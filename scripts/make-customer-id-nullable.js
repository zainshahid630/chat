const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'packages/web-dashboard/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function makeNullable() {
  console.log('Making customer_id nullable in conversations table...\n');

  // Use raw SQL query via Supabase
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('✅ Connected to database\n');
  console.log('⚠️  To make customer_id nullable, run this SQL in Supabase SQL Editor:\n');
  console.log('ALTER TABLE conversations ALTER COLUMN customer_id DROP NOT NULL;\n');
  console.log('Or open Supabase dashboard and run the SQL manually.');
}

makeNullable().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

