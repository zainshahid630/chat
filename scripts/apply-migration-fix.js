/**
 * Apply the pre-chat validation fix directly to the database
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../packages/web-dashboard/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const migrationSQL = `
CREATE OR REPLACE FUNCTION validate_pre_chat_data()
RETURNS TRIGGER AS $$
DECLARE
  required_fields JSONB;
  field JSONB;
  field_id TEXT;
BEGIN
  -- Get required fields from department's pre_chat_form
  SELECT pre_chat_form INTO required_fields
  FROM departments
  WHERE id = NEW.department_id;
  
  -- Check each required field
  FOR field IN SELECT * FROM jsonb_array_elements(required_fields)
  LOOP
    IF (field->>'required')::BOOLEAN = true THEN
      field_id := field->>'id';  -- Changed from 'name' to 'id'
      
      -- Check if field exists in pre_chat_data
      IF NOT (NEW.pre_chat_data ? field_id) THEN
        RAISE EXCEPTION 'Required field % is missing', field_id;
      END IF;
      
      -- Check if field is not empty
      IF NEW.pre_chat_data->>field_id IS NULL OR 
         NEW.pre_chat_data->>field_id = '' THEN
        RAISE EXCEPTION 'Required field % cannot be empty', field_id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;

async function main() {
  console.log('🔧 Applying migration fix...\n');

  const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

  if (error) {
    // Try direct query instead
    console.log('Trying direct query...');
    const { error: directError } = await supabase.from('_sql').insert({ query: migrationSQL });
    
    if (directError) {
      console.error('❌ Error applying migration:', error);
      console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
      console.log(migrationSQL);
      return;
    }
  }

  console.log('✅ Migration applied successfully!\n');
  console.log('Now you can run: node scripts/create-test-conversations.js');
}

main().catch(console.error);

