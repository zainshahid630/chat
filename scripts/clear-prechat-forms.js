const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'packages/web-dashboard/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearPreChatForms() {
  console.log('Clearing pre-chat forms from all departments...\n');

  // First get all departments
  const { data: allDepts } = await supabase
    .from('departments')
    .select('id, name');

  if (!allDepts || allDepts.length === 0) {
    console.log('No departments found');
    return;
  }

  // Update each department
  const { data: departments, error } = await supabase
    .from('departments')
    .update({ pre_chat_form: [] })
    .in('id', allDepts.map(d => d.id))
    .select();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`✅ Cleared pre-chat forms from ${departments.length} departments\n`);

  departments.forEach(dept => {
    console.log(`  - ${dept.name}`);
  });

  console.log('\n✨ Done! You can now test the widget without pre-chat form validation.');
  console.log('💡 To add pre-chat forms back, use the admin panel: Settings → Departments → Edit Department\n');
}

clearPreChatForms().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

