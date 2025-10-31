-- ChatDesk Seed Data
-- Phase 1.3: Database Schema
-- Created: 2025-10-31
-- This file contains test data for development

-- =====================================================
-- 1. SEED ORGANIZATIONS
-- =====================================================
INSERT INTO organizations (id, name, slug, website, settings, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Acme Corporation',
    'acme-corp',
    'https://acme-corp.example.com',
    '{"theme": "blue", "timezone": "America/New_York"}'::jsonb,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'TechStart Inc',
    'techstart',
    'https://techstart.example.com',
    '{"theme": "purple", "timezone": "America/Los_Angeles"}'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. SEED DEPARTMENTS
-- =====================================================
INSERT INTO departments (id, organization_id, name, description, pre_chat_form, is_active)
VALUES
  -- Acme Corporation Departments
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Sales',
    'Sales inquiries and product information',
    '[
      {"name": "full_name", "label": "Full Name", "type": "text", "required": true},
      {"name": "email", "label": "Email", "type": "email", "required": true},
      {"name": "company", "label": "Company Name", "type": "text", "required": false},
      {"name": "interest", "label": "What are you interested in?", "type": "select", "options": ["Product Demo", "Pricing", "Partnership"], "required": true}
    ]'::jsonb,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Support',
    'Technical support and customer service',
    '[
      {"name": "full_name", "label": "Full Name", "type": "text", "required": true},
      {"name": "email", "label": "Email", "type": "email", "required": true},
      {"name": "order_number", "label": "Order Number", "type": "text", "required": false},
      {"name": "issue_type", "label": "Issue Type", "type": "select", "options": ["Technical Issue", "Billing Question", "Feature Request", "Other"], "required": true}
    ]'::jsonb,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Billing',
    'Billing and payment inquiries',
    '[
      {"name": "full_name", "label": "Full Name", "type": "text", "required": true},
      {"name": "email", "label": "Email", "type": "email", "required": true},
      {"name": "account_number", "label": "Account Number", "type": "text", "required": true}
    ]'::jsonb,
    true
  ),
  
  -- TechStart Inc Departments
  (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    'Customer Success',
    'Onboarding and customer success',
    '[
      {"name": "full_name", "label": "Full Name", "type": "text", "required": true},
      {"name": "email", "label": "Email", "type": "email", "required": true},
      {"name": "plan", "label": "Current Plan", "type": "select", "options": ["Free", "Pro", "Enterprise"], "required": true}
    ]'::jsonb,
    true
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    'Technical Support',
    'Technical assistance and troubleshooting',
    '[
      {"name": "full_name", "label": "Full Name", "type": "text", "required": true},
      {"name": "email", "label": "Email", "type": "email", "required": true},
      {"name": "urgency", "label": "Urgency", "type": "select", "options": ["Low", "Medium", "High", "Critical"], "required": true}
    ]'::jsonb,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. SEED USERS
-- Note: In production, users are created via Supabase Auth
-- This is for testing only - passwords would be handled by auth
-- =====================================================

-- Super Admin
INSERT INTO users (id, organization_id, email, full_name, role, is_active, metadata)
VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    NULL,
    'admin@chatdesk.com',
    'Super Admin',
    'super_admin',
    true,
    '{"phone": "+1-555-0001"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Acme Corporation Users
INSERT INTO users (id, organization_id, email, full_name, role, is_active, metadata)
VALUES
  -- Org Admin
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'admin@acme-corp.com',
    'John Admin',
    'org_admin',
    true,
    '{"phone": "+1-555-0002"}'::jsonb
  ),
  -- Sales Agents
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'sarah.sales@acme-corp.com',
    'Sarah Sales',
    'agent',
    true,
    '{"phone": "+1-555-0003", "department": "Sales"}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'mike.sales@acme-corp.com',
    'Mike Marketing',
    'agent',
    true,
    '{"phone": "+1-555-0004", "department": "Sales"}'::jsonb
  ),
  -- Support Agents
  (
    '20000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'tom.support@acme-corp.com',
    'Tom Support',
    'agent',
    true,
    '{"phone": "+1-555-0005", "department": "Support"}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'lisa.support@acme-corp.com',
    'Lisa Helper',
    'agent',
    true,
    '{"phone": "+1-555-0006", "department": "Support"}'::jsonb
  ),
  -- Billing Agent
  (
    '20000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'bob.billing@acme-corp.com',
    'Bob Billing',
    'agent',
    true,
    '{"phone": "+1-555-0007", "department": "Billing"}'::jsonb
  ),
  -- Test Customers
  (
    '20000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    'customer1@example.com',
    'Alice Customer',
    'customer',
    true,
    '{"phone": "+1-555-0008"}'::jsonb
  ),
  (
    '20000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000001',
    'customer2@example.com',
    'Bob Client',
    'customer',
    true,
    '{"phone": "+1-555-0009"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- TechStart Inc Users
INSERT INTO users (id, organization_id, email, full_name, role, is_active, metadata)
VALUES
  -- Org Admin
  (
    '20000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000002',
    'admin@techstart.com',
    'Jane Admin',
    'org_admin',
    true,
    '{"phone": "+1-555-0010"}'::jsonb
  ),
  -- Agents
  (
    '20000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000002',
    'agent@techstart.com',
    'Chris Agent',
    'agent',
    true,
    '{"phone": "+1-555-0011"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. SEED AGENT-DEPARTMENT ASSIGNMENTS
-- =====================================================
INSERT INTO agent_departments (agent_id, department_id)
VALUES
  -- Acme Corp
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001'), -- Sarah -> Sales
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001'), -- Mike -> Sales
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002'), -- Tom -> Support
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002'), -- Lisa -> Support
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000003'), -- Bob -> Billing
  
  -- Multi-department agents
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003'), -- Tom -> Support + Billing
  
  -- TechStart
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004'), -- Chris -> Customer Success
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000005')  -- Chris -> Technical Support
ON CONFLICT (agent_id, department_id) DO NOTHING;

-- =====================================================
-- 5. SEED SAMPLE CONVERSATIONS
-- =====================================================
INSERT INTO conversations (
  id, organization_id, department_id, customer_id, agent_id, status, pre_chat_data, started_at
)
VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000008',
    '20000000-0000-0000-0000-000000000003',
    'active',
    '{"full_name": "Alice Customer", "email": "customer1@example.com", "company": "Example Inc", "interest": "Product Demo"}'::jsonb,
    NOW() - INTERVAL '2 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000009',
    '20000000-0000-0000-0000-000000000005',
    'ticket',
    '{"full_name": "Bob Client", "email": "customer2@example.com", "order_number": "ORD-12345", "issue_type": "Technical Issue"}'::jsonb,
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- Update ticket fields for the ticket conversation
UPDATE conversations
SET 
  ticket_priority = 'high',
  ticket_tags = ARRAY['bug', 'urgent'],
  ticket_notes = 'Customer reported login issues on mobile app'
WHERE id = '30000000-0000-0000-0000-000000000002';

-- =====================================================
-- 6. SEED SAMPLE MESSAGES
-- =====================================================
INSERT INTO messages (conversation_id, sender_id, content, message_type, created_at)
VALUES
  -- Conversation 1 messages
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000008',
    'Hi! I''m interested in learning more about your product.',
    'text',
    NOW() - INTERVAL '2 hours'
  ),
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'Hello Alice! I''d be happy to help. What specific features are you interested in?',
    'text',
    NOW() - INTERVAL '1 hour 55 minutes'
  ),
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000008',
    'I''m particularly interested in the analytics dashboard and API integration.',
    'text',
    NOW() - INTERVAL '1 hour 50 minutes'
  ),
  
  -- Conversation 2 messages
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000009',
    'I can''t log in to my account on the mobile app.',
    'text',
    NOW() - INTERVAL '1 day'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000005',
    'I''m sorry to hear that. Let me help you troubleshoot. What error message are you seeing?',
    'text',
    NOW() - INTERVAL '23 hours'
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED DATA SUMMARY
-- =====================================================
-- Organizations: 2 (Acme Corporation, TechStart Inc)
-- Departments: 5 total
--   - Acme: Sales, Support, Billing
--   - TechStart: Customer Success, Technical Support
-- Users: 11 total
--   - 1 Super Admin
--   - 2 Org Admins
--   - 6 Agents
--   - 2 Customers
-- Agent Assignments: 8 assignments
-- Conversations: 2 (1 active, 1 ticket)
-- Messages: 5 messages

