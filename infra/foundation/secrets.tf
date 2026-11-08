# The Oregon Lottery API key is shared by all environments and lives here, in the long-lived
# layer, because the test environment is created and destroyed on every pipeline run.
# Terraform creates the parameter with a placeholder; set the real value once with:
#   aws ssm put-parameter --name /sd-lottery/oregon-api-key --type SecureString --overwrite --value "<key>"
# ignore_changes stops Terraform from putting the placeholder back on the next apply.
resource "aws_ssm_parameter" "oregon_api_key" {
  name        = "/${var.project}/oregon-api-key"
  description = "Oregon Lottery API subscription key, shared by all environments"
  type        = "SecureString"
  value       = "CHANGE_ME"

  lifecycle {
    ignore_changes = [value]
  }
}
