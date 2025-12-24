# New Tab - Browser Extension Landing Page

A modern, responsive landing page built with Next.js 15 and deployed on Cloudflare Pages.

## Features

- 🚀 **Next.js 15** with React 19
- 🎨 **Tailwind CSS 4** for styling
- 🌙 **Dark/Light mode** support
- 📱 **Responsive design**
- ☁️ **Cloudflare Pages** deployment
- 🗄️ **Workers KV** storage for user settings
- 🔐 **Secret key authentication** for privacy protection
- 🔧 **TypeScript** for type safety

## Quick Start

### Development

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev

# Preview with Cloudflare Pages environment
npm run preview
```

### Deployment

The project automatically deploys to Cloudflare Pages via GitHub Actions when you push to the `master` branch.

**Setup:**
1. Add `CLOUDFLARE_API_TOKEN` to your GitHub repository secrets
2. (Optional) Add `SECRET_KEY` to protect your personalized settings
3. Push to `master` branch
4. Your site will be available at `https://new-tab.pages.dev`

For detailed deployment instructions, see [docs/CLOUDFLARE_DEPLOY.md](docs/CLOUDFLARE_DEPLOY.md).

## Security

This project uses GitHub Secrets-based authentication to protect your personalized settings:

- Set `SECRET_KEY` in GitHub repository secrets
- The key is hashed (SHA-256) and stored in Cloudflare KV
- Users must enter the secret key to access personalized settings
- The key is cached in browser localStorage after verification

See [SECRET_AUTH_MIGRATION.md](SECRET_AUTH_MIGRATION.md) for detailed information.

## Project Structure

```
├── app/                 # Next.js app directory
├── components/          # React components
├── docs/               # Documentation
├── .github/workflows/  # GitHub Actions
├── deploy.tf           # Terraform configuration
└── next.config.mjs     # Next.js configuration
```

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **Storage**: Cloudflare Workers KV
- **Deployment**: Cloudflare Pages
- **CI/CD**: GitHub Actions + Terraform
