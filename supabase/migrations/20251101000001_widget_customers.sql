-- Create widget_customers table for anonymous widget visitors
-- This separates widget customers from authenticated users

CREATE TABLE widget_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  visitor_id VARCHAR(255) NOT NULL, -- Browser fingerprint/session ID
  
  -- Optional contact info (collected during chat or pre-chat form)
  email VARCHAR(255),
  full_name VARCHAR(255),
  phone VARCHAR(50),
  
  -- Browser/device info
  user_agent TEXT,
  ip_address INET,
  
  -- Location info (if available)
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Custom data from pre-chat forms or chat
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Tracking
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  total_conversations INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one visitor_id per organization
  CONSTRAINT unique_visitor_per_org UNIQUE (organization_id, visitor_id)
);

-- Indexes
CREATE INDEX idx_widget_customers_org ON widget_customers(organization_id);
CREATE INDEX idx_widget_customers_visitor ON widget_customers(visitor_id);
CREATE INDEX idx_widget_customers_email ON widget_customers(email) WHERE email IS NOT NULL;

-- RLS Policies
ALTER TABLE widget_customers ENABLE ROW LEVEL SECURITY;

-- Admins and agents can view widget customers in their organization
CREATE POLICY "Users can view widget customers in their organization"
  ON widget_customers
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Service role can do everything (for widget API)
CREATE POLICY "Service role has full access to widget customers"
  ON widget_customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add widget_customer_id to conversations table
ALTER TABLE conversations
ADD COLUMN widget_customer_id UUID REFERENCES widget_customers(id) ON DELETE SET NULL;

-- Make customer_id nullable (since widget customers won't have auth accounts)
ALTER TABLE conversations
ALTER COLUMN customer_id DROP NOT NULL;

-- Add constraint: must have either customer_id OR widget_customer_id
ALTER TABLE conversations
ADD CONSTRAINT check_customer_type CHECK (
  (customer_id IS NOT NULL AND widget_customer_id IS NULL) OR
  (customer_id IS NULL AND widget_customer_id IS NOT NULL)
);

-- Create index
CREATE INDEX idx_conversations_widget_customer ON conversations(widget_customer_id);

-- Update trigger for updated_at
CREATE TRIGGER update_widget_customers_updated_at
  BEFORE UPDATE ON widget_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_seen_at and total_conversations
CREATE OR REPLACE FUNCTION update_widget_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_seen_at and increment total_conversations
  UPDATE widget_customers
  SET 
    last_seen_at = NOW(),
    total_conversations = total_conversations + 1
  WHERE id = NEW.widget_customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update widget customer stats when conversation is created
CREATE TRIGGER update_widget_customer_stats_on_conversation
  AFTER INSERT ON conversations
  FOR EACH ROW
  WHEN (NEW.widget_customer_id IS NOT NULL)
  EXECUTE FUNCTION update_widget_customer_stats();

-- Add comment
COMMENT ON TABLE widget_customers IS 'Anonymous customers who interact via the chat widget';
COMMENT ON COLUMN widget_customers.visitor_id IS 'Unique identifier for the visitor (browser fingerprint or session ID)';
COMMENT ON COLUMN widget_customers.metadata IS 'Custom data collected from pre-chat forms or during chat';

