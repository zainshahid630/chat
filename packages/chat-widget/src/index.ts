/**
 * ChatDesk Widget
 * Embeddable chat widget for customer support
 */

import { ChatWidget } from './widget';
import type { WidgetConfig } from './types';

// Global queue for commands before widget is initialized
interface ChatDeskGlobal {
  q?: any[][];
  widget?: ChatWidget;
}

declare global {
  interface Window {
    chatdesk: ((command: string, ...args: any[]) => void) & ChatDeskGlobal;
  }
}

// Initialize the global chatdesk function
(function() {
  const chatdesk = window.chatdesk || function(...args: any[]) {
    (chatdesk.q = chatdesk.q || []).push(args);
  };

  chatdesk.q = chatdesk.q || [];
  window.chatdesk = chatdesk as any;

  // Process queued commands
  function processQueue() {
    if (!chatdesk.q) return;

    while (chatdesk.q.length > 0) {
      const args = chatdesk.q.shift();
      if (args) {
        const [command, ...params] = args;
        executeCommand(command, ...params);
      }
    }
  }

  // Execute a command
  function executeCommand(command: string, ...args: any[]) {
    switch (command) {
      case 'init':
        const config = args[0] as WidgetConfig;
        if (!chatdesk.widget) {
          chatdesk.widget = new ChatWidget(config);
          chatdesk.widget.init();
        }
        break;

      case 'open':
        chatdesk.widget?.open();
        break;

      case 'close':
        chatdesk.widget?.close();
        break;

      case 'toggle':
        chatdesk.widget?.toggle();
        break;

      case 'identify':
        const userData = args[0];
        chatdesk.widget?.identify(userData);
        break;

      case 'track':
        const eventName = args[0];
        const eventData = args[1];
        chatdesk.widget?.track(eventName, eventData);
        break;

      case 'on':
        const event = args[0];
        const callback = args[1];
        chatdesk.widget?.on(event, callback);
        break;

      default:
        console.warn(`[ChatDesk] Unknown command: ${command}`);
    }
  }

  // Override chatdesk function to execute commands immediately
  window.chatdesk = function(command: string, ...args: any[]) {
    executeCommand(command, ...args);
  } as any;

  window.chatdesk.q = chatdesk.q;
  window.chatdesk.widget = chatdesk.widget;

  // Process any queued commands
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processQueue);
  } else {
    processQueue();
  }
})();

export { ChatWidget };
export type { WidgetConfig };

