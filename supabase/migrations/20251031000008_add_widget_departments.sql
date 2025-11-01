-- Add enabled_department_ids to widget_settings
-- This allows admins to select which departments are available in the widget

ALTER TABLE widget_settings
ADD COLUMN enabled_department_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Add index for performance
CREATE INDEX idx_widget_settings_enabled_depts ON widget_settings USING GIN (enabled_department_ids);

-- Comment
COMMENT ON COLUMN widget_settings.enabled_department_ids IS 'Array of department IDs that are enabled in the widget. Empty = all active departments';

