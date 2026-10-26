// ==============================================================================
// Cross-Device & Cross-Browser Real-Time State Synchronization Service
// Confeitaria Dolce Felicitá
// Syncs Orders, Products, Categories, Stock, and Accounts across ANY device/browser
// ==============================================================================

import type { 
  Product, 
  Category, 
  ProductAddon, 
  Order, 
  StoreSettings, 
  Customer, 
  User, 
  Address, 
  OrderStatus 
} from '../types';

export type SyncEventType = 
  | 'ORDERS_UPDATED'
  | 'PRODUCTS_UPDATED'
  | 'CATEGORIES_UPDATED'
  | 'ADDONS_UPDATED'
  | 'STORE_SETTINGS_UPDATED'
  | 'CUSTOMERS_UPDATED'
  | 'REVENUE_RESET_UPDATED'
  | 'CONNECTED';

export interface SyncPayload {
  type: SyncEventType;
  data: any;
  timestamp: number;
  sourceTabId?: string;
}

type SyncCallback = (payload: SyncPayload) => void;
const listeners: Set<SyncCallback> = new Set();

const TAB_ID = 'tab_' + Math.random().toString(36).substring(2, 9);
let eventSource: EventSource | null = null;
let broadcastChannel: BroadcastChannel | null = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('felicita_realtime_broadcast');
    broadcastChannel.onmessage = (event) => {
      const payload: SyncPayload = event.data;
      if (payload && payload.sourceTabId !== TAB_ID) {
        listeners.forEach(cb => {
          try { cb(payload); } catch (e) {}
        });
      }
    };
  }
} catch (e) {}

// Subscribe to state updates
export function subscribeToSync(callback: SyncCallback): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// Notify all listeners locally and across tabs
function notifyListeners(payload: SyncPayload) {
  listeners.forEach(cb => {
    try {
      cb(payload);
    } catch (err) {
      console.error('Error in sync callback:', err);
    }
  });

  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch (e) {}
  }
}

// Local broadcast
export function broadcastSync(type: SyncEventType, data: any) {
  notifyListeners({
    type,
    data,
    timestamp: Date.now(),
    sourceTabId: TAB_ID
  });
}

// Initialize Server-Sent Events (SSE) connection
export function initSSEConnection(onFullStateRefresh?: (state: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  function connect() {
    try {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource('/api/sync/events');

      eventSource.onmessage = (event) => {
        try {
          const payload: SyncPayload = JSON.parse(event.data);
          if (payload && payload.type) {
            notifyListeners(payload);
          }
        } catch (e) {}
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };
    } catch (e) {
      setTimeout(connect, 3000);
    }
  }

  connect();

  // Background polling fallback (every 3.5 seconds) for mobile wakeups or unstable connections
  let lastSyncTime = 0;
  const pollInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.lastUpdated && json.lastUpdated > lastSyncTime) {
          lastSyncTime = json.lastUpdated;
          if (onFullStateRefresh) {
            onFullStateRefresh(json);
          }
        }
      }
    } catch (e) {}
  }, 3500);

  return () => {
    clearInterval(pollInterval);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

// ==============================================================================
// HTTP API Client for Server Authoritative Actions
// Dual-Mode Auth: Supports HttpOnly Cookies + Authorization: Bearer <sessionId>
// ==============================================================================

const TOKEN_KEY = 'felicita_auth_token';

export function getAuthToken(): string | null {
  try {
    // Check sessionStorage first for per-tab / per-window instance isolation
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const sessionVal = sessionStorage.getItem(TOKEN_KEY);
      if (sessionVal && sessionVal.trim()) {
        return sessionVal.trim();
      }
    }
    // Fallback to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const localVal = localStorage.getItem(TOKEN_KEY);
      if (localVal && localVal.trim()) {
        return localVal.trim();
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (typeof window === 'undefined') return;
    if (token && token.trim()) {
      sessionStorage.setItem(TOKEN_KEY, token.trim());
      localStorage.setItem(TOKEN_KEY, token.trim());
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {}
}

function getAuthHeaders(extraHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Session-ID'] = token;
  }
  return headers;
}

export const api = {
  async getState() {
    const res = await fetch('/api/state', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    const data = await res.json();
    if (data && data.success && data.token) {
      setAuthToken(data.token);
    } else if (data && !data.success) {
      setAuthToken(null);
    }
    return data;
  },

  async login(email: string, password?: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data && data.success && data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async register(data: { name: string; email: string; password?: string; phone?: string; address?: Address }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(data)
    });
    const dataRes = await res.json();
    if (dataRes && dataRes.success && dataRes.token) {
      setAuthToken(dataRes.token);
    }
    return dataRes;
  },

  async logout() {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include'
      });
      return await res.json();
    } finally {
      setAuthToken(null);
    }
  },

  async getCustomerProfile(email: string) {
    const res = await fetch(`/api/customers/profile?email=${encodeURIComponent(email)}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  async createOrder(order: Order) {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ order })
    });
    return res.json();
  },

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async updateOrderCourier(orderId: string, courierName: string, courierPhone: string) {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/courier`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ courierName, courierPhone })
    });
    return res.json();
  },

  async deleteOrder(orderId: string) {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  async clearAllOrders() {
    const res = await fetch('/api/orders', {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  async addProduct(product: Product) {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(product)
    });
    return res.json();
  },

  async updateProduct(product: Product) {
    const res = await fetch(`/api/products/${encodeURIComponent(product.id)}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(product)
    });
    return res.json();
  },

  async deleteProduct(productId: string) {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  async setProductStock(productId: string, quantity?: number, delta?: number) {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}/stock`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ quantity, delta })
    });
    return res.json();
  },

  async addCategory(category: Category) {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(category)
    });
    return res.json();
  },

  async deleteCategory(categoryId: string) {
    const res = await fetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  async addAddon(addon: ProductAddon) {
    const res = await fetch('/api/addons', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(addon)
    });
    return res.json();
  },

  async deleteAddon(addonId: string) {
    const res = await fetch(`/api/addons/${encodeURIComponent(addonId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return res.json();
  },

  async updateStoreSettings(settings: StoreSettings) {
    const res = await fetch('/api/store-settings', {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  async setRevenueReset(isRevenueReset: boolean) {
    const res = await fetch('/api/revenue/reset', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      credentials: 'include',
      body: JSON.stringify({ isRevenueReset })
    });
    return res.json();
  },

  async deleteCustomer(customerId: string) {
    const res = await fetch(`/api/customers/${encodeURIComponent(customerId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    return res.json();
  }
};
