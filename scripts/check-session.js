const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSession() {
  console.log('\n🔍 Checking for active users...\n');

  // Get all users
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role, organization_id')
    .limit(5);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('❌ No users found in database');
    return;
  }

  console.log('✅ Found users:');
  users.forEach((user, index) => {
    console.log(`\n${index + 1}. Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Organization ID: ${user.organization_id}`);
  });

  console.log('\n📝 To log in:');
  console.log('1. Go to http://localhost:3000/auth/login');
  console.log('2. Use one of the emails above');
  console.log('3. Check your email for the magic link (or use password if set)');
  console.log('\n');
}

checkSession();

