# Widget Chat System - Complete Fixes

## Issues Fixed

### 1. ✅ Widget Customers Not Showing in Admin Dashboard

**Problem:** Conversations created by widget customers were not appearing in the admin chat dashboard (403 error).

**Solution:**
- Updated `/api/conversations` route to include `widget_customer` in the query
- Updated chat dashboard page to display widget customer info (name, email)
- Added fallback to show "Anonymous Visitor" for customers without names

**Files Modified:**
- `packages/web-dashboard/src/app/api/conversations/route.ts`
- `packages/web-dashboard/src/app/dashboard/chat/page.tsx`

---

### 2. ✅ Pre-Chat Forms Not Showing in Widget

**Problem:** When a department had pre-chat form rules, the widget was not showing the form to collect data before creating the conversation.

**Solution:**
- Added pre-chat form detection in widget
- Created `showPreChatForm()` method to render form UI
- Created `renderFormField()` method to render different field types
- Form data is collected and sent when creating conversation
- Added "Back to departments" button to return to department selection

**Supported Field Types:**
- Text input
- Email input
- Phone input
- Textarea
- Select dropdown
- Checkbox

**Files Modified:**
- `packages/chat-widget/src/widget.ts`

---

### 3. ✅ Widget Customer Database Schema

**Problem:** Missing `widget_customers` table and `widget_customer_id` column in conversations.

**Solution:**
- Created `widget_customers` table to store anonymous visitors
- Added `widget_customer_id` column to conversations table
- Made `customer_id` nullable (widget customers don't need auth accounts)
- Added constraint: must have either `customer_id` OR `widget_customer_id`
- Set up RLS policies and triggers

**Migration File:**
- `supabase/migrations/20251101000003_widget_customers_complete.sql`

---

## How It Works Now

### Customer Flow:

1. **Customer opens widget**
   - Widget loads on customer's website
   - Session created with unique `visitor_id`

2. **Customer selects department**
   - If department has pre-chat form → Show form
   - If no pre-chat form → Create conversation immediately

3. **Pre-chat form (if applicable)**
   - Customer fills out required fields
   - Clicks "Start Chat"
   - Form data saved in `widget_customer.custom_fields`

4. **Conversation created**
   - `widget_customer` record created or found by `visitor_id`
   - Conversation linked to `widget_customer`
   - Customer can start chatting

5. **Customer can change department**
   - Close current conversation
   - Select different department
   - New conversation created with same `widget_customer`

### Admin Flow:

1. **View conversations**
   - Go to `/dashboard/chat`
   - See all conversations including widget customers
   - Widget customers show as "Anonymous Visitor" or their provided name

2. **Customer information**
   - Name from pre-chat form or "Anonymous Visitor"
   - Email if provided
   - Pre-chat form data in conversation details
   - Total conversations count

---

## Database Schema

### `widget_customers` Table
```sql
- id: UUID
- organization_id: UUID
- visitor_id: VARCHAR (browser fingerprint)
- email: VARCHAR (optional)
- full_name: VARCHAR (optional)
- phone: VARCHAR (optional)
- custom_fields: JSONB (pre-chat form data)
- first_seen_at: TIMESTAMPTZ
- last_seen_at: TIMESTAMPTZ
- total_conversations: INTEGER
```

### `conversations` Table (Updated)
```sql
- widget_customer_id: UUID (new column)
- customer_id: UUID (now nullable)
- Constraint: must have either customer_id OR widget_customer_id
```

---

## Testing

### Test Pre-Chat Forms:

1. **Create a pre-chat form for a department:**
   - Go to `/dashboard/departments`
   - Edit a department
   - Go to "Pre-Chat Form" tab
   - Add fields (name, email, etc.)
   - Mark some as required
   - Save

2. **Test in widget:**
   - Open `test-widget.html`
   - Click on the department with pre-chat form
   - Form should appear
   - Fill out the form
   - Click "Start Chat"
   - Conversation should be created

3. **Verify in admin:**
   - Go to `/dashboard/chat`
   - See the new conversation
   - Customer name should show from form
   - Click on conversation to see pre-chat data

### Test Without Pre-Chat Forms:

1. **Select department without form:**
   - Open widget
   - Click on department without pre-chat form
   - Conversation created immediately
   - Can start chatting right away

2. **Verify in admin:**
   - Conversation appears in chat dashboard
   - Shows as "Anonymous Visitor"
   - Can chat with customer

---

## API Changes

### POST `/api/widget/conversations`

**Request Body:**
```json
{
  "sessionToken": "st_...",
  "departmentId": "uuid",
  "preChatData": {
    "field_0": "John Doe",
    "field_1": "john@example.com"
  },
  "customerData": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "widget_customer_id": "uuid",
    "widget_customer": {
      "id": "uuid",
      "visitor_id": "visitor_123",
      "email": "john@example.com",
      "full_name": "John Doe",
      "custom_fields": {
        "field_0": "John Doe",
        "field_1": "john@example.com"
      }
    },
    "department": {
      "id": "uuid",
      "name": "Sales"
    }
  }
}
```

### GET `/api/conversations`

**Response includes widget_customer:**
```json
[
  {
    "id": "uuid",
    "widget_customer_id": "uuid",
    "widget_customer": {
      "id": "uuid",
      "visitor_id": "visitor_123",
      "email": "john@example.com",
      "full_name": "John Doe"
    },
    "department": {...},
    "messages": [...]
  }
]
```

---

## Next Steps

### Recommended Enhancements:

1. **Email Collection Prompt**
   - If customer doesn't provide email in pre-chat form
   - Prompt for email during chat
   - Update widget_customer record

2. **Customer Profile Page**
   - View all conversations for a widget customer
   - See visitor history and behavior
   - Merge widget customers if needed

3. **Analytics**
   - Track visitor behavior
   - Conversion rates (visitor → customer)
   - Popular departments
   - Average response time

4. **Department Routing**
   - Auto-select department based on page URL
   - Smart routing based on visitor behavior
   - Business hours per department

5. **Upgrade to Registered Customer**
   - Allow converting widget_customer to full user account
   - Preserve conversation history
   - Link all past conversations

---

## Files Changed

### Backend:
- `packages/web-dashboard/src/app/api/conversations/route.ts`
- `packages/web-dashboard/src/app/api/widget/conversations/route.ts`

### Frontend:
- `packages/web-dashboard/src/app/dashboard/chat/page.tsx`

### Widget:
- `packages/chat-widget/src/widget.ts`

### Types:
- `packages/shared/src/types/index.ts`

### Database:
- `supabase/migrations/20251101000003_widget_customers_complete.sql`

### Documentation:
- `docs/WIDGET_CUSTOMER_SETUP.md`
- `docs/WIDGET_FIXES_SUMMARY.md`

