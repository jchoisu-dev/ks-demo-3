# Security groups are firewalls attached to each container.
# Nothing here allows any inbound traffic from the internet.

# "Membership card" for Redis access. It allows nothing by itself; anything wearing it
# may connect to Redis. The scraper wears it, and so can the consumer project's containers.
resource "aws_security_group" "redis_clients" {
  name        = "${local.name}-redis-clients"
  description = "Attach to anything that needs to connect to ${local.name} Redis"
  vpc_id      = var.vpc_id

  tags = { Name = "${local.name}-redis-clients" }
}

# Outbound: allowed everywhere (the scraper calls the lottery websites).
resource "aws_vpc_security_group_egress_rule" "redis_clients_all" {
  security_group_id = aws_security_group.redis_clients.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  description       = "All outbound traffic"
}

resource "aws_security_group" "redis" {
  name        = "${local.name}-redis"
  description = "Redis for ${local.name}"
  vpc_id      = var.vpc_id

  tags = { Name = "${local.name}-redis" }
}

# Inbound: only port 6379, and only from members of the redis-clients group.
# Referencing a group (not IP ranges) keeps working when containers get new IPs.
resource "aws_vpc_security_group_ingress_rule" "redis_from_clients" {
  security_group_id            = aws_security_group.redis.id
  referenced_security_group_id = aws_security_group.redis_clients.id
  ip_protocol                  = "tcp"
  from_port                    = 6379
  to_port                      = 6379
  description                  = "Redis from redis-clients members"
}

# Outbound for Redis: needed to download its image when it starts.
resource "aws_vpc_security_group_egress_rule" "redis_all" {
  security_group_id = aws_security_group.redis.id
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
  description       = "All outbound traffic (image pulls)"
}
