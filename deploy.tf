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

# D1 数据库
resource "cloudflare_d1_database" "newsletter_db" {
  account_id = var.CLOUDFLARE_ACCOUNT_ID
  name       = "newsletter-db"
}

# Pages 项目
resource "cloudflare_pages_project" "newsletter_app" {
  account_id        = var.CLOUDFLARE_ACCOUNT_ID
  name              = "new-tab"
  production_branch = "master"

  deployment_configs {
    production {
      # D1 数据库绑定
      d1_databases = {
        DB = cloudflare_d1_database.newsletter_db.id
      }

      compatibility_date  = "2024-12-18"
      compatibility_flags = ["nodejs_compat"]
    }

    preview {
      # 预览环境使用相同的绑定
      d1_databases = {
        DB = cloudflare_d1_database.newsletter_db.id
      }

      compatibility_date  = "2024-12-18"
      compatibility_flags = ["nodejs_compat"]
    }
  }
}

# 输出资源信息
output "d1_database_id" {
  value = cloudflare_d1_database.newsletter_db.id
}

output "pages_project_url" {
  value = "https://${cloudflare_pages_project.newsletter_app.subdomain}"
}
