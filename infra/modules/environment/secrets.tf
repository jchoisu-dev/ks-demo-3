# Secrets live in SSM Parameter Store (encrypted, free for standard parameters).
# ECS reads them when a container starts and passes them in as environment variables,
# so they are never in the code, the image or the task definition.
#
# Note: Terraform state contains the values of secrets it manages. That is one reason
# the state bucket is encrypted and private.

# Terraform generates the Redis password, so no human ever needs to know it.
# Letters and digits only, so it is safe inside the shell command that starts Redis.
resource "random_password" "redis" {
  length  = 32
  special = false
}

resource "aws_ssm_parameter" "redis_password" {
  name        = "/${var.project}/${var.environment}/redis-password"
  description = "Redis password for ${local.name}"
  type        = "SecureString"
  value       = random_password.redis.result
}

# The Oregon API key is shared by all environments and lives in the foundation layer
# (see infra/foundation/secrets.tf); its ARN comes in as var.oregon_api_key_parameter_arn.
