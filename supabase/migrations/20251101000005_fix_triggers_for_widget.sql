-- =====================================================
-- FIX TRIGGERS FOR WIDGET CUSTOMER MESSAGES
-- =====================================================
-- This migration updates triggers to handle widget customer messages
-- where sender_id is NULL and widget_sender_id is used instead
-- =====================================================

-- =====================================================
-- 1. FIX: UPDATE USER LAST SEEN (skip for widget customers)
-- =====================================================
DROP TRIGGER IF EXISTS update_sender_last_seen ON messages;

CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if sender_id is not null (authenticated users)
  -- Skip for widget customers (widget_sender_id)
  IF NEW.sender_id IS NOT NULL THEN
    UPDATE users
    SET last_seen_at = NOW()
    WHERE id = NEW.sender_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sender_last_seen
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_seen();

-- =====================================================
-- 2. FIX: AUTO-CREATE MESSAGE STATUS (handle widget customers)
-- =====================================================
DROP TRIGGER IF EXISTS auto_create_message_status ON messages;

CREATE OR REPLACE FUNCTION create_message_status()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_user_id UUID;
BEGIN
  -- Determine the actual sender user_id
  -- For widget customers, we don't create message_status records
  -- because they don't have user accounts
  IF NEW.sender_id IS NOT NULL THEN
    sender_user_id := NEW.sender_id;
  ELSE
    -- Widget customer message - skip message_status creation
    RETURN NEW;
  END IF;
  
  -- Get the recipient (the other person in the conversation)
  SELECT CASE
    WHEN c.customer_id = sender_user_id THEN c.agent_id
    WHEN c.agent_id = sender_user_id THEN c.customer_id
    WHEN c.widget_customer_id IS NOT NULL THEN c.agent_id
    ELSE NULL
  END INTO recipient_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;
  
  -- Create 'sent' status for sender (only for authenticated users)
  INSERT INTO message_status (message_id, user_id, status, timestamp)
  VALUES (NEW.id, sender_user_id, 'sent', NEW.created_at);
  
  -- Create 'delivered' status for recipient (if exists)
  IF recipient_id IS NOT NULL THEN
    INSERT INTO message_status (message_id, user_id, status, timestamp)
    VALUES (NEW.id, recipient_id, 'delivered', NEW.created_at);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_message_status
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_status();

-- =====================================================
-- 3. FIX: PREVENT BLOCKED USER MESSAGES (handle widget customers)
-- =====================================================
DROP TRIGGER IF EXISTS prevent_blocked_user_messages ON messages;

CREATE OR REPLACE FUNCTION check_blocked_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for authenticated users, skip widget customers
  IF NEW.sender_id IS NOT NULL THEN
    -- Check if customer is blocked
    IF EXISTS (
      SELECT 1 FROM blocked_users bu
      JOIN conversations c ON c.organization_id = bu.organization_id
      WHERE c.id = NEW.conversation_id
      AND bu.customer_id = NEW.sender_id
    ) THEN
      RAISE EXCEPTION 'User is blocked from sending messages';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_blocked_user_messages
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION check_blocked_user();

-- =====================================================
-- 4. COMMENTS
-- =====================================================
COMMENT ON FUNCTION update_user_last_seen() IS 'Updates last_seen_at for authenticated users only. Skips widget customers.';
COMMENT ON FUNCTION create_message_status() IS 'Creates message status records for authenticated users only. Skips widget customers.';
COMMENT ON FUNCTION check_blocked_user() IS 'Checks if authenticated user is blocked. Skips widget customers.';

