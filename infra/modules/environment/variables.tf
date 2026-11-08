# The module's inputs. Everything that differs between test, staging and prod is a variable;
# everything else is written once in this module.

variable "project" {
  description = "Short name used in resource names"
  type        = string
  default     = "sd-lottery"
}

variable "environment" {
  description = "Environment name: test, staging or prod"
  type        = string

  validation {
    condition     = contains(["test", "staging", "prod"], var.environment)
    error_message = "environment must be test, staging or prod."
  }
}

variable "aws_region" {
  description = "Region, used for the log configuration of the containers"
  type        = string
}

variable "vpc_id" {
  description = "VPC from the foundation layer"
  type        = string
}

variable "subnet_ids" {
  description = "Public subnets from the foundation layer"
  type        = list(string)
}

variable "scraper_image" {
  description = "Full image URI including the tag, e.g. <account>.dkr.ecr.us-east-1.amazonaws.com/sd-lottery/scraper:abc1234"
  type        = string
}

variable "oregon_api_key_parameter_arn" {
  description = "SSM parameter (from the foundation layer) holding the Oregon Lottery API key"
  type        = string
}

variable "redis_image" {
  description = "Official Redis image, from AWS's public mirror of Docker Hub (avoids Docker Hub download limits)"
  type        = string
  default     = "public.ecr.aws/docker/library/redis:7.4-alpine"
}

variable "log_retention_days" {
  description = "How long CloudWatch keeps container logs"
  type        = number
  default     = 7
}
