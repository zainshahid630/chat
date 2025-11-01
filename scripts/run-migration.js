const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: 'packages/web-dashboard/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    db: {
      schema: 'public'
    }
  }
);

async function runMigration() {
  console.log('📦 Running widget_customers migration...\n');

  const sql = fs.readFileSync('supabase/migrations/20251101000001_widget_customers.sql', 'utf8');
  
  console.log('SQL to execute:');
  console.log('================');
  console.log(sql);
  console.log('================\n');
  
  console.log('⚠️  Please run this SQL manually in Supabase SQL Editor:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL above');
  console.log('4. Click "Run"\n');
}

runMigration().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
