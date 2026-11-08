# The private network all environments run in, plus anything else in this account
# that needs to reach them (such as the separate consumer project).
#
# Demo trade-off: public subnets only, no NAT gateway (~$32/month). Tasks get a public IP
# for outbound traffic (the scraper calls the lottery sites); security groups in each
# environment block all inbound traffic from the internet.
# In production: private subnets for the tasks, with a NAT gateway for outbound traffic.

# Look up which availability zones (separate data centres) this region has.
data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  # Two subnets in two availability zones, so one data-centre outage can't take everything down.
  # cidrsubnet() carves smaller ranges out of the VPC range: 10.20.0.0/24 and 10.20.1.0/24.
  public_subnets = {
    for i, az in slice(data.aws_availability_zones.available.names, 0, 2) :
    az => cidrsubnet(var.vpc_cidr, 8, i)
  }
}

resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr
  # Both are needed for private DNS names like redis.prod.sd-lottery.internal to work.
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project}-vpc" }
}

# The VPC's door to the internet.
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project}-igw" }
}

resource "aws_subnet" "public" {
  for_each = local.public_subnets

  vpc_id            = aws_vpc.main.id
  availability_zone = each.key
  cidr_block        = each.value

  tags = { Name = "${var.project}-public-${each.key}" }
}

# Routing rule: traffic for anywhere outside the VPC (0.0.0.0/0) goes through the internet gateway.
# Traffic inside the VPC is routed automatically.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project}-public" }
}

# Attaching the route table is what makes a subnet "public".
resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}
