/**
 * Get widget key for testing
 * This script fetches the widget key from the database for testing purposes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './packages/web-dashboard/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getWidgetKey() {
  try {
    console.log('🔍 Fetching widget key...\n');

    // Get the first organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1)
      .single();

    if (orgError || !org) {
      console.error('❌ No organization found. Please create an organization first.');
      process.exit(1);
    }

    console.log(`📦 Organization: ${org.name} (${org.id})\n`);

    // Get or create widget settings
    let { data: settings, error: settingsError } = await supabase
      .from('widget_settings')
      .select('*')
      .eq('organization_id', org.id)
      .single();

    if (settingsError && settingsError.code === 'PGRST116') {
      // Create widget settings if not exists
      console.log('⚙️  Creating widget settings...\n');
      
      const { data: newSettings, error: createError } = await supabase
        .from('widget_settings')
        .insert({
          organization_id: org.id,
          enabled: true,
          primary_color: '#3B82F6',
          position: 'bottom-right',
          bubble_icon: 'chat',
          widget_title: 'Chat with us',
          greeting_message: 'Hi! How can we help you today?',
          auto_open: false,
          auto_open_delay: 5,
          show_agent_avatars: true,
          show_typing_indicator: true,
          play_notification_sound: true,
          business_hours: [],
          offline_message: 'We are currently offline. Leave a message and we will get back to you.',
          allowed_domains: [],
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating widget settings:', createError);
        process.exit(1);
      }

      settings = newSettings;
    } else if (settingsError) {
      console.error('❌ Error fetching widget settings:', settingsError);
      process.exit(1);
    }

    console.log('✅ Widget Settings Found!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔑 Widget Key: ${settings.widget_key}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📋 Widget Configuration:');
    console.log(`   • Enabled: ${settings.enabled ? '✓' : '✗'}`);
    console.log(`   • Primary Color: ${settings.primary_color}`);
    console.log(`   • Position: ${settings.position}`);
    console.log(`   • Widget Title: ${settings.widget_title}`);
    console.log(`   • Greeting: ${settings.greeting_message}`);
    console.log(`   • Auto Open: ${settings.auto_open ? 'Yes' : 'No'}\n`);

    console.log('🔗 Embed Code:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`
<!-- ChatDesk Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ChatDesk']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','chatdesk','http://localhost:3001/widget.js'));
  
  chatdesk('init', {
    widgetKey: '${settings.widget_key}'
  });
</script>
    `);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 Next Steps:');
    console.log('   1. Start the widget dev server: cd packages/chat-widget && npm run dev');
    console.log('   2. Open test-widget.html in your browser');
    console.log('   3. Replace YOUR_WIDGET_KEY with the key above\n');

    console.log('🌐 URLs:');
    console.log(`   • Dashboard: http://localhost:3000/dashboard/settings/widget`);
    console.log(`   • Widget Server: http://localhost:3001/widget.js`);
    console.log(`   • Test Page: file://${process.cwd()}/test-widget.html\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getWidgetKey();

