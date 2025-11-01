/**
 * Test script for Pre-chat Form Builder
 * This script creates sample form configurations for testing
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../packages/web-dashboard/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Sample form configurations
const sampleForms = {
  sales: [
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
  ],
  support: [
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
      options: ['Technical Issue', 'Billing Question', 'Feature Request', 'General Inquiry'],
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
  ],
  billing: [
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
};

async function main() {
  console.log('🚀 Starting Form Builder Test Script...\n');

  // Get all departments
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('*')
    .order('created_at', { ascending: true });

  if (deptError) {
    console.error('❌ Error fetching departments:', deptError);
    return;
  }

  if (!departments || departments.length === 0) {
    console.log('⚠️  No departments found. Please create departments first.');
    return;
  }

  console.log(`📋 Found ${departments.length} department(s):\n`);
  departments.forEach((dept, index) => {
    console.log(`${index + 1}. ${dept.name} (${dept.id})`);
    console.log(`   Current form fields: ${dept.pre_chat_form?.length || 0}`);
  });

  console.log('\n🔧 Applying sample forms...\n');

  // Apply sample forms to departments based on name
  for (const dept of departments) {
    const deptNameLower = dept.name.toLowerCase();
    let formToApply = null;

    if (deptNameLower.includes('sales')) {
      formToApply = sampleForms.sales;
      console.log(`📝 Applying Sales form to "${dept.name}"`);
    } else if (deptNameLower.includes('support')) {
      formToApply = sampleForms.support;
      console.log(`📝 Applying Support form to "${dept.name}"`);
    } else if (deptNameLower.includes('billing')) {
      formToApply = sampleForms.billing;
      console.log(`📝 Applying Billing form to "${dept.name}"`);
    } else {
      // Apply a simple default form
      formToApply = [
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
          placeholder: 'your@email.com',
          required: true,
          order: 1
        },
        {
          id: 'field_3',
          type: 'textarea',
          label: 'How can we help?',
          placeholder: 'Describe your inquiry...',
          required: true,
          order: 2
        }
      ];
      console.log(`📝 Applying Default form to "${dept.name}"`);
    }

    // Update department with form
    const { error: updateError } = await supabase
      .from('departments')
      .update({ pre_chat_form: formToApply })
      .eq('id', dept.id);

    if (updateError) {
      console.error(`   ❌ Error updating ${dept.name}:`, updateError.message);
    } else {
      console.log(`   ✅ Successfully updated with ${formToApply.length} fields`);
    }
  }

  console.log('\n✨ Form Builder Test Complete!\n');
  console.log('🧪 Test the forms:');
  console.log('1. Navigate to http://localhost:3000/dashboard/departments');
  console.log('2. Click the Form Builder icon (📄) on any department');
  console.log('3. View the pre-configured forms');
  console.log('4. Try editing, reordering, and adding new fields');
  console.log('5. Switch to Preview tab to see customer view');
  console.log('6. Click Save to persist changes\n');
}

main().catch(console.error);

