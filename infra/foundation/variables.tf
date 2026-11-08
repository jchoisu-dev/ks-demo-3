variable "aws_region" {
  description = "AWS region for all project resources"
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Short name used in resource names and tags"
  type        = string
  default     = "sd-lottery"
}

variable "services" {
  description = "Services that get their own container image repository"
  type        = set(string)
  default     = ["scraper"]
}

variable "github_repo" {
  description = "GitHub repository CodePipeline builds from (owner/name)"
  type        = string
  default     = "jchoisu-dev/sd-lottery-scraper"
}
