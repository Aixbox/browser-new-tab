# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern Newsletter subscription page project built with Next.js 15, React 19, and TypeScript. The project features a unique glassmorphism aesthetic design system with animations and responsive design.

## Common Development Commands

### Build and Run
```bash
# Start development mode
npm run dev

# Build production version
npm run build

# Start production server
npm run start

# Code linting
npm run lint
```

### Package Management
The project uses npm as the package manager.

## Core Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **React**: v19
- **TypeScript**: v5
- **Styling**: Tailwind CSS v4 + Custom Design System
- **Animation**: Framer Motion
- **UI Components**: Radix UI + shadcn/ui Component System
- **Fonts**: Geist Sans/Mono + Instrument Serif

### Directory Structure
```
app/                    # Next.js App Router pages
  ├── layout.tsx       # Root layout, fonts and metadata config
  ├── page.tsx         # Homepage, integrating Background, Newsletter, Footer
  └── globals.css      # Global styles and CSS variables
components/            # Component library
  ├── ui/             # shadcn/ui base components
  ├── newsletter.tsx  # Core Newsletter component
  ├── background.tsx  # Background video component
  ├── footer.tsx      # Footer component
  └── form-newsletter.tsx # Email subscription form
lib/
  ├── utils.ts        # Utility functions (cn, ActionResult types)
  └── context.ts      # V0 Provider context
```

### Design System Architecture

The project has complete design system documentation (`DESIGN_SYSTEM.md`) with core features:

#### CSS Variables System
- `--inset`: Page padding
- `--sides`: Side margins
- `--footer-safe-area`: Bottom safe area
- Complete HSL color variable system

#### Tailwind Extension Configuration
- **Custom Breakpoint**: `short` (max-height: 748px) for short screen adaptation
- **Custom Shadows**: `shadow-button` and `shadow-button-hover`
- **Custom Transitions**: `transition-colors-and-shadows`
- **Custom Fonts**: `font-serif` using Instrument Serif

#### Glassmorphism Aesthetic Pattern
All components follow unified glassmorphism design:
```css
/* Standard glassmorphism card */
backdrop-blur-xl bg-primary/20 border-2 border-border/50
rounded-3xl ring-1 ring-offset-2 ring-border/10 shadow-button
```

### Component Architecture Patterns

#### Variant System (CVA)
Using `class-variance-authority` to create component variants:
- `buttonVariants`: default, ghost, link, iconButton
- `inputVariants`: Unified input field styles
- All components support `cn()` utility function for style merging

#### Animation System
Unified animation constants based on Framer Motion:
```typescript
const DURATION = 0.3;
const EASE_OUT = "easeOut";
const SPRING = { type: "spring", stiffness: 60, damping: 10, mass: 0.8 };
```

#### Responsive Design
- Prioritize `short:lg:` breakpoint (short screen adaptation)
- Use `calc()` expressions for dynamic sizing
- Responsive typography: `text-5xl short:lg:text-8xl sm:text-8xl lg:text-9xl`

## Development Standards

### Style Writing Standards
1. **Must use design system variables**: Avoid hardcoded color values, use `text-foreground`, `bg-primary/20` etc.
2. **Glassmorphism effect standard**: `backdrop-blur-xl` + `bg-primary/20` + `border-border/50`
3. **Border radius hierarchy**: Buttons use `rounded-full`, cards use `rounded-3xl`
4. **Shadow system**: Use `shadow-button` instead of standard Tailwind shadows
5. **Spacing variables**: Page-level use `p-inset px-sides pb-footer-safe-area`

### TypeScript Patterns
- Use strict TypeScript configuration
- Path alias: `@/*` points to project root
- ActionResult type system for handling operation results

### Animation Development Patterns
- All animations use unified DURATION/EASE_OUT constants
- Disable animations on initial component render: `initial={isInitialRender.current ? false : "hidden"}`
- Disable AnimatePresence in V0 environment: Use `AnimatePresenceGuard` wrapper

## Special Features

### V0 Integration
The project includes V0 (Vercel's AI design tool) integration logic:
- `isV0` detection based on `VERCEL_URL` environment variable
- Disable certain animation effects in V0 environment
- Dynamic loading of `V0Setup` component

### Email Subscription System
- Form component uses render props pattern
- Integrated input validation and submission handling
- Support for custom input field and submit button styles

## AI Development Guidance

When using AI to modify code, refer to detailed examples in `AI_STYLE_GUIDE.md`. Key principles:

1. **Strictly follow design system**: Use glassmorphism, border radius, and shadow standards defined in documentation
2. **Maintain responsive consistency**: Must support `short:lg:` breakpoint
3. **Use component variant system**: Customize through CVA rather than inline styles
4. **Maintain animation consistency**: Use project-defined animation constants

### AI Prompt Template
```markdown
Please modify styles according to the following design system:
- Glassmorphism: backdrop-blur-xl bg-primary/20 border-2 border-border/50
- Border radius: rounded-3xl (cards) or rounded-full (buttons)
- Shadows: shadow-button
- Typography: Main titles use font-serif italic, body text use text-foreground
- Responsive: Support short:lg: breakpoint
```

## Deployment Notes

The project is optimized for Vercel deployment:
- Support for Vercel Analytics integration
- Special handling for vusercontent.net domains
- Metadata and SEO optimization configuration