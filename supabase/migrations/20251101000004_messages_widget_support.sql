-- =====================================================
-- MESSAGES TABLE: ADD WIDGET CUSTOMER SUPPORT
-- =====================================================
-- This migration allows messages to be sent by widget customers
-- who don't have auth accounts in the users table
-- =====================================================

-- 1. Make sender_id nullable (for widget customer messages)
ALTER TABLE messages
ALTER COLUMN sender_id DROP NOT NULL;

-- 2. Add widget_sender_id column
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS widget_sender_id UUID REFERENCES widget_customers(id) ON DELETE CASCADE;

-- 3. Add constraint: must have either sender_id OR widget_sender_id
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS check_sender_type;

ALTER TABLE messages
ADD CONSTRAINT check_sender_type CHECK (
  (sender_id IS NOT NULL AND widget_sender_id IS NULL) OR
  (sender_id IS NULL AND widget_sender_id IS NOT NULL)
);

-- 4. Create index
CREATE INDEX IF NOT EXISTS idx_messages_widget_sender ON messages(widget_sender_id);

-- 5. Update RLS policies for messages

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their conversation messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- Users can view messages in conversations they're part of (including widget conversations)
CREATE POLICY "Users can view their conversation messages"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.customer_id = auth.uid() OR 
      c.agent_id = auth.uid() OR
      c.organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
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

-- Service role can do everything (for widget API)
CREATE POLICY "Service role has full access to messages"
ON messages FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Comments
COMMENT ON COLUMN messages.sender_id IS 'Reference to users for authenticated senders. NULL for widget customers';
COMMENT ON COLUMN messages.widget_sender_id IS 'Reference to widget_customers for anonymous widget senders. NULL for authenticated users';

