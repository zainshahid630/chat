# Database Schema - ChatDesk

## Overview

This document describes the complete database schema for the ChatDesk platform. The database uses PostgreSQL via Supabase with Row Level Security (RLS) for multi-tenancy.

---

## Schema Diagram

```
organizations (Companies using the SaaS)
    ↓
departments (Sales, Support, Billing, etc.)
    ↓
agent_departments (Many-to-many: Agents ↔ Departments)
    ↓
conversations (Chat sessions)
    ↓
messages (Individual messages)
    ↓
message_status (Read receipts)

users (All users: admins, agents, customers)
blocked_users (Blocked customers)
webhooks (Webhook configurations)
webhook_logs (Webhook delivery logs)
```

---

## Tables

### 1. organizations

Represents companies using the ChatDesk platform (multi-tenancy).

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings JSONB structure:
{
  "branding": {
    "primaryColor": "#007bff",
    "logoUrl": "https://...",
    "companyName": "Acme Corp"
  },
  "features": {
    "ticketingEnabled": true,
    "webhooksEnabled": true,
    "maxAgents": 10
  },
  "notifications": {
    "emailNotifications": true,
    "soundEnabled": true
  }
}
```

**Indexes:**
- `idx_organizations_slug` on `slug`
- `idx_organizations_is_active` on `is_active`

---

### 2. departments

Departments within an organization (Sales, Support, Billing, etc.).

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pre_chat_form JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, name)
);

-- pre_chat_form JSONB structure (array of form fields):
[
  {
    "id": "field_1",
    "type": "text",
    "label": "Your Name",
    "placeholder": "Enter your name",
    "required": true,
    "order": 1
  },
  {
    "id": "field_2",
    "type": "email",
    "label": "Email Address",
    "required": true,
    "order": 2
  },
  {
    "id": "field_3",
    "type": "select",
    "label": "Issue Type",
    "options": ["Technical", "Billing", "General"],
    "required": false,
    "order": 3
  }
]
```

**Indexes:**
- `idx_departments_org_id` on `organization_id`
- `idx_departments_is_active` on `is_active`

---

### 3. users

Extends Supabase auth.users with additional profile information.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'org_admin', 'agent', 'customer')),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'busy', 'away')),
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Roles:**
- `super_admin`: SaaS platform owner
- `org_admin`: Organization administrator
- `agent`: Support agent
- `customer`: End user

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_role` on `role`
- `idx_users_org_id` on `organization_id`

---

### 4. agent_departments

Junction table for many-to-many relationship between agents and departments.

```sql
CREATE TABLE agent_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(agent_id, department_id)
);
```

**Indexes:**
- `idx_agent_departments_agent` on `agent_id`
- `idx_agent_departments_dept` on `department_id`

---

### 5. conversations

Chat sessions between customers and agents.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'closed', 'ticket')),
  
  -- Ticket-related fields (nullable, only used when status = 'ticket')
  ticket_number VARCHAR(50) UNIQUE,
  ticket_priority VARCHAR(20) CHECK (ticket_priority IN ('low', 'medium', 'high', 'urgent')),
  ticket_due_date TIMESTAMP WITH TIME ZONE,
  ticket_tags JSONB DEFAULT '[]',
  
  -- Pre-chat form responses
  pre_chat_data JSONB DEFAULT '{}',
  
  -- Metadata
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- pre_chat_data JSONB structure:
{
  "name": "John Doe",
  "email": "john@example.com",
  "issue_type": "Technical"
}

-- ticket_tags JSONB structure:
["bug", "urgent", "payment-issue"]
```

**Indexes:**
- `idx_conversations_org_id` on `organization_id`
- `idx_conversations_dept_id` on `department_id`
- `idx_conversations_customer_id` on `customer_id`
- `idx_conversations_agent_id` on `agent_id`
- `idx_conversations_status` on `status`
- `idx_conversations_ticket_number` on `ticket_number`

---

### 6. messages

Individual messages within conversations.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('agent', 'customer', 'system')),
  
  -- Message content
  content TEXT,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'file', 'system')),
  
  -- Media fields (for images, audio, files)
  media_url TEXT,
  media_type VARCHAR(50),
  media_size INTEGER,
  
  -- Message status
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);
```

**Indexes:**
- `idx_messages_conversation_id` on `conversation_id`
- `idx_messages_sender_id` on `sender_id`
- `idx_messages_created_at` on `created_at` (for pagination)

---

### 7. message_status

Tracks read receipts for messages (who has read what).

```sql
CREATE TABLE message_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('delivered', 'read')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(message_id, user_id)
);
```

**Indexes:**
- `idx_message_status_message_id` on `message_id`
- `idx_message_status_user_id` on `user_id`

---

### 8. blocked_users

Tracks blocked customers.

```sql
CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unblocked_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(organization_id, customer_id)
);
```

**Indexes:**
- `idx_blocked_users_org_id` on `organization_id`
- `idx_blocked_users_customer_id` on `customer_id`

---

### 9. webhooks

Webhook configurations for organizations.

```sql
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  event_types JSONB NOT NULL DEFAULT '[]',
  secret_key VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- event_types JSONB structure:
["message.sent", "message.received", "conversation.started", "conversation.closed", "ticket.created"]
```

**Indexes:**
- `idx_webhooks_org_id` on `organization_id`
- `idx_webhooks_is_active` on `is_active`

---

### 10. webhook_logs

Logs of webhook deliveries.

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_webhook_logs_webhook_id` on `webhook_id`
- `idx_webhook_logs_created_at` on `created_at`

---

## Row Level Security (RLS) Policies

### organizations
```sql
-- Users can only see their own organization
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Only org_admin can update their organization
CREATE POLICY "Org admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'org_admin'
  );
```

### departments
```sql
-- Users can only see departments in their organization
CREATE POLICY "Users can view departments in their org"
  ON departments FOR SELECT
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );
```

### conversations
```sql
-- Agents can see conversations in their departments
CREATE POLICY "Agents can view conversations in their departments"
  ON conversations FOR SELECT
  USING (
    department_id IN (
      SELECT department_id FROM agent_departments WHERE agent_id = auth.uid()
    )
  );

-- Customers can see their own conversations
CREATE POLICY "Customers can view their conversations"
  ON conversations FOR SELECT
  USING (customer_id = auth.uid());
```

### messages
```sql
-- Users can see messages in conversations they're part of
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid() OR agent_id = auth.uid()
    )
  );
```

---

## Triggers

### Update updated_at timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (apply to other tables)
```

### Auto-generate ticket numbers
```sql
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ticket' AND NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'TICK-' || LPAD(nextval('ticket_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE ticket_number_seq START 1000;

CREATE TRIGGER auto_generate_ticket_number BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();
```

---

## Storage Buckets

### chat-media
For storing images, audio, and files uploaded in chats.

```sql
-- Bucket configuration
{
  "name": "chat-media",
  "public": false,
  "file_size_limit": 10485760,  -- 10MB
  "allowed_mime_types": [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "audio/mpeg",
    "audio/wav",
    "audio/webm"
  ]
}

-- RLS Policy
CREATE POLICY "Users can upload to their organization folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = (SELECT organization_id::TEXT FROM users WHERE id = auth.uid())
  );
```

---

**Last Updated**: 2025-10-31  
**Schema Version**: 1.0.0

