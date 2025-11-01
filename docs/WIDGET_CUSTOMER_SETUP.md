# Widget Customer System - Complete Setup

## Overview

This document describes the complete widget customer system that allows anonymous visitors to chat without creating accounts.

## How It Works

### 1. **Customer Opens Widget**
- Widget loads on customer's website
- Widget session is created with unique `visitor_id` (browser fingerprint)
- Departments are loaded and displayed

### 2. **Customer Selects Department**
- Customer clicks on a department
- System creates or finds existing `widget_customer` record based on `visitor_id`
- Conversation is created and linked to `widget_customer`
- Pre-chat form data (if any) is saved in `widget_customer.custom_fields`

### 3. **Customer Can Chat**
- Messages are sent and received
- Conversation appears in admin dashboard
- Agents can see customer info from pre-chat form or chat

### 4. **Customer Can Change Department**
- Customer can close conversation and select a different department
- New conversation is created with the same `widget_customer`
- All conversations are tracked under the same visitor

### 5. **Returning Visitors**
- Same `visitor_id` = same `widget_customer` record
- Can see chat history from previous visits
- Total conversations tracked

## Database Schema

### `widget_customers` Table
```sql
- id: UUID (primary key)
- organization_id: UUID (which organization)
- visitor_id: VARCHAR (browser fingerprint - unique per org)
- email: VARCHAR (optional, from pre-chat form or chat)
- full_name: VARCHAR (optional)
- phone: VARCHAR (optional)
- user_agent: TEXT (browser info)
- ip_address: INET (visitor IP)
- country, city: VARCHAR (location if available)
- custom_fields: JSONB (pre-chat form data)
- first_seen_at, last_seen_at: TIMESTAMPTZ
- total_conversations: INTEGER
```

### `conversations` Table Updates
```sql
- widget_customer_id: UUID (reference to widget_customers)
- customer_id: UUID (nullable - for authenticated users only)
- Constraint: Must have either customer_id OR widget_customer_id
```

## API Flow

### POST /api/widget/conversations

**Request:**
```json
{
  "sessionToken": "st_...",
  "departmentId": "uuid",
  "preChatData": {
    "field_1": "John Doe",
    "field_2": "john@example.com"
  },
  "customerData": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  }
}
```

**Process:**
1. Validate session token
2. Check if widget customer exists for this visitor_id
3. If not, create new widget_customer with provided data
4. Create conversation linked to widget_customer
5. Save pre-chat form data in widget_customer.custom_fields
6. Return conversation with widget_customer details

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "organization_id": "uuid",
    "department_id": "uuid",
    "widget_customer_id": "uuid",
    "customer_id": null,
    "status": "waiting",
    "pre_chat_data": {},
    "widget_customer": {
      "id": "uuid",
      "visitor_id": "visitor_123",
      "email": "john@example.com",
      "full_name": "John Doe",
      "phone": "+1234567890",
      "custom_fields": {
        "field_1": "John Doe",
        "field_2": "john@example.com"
      }
    },
    "department": {
      "id": "uuid",
      "name": "Sales"
    }
  }
}
```

## Admin Dashboard

### Viewing Widget Customers

Agents and admins can see widget customers in conversations:
- Customer name from `widget_customer.full_name` or "Anonymous Visitor"
- Email from `widget_customer.email` if provided
- Custom fields from pre-chat form
- Total conversations count
- First and last seen timestamps

### Future Enhancements

1. **Convert to Registered Customer**: Allow upgrading widget_customer to full user account
2. **Customer Profile Page**: View all conversations and data for a widget customer
3. **Analytics**: Track visitor behavior, conversion rates, etc.
4. **Email Collection**: Prompt for email during chat if not provided
5. **Department Routing**: Auto-assign based on visitor behavior or page URL

## Migration Instructions

### Step 1: Run SQL Migration

Open Supabase SQL Editor and run:
```
supabase/migrations/20251101000003_widget_customers_complete.sql
```

Or manually execute the SQL in Supabase Dashboard → SQL Editor.

### Step 2: Verify Tables

Check that these tables exist:
- `widget_customers` (new)
- `conversations` (updated with `widget_customer_id` column)

### Step 3: Test Widget

1. Open test-widget.html
2. Select a department
3. Verify conversation is created
4. Check admin dashboard to see the conversation

## Benefits

✅ **No Authentication Required**: Visitors can chat immediately
✅ **Persistent Identity**: Same visitor = same chat history
✅ **Flexible Data Collection**: Collect email/name when needed
✅ **Department Switching**: Visitors can change departments easily
✅ **Scalable**: Handles millions of anonymous visitors
✅ **Privacy-Friendly**: No forced account creation
✅ **Easy Upgrade Path**: Can convert to registered customer later

