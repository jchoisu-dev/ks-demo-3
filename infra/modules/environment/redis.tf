# Redis as its own ECS service: the cloud version of the "redis" service in docker-compose.yml.

# A task definition is the "recipe" for running containers: image, CPU, memory,
# environment, secrets, logs. Like one service block in docker-compose.yml.
resource "aws_ecs_task_definition" "redis" {
  family                   = "${local.name}-redis"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc" # each task gets its own network interface and IP
  cpu                      = 256      # 0.25 vCPU
  memory                   = 512      # MiB
  execution_role_arn       = aws_iam_role.execution.arn

  # ARM (Graviton): ~20% cheaper than x86, and matches images built on an Apple Silicon Mac.
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([{
    name      = "redis"
    image     = var.redis_image
    essential = true

    # Same start command as docker-compose.yml. Keyspace notifications ("Ex") are required:
    # the scraper's polling loop runs on expired-key events.
    # Persistence is off: on restart Redis starts empty and the scraper refills it within seconds.
    entryPoint = ["sh", "-c"]
    command    = ["exec redis-server --requirepass \"$REDIS_PASSWORD\" --notify-keyspace-events Ex --save '' --appendonly no"]

    secrets = [
      { name = "REDIS_PASSWORD", valueFrom = aws_ssm_parameter.redis_password.arn },
    ]

    portMappings = [{ containerPort = 6379, protocol = "tcp" }]

    # ECS restarts the container if this keeps failing.
    healthCheck = {
      command     = ["CMD-SHELL", "redis-cli -a \"$REDIS_PASSWORD\" --no-auth-warning ping | grep -q PONG"]
      interval    = 10
      timeout     = 3
      retries     = 3
      startPeriod = 10
    }

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.service["redis"].name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "redis"
      }
    }
  }])
}

# Registers Redis in the private DNS: redis.<env>.sd-lottery.internal → the task's current IP.
resource "aws_service_discovery_service" "redis" {
  name = "redis"

  dns_config {
    namespace_id   = aws_service_discovery_private_dns_namespace.main.id
    routing_policy = "MULTIVALUE"

    dns_records {
      type = "A"
      ttl  = 10 # short, so clients notice quickly when Redis moves to a new IP
    }
  }

  force_destroy = true
}

# A service keeps the task definition running: if the container dies, ECS starts a new one.
resource "aws_ecs_service" "redis" {
  name            = "redis"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.redis.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  # Exactly one Redis at a time: stop the old one before starting the new one on deploys.
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100

  # If a new version fails to start, ECS rolls back to the previous one automatically.
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = [aws_security_group.redis.id]
    assign_public_ip = true # outbound only (image pull); the security group blocks all inbound internet traffic
  }

  service_registries {
    registry_arn = aws_service_discovery_service.redis.arn
  }

  # terraform apply waits until Redis is actually running and healthy.
  wait_for_steady_state = true
}
