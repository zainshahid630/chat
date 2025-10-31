-- ChatDesk Authentication Triggers
-- Phase 1.4: Authentication
-- Created: 2025-10-31

-- =====================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a user profile in the users table
  -- Default role is 'customer' unless specified in metadata
  INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    metadata
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- UPDATE USER PROFILE ON AUTH UPDATE
-- =====================================================
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user profile when auth.users is updated
  UPDATE public.users
  SET
    email = NEW.email,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users update
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_update();

-- =====================================================
-- DELETE USER PROFILE ON AUTH DELETE
-- =====================================================
-- Note: This is handled by ON DELETE CASCADE in the users table foreign key

-- =====================================================
-- HELPER FUNCTION: Check if email exists
-- =====================================================
CREATE OR REPLACE FUNCTION email_exists(p_email TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Get user by email
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_by_email(p_email TEXT)
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  full_name VARCHAR,
  role VARCHAR,
  organization_id UUID
) AS $$
  SELECT id, email, full_name, role, organization_id
  FROM users
  WHERE email = p_email;
$$ LANGUAGE SQL SECURITY DEFINER;

