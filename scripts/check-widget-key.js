const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'packages/web-dashboard/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkWidgetKey() {
  const widgetKey = 'wk_86b77b8f3b1048958ecf9f4a811b9690';
  
  console.log('Checking widget key:', widgetKey);
  console.log('');

  const { data: settings, error } = await supabase
    .from('widget_settings')
    .select('*')
    .eq('widget_key', widgetKey)
    .single();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!settings) {
    console.log('Widget key not found!');
    return;
  }

  console.log('Widget Settings:');
  console.log('  ID:', settings.id);
  console.log('  Organization ID:', settings.organization_id);
  console.log('  Widget Key:', settings.widget_key);
  console.log('  Enabled:', settings.enabled);
  console.log('  Enabled Department IDs:', settings.enabled_department_ids);
  console.log('');

  // Get departments for this organization
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name, is_active')
    .eq('organization_id', settings.organization_id);

  console.log('All Departments for Organization:');
  departments?.forEach(dept => {
    console.log(`  - ${dept.name} (${dept.id}) - Active: ${dept.is_active}`);
  });
  console.log('');

  // Get active departments
  const { data: activeDepts } = await supabase
    .from('departments')
    .select('id, name')
    .eq('organization_id', settings.organization_id)
    .eq('is_active', true);

  console.log('Active Departments:');
  activeDepts?.forEach(dept => {
    console.log(`  - ${dept.name} (${dept.id})`);
  });
  console.log('');

  // Check which departments should be shown in widget
  if (settings.enabled_department_ids && settings.enabled_department_ids.length > 0) {
    console.log('Widget will show ONLY these departments:');
    const { data: enabledDepts } = await supabase
      .from('departments')
      .select('id, name')
      .in('id', settings.enabled_department_ids);
    
    enabledDepts?.forEach(dept => {
      console.log(`  - ${dept.name} (${dept.id})`);
    });
  } else {
    console.log('Widget will show ALL active departments');
  }
}

checkWidgetKey().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
