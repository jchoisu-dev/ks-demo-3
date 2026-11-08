terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Bucket and region are passed at init time, because backend blocks can't use variables:
  #   terraform init -backend-config="bucket=<state bucket>" -backend-config="region=<region>"
  # use_lockfile gives state locking through S3 itself, with no DynamoDB table needed.
  backend "s3" {
    key          = "foundation/terraform.tfstate"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project   = var.project
      Layer     = "foundation"
      ManagedBy = "terraform"
    }
  }
}
