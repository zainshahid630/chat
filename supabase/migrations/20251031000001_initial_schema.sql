-- ChatDesk Initial Database Schema
-- Phase 1.3: Database Schema
-- Created: 2025-10-31

-- Enable UUID extension (use gen_random_uuid() which is built-in to Postgres 13+)
-- No extension needed for gen_random_uuid()

-- =====================================================
-- 1. ORGANIZATIONS TABLE
-- =====================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  website VARCHAR(255),
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

COMMENT ON TABLE organizations IS 'Multi-tenant organizations using the ChatDesk platform';
COMMENT ON COLUMN organizations.settings IS 'Organization-specific settings (theme, branding, etc.)';

-- =====================================================
-- 2. DEPARTMENTS TABLE
-- =====================================================
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pre_chat_form JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Indexes
CREATE INDEX idx_departments_organization_id ON departments(organization_id);
CREATE INDEX idx_departments_is_active ON departments(is_active);

COMMENT ON TABLE departments IS 'Departments within organizations (Sales, Support, Billing, etc.)';
COMMENT ON COLUMN departments.pre_chat_form IS 'Array of form fields customers must fill before chatting';

-- =====================================================
-- 3. USERS TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'org_admin', 'agent', 'customer')),
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

COMMENT ON TABLE users IS 'All users in the system (super_admin, org_admin, agent, customer)';
COMMENT ON COLUMN users.metadata IS 'Additional user data (phone, timezone, preferences, etc.)';

-- =====================================================
-- 4. AGENT_DEPARTMENTS (Junction Table)
-- =====================================================
CREATE TABLE agent_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, department_id)
);

-- Indexes
CREATE INDEX idx_agent_departments_agent_id ON agent_departments(agent_id);
CREATE INDEX idx_agent_departments_department_id ON agent_departments(department_id);

COMMENT ON TABLE agent_departments IS 'Many-to-many relationship: agents can belong to multiple departments';

-- =====================================================
-- 5. CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'closed', 'ticket')),
  
  -- Pre-chat form data
  pre_chat_data JSONB DEFAULT '{}'::jsonb,
  
  -- Ticket fields (when status = 'ticket')
  ticket_number VARCHAR(50) UNIQUE,
  ticket_priority VARCHAR(20) CHECK (ticket_priority IN ('low', 'medium', 'high', 'urgent')),
  ticket_due_date TIMESTAMPTZ,
  ticket_tags TEXT[],
  ticket_notes TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX idx_conversations_department_id ON conversations(department_id);
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_ticket_number ON conversations(ticket_number) WHERE ticket_number IS NOT NULL;
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

COMMENT ON TABLE conversations IS 'Chat conversations between customers and agents';
COMMENT ON COLUMN conversations.pre_chat_data IS 'Customer responses to pre-chat form';
COMMENT ON COLUMN conversations.ticket_number IS 'Auto-generated ticket number (e.g., TICK-1001)';

-- =====================================================
-- 6. MESSAGES TABLE
-- =====================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'file')),
  
  -- Media fields
  media_url TEXT,
  media_type VARCHAR(100),
  media_size INTEGER,
  media_name VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_message_type ON messages(message_type);

COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON COLUMN messages.media_url IS 'URL to uploaded media in Supabase Storage';

-- =====================================================
-- 7. MESSAGE_STATUS TABLE (Read Receipts)
-- =====================================================
CREATE TABLE message_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'delivered', 'read')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Indexes
CREATE INDEX idx_message_status_message_id ON message_status(message_id);
CREATE INDEX idx_message_status_user_id ON message_status(user_id);
CREATE INDEX idx_message_status_status ON message_status(status);

COMMENT ON TABLE message_status IS 'Track message delivery and read status per user';

-- =====================================================
-- 8. BLOCKED_USERS TABLE
-- =====================================================
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, customer_id)
);

-- Indexes
CREATE INDEX idx_blocked_users_organization_id ON blocked_users(organization_id);
CREATE INDEX idx_blocked_users_customer_id ON blocked_users(customer_id);

COMMENT ON TABLE blocked_users IS 'Customers blocked by organization admins/agents';

-- =====================================================
-- 9. WEBHOOKS TABLE
-- =====================================================
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  headers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhooks_organization_id ON webhooks(organization_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);

COMMENT ON TABLE webhooks IS 'Webhook configurations for organizations';
COMMENT ON COLUMN webhooks.events IS 'Array of events to trigger webhook (message.created, conversation.closed, etc.)';

-- =====================================================
-- 10. WEBHOOK_LOGS TABLE
-- =====================================================
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_event ON webhook_logs(event);

COMMENT ON TABLE webhook_logs IS 'Logs of all webhook deliveries';

