# Pre-chat Form Builder - Testing Guide

## Overview
The Pre-chat Form Builder allows you to create custom forms for each department to collect information from customers before starting a chat conversation.

## Test Data Created

We've created 3 test departments with pre-configured forms:

### 1. Sales Department
**Purpose**: Sales inquiries and product information

**Form Fields (5)**:
1. **Your Name** (Text, Required)
   - Placeholder: "Enter your full name"
   - Help text: "Please provide your full name"

2. **Email Address** (Email, Required)
   - Placeholder: "you@company.com"
   - Help text: "We'll use this to send you information"

3. **Phone Number** (Phone, Optional)
   - Placeholder: "+1 (555) 000-0000"

4. **Company Size** (Select, Required)
   - Options: 1-10, 11-50, 51-200, 200+ employees
   - Help text: "Select your company size"

5. **What are you interested in?** (Textarea, Optional)
   - Placeholder: "Tell us about your needs..."
   - Validation: Min 10 chars, Max 500 chars

### 2. Technical Support Department
**Purpose**: Technical issues and troubleshooting

**Form Fields (6)**:
1. **Your Name** (Text, Required)
2. **Email Address** (Email, Required)
3. **Issue Type** (Select, Required)
   - Options: Technical Issue, Bug Report, Feature Request, General Inquiry
4. **Priority** (Select, Required)
   - Options: Low, Medium, High, Urgent
5. **Describe your issue** (Textarea, Required)
   - Validation: Min 20 chars, Max 1000 chars
   - Help text: "Minimum 20 characters"
6. **I have read the FAQ** (Checkbox, Optional)

### 3. Billing Department
**Purpose**: Billing and payment inquiries

**Form Fields (5)**:
1. **Full Name** (Text, Required)
2. **Email Address** (Email, Required)
3. **Account Number** (Text, Optional)
   - Help text: "Found in your account settings"
4. **Inquiry Type** (Select, Required)
   - Options: Invoice Question, Payment Issue, Refund Request, Subscription Change, Other
5. **Details** (Textarea, Required)
   - Validation: Min 10 chars

## Testing Checklist

### ✅ Basic Functionality
- [ ] Navigate to http://localhost:3000/dashboard/departments
- [ ] Verify 4 departments are visible (Deposits + 3 new ones)
- [ ] Click Form Builder icon (📄) on each department
- [ ] Verify pre-configured forms load correctly

### ✅ Form Builder UI
- [ ] **Builder Tab**
  - [ ] All fields display correctly
  - [ ] Field type icons are visible
  - [ ] Required indicators (*) show for required fields
  - [ ] Help text displays when present
  - [ ] Options show for select fields
  - [ ] Validation rules display correctly

- [ ] **Preview Tab**
  - [ ] Form renders as customers will see it
  - [ ] All field types render correctly
  - [ ] Required fields show asterisk (*)
  - [ ] Help text appears below fields
  - [ ] Select dropdowns show all options

### ✅ Drag and Drop
- [ ] Grab a field by the grip handle (⋮⋮)
- [ ] Drag it to a new position
- [ ] Verify field order updates
- [ ] Verify order numbers update automatically
- [ ] Drop field in new position
- [ ] Verify preview tab reflects new order

### ✅ Field Editing
- [ ] **Change Field Type**
  - [ ] Click field type dropdown
  - [ ] Change from Text to Email
  - [ ] Verify field updates
  - [ ] Change to Select
  - [ ] Verify options input appears

- [ ] **Edit Field Properties**
  - [ ] Change label text
  - [ ] Change placeholder text
  - [ ] Toggle required switch
  - [ ] Add/edit help text
  - [ ] Verify changes in preview

- [ ] **Select Field Options**
  - [ ] Add new option
  - [ ] Remove option
  - [ ] Verify options update in preview

- [ ] **Validation Rules** (Text/Textarea)
  - [ ] Set min length
  - [ ] Set max length
  - [ ] Verify validation shows in preview

### ✅ Adding Fields
- [ ] Click "Text" button
- [ ] Verify new text field appears at bottom
- [ ] Click "Email" button
- [ ] Verify new email field appears
- [ ] Click "Phone" button
- [ ] Click "Textarea" button
- [ ] Click "Select" button
- [ ] Verify options input appears
- [ ] Click "Checkbox" button
- [ ] Verify all 6 field types can be added

### ✅ Deleting Fields
- [ ] Click delete (trash) icon on a field
- [ ] Verify field is removed
- [ ] Verify order numbers update
- [ ] Verify preview updates

### ✅ Saving Forms
- [ ] Make changes to a form
- [ ] Click "Save Form" button
- [ ] Verify success message appears
- [ ] Refresh the page
- [ ] Verify changes persisted
- [ ] Check database to confirm

### ✅ Empty State
- [ ] Delete all fields from a form
- [ ] Verify empty state message shows
- [ ] Verify "Add your first field" message
- [ ] Add a field
- [ ] Verify empty state disappears

### ✅ Navigation
- [ ] Click "Back to Departments" button
- [ ] Verify returns to departments list
- [ ] Click Form Builder icon again
- [ ] Verify form loads correctly

### ✅ Field Type Specific Tests

**Text Field**:
- [ ] Verify single-line input
- [ ] Test min/max length validation
- [ ] Test required validation

**Email Field**:
- [ ] Verify email input type
- [ ] Test email format validation
- [ ] Test required validation

**Phone Field**:
- [ ] Verify phone input type
- [ ] Test phone number input

**Textarea Field**:
- [ ] Verify multi-line input
- [ ] Test min/max length validation
- [ ] Verify resizable textarea

**Select Field**:
- [ ] Verify dropdown appears
- [ ] Test selecting options
- [ ] Verify all options are selectable
- [ ] Test required validation

**Checkbox Field**:
- [ ] Verify checkbox renders
- [ ] Test checking/unchecking
- [ ] Verify label displays correctly

## Test Scripts

### Create Test Departments
```bash
source ~/.nvm/nvm.sh && nvm use
node scripts/create-test-departments.js
```

This creates 3 departments (Sales, Technical Support, Billing) with pre-configured forms.

### Apply Forms to Existing Departments
```bash
source ~/.nvm/nvm.sh && nvm use
node scripts/test-form-builder.js
```

This applies sample forms to existing departments based on their names.

## Expected Results

### Success Criteria
✅ All field types render correctly  
✅ Drag and drop works smoothly  
✅ Forms save and persist correctly  
✅ Preview matches actual customer view  
✅ Validation rules work as expected  
✅ No console errors  
✅ No TypeScript errors  
✅ Responsive design works on different screen sizes  

### Known Limitations
- Maximum 20 fields per form (recommended)
- Select fields limited to 50 options (recommended)
- Validation patterns must be valid regex

## Troubleshooting

### Form doesn't save
- Check browser console for errors
- Verify you're logged in as org_admin
- Check network tab for API errors
- Verify Supabase connection

### Drag and drop not working
- Ensure you're grabbing the grip handle (⋮⋮)
- Check for JavaScript errors in console
- Try refreshing the page

### Fields not rendering
- Check that field type is valid
- Verify field has required properties (id, type, label, order)
- Check browser console for errors

### Preview doesn't match builder
- Verify you've saved the form
- Try refreshing the page
- Check that all fields have valid data

## Next Steps

After testing the form builder:
1. Test the forms in the actual chat widget (when implemented)
2. Verify form data is captured correctly
3. Test form validation on submission
4. Test with different user roles
5. Test on mobile devices

## Database Verification

To verify forms are saved correctly:

```sql
-- View all departments with their forms
SELECT 
  id,
  name,
  jsonb_array_length(pre_chat_form) as field_count,
  pre_chat_form
FROM departments
WHERE organization_id = 'YOUR_ORG_ID';

-- View specific department form
SELECT 
  name,
  jsonb_pretty(pre_chat_form) as form_fields
FROM departments
WHERE id = 'DEPARTMENT_ID';
```

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the terminal for server errors
3. Verify database connection
4. Check Supabase logs
5. Review the code in `/app/dashboard/departments/[id]/form-builder/page.tsx`

