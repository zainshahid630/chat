import type {
  WidgetConfig,
  WidgetSession,
  Department,
  Conversation,
  Message,
  EventCallbacks,
} from './types';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

export class ChatWidget {
  private config: WidgetConfig;
  private session: WidgetSession | null = null;
  private conversation: Conversation | null = null;
  private messages: Message[] = [];
  private departments: Department[] = [];
  private isOpen: boolean = false;
  private isMinimized: boolean = true;
  private eventCallbacks: EventCallbacks = {};
  private supabase: any;
  private realtimeChannel: RealtimeChannel | null = null;

  // DOM elements
  private container: HTMLElement | null = null;
  private bubble: HTMLElement | null = null;
  private chatWindow: HTMLElement | null = null;

  constructor(config: WidgetConfig) {
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:3000',
      position: config.position || 'bottom-right',
      ...config,
    };
  }

  /**
   * Initialize the widget
   */
  async init() {
    try {
      // Initialize widget session
      await this.initializeSession();

      // Create DOM elements
      this.createWidget();

      // Load departments
      await this.loadDepartments();

      // Auto-open if configured
      if (this.session?.config.autoOpen) {
        setTimeout(() => {
          this.open();
        }, (this.session.config.autoOpenDelay || 5) * 1000);
      }

      this.emit('ready');
    } catch (error) {
      console.error('[ChatDesk] Failed to initialize widget:', error);
      this.emit('error', error);
    }
  }

  /**
   * Initialize widget session with backend
   */
  private async initializeSession() {
    try {
      const visitorId = this.getOrCreateVisitorId();
      const existingSessionToken = this.getStoredSessionToken();

      console.log('[ChatDesk] Initializing session...');
      console.log('[ChatDesk] Visitor ID:', visitorId);
      console.log('[ChatDesk] Existing session token:', existingSessionToken ? 'Found' : 'None');

      const response = await fetch(`${this.config.apiUrl}/api/widget/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          widgetKey: this.config.widgetKey,
          visitorId,
          existingSessionToken,
          userData: {
            ...this.config.userData,
            currentUrl: window.location.href,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize widget session');
      }

      const sessionData = await response.json();
      this.session = sessionData;

      // Store session token in localStorage for persistence
      this.storeSessionToken(sessionData.sessionToken);

      console.log('[ChatDesk] Session initialized:', sessionData.sessionToken);
      console.log('[ChatDesk] Existing conversation:', sessionData.conversationId || 'None');

      // Initialize Supabase client for realtime
      if (this.session) {
        this.supabase = createClient(
          'https://pnjbqxfhtfitriyviwid.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuamJxeGZodGZpdHJpeXZpd2lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAzNjI4NzksImV4cCI6MjA0NTkzODg3OX0.Ks_Ks8Ks8Ks8Ks8Ks8Ks8Ks8Ks8Ks8Ks8Ks8Ks8Ks8' // Anon key
        );
      }

      // If there's an existing conversation, load it
      if (sessionData.conversationId) {
        console.log('[ChatDesk] Restoring existing conversation:', sessionData.conversationId);
        await this.restoreConversation(sessionData.conversationId);
      }
    } catch (error) {
      console.error('[ChatDesk] Session initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get or create visitor ID (multi-layer storage)
   */
  private getOrCreateVisitorId(): string {
    const key = 'chatdesk_visitor_id';

    // Try to get from multiple sources
    let visitorId = this.getCookie(key) ||
                    localStorage.getItem(key) ||
                    sessionStorage.getItem(key);

    if (!visitorId) {
      // Generate new visitor ID with browser fingerprint
      const fingerprint = this.generateBrowserFingerprint();
      visitorId = `visitor_${Date.now()}_${fingerprint}_${Math.random().toString(36).substring(2, 9)}`;

      // Store in all locations
      this.setCookie(key, visitorId, 365 * 10); // 10 years
      localStorage.setItem(key, visitorId);
      sessionStorage.setItem(key, visitorId);
    } else {
      // Sync across all storage locations
      this.setCookie(key, visitorId, 365 * 10);
      localStorage.setItem(key, visitorId);
      sessionStorage.setItem(key, visitorId);
    }

    return visitorId;
  }

  /**
   * Generate browser fingerprint for visitor identification
   */
  private generateBrowserFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let fingerprint = '';

    // Collect browser characteristics
    const data = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
    ].join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    fingerprint = Math.abs(hash).toString(36);
    return fingerprint;
  }

  /**
   * Get stored session token from multiple sources
   */
  private getStoredSessionToken(): string | null {
    const key = `chatdesk_session_${this.config.widgetKey}`;

    // Try cookie first (most persistent), then localStorage, then sessionStorage
    return this.getCookie(key) ||
           localStorage.getItem(key) ||
           sessionStorage.getItem(key);
  }

  /**
   * Store session token in multiple locations
   */
  private storeSessionToken(sessionToken: string): void {
    const key = `chatdesk_session_${this.config.widgetKey}`;

    // Store in cookie (30 days)
    this.setCookie(key, sessionToken, 30);

    // Store in localStorage (backup)
    try {
      localStorage.setItem(key, sessionToken);
    } catch (e) {
      console.warn('[ChatDesk] localStorage not available:', e);
    }

    // Store in sessionStorage (current tab)
    try {
      sessionStorage.setItem(key, sessionToken);
    } catch (e) {
      console.warn('[ChatDesk] sessionStorage not available:', e);
    }
  }

  /**
   * Clear stored session token from all locations
   */
  private clearSessionToken(): void {
    const key = `chatdesk_session_${this.config.widgetKey}`;

    // Clear from cookie
    this.deleteCookie(key);

    // Clear from localStorage
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }

    // Clear from sessionStorage
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Set a cookie
   */
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = cookie;
  }

  /**
   * Get a cookie value
   */
  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1, cookie.length);
      }
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
      }
    }

    return null;
  }

  /**
   * Delete a cookie
   */
  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }

  /**
   * Restore an existing conversation
   */
  private async restoreConversation(conversationId: string): Promise<void> {
    try {
      console.log('[ChatDesk] Restoring conversation:', conversationId);

      // Fetch conversation details
      const response = await fetch(
        `${this.config.apiUrl}/api/widget/conversations/${conversationId}`,
        {
          headers: {
            'X-Session-Token': this.session!.sessionToken,
          },
        }
      );

      if (!response.ok) {
        console.error('[ChatDesk] Failed to restore conversation');
        return;
      }

      const data = await response.json();
      this.conversation = data.conversation;

      console.log('[ChatDesk] Conversation restored:', this.conversation);

      // Load messages
      await this.loadMessages();

      // Subscribe to realtime updates
      this.subscribeToMessages();

      // Render the chat view (show messages)
      this.renderChatView();
    } catch (error) {
      console.error('[ChatDesk] Failed to restore conversation:', error);
    }
  }

  /**
   * Render chat view after restoring conversation
   */
  private renderChatView(): void {
    if (!this.chatWindow) return;

    // Find the main content area
    const contentArea = this.chatWindow.querySelector('#chatdesk-content');
    if (!contentArea) return;

    // Show the chat interface
    contentArea.innerHTML = `
      <div id="chatdesk-messages" style="
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background-color: #f9fafb;
      "></div>
      <div style="
        padding: 16px;
        background-color: white;
        border-top: 1px solid #e5e7eb;
      ">
        <div style="display: flex; gap: 8px;">
          <input
            type="text"
            id="chatdesk-input"
            placeholder="Type your message..."
            style="
              flex: 1;
              padding: 10px 14px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              outline: none;
            "
          />
          <button
            id="chatdesk-send"
            style="
              padding: 10px 20px;
              background-color: ${this.session!.config.primaryColor};
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
            "
          >
            Send
          </button>
        </div>
      </div>
    `;

    // Attach event listeners
    const input = this.chatWindow.querySelector('#chatdesk-input') as HTMLInputElement;
    const sendButton = this.chatWindow.querySelector('#chatdesk-send') as HTMLButtonElement;

    if (sendButton) {
      sendButton.addEventListener('click', () => this.sendMessage());
    }

    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.sendMessage();
        }
      });
    }

    // Render messages
    this.renderMessages();
  }

  /**
   * Load departments from API
   */
  private async loadDepartments() {
    if (!this.session) return;

    try {
      console.log('[ChatDesk] Loading departments from:', `${this.config.apiUrl}/api/widget/departments`);
      const response = await fetch(`${this.config.apiUrl}/api/widget/departments`, {
        headers: {
          'X-Session-Token': this.session.sessionToken,
        },
      });

      console.log('[ChatDesk] Departments response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[ChatDesk] Departments data:', data);
        this.departments = data.departments || [];
        console.log('[ChatDesk] Loaded departments:', this.departments.length);

        // Re-render departments after loading
        this.renderDepartments();
      } else {
        console.error('[ChatDesk] Failed to load departments - status:', response.status);
      }
    } catch (error) {
      console.error('[ChatDesk] Failed to load departments:', error);
    }
  }

  /**
   * Create widget DOM elements
   */
  private createWidget() {
    if (!this.session) return;

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'chatdesk-widget';
    this.container.style.cssText = `
      position: fixed;
      ${this.session.config.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
      bottom: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;

    // Create chat bubble
    this.createBubble();

    // Create chat window
    this.createChatWindow();

    // Append to body
    document.body.appendChild(this.container);
  }

  /**
   * Create chat bubble (floating button)
   */
  private createBubble() {
    if (!this.container || !this.session) return;

    this.bubble = document.createElement('div');
    this.bubble.style.cssText = `
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background-color: ${this.session.config.primaryColor};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-center;
      transition: transform 0.2s, box-shadow 0.2s;
    `;

    this.bubble.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;

    this.bubble.addEventListener('click', () => this.toggle());
    this.bubble.addEventListener('mouseenter', () => {
      this.bubble!.style.transform = 'scale(1.05)';
      this.bubble!.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
    });
    this.bubble.addEventListener('mouseleave', () => {
      this.bubble!.style.transform = 'scale(1)';
      this.bubble!.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    this.container.appendChild(this.bubble);
  }

  /**
   * Create chat window
   */
  private createChatWindow() {
    if (!this.container || !this.session) return;

    this.chatWindow = document.createElement('div');
    this.chatWindow.style.cssText = `
      position: absolute;
      bottom: 80px;
      ${this.session.config.position === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
      width: 380px;
      height: 600px;
      max-height: calc(100vh - 120px);
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
    `;

    this.chatWindow.innerHTML = `
      <div id="chatdesk-header" style="
        background-color: ${this.session.config.primaryColor};
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div>
          <div style="font-weight: 600; font-size: 16px;">${this.session.config.widgetTitle}</div>
          <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">We typically reply in a few minutes</div>
        </div>
        <button id="chatdesk-close" style="
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div id="chatdesk-content" style="
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f9fafb;
      ">
        <div id="chatdesk-welcome" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 8px;">
            ${this.session.config.greetingMessage}
          </div>
          <div style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">
            Choose a department to start chatting
          </div>
          <div id="chatdesk-departments"></div>
        </div>
        <div id="chatdesk-messages" style="display: none;"></div>
      </div>

      <div id="chatdesk-input-container" style="
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        background: white;
        display: none;
      ">
        <div style="display: flex; gap: 8px;">
          <input
            id="chatdesk-input"
            type="text"
            placeholder="Type your message..."
            style="
              flex: 1;
              padding: 10px 14px;
              border: 1px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              outline: none;
            "
          />
          <button id="chatdesk-send" style="
            background-color: ${this.session.config.primaryColor};
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 16px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
          ">
            Send
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const closeBtn = this.chatWindow.querySelector('#chatdesk-close');
    closeBtn?.addEventListener('click', () => this.close());

    const sendBtn = this.chatWindow.querySelector('#chatdesk-send');
    const input = this.chatWindow.querySelector('#chatdesk-input') as HTMLInputElement;

    sendBtn?.addEventListener('click', () => this.sendMessage());
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Render departments
    this.renderDepartments();

    this.container.appendChild(this.chatWindow);
  }

  /**
   * Render department selection
   */
  private renderDepartments() {
    console.log('[ChatDesk] Rendering departments, count:', this.departments.length);
    const container = this.chatWindow?.querySelector('#chatdesk-departments');
    if (!container) {
      console.log('[ChatDesk] Department container not found');
      return;
    }

    if (this.departments.length === 0) {
      console.log('[ChatDesk] No departments to display');
      container.innerHTML = '<div style="color: #6b7280; font-size: 14px;">No departments available</div>';
      return;
    }

    console.log('[ChatDesk] Rendering', this.departments.length, 'departments');

    container.innerHTML = this.departments.map(dept => `
      <button
        class="chatdesk-dept-btn"
        data-dept-id="${dept.id}"
        style="
          width: 100%;
          padding: 12px 16px;
          margin-bottom: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        "
      >
        <div style="font-weight: 500; color: #111827; margin-bottom: 4px;">${dept.name}</div>
        ${dept.description ? `<div style="font-size: 12px; color: #6b7280;">${dept.description}</div>` : ''}
      </button>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.chatdesk-dept-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const deptId = (e.currentTarget as HTMLElement).dataset.deptId;
        if (deptId) {
          const department = this.departments.find(d => d.id === deptId);
          // Check if department has pre-chat form
          if (department?.pre_chat_form && Array.isArray(department.pre_chat_form) && department.pre_chat_form.length > 0) {
            this.showPreChatForm(department);
          } else {
            this.startConversation(deptId);
          }
        }
      });

      btn.addEventListener('mouseenter', (e) => {
        (e.currentTarget as HTMLElement).style.borderColor = this.session!.config.primaryColor;
        (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb';
      });

      btn.addEventListener('mouseleave', (e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
        (e.currentTarget as HTMLElement).style.backgroundColor = 'white';
      });
    });
  }

  /**
   * Show pre-chat form for department
   */
  private showPreChatForm(department: Department) {
    const container = this.chatWindow?.querySelector('#chatdesk-departments');
    if (!container) return;

    const fields = department.pre_chat_form || [];

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <button id="chatdesk-back-btn" style="
          background: none;
          border: none;
          color: ${this.session!.config.primaryColor};
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          margin-bottom: 12px;
        ">← Back to departments</button>
        <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 8px;">
          ${department.name}
        </h3>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 16px;">
          Please fill out the form below to start chatting
        </p>
      </div>
      <form id="chatdesk-prechat-form" style="display: flex; flex-direction: column; gap: 12px;">
        ${fields.map((field: any, index: number) => `
          <div>
            <label style="display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 4px;">
              ${field.label}${field.required ? ' *' : ''}
            </label>
            ${this.renderFormField(field, index)}
          </div>
        `).join('')}
        <button type="submit" style="
          width: 100%;
          padding: 12px;
          background-color: ${this.session!.config.primaryColor};
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 8px;
        ">Start Chat</button>
      </form>
    `;

    // Back button handler
    const backBtn = container.querySelector('#chatdesk-back-btn');
    backBtn?.addEventListener('click', () => {
      this.renderDepartments();
    });

    // Form submit handler
    const form = container.querySelector('#chatdesk-prechat-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Collect form data
      const formData: any = {};
      fields.forEach((field: any, index: number) => {
        const input = form.querySelector(`[name="field_${index}"]`) as HTMLInputElement;
        if (input) {
          formData[`field_${index}`] = input.value;
        }
      });

      // Start conversation with pre-chat data
      await this.startConversation(department.id, formData);
    });
  }

  /**
   * Render a form field based on type
   */
  private renderFormField(field: any, index: number): string {
    const baseStyle = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
    `;

    switch (field.type) {
      case 'textarea':
        return `<textarea name="field_${index}" ${field.required ? 'required' : ''}
                  placeholder="${field.placeholder || ''}"
                  style="${baseStyle} min-height: 80px; resize: vertical;"></textarea>`;

      case 'select':
        return `<select name="field_${index}" ${field.required ? 'required' : ''} style="${baseStyle}">
                  <option value="">Select...</option>
                  ${(field.options || []).map((opt: string) => `<option value="${opt}">${opt}</option>`).join('')}
                </select>`;

      case 'checkbox':
        return `<label style="display: flex; align-items: center; gap: 8px;">
                  <input type="checkbox" name="field_${index}" ${field.required ? 'required' : ''}
                    style="width: 16px; height: 16px;">
                  <span style="font-size: 14px; color: #6b7280;">${field.placeholder || 'I agree'}</span>
                </label>`;

      default:
        return `<input type="${field.type || 'text'}" name="field_${index}"
                  ${field.required ? 'required' : ''}
                  placeholder="${field.placeholder || ''}"
                  style="${baseStyle}">`;
    }
  }

  /**
   * Start a conversation with a department
   */
  private async startConversation(departmentId: string, preChatData?: any) {
    if (!this.session) return;

    try {
      const response = await fetch(`${this.config.apiUrl}/api/widget/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': this.session.sessionToken,
        },
        body: JSON.stringify({
          sessionToken: this.session.sessionToken,
          departmentId,
          customerData: this.config.userData,
          preChatData: preChatData || {},
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      const data = await response.json();
      this.conversation = data.conversation;

      // Hide welcome, show chat
      const welcome = this.chatWindow?.querySelector('#chatdesk-welcome');
      const messages = this.chatWindow?.querySelector('#chatdesk-messages');
      const inputContainer = this.chatWindow?.querySelector('#chatdesk-input-container');

      if (welcome) (welcome as HTMLElement).style.display = 'none';
      if (messages) (messages as HTMLElement).style.display = 'block';
      if (inputContainer) (inputContainer as HTMLElement).style.display = 'block';

      // Load messages
      await this.loadMessages();

      // Subscribe to realtime updates
      this.subscribeToMessages();

      this.emit('conversation_started', this.conversation);
    } catch (error) {
      console.error('[ChatDesk] Failed to start conversation:', error);
      this.emit('error', error);
    }
  }

  /**
   * Load messages for current conversation
   */
  private async loadMessages() {
    if (!this.session || !this.conversation) return;

    try {
      const response = await fetch(
        `${this.config.apiUrl}/api/widget/conversations/${this.conversation.id}/messages`,
        {
          headers: {
            'X-Session-Token': this.session.sessionToken,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        this.messages = data.messages || [];
        this.renderMessages();
      }
    } catch (error) {
      console.error('[ChatDesk] Failed to load messages:', error);
    }
  }

  /**
   * Render messages in chat window
   */
  private renderMessages() {
    const container = this.chatWindow?.querySelector('#chatdesk-messages');
    if (!container) return;

    if (this.messages.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: #6b7280; font-size: 14px;">
          No messages yet. Start the conversation!
        </div>
      `;
      return;
    }

    container.innerHTML = this.messages.map(msg => {
      const isCustomer = msg.sender?.role === 'customer';
      return `
        <div style="
          display: flex;
          margin-bottom: 16px;
          ${isCustomer ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
        ">
          <div style="
            max-width: 70%;
            padding: 10px 14px;
            border-radius: 12px;
            ${isCustomer
              ? `background-color: ${this.session!.config.primaryColor}; color: white;`
              : 'background-color: white; color: #111827; border: 1px solid #e5e7eb;'
            }
          ">
            ${!isCustomer && this.session!.config.showAgentAvatars ? `
              <div style="font-size: 12px; font-weight: 500; margin-bottom: 4px; opacity: 0.8;">
                ${msg.sender?.full_name || 'Agent'}
              </div>
            ` : ''}
            <div style="font-size: 14px; line-height: 1.5;">${this.escapeHtml(msg.content)}</div>
            <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">
              ${this.formatTime(msg.created_at)}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Send a message
   */
  private async sendMessage() {
    if (!this.session || !this.conversation) return;

    const input = this.chatWindow?.querySelector('#chatdesk-input') as HTMLInputElement;
    const content = input?.value.trim();

    if (!content) return;

    try {
      // Clear input immediately
      input.value = '';

      const response = await fetch(
        `${this.config.apiUrl}/api/widget/conversations/${this.conversation.id}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': this.session.sessionToken,
          },
          body: JSON.stringify({
            content,
            messageType: 'text',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Message will be added via realtime subscription
      // But add it immediately for better UX
      this.messages.push(data.message);
      this.renderMessages();

      this.emit('message_sent', data.message);
    } catch (error) {
      console.error('[ChatDesk] Failed to send message:', error);
      this.emit('error', error);
      // Restore input value on error
      input.value = content;
    }
  }

  /**
   * Subscribe to realtime message updates
   */
  private subscribeToMessages() {
    if (!this.supabase || !this.conversation) return;

    this.realtimeChannel = this.supabase
      .channel(`conversation:${this.conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${this.conversation.id}`,
        },
        (payload: any) => {
          // Only add if not already in messages (avoid duplicates)
          if (!this.messages.find(m => m.id === payload.new.id)) {
            this.messages.push(payload.new);
            this.renderMessages();

            // Play notification sound if enabled and message is from agent
            if (this.session?.config.playNotificationSound && payload.new.sender?.role !== 'customer') {
              this.playNotificationSound();
            }

            this.emit('message_received', payload.new);
          }
        }
      )
      .subscribe();
  }

  /**
   * Open chat window
   */
  open() {
    if (!this.chatWindow || !this.bubble) return;

    this.chatWindow.style.display = 'flex';
    this.bubble.style.display = 'none';
    this.isOpen = true;
    this.isMinimized = false;

    this.emit('opened');
  }

  /**
   * Close chat window
   */
  close() {
    if (!this.chatWindow || !this.bubble) return;

    this.chatWindow.style.display = 'none';
    this.bubble.style.display = 'flex';
    this.isOpen = false;
    this.isMinimized = true;

    this.emit('closed');
  }

  /**
   * Toggle chat window
   */
  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Identify user
   */
  identify(userData: any) {
    this.config.userData = { ...this.config.userData, ...userData };
    this.emit('identified', userData);
  }

  /**
   * Track custom event
   */
  track(eventName: string, eventData?: any) {
    this.emit('tracked', { eventName, eventData });
  }

  /**
   * Register event callback
   */
  on(event: string, callback: Function) {
    if (!this.eventCallbacks[event]) {
      this.eventCallbacks[event] = [];
    }
    this.eventCallbacks[event].push(callback);
  }

  /**
   * Emit event
   */
  private emit(event: string, data?: any) {
    if (this.eventCallbacks[event]) {
      this.eventCallbacks[event].forEach(callback => callback(data));
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound() {
    // Simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      // Ignore audio errors
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format timestamp
   */
  private formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  /**
   * Destroy widget
   */
  destroy() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }
    if (this.container) {
      this.container.remove();
    }
    this.emit('destroyed');
  }
}

