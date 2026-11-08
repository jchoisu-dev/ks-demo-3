# The scraper: the cloud version of the "scraper" service in docker-compose.yml.

resource "aws_ecs_task_definition" "scraper" {
  family                   = "${local.name}-scraper"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.execution.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([{
    name      = "scraper"
    image     = var.scraper_image
    essential = true

    # Plain settings: visible in the console, so nothing secret here.
    environment = [
      { name = "REDIS_HOST", value = "redis.${local.dns_namespace}" },
      { name = "REDIS_PORT", value = "6379" },
    ]

    # Secrets: injected from SSM when the container starts.
    secrets = [
      { name = "REDIS_PASSWORD", valueFrom = aws_ssm_parameter.redis_password.arn },
      { name = "OREGON_API_KEY", valueFrom = var.oregon_api_key_parameter_arn },
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.service["scraper"].name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "scraper"
      }
    }
  }])
}

resource "aws_ecs_service" "scraper" {
  name            = "scraper"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.scraper.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  # Exactly one scraper at a time; two would publish every draw twice.
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.redis_clients.id]
    assign_public_ip = true # outbound to the lottery websites; no inbound allowed
  }

  wait_for_steady_state = true

  # Start the scraper only after Redis is up, so it can connect straight away.
  depends_on = [aws_ecs_service.redis]
}
