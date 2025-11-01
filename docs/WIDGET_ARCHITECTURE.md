# Customer Chat Widget Architecture

## Overview

The customer chat widget is an embeddable JavaScript widget that website owners install on their sites to enable customer chat. Similar to JivoChat, Intercom, or Drift.

## How It Works

### 1. Organization Setup (Admin Panel)
```
1. Admin creates organization
2. Admin sets up departments
3. Admin configures pre-chat forms
4. Admin invites agents
5. Admin gets WIDGET CODE from settings
```

### 2. Widget Installation (Customer Website)
```html
<!-- Customer adds this to their website -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ChatDesk']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','chatdesk','https://widget.chatdesk.com/widget.js'));
  
  chatdesk('init', {
    organizationId: 'c785d757-16c3-49de-b547-f2a897fc94dc', // Unique org ID
    departmentId: 'optional-department-id', // Optional: specific department
    position: 'bottom-right', // Widget position
    primaryColor: '#3B82F6', // Brand color
    greeting: 'Hi! How can we help you today?'
  });
</script>
```

### 3. Widget Flow (Customer Experience)
```
1. Customer visits website
2. Widget loads and shows chat bubble
3. Customer clicks bubble
4. Pre-chat form appears (if configured)
5. Customer fills form and submits
6. Chat window opens
7. Customer sends message
8. Message appears in agent dashboard
9. Agent responds
10. Customer sees response in real-time
```

## Architecture Components

### 1. Widget Script (`widget.js`)
**Location**: `packages/chat-widget/` (new package)

**Responsibilities**:
- Load widget UI
- Initialize connection to backend
- Handle authentication
- Manage WebSocket connection
- Send/receive messages
- Store conversation state
- Handle offline mode

### 2. Widget UI
**Components**:
- Chat Bubble (floating button)
- Chat Window (popup interface)
- Pre-chat Form
- Message List
- Message Input
- Typing Indicators
- Agent Avatar
- Minimize/Maximize controls

### 3. Widget API
**Endpoints**:
- `POST /api/widget/init` - Initialize widget session
- `POST /api/widget/conversations` - Create conversation
- `POST /api/widget/conversations/:id/messages` - Send message
- `GET /api/widget/conversations/:id/messages` - Get messages
- `GET /api/widget/departments` - Get available departments
- `POST /api/widget/upload` - Upload files

### 4. Real-time Connection
**Technology**: Supabase Realtime
- Subscribe to conversation messages
- Receive agent responses instantly
- Show typing indicators
- Update online/offline status

## Database Schema Additions

### Widget Sessions Table
```sql
CREATE TABLE widget_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  visitor_id VARCHAR(255), -- Anonymous visitor tracking
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  current_url TEXT,
  country VARCHAR(2),
  city VARCHAR(100),
  device_type VARCHAR(50), -- desktop, mobile, tablet
  browser VARCHAR(100),
  os VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);
```

### Widget Settings Table
```sql
CREATE TABLE widget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
  widget_key VARCHAR(255) UNIQUE NOT NULL, -- Public key for widget
  enabled BOOLEAN DEFAULT true,
  
  -- Appearance
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  position VARCHAR(20) DEFAULT 'bottom-right', -- bottom-right, bottom-left
  bubble_icon VARCHAR(50) DEFAULT 'chat',
  
  -- Behavior
  greeting_message TEXT DEFAULT 'Hi! How can we help you today?',
  auto_open BOOLEAN DEFAULT false,
  auto_open_delay INTEGER DEFAULT 5, -- seconds
  show_agent_avatars BOOLEAN DEFAULT true,
  show_typing_indicator BOOLEAN DEFAULT true,
  
  -- Business Hours
  business_hours JSONB DEFAULT '[]'::jsonb,
  offline_message TEXT DEFAULT 'We are currently offline. Leave a message and we will get back to you.',
  
  -- Allowed Domains
  allowed_domains TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Implementation Plan

### Phase 1: Widget Backend (API)
1. Create widget settings in organization settings
2. Generate unique widget key for each organization
3. Create widget API endpoints
4. Implement widget authentication
5. Create widget session management

### Phase 2: Widget Frontend (Script)
1. Create new package `packages/chat-widget`
2. Build widget loader script
3. Build chat bubble component
4. Build chat window component
5. Build pre-chat form
6. Implement message sending/receiving
7. Add file upload support

### Phase 3: Widget Customization
1. Add widget settings page in admin panel
2. Allow customization of colors, position, greeting
3. Configure business hours
4. Set allowed domains
5. Preview widget before deployment

### Phase 4: Real-time Features
1. Implement Supabase Realtime subscriptions
2. Add typing indicators
3. Add online/offline status
4. Add read receipts
5. Add notification sounds

### Phase 5: Advanced Features
1. Visitor tracking and analytics
2. Proactive chat (auto-open based on rules)
3. Canned responses
4. File attachments
5. Emoji support
6. Chat transcripts via email

## Widget Code Generation

### Admin Panel - Widget Settings Page
```typescript
// packages/web-dashboard/src/app/dashboard/settings/widget/page.tsx

export default function WidgetSettingsPage() {
  const [widgetKey, setWidgetKey] = useState('');
  const [settings, setSettings] = useState({
    primaryColor: '#3B82F6',
    position: 'bottom-right',
    greeting: 'Hi! How can we help you today?',
  });

  const widgetCode = `
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ChatDesk']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','chatdesk','${process.env.NEXT_PUBLIC_WIDGET_URL}/widget.js'));
  
  chatdesk('init', {
    widgetKey: '${widgetKey}',
    primaryColor: '${settings.primaryColor}',
    position: '${settings.position}',
    greeting: '${settings.greeting}'
  });
</script>
  `.trim();

  return (
    <div>
      <h1>Chat Widget</h1>
      
      {/* Widget Settings Form */}
      <WidgetSettingsForm settings={settings} onChange={setSettings} />
      
      {/* Widget Code Display */}
      <div className="mt-8">
        <h2>Installation Code</h2>
        <p>Copy and paste this code before the closing &lt;/body&gt; tag on your website:</p>
        <pre className="bg-gray-100 p-4 rounded">
          <code>{widgetCode}</code>
        </pre>
        <Button onClick={() => navigator.clipboard.writeText(widgetCode)}>
          Copy Code
        </Button>
      </div>
      
      {/* Live Preview */}
      <div className="mt-8">
        <h2>Preview</h2>
        <WidgetPreview settings={settings} />
      </div>
    </div>
  );
}
```

## Security Considerations

### 1. Widget Authentication
- Use public widget key (not secret)
- Generate session tokens for each visitor
- Validate allowed domains
- Rate limiting on widget API

### 2. CORS Configuration
```typescript
// Allow widget to be embedded on customer domains
const allowedOrigins = widgetSettings.allowed_domains;

if (allowedOrigins.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

### 3. XSS Protection
- Sanitize all user input
- Escape HTML in messages
- Use Content Security Policy
- Validate file uploads

## Example Widget Usage

### Basic Installation
```html
<script src="https://widget.chatdesk.com/widget.js"></script>
<script>
  chatdesk('init', {
    widgetKey: 'wk_abc123xyz789'
  });
</script>
```

### Advanced Configuration
```html
<script>
  chatdesk('init', {
    widgetKey: 'wk_abc123xyz789',
    departmentId: 'dept_sales',
    position: 'bottom-left',
    primaryColor: '#10B981',
    greeting: 'Welcome to Acme Corp! How can we help?',
    autoOpen: true,
    autoOpenDelay: 10,
    userData: {
      name: 'John Doe',
      email: 'john@example.com',
      customField1: 'Premium Customer'
    }
  });
</script>
```

### API Methods
```javascript
// Open widget programmatically
chatdesk('open');

// Close widget
chatdesk('close');

// Send event
chatdesk('track', 'viewed_pricing_page');

// Update user data
chatdesk('identify', {
  name: 'John Doe',
  email: 'john@example.com'
});

// Listen to events
chatdesk('on', 'message', function(message) {
  console.log('New message:', message);
});
```

## Next Steps

To implement this, we need to:

1. **Create Widget Settings in Admin Panel**
   - Add widget settings page
   - Generate unique widget key
   - Display installation code
   - Allow customization

2. **Build Widget Backend**
   - Create widget API endpoints
   - Implement session management
   - Handle widget authentication

3. **Build Widget Frontend**
   - Create new package for widget
   - Build chat bubble and window
   - Implement messaging
   - Add real-time updates

4. **Test Widget**
   - Create test HTML page
   - Embed widget
   - Test messaging flow
   - Test on different devices

Would you like me to start implementing the widget system? I can begin with:
1. Widget settings page in admin panel
2. Widget API endpoints
3. Widget script and UI

Let me know which part you'd like to tackle first!

