# Real-Time WebSocket Chat Implementation

## Overview

This document describes the real-time WebSocket (Supabase Realtime) implementation for end-to-end chat between agents and customers without page reloads.

## Architecture

### Technology Stack
- **Supabase Realtime**: PostgreSQL Change Data Capture (CDC) via WebSockets
- **Channels**: Separate channels for messages, conversations, and typing indicators
- **Client Libraries**: `@supabase/supabase-js` for both admin dashboard and widget

### Real-Time Features Implemented

1. ✅ **Real-time message delivery** (agent ↔ customer)
2. ✅ **Conversation status updates** (waiting → active → closed)
3. ✅ **New conversation notifications**
4. ✅ **Typing indicators** (infrastructure ready)
5. ✅ **Auto-scroll to latest message**
6. ✅ **Duplicate message prevention**

---

## Admin Dashboard Implementation

### File: `packages/web-dashboard/src/app/dashboard/chat/page.tsx`

### Real-Time Subscriptions

#### 1. Messages Subscription (Per Conversation)
```typescript
const messagesChannel = supabase
  .channel(`conversation:${selectedConversation.id}:messages`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${selectedConversation.id}`,
    },
    async (payload: any) => {
      // Fetch complete message with sender info
      // Update messages state
      // Auto-scroll to bottom
    }
  )
  .subscribe();
```

**What it does:**
- Listens for new messages in the selected conversation
- Fetches complete message data with sender information
- Updates the messages list in real-time
- Auto-scrolls to show the latest message

#### 2. Conversation Updates Subscription
```typescript
const conversationChannel = supabase
  .channel(`conversation:${selectedConversation.id}:updates`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'conversations',
      filter: `id=eq.${selectedConversation.id}`,
    },
    (payload: any) => {
      // Update conversation status, agent assignment, etc.
      // Refresh conversation in sidebar
    }
  )
  .subscribe();
```

**What it does:**
- Listens for conversation status changes (waiting → active → closed)
- Updates agent assignment in real-time
- Refreshes conversation metadata

#### 3. Conversations List Subscription
```typescript
const conversationsChannel = supabase
  .channel('conversations:list')
  .on('postgres_changes', { event: 'INSERT', ... }, ...)
  .on('postgres_changes', { event: 'UPDATE', ... }, ...)
  .subscribe();
```

**What it does:**
- Listens for new conversations being created
- Updates when any conversation changes
- Refreshes the conversations sidebar

### Message Sending (Optimistic UI)
```typescript
const sendMessage = async () => {
  setMessageInput(''); // Clear immediately
  
  // Send to API
  await fetch(`/api/conversations/${id}/messages`, { ... });
  
  // Message appears via realtime subscription (no manual add)
};
```

**Benefits:**
- Instant UI feedback
- No duplicate messages
- Consistent state via realtime

---

## Widget Implementation

### File: `packages/chat-widget/src/widget.ts`

### Real-Time Subscriptions

#### 1. Messages Subscription
```typescript
this.realtimeChannel = this.supabase
  .channel(`conversation:${this.conversation.id}:messages`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${this.conversation.id}`,
    },
    async (payload: any) => {
      // Fetch complete message with sender info
      // Update messages array
      // Play notification sound for agent messages
      // Auto-scroll to bottom
    }
  )
  .subscribe();
```

**What it does:**
- Listens for new messages from agents
- Fetches complete message data
- Plays notification sound when agent replies
- Auto-scrolls to show new messages

#### 2. Conversation Updates Subscription
```typescript
this.conversationChannel = this.supabase
  .channel(`conversation:${this.conversation.id}:updates`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'conversations',
      filter: `id=eq.${this.conversation.id}`,
    },
    (payload: any) => {
      // Update conversation status
      // Update agent assignment
      // Re-render chat view
    }
  )
  .subscribe();
```

**What it does:**
- Shows when agent is assigned
- Updates conversation status
- Refreshes chat header with agent info

### Cleanup on Destroy
```typescript
destroy() {
  if (this.realtimeChannel) {
    this.realtimeChannel.unsubscribe();
  }
  if (this.conversationChannel) {
    this.conversationChannel.unsubscribe();
  }
}
```

---

## Typing Indicators (Infrastructure)

### Database Schema
**File:** `supabase/migrations/20251101000009_typing_indicators.sql`

```sql
CREATE TABLE typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  user_id UUID REFERENCES users(id),
  widget_customer_id UUID REFERENCES widget_customers(id),
  is_typing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT typing_indicator_sender_check CHECK (
    (user_id IS NOT NULL AND widget_customer_id IS NULL) OR
    (user_id IS NULL AND widget_customer_id IS NOT NULL)
  )
);
```

### API Endpoints

#### Agent Typing Endpoint
**File:** `packages/web-dashboard/src/app/api/conversations/[id]/typing/route.ts`

- `POST /api/conversations/[id]/typing` - Update agent typing status
- `GET /api/conversations/[id]/typing` - Get typing indicators

#### Widget Customer Typing Endpoint
**File:** `packages/web-dashboard/src/app/api/widget/conversations/[id]/typing/route.ts`

- `POST /api/widget/conversations/[id]/typing` - Update customer typing status

### Usage (To Be Implemented)
```typescript
// When user types
const handleTyping = debounce(() => {
  fetch(`/api/conversations/${id}/typing`, {
    method: 'POST',
    body: JSON.stringify({ isTyping: true })
  });
}, 300);

// Subscribe to typing indicators
supabase
  .channel(`conversation:${id}:typing`)
  .on('postgres_changes', { table: 'typing_indicators', ... }, (payload) => {
    // Show "Agent is typing..." or "Customer is typing..."
  })
  .subscribe();
```

---

## Benefits of This Implementation

### 1. **True Real-Time Communication**
- Messages appear instantly without polling
- No page refresh needed
- Sub-second latency

### 2. **Scalable Architecture**
- Supabase Realtime handles WebSocket connections
- PostgreSQL CDC ensures data consistency
- Automatic reconnection on network issues

### 3. **Optimistic UI**
- Input clears immediately
- Messages appear via subscription
- No duplicate messages

### 4. **Resource Efficient**
- Only subscribes to active conversations
- Automatic cleanup on unmount
- Filtered subscriptions reduce bandwidth

### 5. **Consistent State**
- Single source of truth (database)
- All clients see the same data
- No race conditions

---

## Testing the Real-Time Chat

### Test Scenario 1: Agent → Customer Message
1. Open admin dashboard, select a conversation
2. Open widget in another browser/tab
3. Agent sends message from dashboard
4. **Expected:** Message appears instantly in widget with notification sound

### Test Scenario 2: Customer → Agent Message
1. Customer sends message from widget
2. **Expected:** Message appears instantly in admin dashboard
3. **Expected:** Conversation moves to top of list

### Test Scenario 3: Conversation Status Update
1. Agent changes conversation status (e.g., waiting → active)
2. **Expected:** Status badge updates in real-time in sidebar
3. **Expected:** Widget shows updated status

### Test Scenario 4: Multiple Agents
1. Two agents open the same conversation
2. Agent A sends a message
3. **Expected:** Agent B sees the message instantly

---

## Next Steps (Optional Enhancements)

### 1. **Implement Typing Indicators UI**
- Show "Agent is typing..." in widget
- Show "Customer is typing..." in dashboard
- Debounce typing events (300ms)

### 2. **Online/Offline Status**
- Track agent online status
- Show "Agent is online" in widget
- Show customer active status in dashboard

### 3. **Read Receipts**
- Mark messages as "read" when viewed
- Show double checkmarks
- Update message_status table

### 4. **Presence Indicators**
- Show number of agents viewing conversation
- Show when customer is actively viewing chat

### 5. **Message Delivery Status**
- Sending → Sent → Delivered → Read
- Visual indicators for each status

---

## Troubleshooting

### Messages Not Appearing in Real-Time

**Check:**
1. Supabase Realtime is enabled for the project
2. RLS policies allow reading messages
3. Browser console for subscription errors
4. Network tab for WebSocket connection

**Solution:**
```typescript
// Add logging to subscription
.on('postgres_changes', ..., (payload) => {
  console.log('[Realtime] Message received:', payload);
})
```

### Duplicate Messages

**Cause:** Message added manually AND via subscription

**Solution:** Only add via subscription:
```typescript
// ❌ Don't do this
setMessages([...messages, newMessage]);

// ✅ Do this
// Let realtime subscription handle it
```

### Subscription Not Cleaning Up

**Cause:** Missing cleanup in useEffect

**Solution:**
```typescript
useEffect(() => {
  const channel = supabase.channel(...).subscribe();
  
  return () => {
    channel.unsubscribe(); // Always cleanup
  };
}, [dependencies]);
```

---

## Performance Considerations

### 1. **Subscription Limits**
- Supabase Free tier: 200 concurrent connections
- Pro tier: 500 concurrent connections
- Enterprise: Unlimited

### 2. **Message Filtering**
- Always use `filter` parameter to reduce bandwidth
- Subscribe only to active conversations
- Unsubscribe when conversation is closed

### 3. **Batch Updates**
- Debounce typing indicators
- Throttle status updates
- Use optimistic UI for instant feedback

---

## Conclusion

The real-time WebSocket implementation provides a modern, scalable chat experience with:
- ✅ Instant message delivery
- ✅ No page reloads required
- ✅ Consistent state across all clients
- ✅ Efficient resource usage
- ✅ Production-ready architecture

The system is now ready for production use with optional enhancements available for future iterations.

