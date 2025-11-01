const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'packages/web-dashboard/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPreChatForm() {
  const deptId = '76735e8e-6684-436f-b987-cb4f5f2622b5';
  
  const { data: dept } = await supabase
    .from('departments')
    .select('name, pre_chat_form')
    .eq('id', deptId)
    .single();

  console.log('Department:', dept?.name);
  console.log('Pre-chat form:', JSON.stringify(dept?.pre_chat_form, null, 2));
}

checkPreChatForm().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
