-- Make customer_id nullable in conversations table
-- This allows widget conversations without authenticated customer accounts

ALTER TABLE conversations 
ALTER COLUMN customer_id DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN conversations.customer_id IS 'User ID of the customer. NULL for anonymous widget customers (tracked via metadata instead)';

