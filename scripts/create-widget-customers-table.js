const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'packages/web-dashboard/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTable() {
  console.log('📦 Creating widget_customers table...\n');

  // Step 1: Create widget_customers table
  console.log('1. Creating widget_customers table...');
  const { error: createError } = await supabase.rpc('exec_raw_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS widget_customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        visitor_id VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        full_name VARCHAR(255),
        phone VARCHAR(50),
        user_agent TEXT,
        ip_address INET,
        country VARCHAR(100),
        city VARCHAR(100),
        metadata JSONB DEFAULT '{}'::jsonb,
        first_seen_at TIMESTAMPTZ DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
        total_conversations INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_visitor_per_org UNIQUE (organization_id, visitor_id)
      );
    `
  });

  if (createError && !createError.message.includes('already exists')) {
    console.error('❌ Error creating table:', createError);
    return;
  }
  console.log('✅ Table created\n');

  // Step 2: Add widget_customer_id to conversations
  console.log('2. Adding widget_customer_id column to conversations...');
  const { error: alterError } = await supabase.rpc('exec_raw_sql', {
    query: `
      ALTER TABLE conversations
      ADD COLUMN IF NOT EXISTS widget_customer_id UUID REFERENCES widget_customers(id) ON DELETE SET NULL;
    `
  });

  if (alterError && !alterError.message.includes('already exists')) {
    console.error('❌ Error adding column:', alterError);
  } else {
    console.log('✅ Column added\n');
  }

  // Step 3: Make customer_id nullable
  console.log('3. Making customer_id nullable...');
  const { error: nullableError } = await supabase.rpc('exec_raw_sql', {
    query: `
      ALTER TABLE conversations
      ALTER COLUMN customer_id DROP NOT NULL;
    `
  });

  if (nullableError && !nullableError.message.includes('does not exist')) {
    console.error('❌ Error making column nullable:', nullableError);
  } else {
    console.log('✅ Column made nullable\n');
  }

  console.log('✨ Done! Widget customers table is ready.\n');
  console.log('Note: RLS policies and triggers need to be added manually via Supabase SQL Editor.');
  console.log('See: supabase/migrations/20251101000001_widget_customers.sql\n');
}

createTable().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

