# The "execution role" is what ECS itself uses to start the containers:
# pull the image from ECR, write logs to CloudWatch, and read the secrets.
# (A separate "task role" would give the app itself AWS permissions. The scraper
# doesn't call any AWS APIs, so it gets none: least privilege.)

# Who may use this role: only the ECS tasks service.
data "aws_iam_policy_document" "ecs_tasks_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "execution" {
  name               = "${local.name}-ecs-execution"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume.json
}

# AWS-managed policy covering ECR pulls and CloudWatch logs.
resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Read access to exactly this environment's two secrets, and nothing else.
# So a test container can never read production's password.
data "aws_iam_policy_document" "read_secrets" {
  statement {
    actions = ["ssm:GetParameters"]
    resources = [
      aws_ssm_parameter.redis_password.arn,
      aws_ssm_parameter.oregon_api_key.arn,
    ]
  }
}

resource "aws_iam_role_policy" "read_secrets" {
  name   = "read-secrets"
  role   = aws_iam_role.execution.id
  policy = data.aws_iam_policy_document.read_secrets.json
}
