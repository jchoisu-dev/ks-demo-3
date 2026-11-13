# Infrastructure

Everything in AWS is defined here with Terraform, in three layers:

| Layer | What it holds | Lifetime |
|---|---|---|
| `bootstrap/` | S3 bucket for Terraform state | Created once, never destroyed |
| `foundation/` | VPC, image repo (ECR), GitHub connection, CodePipeline, shared Oregon API key | Long-lived, costs cents per month while idle |
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

**Then set the Oregon API key.** Terraform creates the parameter with a placeholder value (`ignore_changes` stops it from putting the placeholder back later):

```bash
aws ssm put-parameter --name /sd-lottery/oregon-api-key --type SecureString --overwrite --value "<key>"
```

## 3. Environments (through the pipeline)

Normally you don't apply these by hand. Every push to `main` starts the pipeline that the foundation layer created:

```
Source → Build → Test → Staging → Approval → Production
```

| Stage | Script | What it does |
|---|---|---|
| Build | [buildspec-build.yml](pipeline/buildspec-build.yml) | Builds the image once, tags it with the short commit ID, pushes it to ECR (skipped if that tag already exists) |
| Test | [buildspec-test.yml](pipeline/buildspec-test.yml) | Creates `environments/test`, waits up to ~50 s for the scraper to log a published draw, then **always** destroys the environment |
| Staging | [buildspec-deploy.yml](pipeline/buildspec-deploy.yml) | `terraform apply` on `environments/staging` with the new image tag |
| Approval | (manual) | A person checks staging and clicks **Approve** in the CodePipeline console |
| Production | [buildspec-deploy.yml](pipeline/buildspec-deploy.yml) | Same script, now with `ENVIRONMENT=prod` |

To apply an environment by hand (for example, to practise):

```bash
cd infra/environments/staging
terraform init \
  -backend-config="bucket=$(terraform -chdir=../../bootstrap output -raw state_bucket)" \
  -backend-config="region=us-east-1"
terraform apply -var="scraper_image_tag=<7-character commit ID that exists in ECR>"
```

## Tearing down after a demo

Destroy in reverse order: environments first, then the foundation. Leave the bootstrap bucket alone; it has `prevent_destroy` on purpose.

```bash
for env in prod staging; do
  terraform -chdir=infra/environments/$env destroy -var="scraper_image_tag=<tag>"
done
terraform -chdir=infra/foundation destroy
```

## Notes

- **Region:** everything uses `us-east-1` by default. To change it, set `aws_region` in both layers before the first apply.
- **One account:** test, staging and production share one AWS account with clearly named resources. In a company, each environment would get its own account (AWS Organizations), so a mistake in test can't reach production.
