-- ChatDesk Database Functions and Triggers
-- Phase 1.3: Database Schema
-- Created: 2025-10-31

-- =====================================================
-- 1. AUTO-UPDATE TIMESTAMP FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. AUTO-GENERATE TICKET NUMBER
-- =====================================================
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  org_prefix VARCHAR(10);
BEGIN
  -- Only generate ticket number when status changes to 'ticket'
  IF NEW.status = 'ticket' AND (OLD.status IS NULL OR OLD.status != 'ticket') THEN
    -- Get organization prefix (first 4 letters of org name)
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 4))
    INTO org_prefix
    FROM organizations
    WHERE id = NEW.organization_id;
    
    -- Get next ticket number for this organization
    SELECT COALESCE(MAX(
      CAST(
        SUBSTRING(ticket_number FROM '[0-9]+$') AS INTEGER
      )
    ), 1000) + 1
    INTO next_number
    FROM conversations
    WHERE organization_id = NEW.organization_id
    AND ticket_number IS NOT NULL;
    
    -- Generate ticket number: PREFIX-NUMBER (e.g., CHAT-1001)
    NEW.ticket_number := org_prefix || '-' || next_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_conversation_ticket_number
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

-- =====================================================
-- 3. UPDATE CONVERSATION TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_conversation_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set assigned_at when agent is assigned
  IF NEW.agent_id IS NOT NULL AND (OLD.agent_id IS NULL OR OLD.agent_id != NEW.agent_id) THEN
    NEW.assigned_at := NOW();
  END IF;
  
  -- Set closed_at when conversation is closed
  IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status != 'closed') THEN
    NEW.closed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_status_timestamps
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamps();

-- =====================================================
-- 4. UPDATE USER LAST SEEN
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET last_seen_at = NOW()
  WHERE id = NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sender_last_seen
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_seen();

-- =====================================================
-- 5. AUTO-CREATE MESSAGE STATUS
-- =====================================================
CREATE OR REPLACE FUNCTION create_message_status()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
BEGIN
  -- Get the recipient (the other person in the conversation)
  SELECT CASE
    WHEN c.customer_id = NEW.sender_id THEN c.agent_id
    WHEN c.agent_id = NEW.sender_id THEN c.customer_id
    ELSE NULL
  END INTO recipient_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;
  
  -- Create 'sent' status for sender
  INSERT INTO message_status (message_id, user_id, status, timestamp)
  VALUES (NEW.id, NEW.sender_id, 'sent', NEW.created_at);
  
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
-- 6. PREVENT BLOCKED USER MESSAGES
-- =====================================================
CREATE OR REPLACE FUNCTION check_blocked_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if customer is blocked
  IF EXISTS (
    SELECT 1 FROM blocked_users bu
    JOIN conversations c ON c.organization_id = bu.organization_id
    WHERE c.id = NEW.conversation_id
    AND bu.customer_id = NEW.sender_id
  ) THEN
    RAISE EXCEPTION 'User is blocked from sending messages';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_blocked_user_messages
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION check_blocked_user();

-- =====================================================
-- 7. VALIDATE PRE-CHAT FORM DATA
-- =====================================================
CREATE OR REPLACE FUNCTION validate_pre_chat_data()
RETURNS TRIGGER AS $$
DECLARE
  required_fields JSONB;
  field JSONB;
  field_name TEXT;
BEGIN
  -- Get required fields from department's pre_chat_form
  SELECT pre_chat_form INTO required_fields
  FROM departments
  WHERE id = NEW.department_id;
  
  -- Check each required field
  FOR field IN SELECT * FROM jsonb_array_elements(required_fields)
  LOOP
    IF (field->>'required')::BOOLEAN = true THEN
      field_name := field->>'name';
      
      -- Check if field exists in pre_chat_data
      IF NOT (NEW.pre_chat_data ? field_name) THEN
        RAISE EXCEPTION 'Required field % is missing', field_name;
      END IF;
      
      -- Check if field is not empty
      IF NEW.pre_chat_data->>field_name IS NULL OR 
         NEW.pre_chat_data->>field_name = '' THEN
        RAISE EXCEPTION 'Required field % cannot be empty', field_name;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_conversation_pre_chat_data
  BEFORE INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION validate_pre_chat_data();

-- =====================================================
-- 8. UPDATE CONVERSATION ON NEW MESSAGE
-- =====================================================
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation's updated_at timestamp
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- =====================================================
-- 9. HELPER FUNCTION: Get unread message count
-- =====================================================
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_user_id UUID,
  p_conversation_id UUID
)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM messages m
  LEFT JOIN message_status ms ON ms.message_id = m.id AND ms.user_id = p_user_id
  WHERE m.conversation_id = p_conversation_id
  AND m.sender_id != p_user_id
  AND (ms.status IS NULL OR ms.status != 'read');
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- 10. HELPER FUNCTION: Get active conversations count
-- =====================================================
CREATE OR REPLACE FUNCTION get_active_conversations_count(
  p_organization_id UUID
)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM conversations
  WHERE organization_id = p_organization_id
  AND status IN ('waiting', 'active');
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- 11. HELPER FUNCTION: Get agent availability
-- =====================================================
CREATE OR REPLACE FUNCTION get_available_agents(
  p_department_id UUID
)
RETURNS TABLE (
  agent_id UUID,
  agent_name VARCHAR,
  active_conversations INTEGER
) AS $$
  SELECT 
    u.id,
    u.full_name,
    COUNT(c.id)::INTEGER as active_conversations
  FROM users u
  JOIN agent_departments ad ON ad.agent_id = u.id
  LEFT JOIN conversations c ON c.agent_id = u.id AND c.status = 'active'
  WHERE ad.department_id = p_department_id
  AND u.is_active = true
  AND u.role = 'agent'
  GROUP BY u.id, u.full_name
  ORDER BY active_conversations ASC;
$$ LANGUAGE SQL STABLE;

