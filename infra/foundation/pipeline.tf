# CI/CD: every push to main runs
#   Source → Build (image, once) → Test (create, smoke test, destroy) → Staging → Approval → Prod
# The scripts each stage runs are in infra/pipeline/.

data "aws_caller_identity" "current" {}

locals {
  account_id   = data.aws_caller_identity.current.account_id
  state_bucket = "${var.project}-tfstate-${local.account_id}"
  scraper_repo = aws_ecr_repository.service["scraper"]
}

# ---------------------------------------------------------------------------
# Artifact bucket: CodePipeline passes the checked-out source between stages through S3.
# ---------------------------------------------------------------------------
resource "aws_s3_bucket" "pipeline_artifacts" {
  bucket        = "${var.project}-pipeline-artifacts-${local.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "pipeline_artifacts" {
  bucket                  = aws_s3_bucket.pipeline_artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Old source snapshots are useless after a few days.
resource "aws_s3_bucket_lifecycle_configuration" "pipeline_artifacts" {
  bucket = aws_s3_bucket.pipeline_artifacts.id
  rule {
    id     = "expire-artifacts"
    status = "Enabled"
    filter {}
    expiration {
      days = 14
    }
  }
}

# ---------------------------------------------------------------------------
# CodeBuild: the machines that run the buildspec scripts.
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "codebuild_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "codebuild" {
  name               = "${var.project}-codebuild"
  assume_role_policy = data.aws_iam_policy_document.codebuild_assume.json
}

# CodeBuild runs Terraform, which creates ECS, VPC security groups, Cloud Map, SSM, logs, etc.
# PowerUserAccess covers all of that but deliberately excludes IAM...
resource "aws_iam_role_policy_attachment" "codebuild_power_user" {
  role       = aws_iam_role.codebuild.name
  policy_arn = "arn:aws:iam::aws:policy/PowerUserAccess"
}

# ...so IAM is granted separately, and only for this project's own roles.
# That stops the pipeline from creating or changing any other role in the account.
data "aws_iam_policy_document" "codebuild_iam" {
  statement {
    sid       = "ManageProjectRolesOnly"
    actions   = ["iam:*"]
    resources = ["arn:aws:iam::${local.account_id}:role/${var.project}-*"]
  }
}

resource "aws_iam_role_policy" "codebuild_iam" {
  name   = "manage-project-roles"
  role   = aws_iam_role.codebuild.id
  policy = data.aws_iam_policy_document.codebuild_iam.json
}

locals {
  # Settings shared by all three CodeBuild projects.
  codebuild_env = {
    STATE_BUCKET        = local.state_bucket
    ECR_REPOSITORY_URL  = local.scraper_repo.repository_url
    ECR_REPOSITORY_NAME = local.scraper_repo.name
  }

  codebuild_projects = {
    build  = { buildspec = "infra/pipeline/buildspec-build.yml", description = "Build and push the scraper image", timeout = 20 }
    test   = { buildspec = "infra/pipeline/buildspec-test.yml", description = "Create test env, smoke test, destroy", timeout = 30 }
    deploy = { buildspec = "infra/pipeline/buildspec-deploy.yml", description = "Deploy an image to staging or prod", timeout = 20 }
  }
}

resource "aws_codebuild_project" "pipeline" {
  for_each = local.codebuild_projects

  name           = "${var.project}-${each.key}"
  description    = each.value.description
  service_role   = aws_iam_role.codebuild.arn
  build_timeout  = each.value.timeout
  queued_timeout = 60

  source {
    type      = "CODEPIPELINE"
    buildspec = each.value.buildspec
  }

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    # ARM build machines: they build ARM images natively (matching the ARM Fargate tasks).
    type         = "ARM_CONTAINER"
    compute_type = "BUILD_GENERAL1_SMALL"
    image        = "aws/codebuild/amazonlinux-aarch64-standard:3.0"
    # Needed to run Docker inside the build (only the build project uses it).
    privileged_mode = each.key == "build"

    dynamic "environment_variable" {
      for_each = local.codebuild_env
      content {
        name  = environment_variable.key
        value = environment_variable.value
      }
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name = "/codebuild/${var.project}"
    }
  }
}

resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/codebuild/${var.project}"
  retention_in_days = 14
}

# ---------------------------------------------------------------------------
# CodePipeline: runs the stages in order and passes values between them.
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "codepipeline_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["codepipeline.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "codepipeline" {
  name               = "${var.project}-codepipeline"
  assume_role_policy = data.aws_iam_policy_document.codepipeline_assume.json
}

# The pipeline itself only needs to: read/write its artifacts, use the GitHub connection,
# and start the CodeBuild projects. Nothing else.
data "aws_iam_policy_document" "codepipeline" {
  statement {
    sid       = "Artifacts"
    actions   = ["s3:GetObject", "s3:GetObjectVersion", "s3:PutObject", "s3:GetBucketVersioning"]
    resources = [aws_s3_bucket.pipeline_artifacts.arn, "${aws_s3_bucket.pipeline_artifacts.arn}/*"]
  }
  statement {
    sid       = "GitHubConnection"
    actions   = ["codeconnections:UseConnection", "codestar-connections:UseConnection"]
    resources = [aws_codeconnections_connection.github.arn]
  }
  statement {
    sid       = "RunBuilds"
    actions   = ["codebuild:StartBuild", "codebuild:BatchGetBuilds"]
    resources = [for p in aws_codebuild_project.pipeline : p.arn]
  }
}

resource "aws_iam_role_policy" "codepipeline" {
  name   = "pipeline"
  role   = aws_iam_role.codepipeline.id
  policy = data.aws_iam_policy_document.codepipeline.json
}

resource "aws_codepipeline" "main" {
  name          = var.project
  role_arn      = aws_iam_role.codepipeline.arn
  pipeline_type = "V2"
  # One run at a time: two runs must never apply Terraform to the same environment at once.
  execution_mode = "QUEUED"

  artifact_store {
    type     = "S3"
    location = aws_s3_bucket.pipeline_artifacts.bucket
  }

  # Start on every push to main.
  trigger {
    provider_type = "CodeStarSourceConnection"
    git_configuration {
      source_action_name = "Source"
      push {
        branches {
          includes = ["main"]
        }
      }
    }
  }

  stage {
    name = "Source"
    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      namespace        = "SourceVariables" # exposes #{SourceVariables.CommitId}
      output_artifacts = ["source"]
      configuration = {
        ConnectionArn    = aws_codeconnections_connection.github.arn
        FullRepositoryId = var.github_repo
        BranchName       = "main"
      }
    }
  }

  stage {
    name = "Build"
    action {
      name            = "BuildImage"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      namespace       = "BuildVariables" # exposes #{BuildVariables.IMAGE_TAG}
      input_artifacts = ["source"]
      configuration = {
        ProjectName = aws_codebuild_project.pipeline["build"].name
        EnvironmentVariables = jsonencode([
          { name = "COMMIT_ID", value = "#{SourceVariables.CommitId}", type = "PLAINTEXT" },
        ])
      }
    }
  }

  stage {
    name = "Test"
    action {
      name            = "DeployAndSmokeTest"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["source"]
      configuration = {
        ProjectName = aws_codebuild_project.pipeline["test"].name
        EnvironmentVariables = jsonencode([
          { name = "IMAGE_TAG", value = "#{BuildVariables.IMAGE_TAG}", type = "PLAINTEXT" },
        ])
      }
    }
  }

  stage {
    name = "Staging"
    action {
      name            = "Deploy"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["source"]
      configuration = {
        ProjectName = aws_codebuild_project.pipeline["deploy"].name
        EnvironmentVariables = jsonencode([
          { name = "ENVIRONMENT", value = "staging", type = "PLAINTEXT" },
          { name = "IMAGE_TAG", value = "#{BuildVariables.IMAGE_TAG}", type = "PLAINTEXT" },
        ])
      }
    }
  }

  # The human gate: production only changes after someone clicks "Approve" in the console.
  stage {
    name = "Approval"
    action {
      name     = "ApproveProduction"
      category = "Approval"
      owner    = "AWS"
      provider = "Manual"
      version  = "1"
      configuration = {
        CustomData = "Check staging, then approve to deploy image #{BuildVariables.IMAGE_TAG} to production."
      }
    }
  }

  stage {
    name = "Production"
    action {
      name            = "Deploy"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      version         = "1"
      input_artifacts = ["source"]
      configuration = {
        ProjectName = aws_codebuild_project.pipeline["deploy"].name
        EnvironmentVariables = jsonencode([
          { name = "ENVIRONMENT", value = "prod", type = "PLAINTEXT" },
          { name = "IMAGE_TAG", value = "#{BuildVariables.IMAGE_TAG}", type = "PLAINTEXT" },
        ])
      }
    }
  }
}
