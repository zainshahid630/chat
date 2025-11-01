/**
 * Create test conversations and messages for testing the chat dashboard
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../packages/web-dashboard/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🚀 Creating Test Conversations...\n');

  // Get the first organization
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);

  if (orgError || !orgs || orgs.length === 0) {
    console.error('❌ Error: No organization found');
    return;
  }

  const organizationId = orgs[0].id;
  console.log(`📊 Using organization: ${orgs[0].name} (${organizationId})\n`);

  // Get departments
  const { data: departments } = await supabase
    .from('departments')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(3);

  if (!departments || departments.length === 0) {
    console.error('❌ Error: No departments found. Please create departments first.');
    return;
  }

  console.log(`📋 Found ${departments.length} department(s)\n`);

  // Get or create test customers
  const testCustomers = [
    {
      email: 'customer1@example.com',
      full_name: 'John Smith',
      role: 'customer',
    },
    {
      email: 'customer2@example.com',
      full_name: 'Sarah Johnson',
      role: 'customer',
    },
    {
      email: 'customer3@example.com',
      full_name: 'Mike Davis',
      role: 'customer',
    },
  ];

  const customers = [];

  for (const customerData of testCustomers) {
    // Check if customer exists
    let { data: existingCustomer } = await supabase
      .from('users')
      .select('*')
      .eq('email', customerData.email)
      .single();

    if (!existingCustomer) {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: customerData.email,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          full_name: customerData.full_name,
          role: 'customer',
        },
      });

      if (authError) {
        console.error(`❌ Error creating auth user for ${customerData.email}:`, authError.message);
        continue;
      }

      // Update user profile
      const { data: updatedUser } = await supabase
        .from('users')
        .update({
          organization_id: organizationId,
          full_name: customerData.full_name,
          role: 'customer',
        })
        .eq('id', authUser.user.id)
        .select()
        .single();

      customers.push(updatedUser);
      console.log(`✅ Created customer: ${customerData.full_name}`);
    } else {
      customers.push(existingCustomer);
      console.log(`✓ Customer exists: ${customerData.full_name}`);
    }
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

  // Create conversations
  const conversationData = [
    {
      customer: customers[0],
      department: departments[0],
      status: 'waiting',
      messages: [
        { sender: customers[0], content: 'Hi, I need help with my account', delay: 0 },
      ],
    },
    {
      customer: customers[1],
      department: departments[1] || departments[0],
      status: 'active',
      agent: agent,
      messages: [
        { sender: customers[1], content: 'I have a question about billing', delay: 0 },
        { sender: agent, content: 'Hello! I\'d be happy to help you with that. What\'s your question?', delay: 1 },
        { sender: customers[1], content: 'I was charged twice this month', delay: 2 },
        { sender: agent, content: 'Let me check that for you. Can you provide your account number?', delay: 3 },
      ],
    },
    {
      customer: customers[2],
      department: departments[2] || departments[0],
      status: 'active',
      agent: agent,
      messages: [
        { sender: customers[2], content: 'The app is not working properly', delay: 0 },
        { sender: agent, content: 'I\'m sorry to hear that. Can you describe what\'s happening?', delay: 1 },
        { sender: customers[2], content: 'It crashes when I try to upload files', delay: 2 },
        { sender: agent, content: 'Thank you for that information. What device are you using?', delay: 3 },
        { sender: customers[2], content: 'iPhone 14 Pro, iOS 17', delay: 4 },
      ],
    },
  ];

  for (const convData of conversationData) {
    if (!convData.customer || !convData.department) {
      console.log(`⚠️  Skipping conversation - missing customer or department`);
      continue;
    }

    console.log(`Creating conversation for ${convData.customer.full_name}...`);

    // Get department's pre-chat form to build proper pre_chat_data
    const { data: dept } = await supabase
      .from('departments')
      .select('pre_chat_form')
      .eq('id', convData.department.id)
      .single();

    // Build pre_chat_data based on required fields
    const preChatData = {};
    if (dept && dept.pre_chat_form) {
      for (const field of dept.pre_chat_form) {
        if (field.required) {
          // Provide sample data for required fields
          if (field.type === 'email') {
            preChatData[field.id] = convData.customer.email;
          } else if (field.type === 'text' && field.label.toLowerCase().includes('name')) {
            preChatData[field.id] = convData.customer.full_name;
          } else if (field.type === 'select' && field.options && field.options.length > 0) {
            preChatData[field.id] = field.options[0];
          } else if (field.type === 'textarea') {
            preChatData[field.id] = 'Sample message for testing';
          } else {
            preChatData[field.id] = 'Sample data';
          }
        }
      }
    }

    console.log(`  Pre-chat data:`, preChatData);

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        organization_id: organizationId,
        department_id: convData.department.id,
        customer_id: convData.customer.id,
        agent_id: convData.agent?.id || null,
        status: convData.status,
        pre_chat_data: preChatData,
      })
      .select()
      .single();

    if (convError) {
      console.error(`❌ Error creating conversation:`, convError);
      continue;
    }

    console.log(`✅ Created ${convData.status} conversation for ${convData.customer.full_name}`);

    // Create messages
    for (const msgData of convData.messages) {
      if (!msgData.sender) continue;

      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: msgData.sender.id,
          content: msgData.content,
          message_type: 'text',
          created_at: new Date(Date.now() - (msgData.delay * 60000)).toISOString(), // Subtract delay in minutes
        });

      if (msgError) {
        console.error(`   ❌ Error creating message:`, msgError.message);
      } else {
        console.log(`   ✓ Added message: "${msgData.content.substring(0, 30)}..."`);
      }
    }
  }

  console.log('\n✨ Test Conversations Created!\n');
  console.log('🧪 Test the Chat Dashboard:');
  console.log('1. Navigate to http://localhost:3000/dashboard/chat');
  console.log('2. You should see 3 conversations in the sidebar');
  console.log('3. Click on each conversation to view messages');
  console.log('4. Try sending messages');
  console.log('5. Test the search and filter functionality\n');
  console.log('📝 Test Customers Created:');
  console.log('   - customer1@example.com (password: password123)');
  console.log('   - customer2@example.com (password: password123)');
  console.log('   - customer3@example.com (password: password123)\n');
}

main().catch(console.error);

