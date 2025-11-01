-- Enable Realtime for Chat Tables
-- This migration enables Supabase Realtime for real-time message delivery

-- Add messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Add conversations table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Add typing_indicators table to realtime publication (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'typing_indicators'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;
  END IF;
END $$;

-- Verify publications
SELECT 
  pubname,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Ensure RLS policies allow SELECT for realtime
-- (Realtime requires SELECT permission to broadcast changes)

-- Messages: Ensure users can read messages in their organization
DROP POLICY IF EXISTS "Users can view messages in their organization" ON messages;

CREATE POLICY "Users can view messages in their organization"
ON messages
FOR SELECT
USING (
  -- Authenticated users can see messages in their organization
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN users u ON u.organization_id = c.organization_id
    WHERE c.id = messages.conversation_id
    AND u.id = auth.uid()
  )
  OR
  -- Widget customers can see messages in their conversations
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.widget_customer_id = messages.widget_sender_id
      OR c.widget_customer_id IN (
        SELECT id FROM widget_customers WHERE visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id'
      )
    )
  )
);

-- Conversations: Ensure users can read conversations in their organization
DROP POLICY IF EXISTS "Users can view conversations in their organization" ON conversations;

CREATE POLICY "Users can view conversations in their organization"
ON conversations
FOR SELECT
USING (
  -- Authenticated users can see conversations in their organization
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.organization_id = conversations.organization_id
  )
  OR
  -- Widget customers can see their own conversations
  widget_customer_id IS NOT NULL
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

