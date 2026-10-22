// ==============================================================================
// Cross-Tab & Cross-Session Real-Time Synchronization Service
// Confeitaria Dolce Felicitá
// Syncs Orders, Catalog, Statuses, and Settings in Real Time across all tabs/windows
// ==============================================================================

export type SyncEventType = 
  | 'ORDERS_UPDATED'
  | 'PRODUCTS_UPDATED'
  | 'CATEGORIES_UPDATED'
  | 'ADDONS_UPDATED'
  | 'STORE_SETTINGS_UPDATED'
  | 'CUSTOMERS_UPDATED';

export interface SyncPayload {
  type: SyncEventType;
  data: any;
  timestamp: number;
  sourceTabId: string;
}

const CHANNEL_NAME = 'felicita_realtime_broadcast';
const TAB_ID = 'tab_' + Math.random().toString(36).substring(2, 9);

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this context, using storage fallback.');
}

type SyncCallback = (payload: SyncPayload) => void;
const listeners: Set<SyncCallback> = new Set();

// Register listener
export function subscribeToSync(callback: SyncCallback): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// Broadcast an event to other tabs
export function broadcastSync(type: SyncEventType, data: any) {
  const payload: SyncPayload = {
    type,
    data,
    timestamp: Date.now(),
    sourceTabId: TAB_ID
  };

  // 1. BroadcastChannel (Instant, sub-millisecond)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (e) {}
  }

  // 2. Storage event trigger via custom ping key
  try {
    localStorage.setItem('felicita_sync_ping', JSON.stringify({
      type,
      timestamp: Date.now(),
      tabId: TAB_ID
    }));
  } catch (e) {}
}

// Global listener for incoming broadcasts
if (typeof window !== 'undefined') {
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      const payload: SyncPayload = event.data;
      if (payload && payload.sourceTabId !== TAB_ID) {
        listeners.forEach(cb => {
          try {
            cb(payload);
          } catch (err) {
            console.error('Error in sync listener callback:', err);
          }
        });
      }
    };
  }

  // Storage event listener fallback (when BroadcastChannel is not supported or cross-window)
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === 'felicita_sync_ping' && e.newValue) {
      try {
        const ping = JSON.parse(e.newValue);
        if (ping.tabId !== TAB_ID) {
          // Read updated data from localStorage for the specific entity
          let updatedData = null;
          if (ping.type === 'ORDERS_UPDATED') {
            const raw = localStorage.getItem('felicita_orders_list');
            if (raw) updatedData = JSON.parse(raw);
          } else if (ping.type === 'PRODUCTS_UPDATED') {
            const raw = localStorage.getItem('felicita_products_list');
            if (raw) updatedData = JSON.parse(raw);
          } else if (ping.type === 'CATEGORIES_UPDATED') {
            const raw = localStorage.getItem('felicita_categories_list');
            if (raw) updatedData = JSON.parse(raw);
          } else if (ping.type === 'ADDONS_UPDATED') {
            const raw = localStorage.getItem('felicita_addons_list');
            if (raw) updatedData = JSON.parse(raw);
          } else if (ping.type === 'STORE_SETTINGS_UPDATED') {
            const raw = localStorage.getItem('felicita_store_settings');
            if (raw) updatedData = JSON.parse(raw);
          } else if (ping.type === 'CUSTOMERS_UPDATED') {
            const raw = localStorage.getItem('felicita_customers_list');
            if (raw) updatedData = JSON.parse(raw);
          }

          if (updatedData !== null) {
            listeners.forEach(cb => {
              try {
                cb({
                  type: ping.type,
                  data: updatedData,
                  timestamp: ping.timestamp,
                  sourceTabId: ping.tabId
                });
              } catch (err) {}
            });
          }
        }
      } catch (err) {}
    }
  });
}
