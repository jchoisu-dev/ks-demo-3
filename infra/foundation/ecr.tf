# One image repository per service. The pipeline builds each image once, tags it with
# the commit ID, and promotes that same image through test, staging and production.
resource "aws_ecr_repository" "service" {
  for_each = var.services

  name = "${var.project}/${each.key}"
  # Tags can't be overwritten, so a commit ID always points at exactly one image.
  image_tag_mutability = "IMMUTABLE"
  # Demo project: allow `terraform destroy` even when images are present.
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Keep storage costs near zero: keep the 15 most recent images and drop the rest.
resource "aws_ecr_lifecycle_policy" "service" {
  for_each   = aws_ecr_repository.service
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the 15 most recent images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 15
      }
      action = { type = "expire" }
    }]
  })
}
