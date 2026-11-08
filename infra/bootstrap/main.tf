# One-time setup: the S3 bucket that stores Terraform state for every other layer.
# This layer keeps its own state locally, since the bucket can't store the state of its own creation.
terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

variable "aws_region" {
  description = "AWS region for the state bucket"
  type        = string
  default     = "us-east-1"
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project   = "sd-lottery-scraper"
      Layer     = "bootstrap"
      ManagedBy = "terraform"
    }
  }
}

data "aws_caller_identity" "current" {}

# Bucket names are global across AWS, so the account ID keeps this one unique.
resource "aws_s3_bucket" "state" {
  bucket = "sd-lottery-tfstate-${data.aws_caller_identity.current.account_id}"

  lifecycle {
    prevent_destroy = true
  }
}

# Versioning lets you recover an older state file if one gets corrupted.
resource "aws_s3_bucket_versioning" "state" {
  bucket = aws_s3_bucket.state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "state" {
  bucket = aws_s3_bucket.state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "state" {
  bucket                  = aws_s3_bucket.state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "state_bucket" {
  description = "Pass to the other layers with: terraform init -backend-config=\"bucket=<this>\""
  value       = aws_s3_bucket.state.bucket
}

output "aws_region" {
  value = var.aws_region
}
