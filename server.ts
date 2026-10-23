import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  DEFAULT_ADDRESS, 
  INITIAL_ORDERS, 
  DEFAULT_STORE_SETTINGS, 
  INITIAL_CUSTOMERS, 
  INITIAL_GLOBAL_ADDONS 
} from './src/data/initialData';
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
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DB_DIR = path.join(__dirname, 'database');
const DB_FILE = path.join(DB_DIR, 'store.json');

// Interface for server database state
interface StoreState {
  products: Product[];
  categories: Category[];
  addons: ProductAddon[];
  storeSettings: StoreSettings;
  customers: Customer[];
  orders: Order[];
  users: Array<User & { password?: string; address?: Address }>;
  isRevenueReset: boolean;
  lastUpdated: number;
}

// Initial store state template
function createDefaultStore(): StoreState {
  const initialUsers: Array<User & { password?: string; address?: Address }> = [
    {
      id: 'usr-admin-master',
      name: 'Administrador Felicitá',
      email: 'admin@felicitadoces.com.br',
      phone: '(11) 98765-4321',
      role: 'admin',
      password: 'admin',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr-mariana-01',
      name: 'Mariana Vasconcellos',
      email: 'mariana.vasconcellos@exemplo.com',
      phone: '(11) 98765-4321',
      role: 'customer',
      password: '123',
      address: DEFAULT_ADDRESS,
      createdAt: '2024-01-15T10:00:00Z'
    }
  ];

  return {
    products: INITIAL_PRODUCTS,
    categories: INITIAL_CATEGORIES,
    addons: INITIAL_GLOBAL_ADDONS,
    storeSettings: DEFAULT_STORE_SETTINGS,
    customers: INITIAL_CUSTOMERS,
    orders: INITIAL_ORDERS,
    users: initialUsers,
    isRevenueReset: false,
    lastUpdated: Date.now()
  };
}

// Load store from disk or initialize
function loadStore(): StoreState {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.products) && Array.isArray(parsed.orders)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading store.json, generating defaults:', err);
  }

  const defaultStore = createDefaultStore();
  saveStore(defaultStore);
  return defaultStore;
}

// In-memory active store
let store: StoreState = loadStore();

// Safe atomic file persist
function saveStore(data: StoreState) {
  try {
    data.lastUpdated = Date.now();
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing store.json:', err);
  }
}

// SSE Clients for cross-device, cross-browser real-time broadcast
const sseClients = new Set<Response>();

function broadcast(type: string, data: any) {
  const payload = JSON.stringify({
    type,
    data,
    timestamp: Date.now()
  });

  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// Heartbeat ping every 15s to keep connections alive on mobile
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 15000);

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // ============================================================================
  // SSE REAL-TIME SYNC ENDPOINT
  // ============================================================================
  app.get('/api/sync/events', (req: Request, res: Response) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: { lastUpdated: store.lastUpdated }, timestamp: Date.now() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // ============================================================================
  // FULL APPLICATION STATE (Cross-Device Sync)
  // ============================================================================
  app.get('/api/state', (_req: Request, res: Response) => {
    res.json({
      success: true,
      products: store.products,
      categories: store.categories,
      addons: store.addons,
      storeSettings: store.storeSettings,
      customers: store.customers,
      orders: store.orders,
      isRevenueReset: store.isRevenueReset,
      lastUpdated: store.lastUpdated
    });
  });

  // ============================================================================
  // AUTHENTICATION & MULTI-DEVICE ACCOUNT SYNC
  // ============================================================================
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Email obrigatório' });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const ADMIN_EMAILS = [
      'admin@felicitadoces.com.br',
      'admin@lucycandy.com',
      'admin@admin.com'
    ];
    const ADMIN_PASSWORDS = ['admin', 'admin123', 'admin2024', '123456'];

    // 1. Admin login check
    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail) || normalizedEmail.startsWith('admin@');
    if (isAdmin) {
      if (password && !ADMIN_PASSWORDS.includes(password)) {
        res.status(401).json({ success: false, message: 'Senha de administrador incorreta.' });
        return;
      }
      const adminUser: User = {
        id: 'usr-admin-master',
        name: 'Administrador Felicitá',
        email: normalizedEmail,
        phone: '(11) 98765-4321',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      res.json({ success: true, user: adminUser });
      return;
    }

    // 2. Customer login check
    let userRecord = store.users.find(u => u.email.toLowerCase() === normalizedEmail);
    let customerRecord = store.customers.find(c => c.email.toLowerCase() === normalizedEmail);

    // If customer exists but no user record yet, synthesize user record
    if (!userRecord && customerRecord) {
      userRecord = {
        id: customerRecord.id,
        name: customerRecord.name,
        email: customerRecord.email,
        phone: customerRecord.phone,
        role: 'customer',
        createdAt: customerRecord.createdAt || new Date().toISOString(),
        address: customerRecord.address
      };
      store.users.push(userRecord);
      saveStore(store);
    }

    // If user does not exist at all, auto-create a profile so login works seamlessly anywhere
    if (!userRecord) {
      const generatedName = normalizedEmail.split('@')[0]
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const newId = 'cust-' + Date.now();
      const defaultUser: User = {
        id: newId,
        name: generatedName || 'Cliente Felicitá',
        email: normalizedEmail,
        phone: '(11) 99999-0000',
        role: 'customer',
        createdAt: new Date().toISOString()
      };

      const newCustomer: Customer = {
        id: newId,
        name: defaultUser.name,
        email: normalizedEmail,
        phone: defaultUser.phone || '',
        city: 'São Paulo - SP',
        address: DEFAULT_ADDRESS,
        ordersCount: 0,
        totalSpent: 0,
        isActive: true,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };

      store.users.push({ ...defaultUser, password: password || '', address: DEFAULT_ADDRESS });
      store.customers.push(newCustomer);
      saveStore(store);

      broadcast('CUSTOMERS_UPDATED', store.customers);

      res.json({
        success: true,
        user: defaultUser,
        customer: newCustomer,
        address: DEFAULT_ADDRESS
      });
      return;
    }

    const resolvedAddress = customerRecord?.address || userRecord.address || DEFAULT_ADDRESS;
    const publicUser: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role,
      createdAt: userRecord.createdAt
    };

    res.json({
      success: true,
      user: publicUser,
      customer: customerRecord || null,
      address: resolvedAddress
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, password, phone, address } = req.body;
    if (!email || !name) {
      res.status(400).json({ success: false, message: 'Nome e email são obrigatórios' });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const custId = 'cust-' + Date.now();

    const newAddress: Address = address || {
      id: 'addr-' + Date.now(),
      title: 'Endereço Principal',
      postalCode: '01310-100',
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      isDefault: true
    };

    const newCust: Customer = {
      id: custId,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : '(11) 99999-0000',
      city: `${newAddress.neighborhood ? `${newAddress.neighborhood} • ` : ''}${newAddress.city || 'São Paulo'}`,
      address: newAddress,
      ordersCount: 0,
      totalSpent: 0,
      isActive: true,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    const newUser: User = {
      id: custId,
      name: newCust.name,
      email: normalizedEmail,
      phone: newCust.phone,
      role: 'customer',
      createdAt: new Date().toISOString()
    };

    // Update or insert into store.users
    const existingUserIndex = store.users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    if (existingUserIndex >= 0) {
      store.users[existingUserIndex] = {
        ...store.users[existingUserIndex],
        name: newUser.name,
        phone: newUser.phone,
        password: password || store.users[existingUserIndex].password,
        address: newAddress
      };
    } else {
      store.users.push({ ...newUser, password, address: newAddress });
    }

    // Update or insert into store.customers
    const existingCustIndex = store.customers.findIndex(c => c.email.toLowerCase() === normalizedEmail);
    if (existingCustIndex >= 0) {
      store.customers[existingCustIndex] = {
        ...store.customers[existingCustIndex],
        name: newCust.name,
        phone: newCust.phone,
        city: newCust.city,
        address: newAddress
      };
    } else {
      store.customers.unshift(newCust);
    }

    saveStore(store);
    broadcast('CUSTOMERS_UPDATED', store.customers);

    res.json({
      success: true,
      user: newUser,
      customer: newCust,
      address: newAddress
    });
  });

  // Get customer profile by email
  app.get('/api/customers/profile', (req: Request, res: Response) => {
    const email = req.query.email ? String(req.query.email).toLowerCase().trim() : '';
    if (!email) {
      res.status(400).json({ success: false, message: 'Email query parameter required' });
      return;
    }
    const customer = store.customers.find(c => c.email.toLowerCase() === email);
    const user = store.users.find(u => u.email.toLowerCase() === email);
    if (customer || user) {
      res.json({
        success: true,
        customer,
        user,
        address: customer?.address || user?.address || DEFAULT_ADDRESS
      });
    } else {
      res.status(404).json({ success: false, message: 'Perfil não encontrado' });
    }
  });

  // ============================================================================
  // ORDERS API
  // ============================================================================
  app.post('/api/orders', (req: Request, res: Response) => {
    const { order } = req.body;
    if (!order || !order.id) {
      res.status(400).json({ success: false, message: 'Dados do pedido inválidos' });
      return;
    }

    // Add to orders list at beginning
    store.orders = [order, ...store.orders];

    // Update customer stats if email is present
    if (order.customerEmail) {
      const email = String(order.customerEmail).toLowerCase().trim();
      const custIndex = store.customers.findIndex(c => c.email.toLowerCase() === email);
      if (custIndex >= 0) {
        store.customers[custIndex] = {
          ...store.customers[custIndex],
          ordersCount: (store.customers[custIndex].ordersCount || 0) + 1,
          totalSpent: (store.customers[custIndex].totalSpent || 0) + (order.total || 0)
        };
        broadcast('CUSTOMERS_UPDATED', store.customers);
      }
    }

    saveStore(store);
    broadcast('ORDERS_UPDATED', store.orders);

    res.json({ success: true, order, orders: store.orders });
  });

  app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
    const orderId = req.params.id;
    const { status } = req.body as { status: OrderStatus };

    store.orders = store.orders.map(o => 
      o.id === orderId ? { ...o, status, updatedAt: 'Agora' } : o
    );

    saveStore(store);
    broadcast('ORDERS_UPDATED', store.orders);

    res.json({ success: true, orders: store.orders });
  });

  app.patch('/api/orders/:id/courier', (req: Request, res: Response) => {
    const orderId = req.params.id;
    const { courierName, courierPhone } = req.body;

    store.orders = store.orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          courier: {
            name: courierName || 'Mateus Siqueira',
            phone: courierPhone || '(11) 98765-4321',
            avatarUrl: o.courier?.avatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2aeNO3G5Kn1XPeuOcyvlHLub_aqlAu2cWxwqmm0uV5Bog5SJvE3zpIHrljrGVm6IGh6XSm019EftSfQTQYs3FFnErm0DIQ5HWMGmuujLpjQR5xKaq9r9UuNVYHMME_kf24d4Cn-QlcIB_9fxMRWmWXUAuDG28wR2pVugWRKgFERlggSLqgohN-bWmorJpS4d7R4Ftygy3ZxuLbVJXh-rWac7czDE_-PtIXp9sQAz-KodVf97EJSVx6w',
            rating: o.courier?.rating || 4.97,
            deliveriesCount: o.courier?.deliveriesCount || 852
          },
          updatedAt: 'Agora'
        };
      }
      return o;
    });

    saveStore(store);
    broadcast('ORDERS_UPDATED', store.orders);

    res.json({ success: true, orders: store.orders });
  });

  app.delete('/api/orders/:id', (req: Request, res: Response) => {
    const orderId = req.params.id;
    store.orders = store.orders.filter(o => o.id !== orderId);
    saveStore(store);
    broadcast('ORDERS_UPDATED', store.orders);
    res.json({ success: true, orders: store.orders });
  });

  app.delete('/api/orders', (_req: Request, res: Response) => {
    store.orders = [];
    saveStore(store);
    broadcast('ORDERS_UPDATED', store.orders);
    res.json({ success: true, orders: [] });
  });

  // ============================================================================
  // PRODUCTS API
  // ============================================================================
  app.post('/api/products', (req: Request, res: Response) => {
    const product = req.body as Product;
    if (!product || !product.id || !product.name) {
      res.status(400).json({ success: false, message: 'Dados do produto inválidos' });
      return;
    }

    store.products = [product, ...store.products];

    // Update categories count
    store.categories = store.categories.map(c => 
      c.id === product.categoryId || c.id === 'all' ? { ...c, count: c.count + 1 } : c
    );

    saveStore(store);
    broadcast('PRODUCTS_UPDATED', store.products);
    broadcast('CATEGORIES_UPDATED', store.categories);

    res.json({ success: true, products: store.products, categories: store.categories });
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const productId = req.params.id;
    const updated = req.body as Product;

    store.products = store.products.map(p => (p.id === productId ? updated : p));
    saveStore(store);
    broadcast('PRODUCTS_UPDATED', store.products);

    res.json({ success: true, products: store.products });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const productId = req.params.id;
    const prod = store.products.find(p => p.id === productId);

    store.products = store.products.filter(p => p.id !== productId);

    if (prod) {
      store.categories = store.categories.map(c => 
        c.id === prod.categoryId || c.id === 'all' ? { ...c, count: Math.max(0, c.count - 1) } : c
      );
    }

    saveStore(store);
    broadcast('PRODUCTS_UPDATED', store.products);
    broadcast('CATEGORIES_UPDATED', store.categories);

    res.json({ success: true, products: store.products, categories: store.categories });
  });

  app.patch('/api/products/:id/stock', (req: Request, res: Response) => {
    const productId = req.params.id;
    const { quantity, delta } = req.body;

    store.products = store.products.map(p => {
      if (p.id === productId) {
        let newStock = p.stockAvailable || 0;
        if (typeof quantity === 'number') {
          newStock = Math.max(0, quantity);
        } else if (typeof delta === 'number') {
          newStock = Math.max(0, newStock + delta);
        }
        return { ...p, stockAvailable: newStock };
      }
      return p;
    });

    saveStore(store);
    broadcast('PRODUCTS_UPDATED', store.products);

    res.json({ success: true, products: store.products });
  });

  // ============================================================================
  // CATEGORIES API
  // ============================================================================
  app.post('/api/categories', (req: Request, res: Response) => {
    const newCat = req.body as Category;
    store.categories = [...store.categories, newCat];
    saveStore(store);
    broadcast('CATEGORIES_UPDATED', store.categories);
    res.json({ success: true, categories: store.categories });
  });

  app.delete('/api/categories/:id', (req: Request, res: Response) => {
    const catId = req.params.id;
    store.categories = store.categories.filter(c => c.id !== catId);
    saveStore(store);
    broadcast('CATEGORIES_UPDATED', store.categories);
    res.json({ success: true, categories: store.categories });
  });

  // ============================================================================
  // ADDONS API
  // ============================================================================
  app.post('/api/addons', (req: Request, res: Response) => {
    const addon = req.body as ProductAddon;
    store.addons = [...store.addons, addon];
    saveStore(store);
    broadcast('ADDONS_UPDATED', store.addons);
    res.json({ success: true, addons: store.addons });
  });

  app.delete('/api/addons/:id', (req: Request, res: Response) => {
    const addonId = req.params.id;
    store.addons = store.addons.filter(a => a.id !== addonId);
    saveStore(store);
    broadcast('ADDONS_UPDATED', store.addons);
    res.json({ success: true, addons: store.addons });
  });

  // ============================================================================
  // STORE SETTINGS & REVENUE
  // ============================================================================
  app.put('/api/store-settings', (req: Request, res: Response) => {
    store.storeSettings = req.body as StoreSettings;
    saveStore(store);
    broadcast('STORE_SETTINGS_UPDATED', store.storeSettings);
    res.json({ success: true, storeSettings: store.storeSettings });
  });

  app.post('/api/revenue/reset', (req: Request, res: Response) => {
    const { isRevenueReset } = req.body;
    store.isRevenueReset = Boolean(isRevenueReset);
    saveStore(store);
    broadcast('REVENUE_RESET_UPDATED', { isRevenueReset: store.isRevenueReset });
    res.json({ success: true, isRevenueReset: store.isRevenueReset });
  });

  // ============================================================================
  // CUSTOMERS API
  // ============================================================================
  app.delete('/api/customers/:id', (req: Request, res: Response) => {
    const custId = req.params.id;
    store.customers = store.customers.filter(c => c.id !== custId);
    saveStore(store);
    broadcast('CUSTOMERS_UPDATED', store.customers);
    res.json({ success: true, customers: store.customers });
  });

  // ============================================================================
  // VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVING
  // ============================================================================
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dolce Felicitá] Server authoritative backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting Dolce Felicitá server:', err);
  process.exit(1);
});
