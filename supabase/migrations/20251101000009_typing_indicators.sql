-- Create typing_indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  widget_customer_id UUID REFERENCES widget_customers(id) ON DELETE CASCADE,
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure either user_id or widget_customer_id is set, but not both
  CONSTRAINT typing_indicator_sender_check CHECK (
    (user_id IS NOT NULL AND widget_customer_id IS NULL) OR
    (user_id IS NULL AND widget_customer_id IS NOT NULL)
  ),
  
  -- Unique constraint: one typing indicator per conversation per user/customer
  CONSTRAINT unique_typing_indicator UNIQUE (conversation_id, user_id, widget_customer_id)
);

-- Create index for faster lookups
CREATE INDEX idx_typing_indicators_conversation ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_indicators_user ON typing_indicators(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_typing_indicators_widget_customer ON typing_indicators(widget_customer_id) WHERE widget_customer_id IS NOT NULL;

-- Enable RLS
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to see typing indicators in their organization's conversations
CREATE POLICY "Users can view typing indicators in their org conversations"
  ON typing_indicators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN users u ON u.organization_id = c.organization_id
      WHERE c.id = typing_indicators.conversation_id
      AND u.id = auth.uid()
    )
  );

-- Allow authenticated users to insert/update their own typing indicators
CREATE POLICY "Users can manage their own typing indicators"
  ON typing_indicators
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow widget customers to manage their typing indicators (via service role)
-- This will be handled by the API endpoint

-- Function to auto-delete old typing indicators (older than 10 seconds)
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM typing_indicators
  WHERE updated_at < NOW() - INTERVAL '10 seconds';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup old typing indicators
CREATE TRIGGER cleanup_typing_indicators_trigger
  AFTER INSERT OR UPDATE ON typing_indicators
  EXECUTE FUNCTION cleanup_old_typing_indicators();

-- Function to automatically set is_typing to false after 5 seconds
CREATE OR REPLACE FUNCTION auto_stop_typing()
RETURNS void AS $$
BEGIN
  UPDATE typing_indicators
  SET is_typing = false
  WHERE is_typing = true
  AND updated_at < NOW() - INTERVAL '5 seconds';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON typing_indicators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON typing_indicators TO service_role;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

