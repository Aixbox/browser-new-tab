# New Tab - Browser Extension Landing Page

A modern, responsive landing page built with Next.js 15 and deployed on Cloudflare Pages.

## Features

- 🚀 **Next.js 15** with React 19
- 🎨 **Tailwind CSS 4** for styling
- 🌙 **Dark/Light mode** support
- 📱 **Responsive design**
- ☁️ **Cloudflare Pages** deployment
- 🗄️ **Workers KV** storage for user settings
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
2. Push to `master` branch
3. Your site will be available at `https://new-tab.pages.dev`

For detailed deployment instructions, see [docs/CLOUDFLARE_DEPLOY.md](docs/CLOUDFLARE_DEPLOY.md).

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
