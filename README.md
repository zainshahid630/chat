# ChatDesk - Customer Service Chat SaaS

A comprehensive multi-tenant customer service chat platform built with Next.js, React Native, and Supabase.

## 📚 Documentation

Complete project documentation is available in the `/docs` folder:

- **[PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md)** - Complete project vision, architecture, and tech stack
- **[DEVELOPMENT_PHASES.md](./docs/DEVELOPMENT_PHASES.md)** - Detailed development roadmap and progress tracking
- **[DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)** - Complete database schema and design

## 🏗️ Project Structure

```
chatdesk-monorepo/
├── docs/                      # Project documentation
├── packages/
│   ├── shared/                # Shared business logic & types
│   ├── web-dashboard/         # Next.js admin/agent dashboard
│   ├── mobile/                # React Native app (future)
│   └── widget/                # Embeddable widget (future)
├── supabase/                  # Supabase configuration (future)
├── package.json               # Monorepo root
└── turbo.json                 # Turborepo configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 21.x or higher
- npm 10.x or higher
- nvm (recommended for Node version management)

### Setup

```bash
# Use Node 21
nvm use 21

# Install dependencies
npm install

# Start development
npm run dev
```

## 📦 Packages

### @chatdesk/shared
Shared TypeScript types, utilities, and business logic used across all platforms.

### @chatdesk/web-dashboard
Next.js 14 web application for admin and agent dashboards.

### @chatdesk/mobile (Coming Soon)
React Native + Expo mobile application for iOS and Android.

### @chatdesk/widget (Coming Soon)
Embeddable chat widget for customer websites.

## 🛠️ Development

```bash
# Run all packages in development mode
npm run dev

# Run specific package
npm run dev:web
npm run dev:shared

# Build all packages
npm run build

# Lint all packages
npm run lint

# Format code
npm run format
```

## 🎯 Current Status

**Phase**: Phase 1 - Foundation ✅ **COMPLETE**
**Progress**: 100% (Phase 1)
**Next**: Phase 2 - Core Admin Features

See [DEVELOPMENT_PHASES.md](./docs/DEVELOPMENT_PHASES.md) for detailed progress.

### What's Working Now:
- ✅ User authentication (email/password + magic link)
- ✅ Super admin dashboard access
- ✅ Multi-tenant database with RLS
- ✅ Responsive UI with shadcn/ui components
- ✅ Protected routes and role-based access

## 🔧 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Mobile**: React Native, Expo (future)
- **Backend**: Supabase (PostgreSQL, Realtime, Auth, Storage)
- **Monorepo**: Turborepo
- **Deployment**: Vercel (web), EAS (mobile)

## 📝 Features

- ✅ Multi-tenancy (organizations, departments, agents)
- ✅ Real-time messaging
- ✅ Department-based routing
- ✅ Chat history
- ✅ Ticket system
- ✅ Media upload (images, audio)
- ✅ Block/unblock users
- ✅ Webhooks
- ✅ Notifications

## 🤝 For New Contributors / AI Agents

If you're picking up this project:

1. Read [PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md) first
2. Check [DEVELOPMENT_PHASES.md](./docs/DEVELOPMENT_PHASES.md) for current progress
3. Review [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) for data structure
4. Check the task list in the conversation history

## 📄 License

Private - All Rights Reserved

## 📧 Contact

Project maintained by Zain

---

**Last Updated**: 2025-10-31
**Node Version**: 21.7.3
**Current Phase**: Phase 1 - Foundation ✅ COMPLETE
**Next Phase**: Phase 2 - Core Admin Features

