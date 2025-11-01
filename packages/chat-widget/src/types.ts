export interface WidgetConfig {
  widgetKey: string;
  apiUrl?: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  greeting?: string;
  autoOpen?: boolean;
  autoOpenDelay?: number;
  userData?: {
    name?: string;
    email?: string;
    [key: string]: any;
  };
}

export interface WidgetSettings {
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  widgetTitle: string;
  greetingMessage: string;
  autoOpen: boolean;
  autoOpenDelay: number;
  showAgentAvatars: boolean;
  showTypingIndicator: boolean;
  playNotificationSound: boolean;
  defaultDepartmentId?: string;
}

export interface WidgetSession {
  sessionToken: string;
  organizationId: string;
  organizationName: string;
  config: WidgetSettings;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  pre_chat_form: PreChatFormField[];
}

export interface PreChatFormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  order: number;
}

export interface Conversation {
  id: string;
  organization_id: string;
  department_id: string;
  customer_id: string;
  agent_id?: string;
  status: 'waiting' | 'active' | 'closed' | 'ticket';
  pre_chat_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  customer?: User;
  agent?: User;
  department?: {
    id: string;
    name: string;
  };
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: 'agent' | 'customer' | 'org_admin';
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id?: string;
  widget_sender_id?: string;
  sender_type: 'agent' | 'customer' | 'system';
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'file' | 'system';
  media_url?: string;
  created_at: string;
  sender?: User;
  widget_sender?: {
    id: string;
    visitor_id: string;
    email?: string;
    full_name?: string;
  };
}

export interface EventCallbacks {
  [event: string]: Function[];
}

