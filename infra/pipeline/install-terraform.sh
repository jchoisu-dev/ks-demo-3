#!/usr/bin/env bash
# Installs a pinned Terraform version in CodeBuild, so the pipeline uses exactly
# the version the code was written and tested with.
set -euo pipefail

TF_VERSION="${TF_VERSION:-1.16.4}"
case "$(uname -m)" in
  aarch64 | arm64) ARCH=arm64 ;;
  x86_64) ARCH=amd64 ;;
  *) echo "unsupported architecture: $(uname -m)" >&2; exit 1 ;;
esac

cd /tmp
curl -fsSLo terraform.zip "https://releases.hashicorp.com/terraform/${TF_VERSION}/terraform_${TF_VERSION}_linux_${ARCH}.zip"
unzip -oq terraform.zip terraform
mv terraform /usr/local/bin/terraform
terraform version
