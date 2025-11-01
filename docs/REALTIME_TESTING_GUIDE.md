# Real-Time WebSocket Chat Testing Guide

## Prerequisites

1. ✅ Dev server running on `http://localhost:3000`
2. ✅ Widget built and available at `http://localhost:3001`
3. ✅ Logged into admin dashboard
4. ✅ Widget test page open: `file:///Users/zain/Documents/augment-projects/Chat/test-widget.html`

---

## Test 1: Customer → Agent Real-Time Message

### Steps:

1. **Open Widget** (test-widget.html)
   - Widget should load and show existing conversation
   - Check browser console for: `[ChatDesk] Setting up realtime subscriptions`

2. **Open Admin Dashboard** (http://localhost:3000/dashboard/chat)
   - Log in if not already logged in
   - Select the conversation from the widget customer
   - Check browser console for: `[Chat Page] Setting up realtime subscription`

3. **Send Message from Widget**
   - Type a message in the widget: "Testing real-time from customer"
   - Click Send
   - **Expected Results:**
     - ✅ Message appears in widget immediately
     - ✅ Message appears in admin dashboard **without refresh** (within 1 second)
     - ✅ Admin dashboard auto-scrolls to show new message
     - ✅ Browser console shows: `[Chat Page] New message received`

4. **Check Console Logs**
   - Widget console should show:
     ```
     [ChatDesk] Sending message...
     [ChatDesk] New message received via realtime
     ```
   - Admin console should show:
     ```
     [Chat Page] New message received: {id: "...", content: "Testing real-time from customer"}
     ```

---

## Test 2: Agent → Customer Real-Time Message

### Steps:

1. **Send Message from Admin Dashboard**
   - Type in the message input: "Hello from agent - real-time test"
   - Click Send or press Enter
   - **Expected Results:**
     - ✅ Input clears immediately
     - ✅ Message appears in admin dashboard via realtime
     - ✅ Message appears in widget **without refresh** (within 1 second)
     - ✅ Widget plays notification sound
     - ✅ Widget auto-scrolls to show new message

2. **Check Console Logs**
   - Admin console should show:
     ```
     [Chat Page] New message received: {id: "...", content: "Hello from agent - real-time test"}
     ```
   - Widget console should show:
     ```
     [ChatDesk] New message received via realtime: {sender_id: "..."}
     ```

---

## Test 3: Conversation Status Update

### Steps:

1. **Change Conversation Status in Admin**
   - In admin dashboard, change status from "waiting" to "active"
   - **Expected Results:**
     - ✅ Status badge updates immediately in sidebar
     - ✅ Status updates in conversation header
     - ✅ Widget receives update (check console)

2. **Check Console Logs**
   - Admin console should show:
     ```
     [Chat Page] Conversation updated: {status: "active"}
     ```
   - Widget console should show:
     ```
     [ChatDesk] Conversation updated: {status: "active"}
     ```

---

## Test 4: New Conversation Notification

### Steps:

1. **Create New Conversation from Widget**
   - Open test-widget.html in a **new incognito window**
   - Select a department and start a new chat
   - Send a message: "New conversation test"

2. **Check Admin Dashboard**
   - **Expected Results:**
     - ✅ New conversation appears in sidebar **without refresh**
     - ✅ Conversation shows unread indicator
     - ✅ Console shows: `[Chat Page] New conversation created`

---

## Test 5: Multiple Messages Rapid Fire

### Steps:

1. **Send Multiple Messages Quickly**
   - From widget, send 5 messages in quick succession:
     - "Message 1"
     - "Message 2"
     - "Message 3"
     - "Message 4"
     - "Message 5"

2. **Check Admin Dashboard**
   - **Expected Results:**
     - ✅ All 5 messages appear in correct order
     - ✅ No duplicate messages
     - ✅ All messages have correct timestamps
     - ✅ Auto-scroll works for all messages

---

## Test 6: Realtime Subscription Cleanup

### Steps:

1. **Select a Conversation**
   - In admin dashboard, select conversation A
   - Check console: `[Chat Page] Setting up realtime subscription for conversation: A`

2. **Switch to Another Conversation**
   - Select conversation B
   - **Expected Results:**
     - ✅ Console shows: `[Chat Page] Cleaning up realtime subscriptions`
     - ✅ Console shows: `[Chat Page] Setting up realtime subscription for conversation: B`
     - ✅ Messages from conversation A no longer trigger updates
     - ✅ Only messages from conversation B appear

3. **Close Widget**
   - Click the close button on widget
   - **Expected Results:**
     - ✅ Console shows: `[ChatDesk] Destroying widget and cleaning up subscriptions`
     - ✅ No more realtime updates received

---

## Test 7: Network Reconnection

### Steps:

1. **Simulate Network Disconnect**
   - Open browser DevTools → Network tab
   - Set throttling to "Offline"
   - Wait 5 seconds

2. **Restore Network**
   - Set throttling back to "No throttling"
   - **Expected Results:**
     - ✅ Supabase Realtime automatically reconnects
     - ✅ Messages sent during offline period appear
     - ✅ No duplicate messages

---

## Test 8: Cross-Tab Synchronization

### Steps:

1. **Open Admin Dashboard in Two Tabs**
   - Tab 1: http://localhost:3000/dashboard/chat
   - Tab 2: http://localhost:3000/dashboard/chat
   - Both tabs select the same conversation

2. **Send Message from Widget**
   - Send: "Testing cross-tab sync"
   - **Expected Results:**
     - ✅ Message appears in Tab 1 immediately
     - ✅ Message appears in Tab 2 immediately
     - ✅ Both tabs show identical message list

---

## Debugging Real-Time Issues

### Issue: Messages Not Appearing in Real-Time

**Check:**
1. Browser console for errors
2. Network tab for WebSocket connection (should see `wss://` connection)
3. Supabase Realtime is enabled in project settings
4. RLS policies allow reading messages

**Solution:**
```javascript
// Add detailed logging
supabase
  .channel('test')
  .on('postgres_changes', ..., (payload) => {
    console.log('Realtime event:', payload);
  })
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });
```

### Issue: Duplicate Messages

**Cause:** Message added manually AND via subscription

**Solution:** Remove manual message addition:
```javascript
// ❌ Don't do this
setMessages([...messages, newMessage]);

// ✅ Do this - let realtime handle it
// (no manual add)
```

### Issue: Subscription Not Cleaning Up

**Check:** useEffect cleanup function

**Solution:**
```javascript
useEffect(() => {
  const channel = supabase.channel(...).subscribe();
  
  return () => {
    console.log('Cleaning up subscription');
    channel.unsubscribe();
  };
}, [conversationId]);
```

---

## Expected Console Output

### Widget Console (Successful Real-Time)
```
[ChatDesk] Initializing session...
[ChatDesk] Session initialized: st_...
[ChatDesk] Setting up realtime subscriptions for conversation: 2954a035-...
[ChatDesk] Sending message...
[ChatDesk] New message received via realtime: {id: "...", content: "..."}
```

### Admin Dashboard Console (Successful Real-Time)
```
[Chat Page] Setting up realtime subscription for conversation: 2954a035-...
[Chat Page] Setting up conversations list realtime subscription
[Chat Page] New message received: {id: "...", content: "...", sender_id: "..."}
[Chat Page] Conversation updated: {status: "active"}
```

---

## Performance Metrics

### Expected Latency
- **Message delivery**: < 500ms
- **Status updates**: < 300ms
- **New conversation notification**: < 1 second

### Resource Usage
- **WebSocket connections**: 2-3 per client (messages, conversations, typing)
- **Memory**: < 10MB per active conversation
- **CPU**: < 5% during active chat

---

## Success Criteria

✅ **All tests pass**
✅ **No duplicate messages**
✅ **No console errors**
✅ **Subscriptions clean up properly**
✅ **Messages appear within 1 second**
✅ **Auto-scroll works consistently**
✅ **Network reconnection works**
✅ **Cross-tab sync works**

---

## Next Steps After Testing

If all tests pass:
1. ✅ Mark "Test real-time chat end-to-end" task as COMPLETE
2. Consider implementing typing indicators UI
3. Consider adding online/offline status
4. Consider adding read receipts
5. Deploy to production

If tests fail:
1. Check console logs for errors
2. Verify Supabase Realtime is enabled
3. Check RLS policies
4. Review subscription setup code
5. Test with simplified example first

