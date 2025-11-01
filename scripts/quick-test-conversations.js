/**
 * Quick script to create test conversations by temporarily clearing pre-chat forms
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../packages/web-dashboard/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🚀 Quick Test Conversations Setup...\n');

  // Get the first organization
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.error('❌ Error: No organization found');
    return;
  }

  const organizationId = orgs[0].id;
  console.log(`📊 Using organization: ${orgs[0].name}\n`);

  // Get departments and temporarily clear their pre_chat_form
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(3);

  if (!departments || departments.length === 0) {
    console.error('❌ Error: No departments found');
    return;
  }

  console.log('📋 Temporarily clearing pre-chat forms...');
  for (const dept of departments) {
    await supabase
      .from('departments')
      .update({ pre_chat_form: [] })
      .eq('id', dept.id);
  }

  // Get customers
  const { data: customers } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('role', 'customer')
    .limit(3);

  if (!customers || customers.length === 0) {
    console.error('❌ No customers found');
    return;
  }

  // Get an agent
  const { data: agents } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('role', 'agent')
    .limit(1);

  const agent = agents && agents.length > 0 ? agents[0] : null;

  console.log('\n📝 Creating conversations...\n');

  // Create 3 test conversations
  const testConversations = [
    {
      customer: customers[0],
      department: departments[0],
      status: 'waiting',
      messages: ['Hi, I need help with my account'],
    },
    {
      customer: customers[1] || customers[0],
      department: departments[1] || departments[0],
      status: 'active',
      agent: agent,
      messages: [
        'I have a question about billing',
        'Hello! I\'d be happy to help you with that.',
        'I was charged twice this month',
      ],
    },
    {
      customer: customers[2] || customers[0],
      department: departments[2] || departments[0],
      status: 'active',
      agent: agent,
      messages: [
        'The app is not working properly',
        'I\'m sorry to hear that. Can you describe what\'s happening?',
        'It crashes when I try to upload files',
      ],
    },
  ];

  for (let i = 0; i < testConversations.length; i++) {
    const conv = testConversations[i];
    
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        organization_id: organizationId,
        department_id: conv.department.id,
        customer_id: conv.customer.id,
        agent_id: conv.agent?.id || null,
        status: conv.status,
        pre_chat_data: {},
      })
      .select()
      .single();

    if (convError) {
      console.error(`❌ Error:`, convError.message);
      continue;
    }

    console.log(`✅ Created conversation #${i + 1} (${conv.status})`);

    // Add messages
    for (let j = 0; j < conv.messages.length; j++) {
      const senderId = j % 2 === 0 ? conv.customer.id : (conv.agent?.id || conv.customer.id);
      
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: senderId,
          content: conv.messages[j],
          message_type: 'text',
        });
    }
    console.log(`   ✓ Added ${conv.messages.length} message(s)`);
  }

  console.log('\n✨ Done!\n');
  console.log('🧪 Test at: http://localhost:3000/dashboard/chat\n');
}

main().catch(console.error);

