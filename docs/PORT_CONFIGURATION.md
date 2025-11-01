# Port Configuration - Fixed

## ✅ Correct Port Setup

The development servers are now configured to use the correct ports:

- **Admin Dashboard (Next.js):** http://localhost:3000
- **Widget Dev Server (Vite):** http://localhost:3001

---

## 🔧 Changes Made

### 1. **Web Dashboard Port**

**File:** `packages/web-dashboard/package.json`

```json
{
  "scripts": {
    "dev": "next dev -p 3000"  // ✅ Force port 3000
  }
}
```

### 2. **Widget Port**

**File:** `packages/chat-widget/vite.config.ts`

```typescript
export default defineConfig({
  server: {
    port: 3001,  // ✅ Already configured
    cors: true,
    open: false,
  },
});
```

### 3. **Test Page Configuration**

**File:** `test-widget.html`

```html
<script type="module">
  // Widget dev server
  import 'http://localhost:3001/src/index.ts';

  window.chatdesk('init', {
    widgetKey: 'wk_86b77b8f3b1048958ecf9f4a811b9690',
    apiUrl: 'http://localhost:3000',  // ✅ Admin API
    position: 'bottom-right',
    primaryColor: '#3B82F6',
    autoOpen: false,
  });
</script>
```

---

## 🚀 How to Start

### **Start Dev Servers**

```bash
# Use Node 21
nvm use 21

# Start all services
npm run dev
```

**Expected Output:**
```
@chatdesk/web-dashboard:dev: Local: http://localhost:3000
@chatdesk/chat-widget:dev: Local: http://localhost:3001
```

---

## 🧪 Testing

### **1. Open Test Page**

Open in browser:
```
file:///Users/zain/Documents/augment-projects/Chat/test-widget.html
```

### **2. Check Widget Loads**

**Browser Console (F12):**
```
[ChatDesk] Initializing session...
[ChatDesk] Session initialized: st_...
```

### **3. Open Admin Dashboard**

```
http://localhost:3000/dashboard/chat
```

### **4. Test Real-Time Chat**

1. **Widget:** Send message "Testing"
2. **Admin:** Should appear instantly ✅
3. **Admin:** Reply "Hello"
4. **Widget:** Should appear instantly ✅

---

## 🔍 Verify Ports

### **Check Running Processes**

```bash
lsof -i :3000
lsof -i :3001
```

**Expected:**
```
node    12345  user   23u  IPv4  0x...  TCP *:3000 (LISTEN)  # Next.js
node    12346  user   24u  IPv4  0x...  TCP *:3001 (LISTEN)  # Vite
```

### **Check Network Tab**

**In browser DevTools → Network:**

1. **Widget API calls** should go to: `http://localhost:3000/api/widget/*`
2. **WebSocket** should connect to: `wss://pnjbqxfhtfitriyviwid.supabase.co/realtime/v1/websocket`

---

## 🐛 Troubleshooting

### **Error: Port Already in Use**

**Solution:**
```bash
# Kill processes on ports 3000 and 3001
lsof -ti:3000 -ti:3001 | xargs kill -9

# Wait 2 seconds
sleep 2

# Restart
nvm use 21
npm run dev
```

### **Error: Widget Not Loading**

**Check:**
1. Widget dev server is running on port 3001
2. Browser console for errors
3. Network tab for failed requests

**Solution:**
```bash
# Hard refresh browser
Cmd+Shift+R

# Clear cache
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### **Error: 404 on /api/widget/init**

**Cause:** Widget is calling wrong API URL

**Check test-widget.html:**
```javascript
window.chatdesk('init', {
  apiUrl: 'http://localhost:3000',  // ✅ Should be 3000, not 3001
});
```

---

## 📋 Port Reference

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Admin Dashboard | 3000 | http://localhost:3000 | Next.js web app for agents |
| Widget Dev Server | 3001 | http://localhost:3001 | Vite dev server for widget |
| Widget API | 3000 | http://localhost:3000/api/widget/* | Backend API for widget |
| Supabase Realtime | - | wss://pnjbqxfhtfitriyviwid.supabase.co | WebSocket for real-time |

---

## ✅ Current Status

- ✅ Admin Dashboard running on port 3000
- ✅ Widget Dev Server running on port 3001
- ✅ Test page configured correctly
- ✅ Widget API pointing to correct URL
- ✅ WebSocket using correct Supabase credentials

---

## 🎯 Next Steps

1. **Clear browser cache:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Hard refresh test page:**
   - Press `Cmd+Shift+R`

3. **Test widget initialization:**
   - Check console for: `[ChatDesk] Session initialized`

4. **Test real-time chat:**
   - Send message from widget
   - Check admin dashboard
   - Reply from admin
   - Check widget

5. **Verify WebSocket:**
   - Network tab → Filter "WS"
   - Status should be: `101 Switching Protocols`

---

## 📚 Related Files

- `packages/web-dashboard/package.json` - Admin dashboard config
- `packages/chat-widget/vite.config.ts` - Widget dev server config
- `test-widget.html` - Test page with widget integration
- `packages/chat-widget/src/widget.ts` - Widget source code

---

## 🎊 Summary

**Ports are now correctly configured:**
- Admin Dashboard: **3000** ✅
- Widget Dev Server: **3001** ✅
- Widget API URL: **http://localhost:3000** ✅

**The widget should now load and connect properly!**

