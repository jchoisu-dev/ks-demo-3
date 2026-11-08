# Lets CodePipeline read the GitHub repo and start on every push, with no tokens stored in AWS.
# Terraform creates it as PENDING; you approve it once in the AWS console (see infra/README.md).
resource "aws_codeconnections_connection" "github" {
  name          = "${var.project}-github"
  provider_type = "GitHub"
}
