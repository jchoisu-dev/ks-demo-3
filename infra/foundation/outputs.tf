output "ecr_repository_urls" {
  value = { for name, repo in aws_ecr_repository.service : name => repo.repository_url }
}

output "github_connection_arn" {
  value = aws_codeconnections_connection.github.arn
}

output "github_connection_status" {
  description = "Must be AVAILABLE before the pipeline can run. PENDING means it still needs approval in the console."
  value       = aws_codeconnections_connection.github.connection_status
}

output "github_repo" {
  value = var.github_repo
}
