const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: 'packages/web-dashboard/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('📦 Applying widget_customers migration...\n');

  const sql = fs.readFileSync('supabase/migrations/20251101000001_widget_customers.sql', 'utf8');
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
    
    if (error) {
      console.error(`❌ Error in statement ${i + 1}:`, error.message);
      console.error('Statement:', statement.substring(0, 100) + '...');
      // Continue with other statements
    } else {
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
  }

  console.log('\n✨ Migration applied!\n');
}

applyMigration().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
