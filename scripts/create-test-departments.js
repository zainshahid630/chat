/**
 * Create test departments with sample forms
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../packages/web-dashboard/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sample departments with forms
const testDepartments = [
  {
    name: 'Sales',
    description: 'Sales inquiries and product information',
    is_active: true,
    pre_chat_form: [
      {
        id: 'field_1',
        type: 'text',
        label: 'Your Name',
        placeholder: 'Enter your full name',
        required: true,
        order: 0,
        helpText: 'Please provide your full name'
      },
      {
        id: 'field_2',
        type: 'email',
        label: 'Email Address',
        placeholder: 'you@company.com',
        required: true,
        order: 1,
        helpText: 'We\'ll use this to send you information'
      },
      {
        id: 'field_3',
        type: 'phone',
        label: 'Phone Number',
        placeholder: '+1 (555) 000-0000',
        required: false,
        order: 2
      },
      {
        id: 'field_4',
        type: 'select',
        label: 'Company Size',
        options: ['1-10 employees', '11-50 employees', '51-200 employees', '200+ employees'],
        required: true,
        order: 3,
        helpText: 'Select your company size'
      },
      {
        id: 'field_5',
        type: 'textarea',
        label: 'What are you interested in?',
        placeholder: 'Tell us about your needs...',
        required: false,
        order: 4,
        validation: {
          minLength: 10,
          maxLength: 500
        }
      }
    ]
  },
  {
    name: 'Technical Support',
    description: 'Technical issues and troubleshooting',
    is_active: true,
    pre_chat_form: [
      {
        id: 'field_1',
        type: 'text',
        label: 'Your Name',
        placeholder: 'Enter your name',
        required: true,
        order: 0
      },
      {
        id: 'field_2',
        type: 'email',
        label: 'Email Address',
        placeholder: 'your.email@example.com',
        required: true,
        order: 1
      },
      {
        id: 'field_3',
        type: 'select',
        label: 'Issue Type',
        options: ['Technical Issue', 'Bug Report', 'Feature Request', 'General Inquiry'],
        required: true,
        order: 2
      },
      {
        id: 'field_4',
        type: 'select',
        label: 'Priority',
        options: ['Low', 'Medium', 'High', 'Urgent'],
        required: true,
        order: 3
      },
      {
        id: 'field_5',
        type: 'textarea',
        label: 'Describe your issue',
        placeholder: 'Please provide as much detail as possible...',
        required: true,
        order: 4,
        validation: {
          minLength: 20,
          maxLength: 1000
        },
        helpText: 'Minimum 20 characters'
      },
      {
        id: 'field_6',
        type: 'checkbox',
        label: 'I have read the FAQ and couldn\'t find an answer',
        required: false,
        order: 5
      }
    ]
  },
  {
    name: 'Billing',
    description: 'Billing and payment inquiries',
    is_active: true,
    pre_chat_form: [
      {
        id: 'field_1',
        type: 'text',
        label: 'Full Name',
        placeholder: 'John Doe',
        required: true,
        order: 0
      },
      {
        id: 'field_2',
        type: 'email',
        label: 'Email Address',
        placeholder: 'billing@company.com',
        required: true,
        order: 1
      },
      {
        id: 'field_3',
        type: 'text',
        label: 'Account Number',
        placeholder: 'ACC-12345',
        required: false,
        order: 2,
        helpText: 'Found in your account settings'
      },
      {
        id: 'field_4',
        type: 'select',
        label: 'Inquiry Type',
        options: ['Invoice Question', 'Payment Issue', 'Refund Request', 'Subscription Change', 'Other'],
        required: true,
        order: 3
      },
      {
        id: 'field_5',
        type: 'textarea',
        label: 'Details',
        placeholder: 'Please describe your billing inquiry...',
        required: true,
        order: 4,
        validation: {
          minLength: 10
        }
      }
    ]
  }
];

async function main() {
  console.log('🚀 Creating Test Departments with Forms...\n');

  // Get the first organization (assuming user is logged in)
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

  // Create departments
  for (const dept of testDepartments) {
    console.log(`📝 Creating department: ${dept.name}`);
    
    // Check if department already exists
    const { data: existing } = await supabase
      .from('departments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', dept.name)
      .single();

    if (existing) {
      console.log(`   ⚠️  Department "${dept.name}" already exists, updating...`);
      
      const { error: updateError } = await supabase
        .from('departments')
        .update({
          description: dept.description,
          is_active: dept.is_active,
          pre_chat_form: dept.pre_chat_form
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error(`   ❌ Error updating: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated with ${dept.pre_chat_form.length} form fields`);
      }
    } else {
      const { error: createError } = await supabase
        .from('departments')
        .insert({
          organization_id: organizationId,
          name: dept.name,
          description: dept.description,
          is_active: dept.is_active,
          pre_chat_form: dept.pre_chat_form
        });

      if (createError) {
        console.error(`   ❌ Error creating: ${createError.message}`);
      } else {
        console.log(`   ✅ Created with ${dept.pre_chat_form.length} form fields`);
      }
    }
  }

  console.log('\n✨ Test Departments Created!\n');
  console.log('🧪 Test the Form Builder:');
  console.log('1. Navigate to http://localhost:3000/dashboard/departments');
  console.log('2. You should see 3 departments: Sales, Technical Support, Billing');
  console.log('3. Click the Form Builder icon (📄) on each department');
  console.log('4. Each has a different pre-configured form:');
  console.log('   - Sales: 5 fields (name, email, phone, company size, interests)');
  console.log('   - Technical Support: 6 fields (name, email, issue type, priority, description, FAQ checkbox)');
  console.log('   - Billing: 5 fields (name, email, account number, inquiry type, details)');
  console.log('5. Try editing, reordering, and adding new fields');
  console.log('6. Switch to Preview tab to see customer view');
  console.log('7. Click Save to persist changes\n');
}

main().catch(console.error);

