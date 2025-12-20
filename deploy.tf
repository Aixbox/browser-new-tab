terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4"
    }
  }
}

provider "cloudflare" {
  # read token from $CLOUDFLARE_API_TOKEN
}

variable "CLOUDFLARE_ACCOUNT_ID" {
  # read account id from $TF_VAR_CLOUDFLARE_ACCOUNT_ID
  type = string
}

# KV 命名空间
resource "cloudflare_workers_kv_namespace" "newtab_kv" {
  account_id = var.CLOUDFLARE_ACCOUNT_ID
  title      = "newtab_kv"
}

# Pages 项目
resource "cloudflare_pages_project" "newsletter_app" {
  account_id        = var.CLOUDFLARE_ACCOUNT_ID
  name              = "new-tab"
  production_branch = "master"

  deployment_configs {
    production {
      # KV 命名空间绑定
      kv_namespaces = {
        NEWTAB_KV = cloudflare_workers_kv_namespace.newtab_kv.id
      }

      compatibility_date  = "2024-12-18"
      compatibility_flags = ["nodejs_compat"]
    }

    preview {
      # 预览环境使用相同的绑定
      kv_namespaces = {
        NEWTAB_KV = cloudflare_workers_kv_namespace.newtab_kv.id
      }

      compatibility_date  = "2024-12-18"
      compatibility_flags = ["nodejs_compat"]
    }
  }
}

# 输出资源信息
output "kv_namespace_id" {
  value = cloudflare_workers_kv_namespace.newtab_kv.id
}

output "pages_project_url" {
  value = "https://${cloudflare_pages_project.newsletter_app.subdomain}"
}
