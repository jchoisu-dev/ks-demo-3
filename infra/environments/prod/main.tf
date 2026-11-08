# The prod environment: a copy of ../test/main.tf with a different
# environment name and state key (the only two lines that differ); all the real definitions live in ../../modules/environment.

terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Each environment has its own state file, so test can never touch prod's resources.
  backend "s3" {
    key          = "environments/prod/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}

locals {
  environment = "prod"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "scraper_image_tag" {
  description = "Which scraper image to run: the git commit ID it was built from"
  type        = string
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "sd-lottery-scraper"
      Layer       = "environment"
      Environment = local.environment
      ManagedBy   = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

# Read the foundation layer's outputs (VPC, subnets, ECR URL) straight from its state file.
# This is how separate Terraform layers share information without copy-pasting IDs.
data "terraform_remote_state" "foundation" {
  backend = "s3"
  config = {
    bucket = "sd-lottery-tfstate-${data.aws_caller_identity.current.account_id}"
    key    = "foundation/terraform.tfstate"
    region = var.aws_region
  }
}

module "environment" {
  source = "../../modules/environment"

  environment   = local.environment
  aws_region    = var.aws_region
  vpc_id        = data.terraform_remote_state.foundation.outputs.vpc_id
  subnet_ids    = data.terraform_remote_state.foundation.outputs.public_subnet_ids
  scraper_image = "${data.terraform_remote_state.foundation.outputs.ecr_repository_urls["scraper"]}:${var.scraper_image_tag}"

  oregon_api_key_parameter_arn = data.terraform_remote_state.foundation.outputs.oregon_api_key_parameter_arn
}

output "redis_endpoint" {
  value = module.environment.redis_endpoint
}

output "redis_clients_security_group_id" {
  value = module.environment.redis_clients_security_group_id
}

output "redis_password_parameter" {
  value = module.environment.redis_password_parameter
}


output "cluster_name" {
  value = module.environment.cluster_name
}
