locals {
  # e.g. "sd-lottery-test". Used as a prefix for every resource name in this environment.
  name = "${var.project}-${var.environment}"

  # Private DNS zone for this environment, e.g. "test.sd-lottery.internal".
  dns_namespace = "${var.environment}.${var.project}.internal"
}

# A cluster is a logical group for this environment's containers.
# With Fargate there are no servers to manage: AWS runs each container on capacity it provides.
resource "aws_ecs_cluster" "main" {
  name = local.name

  # Container Insights gives detailed metrics but costs extra. Off for a demo.
  setting {
    name  = "containerInsights"
    value = "disabled"
  }
}

# Where container output (console.log, Redis logs) ends up. One group per service.
resource "aws_cloudwatch_log_group" "service" {
  for_each = toset(["redis", "scraper"])

  name              = "/ecs/${local.name}/${each.key}"
  retention_in_days = var.log_retention_days
}

# Private DNS for the environment, visible only inside the VPC.
# Containers get a new IP every time they restart; a DNS name always points to the current one.
resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = local.dns_namespace
  description = "Service discovery for ${local.name}"
  vpc         = var.vpc_id
}
