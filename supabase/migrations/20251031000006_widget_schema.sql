-- Migration: Widget Schema
-- Description: Add tables for embeddable chat widget functionality
-- Created: 2025-10-31

-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- Widget Settings Table
-- =====================================================
-- Stores widget configuration for each organization

CREATE TABLE widget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  widget_key VARCHAR(255) UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  
  -- Appearance Settings
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  position VARCHAR(20) DEFAULT 'bottom-right' CHECK (position IN ('bottom-right', 'bottom-left')),
  bubble_icon VARCHAR(50) DEFAULT 'chat',
  widget_title VARCHAR(100) DEFAULT 'Chat with us',
  
  -- Behavior Settings
  greeting_message TEXT DEFAULT 'Hi! How can we help you today?',
  auto_open BOOLEAN DEFAULT false,
  auto_open_delay INTEGER DEFAULT 5, -- seconds
  show_agent_avatars BOOLEAN DEFAULT true,
  show_typing_indicator BOOLEAN DEFAULT true,
  play_notification_sound BOOLEAN DEFAULT true,
  
  -- Business Hours (JSONB array of objects)
  -- Example: [{"day": "monday", "start": "09:00", "end": "17:00", "enabled": true}]
  business_hours JSONB DEFAULT '[]'::jsonb,
  offline_message TEXT DEFAULT 'We are currently offline. Leave a message and we will get back to you.',
  
  -- Security
  allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[], -- Empty array = allow all domains
  
  -- Default Department
  default_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_widget_settings_org ON widget_settings(organization_id);
CREATE INDEX idx_widget_settings_key ON widget_settings(widget_key);

-- =====================================================
-- Widget Sessions Table
-- =====================================================
-- Tracks anonymous visitors and their sessions

CREATE TABLE widget_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  widget_key VARCHAR(255) NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  
  -- Visitor Information
  visitor_id VARCHAR(255), -- Anonymous visitor tracking (cookie-based)
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  -- Technical Information
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  current_url TEXT,
  
  -- Geolocation (optional, can be populated via IP lookup)
  country VARCHAR(2),
  city VARCHAR(100),
  
  -- Device Information
  device_type VARCHAR(50), -- desktop, mobile, tablet
  browser VARCHAR(100),
  os VARCHAR(100),
  screen_resolution VARCHAR(20),
  
  -- Session State
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

-- Indexes for performance
CREATE INDEX idx_widget_sessions_org ON widget_sessions(organization_id);
CREATE INDEX idx_widget_sessions_token ON widget_sessions(session_token);
CREATE INDEX idx_widget_sessions_visitor ON widget_sessions(visitor_id);
CREATE INDEX idx_widget_sessions_conversation ON widget_sessions(conversation_id);
CREATE INDEX idx_widget_sessions_active ON widget_sessions(is_active, last_seen_at);

-- =====================================================
-- Functions
-- =====================================================

-- Function to generate unique widget key
CREATE OR REPLACE FUNCTION generate_widget_key()
RETURNS VARCHAR(255) AS $$
DECLARE
  key_prefix VARCHAR(3) := 'wk_';
  random_string VARCHAR(32);
  new_key VARCHAR(255);
  key_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random string using UUID (remove hyphens)
    random_string := REPLACE(gen_random_uuid()::TEXT, '-', '');
    new_key := key_prefix || random_string;

    -- Check if key already exists
    SELECT EXISTS(SELECT 1 FROM widget_settings WHERE widget_key = new_key) INTO key_exists;

    -- If key doesn't exist, return it
    IF NOT key_exists THEN
      RETURN new_key;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate session token
CREATE OR REPLACE FUNCTION generate_session_token()
RETURNS VARCHAR(255) AS $$
DECLARE
  token_prefix VARCHAR(3) := 'st_';
  random_string VARCHAR(64);
  new_token VARCHAR(255);
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random string using two UUIDs (remove hyphens)
    random_string := REPLACE(gen_random_uuid()::TEXT || gen_random_uuid()::TEXT, '-', '');
    new_token := token_prefix || random_string;

    -- Check if token already exists
    SELECT EXISTS(SELECT 1 FROM widget_sessions WHERE session_token = new_token) INTO token_exists;

    -- If token doesn't exist, return it
    IF NOT token_exists THEN
      RETURN new_token;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp for widget_settings
CREATE TRIGGER update_widget_settings_updated_at
  BEFORE UPDATE ON widget_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate widget_key on insert if not provided
CREATE OR REPLACE FUNCTION auto_generate_widget_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.widget_key IS NULL OR NEW.widget_key = '' THEN
    NEW.widget_key := generate_widget_key();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_widget_key
  BEFORE INSERT ON widget_settings
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_widget_key();

-- Auto-update last_seen_at for widget_sessions
CREATE OR REPLACE FUNCTION update_session_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_last_seen
  BEFORE UPDATE ON widget_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_seen();

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE widget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_sessions ENABLE ROW LEVEL SECURITY;

-- Widget Settings Policies
-- Organization admins can manage their widget settings
CREATE POLICY widget_settings_org_access ON widget_settings
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Public read access for widget initialization (by widget_key)
CREATE POLICY widget_settings_public_read ON widget_settings
  FOR SELECT
  USING (enabled = true);

-- Widget Sessions Policies
-- Organization members can view their sessions
CREATE POLICY widget_sessions_org_access ON widget_sessions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Public insert for new sessions (widget creates sessions)
CREATE POLICY widget_sessions_public_insert ON widget_sessions
  FOR INSERT
  WITH CHECK (true);

-- Public update for session activity
CREATE POLICY widget_sessions_public_update ON widget_sessions
  FOR UPDATE
  USING (true);

-- =====================================================
-- Seed Data (Optional - for testing)
-- =====================================================

-- Create default widget settings for existing organizations
INSERT INTO widget_settings (organization_id, widget_key, enabled)
SELECT 
  id,
  generate_widget_key(),
  true
FROM organizations
WHERE NOT EXISTS (
  SELECT 1 FROM widget_settings WHERE widget_settings.organization_id = organizations.id
);

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE widget_settings IS 'Configuration settings for embeddable chat widget per organization';
COMMENT ON TABLE widget_sessions IS 'Tracks anonymous visitor sessions from widget';
COMMENT ON COLUMN widget_settings.widget_key IS 'Public key used to initialize widget (e.g., wk_abc123...)';
COMMENT ON COLUMN widget_settings.allowed_domains IS 'Whitelist of domains where widget can be embedded. Empty = allow all';
COMMENT ON COLUMN widget_sessions.session_token IS 'Unique token for widget session authentication';
COMMENT ON COLUMN widget_sessions.visitor_id IS 'Anonymous visitor identifier stored in browser cookie';

