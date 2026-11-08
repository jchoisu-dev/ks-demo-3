# Infrastructure

Everything in AWS is defined here with Terraform, in three layers:

| Layer | What it holds | Lifetime |
|---|---|---|
| `bootstrap/` | S3 bucket for Terraform state | Created once, never destroyed |
| `foundation/` | Image repo (ECR), GitHub connection | Long-lived, costs cents per month while idle |
| `environments/` | ECS clusters and services for test, staging and production | Created on demo day, destroyed afterwards |

All commands assume you're signed in to AWS:

```bash
aws sso login --profile ks-demo
export AWS_PROFILE=ks-demo
```

## 1. Bootstrap (once)

```bash
cd infra/bootstrap
terraform init
terraform apply
```

This layer keeps its state in `bootstrap/terraform.tfstate` on your machine (not in git). Keep that file; it's only needed if the bucket ever has to change.

## 2. Foundation (once)

```bash
cd infra/foundation
terraform init \
  -backend-config="bucket=$(terraform -chdir=../bootstrap output -raw state_bucket)" \
  -backend-config="region=$(terraform -chdir=../bootstrap output -raw aws_region)"
terraform apply
```

**Then approve the GitHub connection.** Terraform creates it as `PENDING`. In the AWS console, open **Developer Tools → Settings → Connections**, select `sd-lottery-github`, click **Update pending connection**, and authorise the AWS Connector app for the `jchoisu-dev/sd-lottery-scraper` repo. Afterwards:

```bash
terraform apply -refresh-only && terraform output github_connection_status   # should print AVAILABLE
```

## Notes

- **Region:** everything uses `us-east-1` by default. To change it, set `aws_region` in both layers before the first apply.
- **One account:** test, staging and production share one AWS account with clearly named resources. In a company, each environment would get its own account (AWS Organizations), so a mistake in test can't reach production.
