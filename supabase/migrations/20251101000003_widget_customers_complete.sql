-- =====================================================
-- COMPLETE WIDGET CUSTOMER SOLUTION
-- =====================================================
-- This migration creates a proper widget customer system:
-- 1. widget_customers table for anonymous visitors
-- 2. Makes customer_id nullable in conversations
-- 3. Adds widget_customer_id to conversations
-- 4. Updates RLS policies
-- =====================================================

-- 1. Create widget_customers table
CREATE TABLE IF NOT EXISTS widget_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Visitor tracking
  visitor_id VARCHAR(255) NOT NULL, -- Browser fingerprint from widget session
  
  -- Contact information (optional, collected during chat or pre-chat form)
  email VARCHAR(255),
  full_name VARCHAR(255),
  phone VARCHAR(50),
  
  -- Browser/device info
  user_agent TEXT,
  ip_address INET,
  
  -- Location (if available)
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Custom data from pre-chat forms
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  -- Tracking
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  total_conversations INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One visitor_id per organization
  CONSTRAINT unique_visitor_per_org UNIQUE (organization_id, visitor_id)
);

-- Indexes for widget_customers
CREATE INDEX idx_widget_customers_org ON widget_customers(organization_id);
CREATE INDEX idx_widget_customers_visitor ON widget_customers(visitor_id);
CREATE INDEX idx_widget_customers_email ON widget_customers(email) WHERE email IS NOT NULL;

-- 2. Add widget_customer_id to conversations
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS widget_customer_id UUID REFERENCES widget_customers(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_conversations_widget_customer ON conversations(widget_customer_id);

-- 3. Make customer_id nullable (widget conversations don't need auth users)
ALTER TABLE conversations
ALTER COLUMN customer_id DROP NOT NULL;

-- 4. Add constraint: must have either customer_id OR widget_customer_id
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS check_customer_type;

ALTER TABLE conversations
ADD CONSTRAINT check_customer_type CHECK (
  (customer_id IS NOT NULL AND widget_customer_id IS NULL) OR
  (customer_id IS NULL AND widget_customer_id IS NOT NULL)
);

-- 5. RLS Policies for widget_customers
ALTER TABLE widget_customers ENABLE ROW LEVEL SECURITY;

-- Admins and agents can view widget customers in their organization
DROP POLICY IF EXISTS "Users can view widget customers in their organization" ON widget_customers;
CREATE POLICY "Users can view widget customers in their organization"
  ON widget_customers
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Service role has full access (for widget API)
DROP POLICY IF EXISTS "Service role has full access to widget customers" ON widget_customers;
CREATE POLICY "Service role has full access to widget customers"
  ON widget_customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Update trigger for updated_at
DROP TRIGGER IF EXISTS update_widget_customers_updated_at ON widget_customers;
CREATE TRIGGER update_widget_customers_updated_at
  BEFORE UPDATE ON widget_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Function to update widget customer stats
CREATE OR REPLACE FUNCTION update_widget_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_seen_at and increment total_conversations
  IF NEW.widget_customer_id IS NOT NULL THEN
    UPDATE widget_customers
    SET 
      last_seen_at = NOW(),
      total_conversations = total_conversations + 1
    WHERE id = NEW.widget_customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update widget customer stats when conversation is created
DROP TRIGGER IF EXISTS update_widget_customer_stats_on_conversation ON conversations;
CREATE TRIGGER update_widget_customer_stats_on_conversation
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_widget_customer_stats();

-- 8. Update conversations RLS policies to handle widget customers
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations in their organization" ON conversations;

-- Recreate with widget customer support
CREATE POLICY "Users can view conversations in their organization"
  ON conversations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations in their organization"
  ON conversations
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update conversations in their organization"
  ON conversations
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Service role has full access
DROP POLICY IF EXISTS "Service role has full access to conversations" ON conversations;
CREATE POLICY "Service role has full access to conversations"
  ON conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 9. Comments
COMMENT ON TABLE widget_customers IS 'Anonymous customers who interact via the chat widget';
COMMENT ON COLUMN widget_customers.visitor_id IS 'Unique identifier for the visitor (from widget session)';
COMMENT ON COLUMN widget_customers.custom_fields IS 'Custom data collected from pre-chat forms or during chat';
COMMENT ON COLUMN conversations.widget_customer_id IS 'Reference to widget_customers for anonymous widget conversations';
COMMENT ON COLUMN conversations.customer_id IS 'Reference to users for authenticated customers. NULL for widget customers';

