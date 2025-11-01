const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'packages/web-dashboard/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDepartments() {
  console.log('Checking departments...\n');

  // Get all departments
  const { data: departments, error } = await supabase
    .from('departments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching departments:', error);
    return;
  }

  console.log(`Found ${departments.length} departments:\n`);
  
  departments.forEach((dept, index) => {
    console.log(`${index + 1}. ${dept.name}`);
    console.log(`   ID: ${dept.id}`);
    console.log(`   Active: ${dept.is_active}`);
    console.log(`   Organization ID: ${dept.organization_id}`);
    console.log(`   Description: ${dept.description || 'N/A'}`);
    console.log('');
  });

  // Get widget settings
  const { data: widgetSettings } = await supabase
    .from('widget_settings')
    .select('*')
    .single();

  if (widgetSettings) {
    console.log('Widget Settings:');
    console.log(`  Organization ID: ${widgetSettings.organization_id}`);
    console.log(`  Enabled: ${widgetSettings.enabled}`);
    console.log(`  Enabled Department IDs: ${JSON.stringify(widgetSettings.enabled_department_ids || [])}`);
    console.log('');
  }

  // Check active departments for the widget's organization
  if (widgetSettings) {
    const { data: activeDepts } = await supabase
      .from('departments')
      .select('id, name, is_active')
      .eq('organization_id', widgetSettings.organization_id)
      .eq('is_active', true);

    console.log(`Active departments for widget organization: ${activeDepts?.length || 0}`);
    activeDepts?.forEach(dept => {
      console.log(`  - ${dept.name} (${dept.id})`);
    });
  }
}

checkDepartments().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

