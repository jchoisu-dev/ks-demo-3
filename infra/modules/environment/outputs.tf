# What the consumer project (or a person) needs to connect to this environment's Redis.

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "redis_endpoint" {
  description = "Host:port for Redis, resolvable from inside the VPC"
  value       = "redis.${local.dns_namespace}:6379"
}

output "redis_clients_security_group_id" {
  description = "Attach this security group to any container that needs to reach Redis"
  value       = aws_security_group.redis_clients.id
}

output "redis_password_parameter" {
  description = "SSM parameter holding the Redis password"
  value       = aws_ssm_parameter.redis_password.name
}

output "oregon_api_key_parameter" {
  description = "SSM parameter to put the real Oregon API key in"
  value       = aws_ssm_parameter.oregon_api_key.name
}
