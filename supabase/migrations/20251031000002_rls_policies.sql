-- ChatDesk Row Level Security (RLS) Policies
-- Phase 1.3: Database Schema
-- Created: 2025-10-31

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Get user's organization
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Get user's role
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Check if user is super admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Check if user is org admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role IN ('org_admin', 'super_admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- 1. ORGANIZATIONS POLICIES
-- =====================================================

-- Super admins can see all organizations
CREATE POLICY "Super admins can view all organizations"
ON organizations FOR SELECT
TO authenticated
USING (is_super_admin());

-- Users can view their own organization
CREATE POLICY "Users can view their own organization"
ON organizations FOR SELECT
TO authenticated
USING (id = get_user_organization_id());

-- Super admins can insert organizations
CREATE POLICY "Super admins can create organizations"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

-- Org admins can update their own organization
CREATE POLICY "Org admins can update their organization"
ON organizations FOR UPDATE
TO authenticated
USING (id = get_user_organization_id() AND is_org_admin());

-- =====================================================
-- 2. DEPARTMENTS POLICIES
-- =====================================================

-- Users can view departments in their organization
CREATE POLICY "Users can view their organization's departments"
ON departments FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id());

-- Org admins can manage departments
CREATE POLICY "Org admins can insert departments"
ON departments FOR INSERT
TO authenticated
WITH CHECK (organization_id = get_user_organization_id() AND is_org_admin());

CREATE POLICY "Org admins can update departments"
ON departments FOR UPDATE
TO authenticated
USING (organization_id = get_user_organization_id() AND is_org_admin());

CREATE POLICY "Org admins can delete departments"
ON departments FOR DELETE
TO authenticated
USING (organization_id = get_user_organization_id() AND is_org_admin());

-- =====================================================
-- 3. USERS POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can view other users in their organization
CREATE POLICY "Users can view organization members"
ON users FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id());

-- Super admins can view all users
CREATE POLICY "Super admins can view all users"
ON users FOR SELECT
TO authenticated
USING (is_super_admin());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Org admins can insert users in their organization
CREATE POLICY "Org admins can create users"
ON users FOR INSERT
TO authenticated
WITH CHECK (organization_id = get_user_organization_id() AND is_org_admin());

-- =====================================================
-- 4. AGENT_DEPARTMENTS POLICIES
-- =====================================================

-- Users can view agent-department assignments in their org
CREATE POLICY "Users can view agent departments"
ON agent_departments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM departments d
    WHERE d.id = agent_departments.department_id
    AND d.organization_id = get_user_organization_id()
  )
);

-- Org admins can manage agent-department assignments
CREATE POLICY "Org admins can assign agents to departments"
ON agent_departments FOR INSERT
TO authenticated
WITH CHECK (
  is_org_admin() AND
  EXISTS (
    SELECT 1 FROM departments d
    WHERE d.id = department_id
    AND d.organization_id = get_user_organization_id()
  )
);

CREATE POLICY "Org admins can remove agent assignments"
ON agent_departments FOR DELETE
TO authenticated
USING (
  is_org_admin() AND
  EXISTS (
    SELECT 1 FROM departments d
    WHERE d.id = agent_departments.department_id
    AND d.organization_id = get_user_organization_id()
  )
);

-- =====================================================
-- 5. CONVERSATIONS POLICIES
-- =====================================================

-- Customers can view their own conversations
CREATE POLICY "Customers can view their conversations"
ON conversations FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Agents can view conversations in their departments
CREATE POLICY "Agents can view department conversations"
ON conversations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agent_departments ad
    WHERE ad.agent_id = auth.uid()
    AND ad.department_id = conversations.department_id
  )
);

-- Org admins can view all conversations in their organization
CREATE POLICY "Org admins can view all conversations"
ON conversations FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id() AND is_org_admin());

-- Customers can create conversations
CREATE POLICY "Customers can create conversations"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (customer_id = auth.uid());

-- Agents can update conversations (assign, close, mark as ticket)
CREATE POLICY "Agents can update conversations"
ON conversations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM agent_departments ad
    WHERE ad.agent_id = auth.uid()
    AND ad.department_id = conversations.department_id
  )
);

-- =====================================================
-- 6. MESSAGES POLICIES
-- =====================================================

-- Users can view messages in conversations they're part of
CREATE POLICY "Users can view their conversation messages"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.customer_id = auth.uid() OR c.agent_id = auth.uid())
  )
);

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (c.customer_id = auth.uid() OR c.agent_id = auth.uid())
  )
);

-- =====================================================
-- 7. MESSAGE_STATUS POLICIES
-- =====================================================

-- Users can view message status
CREATE POLICY "Users can view message status"
ON message_status FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.id = message_status.message_id
    AND (c.customer_id = auth.uid() OR c.agent_id = auth.uid())
  )
);

-- Users can update message status
CREATE POLICY "Users can update message status"
ON message_status FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 8. BLOCKED_USERS POLICIES
-- =====================================================

-- Org admins can view blocked users
CREATE POLICY "Org admins can view blocked users"
ON blocked_users FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id() AND is_org_admin());

-- Org admins can block users
CREATE POLICY "Org admins can block users"
ON blocked_users FOR INSERT
TO authenticated
WITH CHECK (organization_id = get_user_organization_id() AND is_org_admin());

-- Org admins can unblock users
CREATE POLICY "Org admins can unblock users"
ON blocked_users FOR DELETE
TO authenticated
USING (organization_id = get_user_organization_id() AND is_org_admin());

-- =====================================================
-- 9. WEBHOOKS POLICIES
-- =====================================================

-- Org admins can manage webhooks
CREATE POLICY "Org admins can view webhooks"
ON webhooks FOR SELECT
TO authenticated
USING (organization_id = get_user_organization_id() AND is_org_admin());

CREATE POLICY "Org admins can create webhooks"
ON webhooks FOR INSERT
TO authenticated
WITH CHECK (organization_id = get_user_organization_id() AND is_org_admin());

CREATE POLICY "Org admins can update webhooks"
ON webhooks FOR UPDATE
TO authenticated
USING (organization_id = get_user_organization_id() AND is_org_admin());

CREATE POLICY "Org admins can delete webhooks"
ON webhooks FOR DELETE
TO authenticated
USING (organization_id = get_user_organization_id() AND is_org_admin());

-- =====================================================
-- 10. WEBHOOK_LOGS POLICIES
-- =====================================================

-- Org admins can view webhook logs
CREATE POLICY "Org admins can view webhook logs"
ON webhook_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM webhooks w
    WHERE w.id = webhook_logs.webhook_id
    AND w.organization_id = get_user_organization_id()
    AND is_org_admin()
  )
);

