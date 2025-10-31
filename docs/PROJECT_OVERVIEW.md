# Customer Service Chat SaaS - Project Overview

## 🎯 Project Vision

A comprehensive **multi-tenant customer service chat platform** that enables companies to provide real-time support to their customers through web, mobile (iOS/Android), and embeddable widget.

## 📋 Project Name
**ChatDesk** (Working Title - Can be changed)

## 🏗️ Architecture

### Platform Strategy
- **Single App Approach**: One mobile app with role-based UI (customer vs agent)
- **Development Priority**: Web → Mobile → Widget
- **Current Phase**: Web Dashboard Development

### Tech Stack

#### Frontend
- **Web Dashboard**: Next.js 14 (App Router) + TypeScript
- **Mobile App**: React Native + Expo (Future)
- **Widget**: Preact/Vanilla JS (Future)
- **UI Framework**: Tailwind CSS + shadcn/ui
- **State Management**: React Query + Zustand/Context

#### Backend & Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime (WebSocket)
- **Authentication**: Supabase Auth (Email/OTP)
- **Storage**: Supabase Storage (Images/Audio)
- **Edge Functions**: Supabase Edge Functions (Webhooks)
- **Deployment**: Vercel (Web), Expo EAS (Mobile)

#### Monorepo
- **Tool**: Turborepo
- **Package Manager**: npm/yarn
- **Node Version**: 21.7.3 (managed via nvm)

### Project Structure
```
chat-saas/
├── docs/                          # Project documentation
│   ├── PROJECT_OVERVIEW.md        # This file
│   ├── DEVELOPMENT_PHASES.md      # Development roadmap
│   ├── DATABASE_SCHEMA.md         # Database design
│   ├── API_DOCUMENTATION.md       # API endpoints
│   └── DEPLOYMENT.md              # Deployment guide
│
├── packages/
│   ├── shared/                    # Shared business logic (70% code reuse)
│   │   ├── src/
│   │   │   ├── types/            # TypeScript types
│   │   │   ├── api/              # Supabase API calls
│   │   │   ├── utils/            # Utilities
│   │   │   └── hooks/            # Shared React hooks
│   │   └── package.json
│   │
│   ├── web-dashboard/             # Next.js Admin/Agent Dashboard
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router
│   │   │   ├── components/       # React components
│   │   │   └── lib/              # Web-specific utilities
│   │   └── package.json
│   │
│   ├── mobile/                    # React Native App (Future)
│   │   └── package.json
│   │
│   └── widget/                    # Embeddable Widget (Future)
│       └── package.json
│
├── supabase/                      # Supabase configuration
│   ├── migrations/                # Database migrations
│   ├── functions/                 # Edge Functions
│   └── config.toml
│
├── package.json                   # Monorepo root
├── turbo.json                     # Turborepo config
└── README.md                      # Quick start guide
```

## 🎭 User Roles

### 1. Super Admin (SaaS Owner)
- Manages all organizations
- System-wide settings
- Billing management

### 2. Organization Admin (Company Owner)
- Manages their organization
- Creates departments
- Manages agents
- Configures webhooks

### 3. Agent (Support Staff)
- Handles customer chats
- Marks chats as tickets
- Blocks/unblocks users
- Views customer history

### 4. Customer (End User)
- Selects department
- Chats with agents
- Views chat history
- Uploads media

## ✨ Core Features

### Customer Features
- ✅ Select department before chatting
- ✅ Fill pre-chat form (configurable per department)
- ✅ Real-time messaging
- ✅ View chat history (all departments)
- ✅ Continue previous conversations
- ✅ Upload images and audio
- ✅ See read/delivered status
- ✅ Receive notifications

### Agent Features
- ✅ Real-time chat interface
- ✅ View assigned conversations
- ✅ Mark chat as ticket
- ✅ Set ticket priority/tags
- ✅ Block/unblock customers
- ✅ View customer chat history
- ✅ Transfer chat to another agent/department
- ✅ Typing indicators
- ✅ Canned responses (quick replies)

### Admin Features
- ✅ Manage organization settings
- ✅ Create/edit departments
- ✅ Add/remove agents
- ✅ Assign agents to departments
- ✅ Configure pre-chat forms per department
- ✅ View analytics (chats, tickets, response time)
- ✅ Configure webhooks
- ✅ Manage blocked users
- ✅ Export chat/ticket data

### Technical Features
- ✅ Multi-tenancy (organization isolation)
- ✅ Real-time message delivery
- ✅ Read/delivered status tracking
- ✅ Webhook integration for external systems
- ✅ Media upload (images, audio)
- ✅ Push notifications
- ✅ Sound alerts
- ✅ Toast notifications
- ✅ Embeddable widget (script injection)

## 🔐 Multi-tenancy Strategy

### Organization Isolation
- Each company is an "organization"
- Row Level Security (RLS) in Supabase
- Data completely isolated per organization
- Subdomain or path-based routing (e.g., `company1.chatdesk.com`)

### Department Structure
- Organizations have multiple departments (Sales, Support, Billing, etc.)
- Agents can belong to multiple departments
- Customers select department before chatting
- Pre-chat forms configured per department

## 💰 Cost Estimates

### Development Phase (MVP)
- Supabase: **$0** (free tier)
- Vercel: **$0** (hobby tier)
- **Total: $0/month**

### Production (Low Usage - 1000 users)
- Supabase: **$0-25**
- Vercel: **$0-20**
- Email OTP: **$0** (Supabase built-in)
- SMS OTP (optional): **~$4-8** (MSG91)
- **Total: ~$4-53/month**

### Production (Medium Usage - 10k users)
- Supabase Pro: **$25**
- Vercel Pro: **$20**
- SMS OTP: **~$40-80**
- Storage: **~$10-20**
- **Total: ~$95-145/month**

## 🚀 Development Approach

### Phase-based Development
See `docs/DEVELOPMENT_PHASES.md` for detailed breakdown

### Current Status
- **Phase**: Phase 1 - Foundation
- **Status**: In Progress
- **Node Version**: 21.7.3
- **Next Steps**: Initialize monorepo, setup Supabase

## 📞 Key Workflows

### Customer Journey
```
1. Customer visits chat (web/mobile/widget)
2. Selects department (Sales, Support, etc.)
3. Fills pre-chat form (if configured)
4. Connected to available agent
5. Real-time chat begins
6. Chat saved with department context
7. Customer can view history later
```

### Agent Workflow
```
1. Agent logs in to dashboard
2. Sees incoming chats from assigned departments
3. Picks up conversation
4. Chats with customer in real-time
5. Can mark chat as ticket if needed
6. Can block user if spam/abuse
7. Closes conversation when resolved
```

### Ticket Creation
```
1. Agent identifies complex issue during chat
2. Clicks "Mark as Ticket"
3. Sets priority (Low, Medium, High, Urgent)
4. Adds tags/categories
5. Assigns to agent/team
6. Auto-generates ticket number (e.g., TICK-1001)
7. Customer notified about ticket creation
8. Ticket tracked separately in ticket dashboard
```

## 🔗 Integration Points

### Webhooks
- Message sent/received
- Ticket created
- Conversation closed
- Agent assigned
- Customer blocked

### External Services
- **OTP**: Supabase Auth (email) or MSG91/Twilio (SMS)
- **Push Notifications**: OneSignal or Firebase Cloud Messaging
- **Analytics**: Custom dashboard + optional Google Analytics
- **File Storage**: Supabase Storage or Cloudinary

## 📝 Important Notes

### Design Decisions
1. **Single mobile app** (not separate customer/agent apps) - can split later if needed
2. **Web-first development** - fastest to market, then mobile, then widget
3. **Supabase for everything** - reduces complexity, budget-friendly
4. **Department-based routing** - customers choose department upfront
5. **Chat history preserved** - customers can view all past conversations
6. **Ticket system integrated** - agents can escalate chats to tickets

### Future Considerations
- Mobile app development (React Native + Expo)
- Embeddable widget (script injection)
- Advanced analytics
- AI-powered features (chatbot, auto-routing)
- Video/voice calling
- Screen sharing
- File attachments (PDFs, documents)

## 🎓 For New Agents

If you're a new AI agent picking up this project:

1. **Read this file first** to understand the vision
2. **Check `DEVELOPMENT_PHASES.md`** to see current progress
3. **Review `DATABASE_SCHEMA.md`** for data structure
4. **Look at task list** to see what's in progress
5. **Check git history** for recent changes
6. **Ask user** for clarification on priorities

### Quick Context Recovery
```bash
# Check Node version
node --version  # Should be 21.x

# Check what's installed
ls -la

# Check git status
git status

# Check current branch
git branch
```

## 📧 Contact & Resources

- **Repository**: `/Users/zain/Documents/augment-projects/Chat`
- **Node Version**: 21.7.3 (use `nvm use 21`)
- **Documentation**: `/docs` folder
- **Supabase Project**: TBD (will be created in Phase 1)

---

**Last Updated**: 2025-10-31
**Current Phase**: Phase 1 - Foundation (In Progress)
**Next Milestone**: Monorepo initialization + Supabase setup

