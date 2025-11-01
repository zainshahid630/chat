# Real-Time Chat Troubleshooting

## Issue: WebSocket Connection Failed

### Error Message:
```
WebSocket connection to 'wss://pnjbqxfhtfitriyviwid.supabase.co/realtime/v1/websocket?apikey=...' failed
```

---

## Root Causes & Solutions

### 1. **Supabase Realtime Not Enabled** ⚠️

**Problem:** Realtime feature is disabled in Supabase project settings.

**Solution:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/pnjbqxfhtfitriyviwid
2. Navigate to **Database** → **Replication**
3. Find the tables: `messages`, `conversations`, `typing_indicators`
4. **Enable Realtime** for each table by toggling the switch
5. Click **Save**

**Tables to enable:**
- ✅ `messages` - For real-time message delivery
- ✅ `conversations` - For status updates
- ✅ `typing_indicators` - For typing status (if table exists)

---

### 2. **Old API Key Cached in Browser**

**Problem:** Browser is using an old/incorrect API key.

**Solution:**
1. **Clear browser cache:**
   - Chrome: Cmd+Shift+Delete → Clear cached images and files
   - Or use Incognito mode

2. **Hard refresh the pages:**
   - Widget: Cmd+Shift+R on test-widget.html
   - Admin: Cmd+Shift+R on dashboard

3. **Clear localStorage:**
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

---

### 3. **RLS Policies Blocking Realtime**

**Problem:** Row Level Security policies might block realtime subscriptions.

**Solution:**
Run this SQL in Supabase SQL Editor to check and fix RLS:

```sql
-- Check current RLS policies on messages table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'messages';

-- Ensure SELECT policy allows reading messages
-- This policy should already exist, but verify it's not too restrictive
DROP POLICY IF EXISTS "Users can view messages in their organization" ON messages;

CREATE POLICY "Users can view messages in their organization"
ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    JOIN users u ON u.organization_id = c.organization_id
    WHERE c.id = messages.conversation_id
    AND u.id = auth.uid()
  )
  OR
  -- Allow widget customers to see their own messages
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND c.widget_customer_id = messages.widget_sender_id
  )
);
```

---

### 4. **Realtime Broadcast Not Configured**

**Problem:** Tables not configured to broadcast changes.

**Solution:**
Run this SQL in Supabase SQL Editor:

```sql
-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for conversations table
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Enable realtime for typing_indicators table (if exists)
ALTER PUBLICATION supabase_realtime ADD TABLE typing_indicators;

-- Verify publications
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

---

### 5. **Network/Firewall Issues**

**Problem:** WebSocket connections blocked by firewall or network.

**Solution:**
1. **Check if WebSocket is blocked:**
   ```javascript
   // In browser console
   const ws = new WebSocket('wss://pnjbqxfhtfitriyviwid.supabase.co/realtime/v1/websocket?apikey=YOUR_KEY&vsn=1.0.0');
   ws.onopen = () => console.log('✅ WebSocket connected');
   ws.onerror = (e) => console.error('❌ WebSocket error:', e);
   ```

2. **Try different network:**
   - Disable VPN if using one
   - Try mobile hotspot
   - Check corporate firewall settings

---

## Step-by-Step Fix Guide

### Step 1: Enable Realtime in Supabase Dashboard

1. **Go to:** https://supabase.com/dashboard/project/pnjbqxfhtfitriyviwid/database/replication
2. **Find these tables:**
   - `messages`
   - `conversations`
3. **Toggle "Enable Realtime"** for each table
4. **Click Save**

### Step 2: Configure Realtime Publication (SQL)

Run this in Supabase SQL Editor:

```sql
-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Verify
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

Expected output:
```
pubname              | schemaname | tablename
---------------------|------------|-------------
supabase_realtime    | public     | messages
supabase_realtime    | public     | conversations
```

### Step 3: Clear Browser Cache

1. **Close all browser tabs** with the widget and admin dashboard
2. **Clear cache:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
3. **Restart browser**

### Step 4: Test WebSocket Connection

1. **Open browser console** (F12)
2. **Run this test:**
   ```javascript
   const { createClient } = supabase;
   const supabase = createClient(
     'https://pnjbqxfhtfitriyviwid.supabase.co',
     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuamJxeGZodGZpdHJpeXZpd2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4OTYxMjQsImV4cCI6MjA3NzQ3MjEyNH0.N9kgEXE23U1YVXCna0vfa-axoA1pYGCeMuMPefEEACY'
   );
   
   const channel = supabase
     .channel('test-channel')
     .on('postgres_changes', {
       event: '*',
       schema: 'public',
       table: 'messages'
     }, (payload) => {
       console.log('✅ Realtime working!', payload);
     })
     .subscribe((status) => {
       console.log('Subscription status:', status);
     });
   ```

3. **Expected output:**
   ```
   Subscription status: SUBSCRIBED
   ```

### Step 5: Restart Dev Server

```bash
# Kill existing server
lsof -ti:3000 -ti:3001 | xargs kill -9

# Restart with Node 21
nvm use 21
npm run dev
```

### Step 6: Test Real-Time Chat

1. **Open widget:** `file:///Users/zain/Documents/augment-projects/Chat/test-widget.html`
2. **Open admin:** `http://localhost:3000/dashboard/chat`
3. **Send message from widget**
4. **Check admin dashboard** - message should appear within 1 second

---

## Debugging Commands

### Check Realtime Status
```javascript
// In browser console
supabase.channel('test').subscribe((status) => {
  console.log('Status:', status);
  // Should show: SUBSCRIBED
});
```

### Check Network Tab
1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for connection to `wss://pnjbqxfhtfitriyviwid.supabase.co/realtime/v1/websocket`
4. Status should be "101 Switching Protocols" (success)

### Check Console Logs
Look for these logs:
- ✅ `[ChatDesk] Setting up realtime subscriptions`
- ✅ `[Chat Page] Setting up realtime subscription`
- ❌ `WebSocket connection failed` (indicates problem)

---

## Common Errors & Fixes

### Error: "WebSocket connection failed"
**Fix:** Enable Realtime in Supabase Dashboard (Step 1 above)

### Error: "Subscription status: CHANNEL_ERROR"
**Fix:** Check RLS policies (Solution 3 above)

### Error: "Subscription status: TIMED_OUT"
**Fix:** Check network/firewall (Solution 5 above)

### Error: Old API key in error message
**Fix:** Clear browser cache (Solution 2 above)

---

## Quick Fix Checklist

- [ ] Realtime enabled for `messages` table in Supabase Dashboard
- [ ] Realtime enabled for `conversations` table in Supabase Dashboard
- [ ] Tables added to `supabase_realtime` publication (SQL)
- [ ] Browser cache cleared
- [ ] Dev server restarted
- [ ] Test page hard-refreshed (Cmd+Shift+R)
- [ ] WebSocket connection shows "101 Switching Protocols" in Network tab
- [ ] Console shows "SUBSCRIBED" status

---

## Still Not Working?

If you've tried all the above and it's still not working:

1. **Check Supabase Status:** https://status.supabase.com/
2. **Check Supabase Logs:** Dashboard → Logs → Realtime
3. **Contact Support:** Provide error logs and steps taken
4. **Try Supabase CLI:** `npx supabase status` to check local setup

---

## Expected Working State

When everything is working correctly, you should see:

**Browser Console (Widget):**
```
[ChatDesk] Setting up realtime subscriptions for conversation: xxx
Subscription status: SUBSCRIBED
```

**Browser Console (Admin):**
```
[Chat Page] Setting up realtime subscription for conversation: xxx
Subscription status: SUBSCRIBED
[Chat Page] New message received: {id: "...", content: "..."}
```

**Network Tab:**
```
wss://pnjbqxfhtfitriyviwid.supabase.co/realtime/v1/websocket
Status: 101 Switching Protocols
```

**Behavior:**
- Messages appear in < 1 second
- No page refresh needed
- Auto-scroll works
- Notification sound plays

