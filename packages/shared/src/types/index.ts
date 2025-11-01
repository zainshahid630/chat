// Database Types
export type UserRole = 'super_admin' | 'org_admin' | 'agent' | 'customer';
export type UserStatus = 'online' | 'offline' | 'busy' | 'away';
export type ConversationStatus = 'waiting' | 'active' | 'closed' | 'ticket';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type MessageType = 'text' | 'image' | 'audio' | 'file' | 'system';
export type MessageStatus = 'sent' | 'delivered' | 'read';
export type SenderType = 'agent' | 'customer' | 'system';
export type WidgetPosition = 'bottom-right' | 'bottom-left';
export type DeviceType = 'desktop' | 'mobile' | 'tablet';

// Organization
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  settings: OrganizationSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationSettings {
  branding?: {
    primaryColor?: string;
    logoUrl?: string;
    companyName?: string;
  };
  features?: {
    ticketingEnabled?: boolean;
    webhooksEnabled?: boolean;
    maxAgents?: number;
  };
  notifications?: {
    emailNotifications?: boolean;
    soundEnabled?: boolean;
  };
}

// Department
export interface Department {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  pre_chat_form: PreChatFormField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FormFieldType = 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea';

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern
  errorMessage?: string;
}

export interface PreChatFormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select type
  validation?: FormFieldValidation;
  order: number;
  helpText?: string; // Additional help text for the field
}

// User
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  organization_id?: string;
  status: UserStatus;
  is_active: boolean;
  last_seen_at?: string;
  created_at: string;
  updated_at: string;
}

// Agent Department
export interface AgentDepartment {
  id: string;
  agent_id: string;
  department_id: string;
  created_at: string;
}

// Conversation
export interface Conversation {
  id: string;
  organization_id: string;
  department_id: string;
  customer_id: string;
  agent_id?: string;
  status: ConversationStatus;
  ticket_number?: string;
  ticket_priority?: TicketPriority;
  ticket_due_date?: string;
  ticket_tags?: string[];
  pre_chat_data: Record<string, any>;
  started_at: string;
  assigned_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

// Message
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: SenderType;
  content?: string;
  message_type: MessageType;
  media_url?: string;
  media_type?: string;
  media_size?: number;
  status: MessageStatus;
  created_at: string;
  delivered_at?: string;
  read_at?: string;
}

// Message Status
export interface MessageStatusRecord {
  id: string;
  message_id: string;
  user_id: string;
  status: 'delivered' | 'read';
  timestamp: string;
}

// Blocked User
export interface BlockedUser {
  id: string;
  organization_id: string;
  customer_id: string;
  blocked_by: string;
  reason?: string;
  created_at: string;
  unblocked_at?: string;
}

// Webhook
export interface Webhook {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  event_types: string[];
  secret_key?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Webhook Log
export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, any>;
  response_status?: number;
  response_body?: string;
  error?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Input Types for Creating/Updating
export type CreateOrganizationInput = Omit<Organization, 'id' | 'created_at' | 'updated_at'>;
export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;

export type CreateDepartmentInput = Omit<Department, 'id' | 'created_at' | 'updated_at'>;
export type UpdateDepartmentInput = Partial<CreateDepartmentInput>;

export type CreateConversationInput = Omit<Conversation, 'id' | 'created_at' | 'updated_at' | 'started_at'>;
export type UpdateConversationInput = Partial<CreateConversationInput>;

export type CreateMessageInput = Omit<Message, 'id' | 'created_at' | 'delivered_at' | 'read_at'>;
export type UpdateMessageInput = Partial<Pick<Message, 'status' | 'delivered_at' | 'read_at'>>;

export type CreateWebhookInput = Omit<Webhook, 'id' | 'created_at' | 'updated_at'>;
export type UpdateWebhookInput = Partial<CreateWebhookInput>;

// Widget Settings
export interface WidgetSettings {
  id: string;
  organization_id: string;
  widget_key: string;
  enabled: boolean;

  // Appearance
  primary_color: string;
  position: WidgetPosition;
  bubble_icon: string;
  widget_title: string;

  // Behavior
  greeting_message: string;
  auto_open: boolean;
  auto_open_delay: number;
  show_agent_avatars: boolean;
  show_typing_indicator: boolean;
  play_notification_sound: boolean;

  // Business Hours
  business_hours: BusinessHours[];
  offline_message: string;

  // Security
  allowed_domains: string[];

  // Default Department
  default_department_id?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface BusinessHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start: string; // HH:MM format
  end: string; // HH:MM format
  enabled: boolean;
}

// Widget Session
export interface WidgetSession {
  id: string;
  organization_id: string;
  widget_key: string;
  session_token: string;

  // Visitor Information
  visitor_id?: string;
  conversation_id?: string;

  // Technical Information
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  current_url?: string;

  // Geolocation
  country?: string;
  city?: string;

  // Device Information
  device_type?: DeviceType;
  browser?: string;
  os?: string;
  screen_resolution?: string;

  // Session State
  is_active: boolean;
  last_seen_at: string;

  // Timestamps
  created_at: string;
  expires_at: string;
}

// Widget Configuration (for initialization)
export interface WidgetConfig {
  widgetKey: string;
  organizationId?: string;
  departmentId?: string;
  position?: WidgetPosition;
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

// Widget API Types
export type CreateWidgetSettingsInput = Omit<WidgetSettings, 'id' | 'widget_key' | 'created_at' | 'updated_at'>;
export type UpdateWidgetSettingsInput = Partial<CreateWidgetSettingsInput>;

export type CreateWidgetSessionInput = Omit<WidgetSession, 'id' | 'session_token' | 'created_at' | 'expires_at'>;
export type UpdateWidgetSessionInput = Partial<Pick<WidgetSession, 'is_active' | 'last_seen_at' | 'current_url' | 'conversation_id'>>;

