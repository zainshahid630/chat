-- Fix: Auto-generate session_token for widget_sessions
-- This migration adds a trigger to automatically generate session tokens

-- Create trigger function to auto-generate session token
CREATE OR REPLACE FUNCTION auto_generate_session_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_token IS NULL OR NEW.session_token = '' THEN
    NEW.session_token := generate_session_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_auto_generate_session_token
  BEFORE INSERT ON widget_sessions
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_session_token();

-- Update existing rows that might have null session_token (if any)
UPDATE widget_sessions 
SET session_token = generate_session_token() 
WHERE session_token IS NULL;

