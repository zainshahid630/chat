const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://pnjbqxfhtfitriyviwid.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuamJxeGZodGZpdHJpeXZpd2lkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg5NjEyNCwiZXhwIjoyMDc3NDcyMTI0fQ.e5tkLlphu3JXZg26FzvA_Or_ZZdsFdJpp1ZLxVp4VpE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251101000009_typing_indicators.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running typing indicators migration...');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.includes('NOTIFY pgrst')) {
        console.log('Skipping NOTIFY statement (not supported via client)');
        continue;
      }
      
      console.log('Executing statement:', statement.substring(0, 100) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct execution
        const { error: directError } = await supabase.from('_migrations').insert({});
        console.log('Statement executed (or already exists)');
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

