import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
import {
  initPostgres,
  isPgConnected,
  pgFindUserByEmail,
  pgFindUserById,
  pgCreateUser,
  pgCreateSession,
  pgGetSession,
  pgDeleteSession,
  pgLoadProducts,
  pgSaveProduct,
  pgDeleteProduct,
  pgLoadCategories,
  pgLoadOrders,
  pgSaveOrder,
  pgUpdateOrderStatus,
  pgDeleteOrder,
  pgLoadCustomers,
  pgLoadStoreSettings,
  toValidUuid
} from './server/postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dolce_felicita_super_secret_cookie_key_2025';
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
  sessions: Record<string, { userId: string; expiresAt: number }>;
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
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Administrador Felicitá',
      email: 'admin@felicita.com',
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
    sessions: {},
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
        if (!parsed.sessions) parsed.sessions = {};
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

// Cookie & Session identifier helper
function getSessionIdFromRequest(req: Request): string | undefined {
  if (req.cookies && req.cookies.felicita_session) {
    return req.cookies.felicita_session;
  }
  if (req.signedCookies && req.signedCookies.felicita_session) {
    return req.signedCookies.felicita_session;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  const sessionHeader = req.headers['x-session-id'];
  if (sessionHeader) {
    return String(sessionHeader).trim();
  }
  return undefined;
}

function setAuthCookie(req: Request, res: Response, sessionId: string) {
  const isHttps = Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https');
  res.cookie('felicita_session', sessionId, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/'
  });
}

function clearAuthCookie(req: Request, res: Response) {
  const isHttps = Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https');
  res.clearCookie('felicita_session', {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/'
  });
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

// Sync in-memory store with PostgreSQL when connected
async function refreshStoreFromPostgres() {
  if (!isPgConnected()) return;
  try {
    const pgProds = await pgLoadProducts();
    if (pgProds && pgProds.length > 0) {
      store.products = pgProds;
    }

    const pgCats = await pgLoadCategories();
    if (pgCats && pgCats.length > 0) {
      store.categories = pgCats;
    }

    const pgOrders = await pgLoadOrders();
    if (pgOrders && pgOrders.length > 0) {
      store.orders = pgOrders;
    }

    const pgCusts = await pgLoadCustomers();
    if (pgCusts && pgCusts.length > 0) {
      store.customers = pgCusts;
    }

    const pgSettings = await pgLoadStoreSettings();
    if (pgSettings) {
      store.storeSettings = pgSettings;
    }

    saveStore(store);
  } catch (err) {
    console.error('Error refreshing store from PostgreSQL:', err);
  }
}

async function startServer() {
  // Initialize PostgreSQL pool
  await initPostgres();
  await refreshStoreFromPostgres();

  // Retry PostgreSQL connection periodically if not yet established
  if (!isPgConnected()) {
    const retryInterval = setInterval(async () => {
      const connected = await initPostgres();
      if (connected) {
        clearInterval(retryInterval);
        await refreshStoreFromPostgres();
        broadcast('PRODUCTS_UPDATED', store.products);
        broadcast('ORDERS_UPDATED', store.orders);
        broadcast('CATEGORIES_UPDATED', store.categories);
      }
    }, 20000);
  }

  const app = express();
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));
  app.use(cookieParser(SESSION_SECRET));

  // CORS headers with credentials for cross-browser & cross-device compatibility
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Session-ID');
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
      'Connection': 'keep-alive'
    });
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: { lastUpdated: store.lastUpdated, pgConnected: isPgConnected() }, timestamp: Date.now() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // ============================================================================
  // FULL APPLICATION STATE (Cross-Device Sync)
  // ============================================================================
  app.get('/api/state', async (_req: Request, res: Response) => {
    if (isPgConnected()) {
      await refreshStoreFromPostgres();
    }

    res.json({
      success: true,
      pgConnected: isPgConnected(),
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
  // AUTHENTICATION & AUTHORIZATION HELPERS & MIDDLEWARES
  // ============================================================================

  async function authenticateRequest(req: Request): Promise<{ user: User; sessionId: string } | null> {
    const sessionId = getSessionIdFromRequest(req);
    if (!sessionId) return null;

    // 1. If PostgreSQL connected, query user_sessions in PostgreSQL
    if (isPgConnected()) {
      const pgSession = await pgGetSession(sessionId);
      if (pgSession && pgSession.user) {
        return { user: pgSession.user, sessionId };
      }
      return null;
    }

    // 2. If PostgreSQL not connected, check local store.sessions
    const localSession = store.sessions[sessionId];
    if (localSession && localSession.expiresAt > Date.now()) {
      const user = store.users.find(u => u.id === localSession.userId);
      if (user) {
        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt
          },
          sessionId
        };
      }
    }

    return null;
  }

  // Middleware: requires any authenticated user (HTTP 401 if not authenticated)
  async function requireAuth(req: Request, res: Response, next: express.NextFunction) {
    const auth = await authenticateRequest(req);
    if (!auth) {
      res.status(401).json({ success: false, message: 'Autenticação necessária. Faça login para continuar.' });
      return;
    }
    (req as any).user = auth.user;
    (req as any).sessionId = auth.sessionId;
    next();
  }

  // Middleware: requires authenticated admin (HTTP 401 if unauthenticated, HTTP 403 if not admin)
  async function requireAdmin(req: Request, res: Response, next: express.NextFunction) {
    const auth = await authenticateRequest(req);
    if (!auth) {
      res.status(401).json({ success: false, message: 'Autenticação necessária.' });
      return;
    }
    if (auth.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Acesso restrito para administradores.' });
      return;
    }
    (req as any).user = auth.user;
    (req as any).sessionId = auth.sessionId;
    next();
  }

  async function verifyUserPassword(provided: string, storedHashOrPlain?: string): Promise<boolean> {
    if (!provided || !storedHashOrPlain) return false;
    if (storedHashOrPlain.startsWith('$2a$') || storedHashOrPlain.startsWith('$2b$')) {
      return await bcrypt.compare(provided, storedHashOrPlain).catch(() => false);
    }
    return provided === storedHashOrPlain;
  }

  // ============================================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================================

  // 1. Session verification (/api/auth/me) - returns HTTP 401 when no session or expired
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const auth = await authenticateRequest(req);

    if (!auth) {
      clearAuthCookie(req, res);
      res.status(401).json({ success: false, user: null, message: 'Nenhuma sessão ativa ou sessão expirada.' });
      return;
    }

    const cust = store.customers.find(c => c.email.toLowerCase() === auth.user.email.toLowerCase()) || null;
    res.json({
      success: true,
      token: auth.sessionId,
      user: auth.user,
      customer: cust,
      address: cust?.address || DEFAULT_ADDRESS
    });
  });

  // 2. Login endpoint (/api/auth/login) - requires registered user, validates with bcrypt, 401 on failure
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ success: false, message: 'E-mail e senha são obrigatórios.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedPassword = password.trim();

    if (!normalizedEmail || !trimmedPassword) {
      res.status(400).json({ success: false, message: 'E-mail e senha não podem estar em branco.' });
      return;
    }

    // 1. If PostgreSQL is connected: query PostgreSQL users
    if (isPgConnected()) {
      const pgUserResult = await pgFindUserByEmail(normalizedEmail);
      if (!pgUserResult) {
        // User does not exist in database: return HTTP 401 immediately (DO NOT AUTO-CREATE!)
        res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' });
        return;
      }

      const isMatch = await verifyUserPassword(trimmedPassword, pgUserResult.passwordHash);
      if (!isMatch) {
        // Password invalid: return HTTP 401
        res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' });
        return;
      }

      const sessionId = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const sessionSaved = await pgCreateSession(sessionId, pgUserResult.user.id, expiresAt);
      if (!sessionSaved) {
        res.status(500).json({ success: false, message: 'Falha ao registrar sessão no servidor.' });
        return;
      }

      store.sessions[sessionId] = { userId: pgUserResult.user.id, expiresAt: expiresAt.getTime() };
      saveStore(store);

      setAuthCookie(req, res, sessionId);

      const cust = store.customers.find(c => c.email.toLowerCase() === normalizedEmail) || null;
      res.json({
        success: true,
        token: sessionId,
        user: pgUserResult.user,
        customer: cust,
        address: pgUserResult.address || cust?.address || DEFAULT_ADDRESS
      });
      return;
    }

    // 2. If PostgreSQL is not connected: query store.users
    const userRecord = store.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!userRecord || !userRecord.password) {
      // User does not exist: return HTTP 401 immediately (DO NOT AUTO-CREATE!)
      res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' });
      return;
    }

    const isMatch = await verifyUserPassword(trimmedPassword, userRecord.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'E-mail ou senha incorretos.' });
      return;
    }

    // If password was stored as plain string, migrate to bcrypt hash safely
    if (!userRecord.password.startsWith('$2a$') && !userRecord.password.startsWith('$2b$')) {
      userRecord.password = await bcrypt.hash(trimmedPassword, 10);
      saveStore(store);
    }

    const publicUser: User = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role,
      createdAt: userRecord.createdAt
    };

    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    store.sessions[sessionId] = { userId: publicUser.id, expiresAt: expiresAt.getTime() };
    saveStore(store);

    setAuthCookie(req, res, sessionId);

    const customerRecord = store.customers.find(c => c.email.toLowerCase() === normalizedEmail);
    res.json({
      success: true,
      token: sessionId,
      user: publicUser,
      customer: customerRecord || null,
      address: customerRecord?.address || userRecord.address || DEFAULT_ADDRESS
    });
  });

  // 3. Register endpoint (/api/auth/register) - forces role = 'customer', rejects missing data
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password || typeof email !== 'string' || typeof name !== 'string' || typeof password !== 'string') {
      res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const trimmedName = name.trim();
    const trimmedPassword = password.trim();

    if (!normalizedEmail || !trimmedName || !trimmedPassword) {
      res.status(400).json({ success: false, message: 'Nome, e-mail e senha não podem estar em branco.' });
      return;
    }

    if (trimmedPassword.length < 4) {
      res.status(400).json({ success: false, message: 'A senha deve ter pelo menos 4 caracteres.' });
      return;
    }

    // CRITICAL SECURITY: Role is ALWAYS forced to 'customer'. Any attempt to supply 'admin' is ignored!
    const enforcedRole = 'customer';

    // Verify if user already exists in PostgreSQL
    if (isPgConnected()) {
      const existingPg = await pgFindUserByEmail(normalizedEmail);
      if (existingPg) {
        res.status(409).json({ success: false, message: 'Este e-mail já está cadastrado. Faça login para continuar.' });
        return;
      }
    }

    // Verify if user already exists in store
    const existingLocal = store.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existingLocal) {
      res.status(409).json({ success: false, message: 'Este e-mail já está cadastrado. Faça login para continuar.' });
      return;
    }

    const custId = crypto.randomUUID();
    const newAddress: Address = address || {
      id: toValidUuid(`addr-${custId}`),
      title: 'Endereço Principal',
      postalCode: '01310-100',
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      isDefault: true
    };

    let createdUser: User = {
      id: custId,
      name: trimmedName,
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : '(11) 99999-0000',
      role: enforcedRole,
      createdAt: new Date().toISOString()
    };

    const passwordHash = await bcrypt.hash(trimmedPassword, 10);

    if (isPgConnected()) {
      const pgRes = await pgCreateUser({
        name: trimmedName,
        email: normalizedEmail,
        password: trimmedPassword,
        phone: createdUser.phone,
        role: enforcedRole,
        address: newAddress
      });
      if (pgRes) {
        createdUser = { ...pgRes.user, role: 'customer' };
      }
    }

    const newCust: Customer = {
      id: createdUser.id,
      name: createdUser.name,
      email: normalizedEmail,
      phone: createdUser.phone || '',
      city: `${newAddress.neighborhood ? `${newAddress.neighborhood} • ` : ''}${newAddress.city || 'São Paulo'}`,
      address: newAddress,
      ordersCount: 0,
      totalSpent: 0,
      isActive: true,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    store.users.push({ ...createdUser, password: passwordHash, address: newAddress });
    store.customers.unshift(newCust);

    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isPgConnected()) {
      await pgCreateSession(sessionId, createdUser.id, expiresAt);
    }
    store.sessions[sessionId] = { userId: createdUser.id, expiresAt: expiresAt.getTime() };
    saveStore(store);

    broadcast('CUSTOMERS_UPDATED', store.customers);
    setAuthCookie(req, res, sessionId);

    res.status(201).json({
      success: true,
      token: sessionId,
      user: createdUser,
      customer: newCust,
      address: newAddress
    });
  });

  // 4. Logout endpoint (/api/auth/logout)
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    const sessionId = getSessionIdFromRequest(req);
    if (sessionId) {
      if (isPgConnected()) {
        await pgDeleteSession(sessionId);
      }
      delete store.sessions[sessionId];
      saveStore(store);
    }

    clearAuthCookie(req, res);
    res.json({ success: true, message: 'Desconectado com sucesso' });
  });

  // Get customer profile by email
  app.get('/api/customers/profile', async (req: Request, res: Response) => {
    const email = req.query.email ? String(req.query.email).toLowerCase().trim() : '';
    if (!email) {
      res.status(400).json({ success: false, message: 'Email query parameter required' });
      return;
    }

    if (isPgConnected()) {
      const pgUser = await pgFindUserByEmail(email);
      if (pgUser) {
        const customer = store.customers.find(c => c.email.toLowerCase() === email);
        res.json({
          success: true,
          customer: customer || null,
          user: pgUser.user,
          address: pgUser.address || customer?.address || DEFAULT_ADDRESS
        });
        return;
      }
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
  // ORDERS API (Protected)
  // ============================================================================
  app.post('/api/orders', requireAuth, async (req: Request, res: Response) => {
    const { order } = req.body;
    if (!order || !order.id) {
      res.status(400).json({ success: false, message: 'Dados do pedido inválidos' });
      return;
    }

    // Save in PostgreSQL
    if (isPgConnected()) {
      await pgSaveOrder(order);
    }

    // Add to in-memory orders list at beginning
    store.orders = [order, ...store.orders.filter(o => o.id !== order.id)];

    // Update customer stats
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

  app.patch('/api/orders/:id/status', requireAdmin, async (req: Request, res: Response) => {
    const orderId = req.params.id;
    const { status } = req.body as { status: OrderStatus };

    if (isPgConnected()) {
      await pgUpdateOrderStatus(orderId, status);
    }

    store.orders = store.orders.map(o => 
      o.id === orderId ? { ...o, status, updatedAt: 'Agora' } : o
    );

    saveStore(store);
    broadcast('ORDERS_UPDATED', store.orders);

    res.json({ success: true, orders: store.orders });
  });

  app.patch('/api/orders/:id/courier', requireAdmin, (req: Request, res: Response) => {
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

  app.delete('/api/orders/:id', requireAdmin, async (req: Request, res: Response) => {
    const orderId = req.params.id;
    if (isPgConnected()) {
      await pgDeleteOrder(orderId);
    }
    store.orders = store.orders.filter(o => o.id !== orderId);
    saveStore(store);
    broadcast('ORDERS_UPDATED', store.orders);
    res.json({ success: true, orders: store.orders });
  });

  app.delete('/api/orders', requireAdmin, (_req: Request, res: Response) => {
    store.orders = [];
    saveStore(store);
    broadcast('ORDERS_UPDATED', store.orders);
    res.json({ success: true, orders: [] });
  });

  // ============================================================================
  // PRODUCTS API (Admin Protected)
  // ============================================================================
  app.post('/api/products', requireAdmin, async (req: Request, res: Response) => {
    const product = req.body as Product;
    if (!product || !product.id || !product.name) {
      res.status(400).json({ success: false, message: 'Dados do produto inválidos' });
      return;
    }

    if (isPgConnected()) {
      await pgSaveProduct(product);
    }

    store.products = [product, ...store.products.filter(p => p.id !== product.id)];

    // Update categories count
    store.categories = store.categories.map(c => 
      c.id === product.categoryId || c.id === 'all' ? { ...c, count: c.count + 1 } : c
    );

    saveStore(store);
    broadcast('PRODUCTS_UPDATED', store.products);
    broadcast('CATEGORIES_UPDATED', store.categories);

    res.json({ success: true, products: store.products, categories: store.categories });
  });

  app.put('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
    const productId = req.params.id;
    const updated = req.body as Product;

    if (isPgConnected()) {
      await pgSaveProduct(updated);
    }

    store.products = store.products.map(p => (p.id === productId ? updated : p));
    saveStore(store);
    broadcast('PRODUCTS_UPDATED', store.products);

    res.json({ success: true, products: store.products });
  });

  app.delete('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
    const productId = req.params.id;
    const prod = store.products.find(p => p.id === productId);

    if (isPgConnected()) {
      await pgDeleteProduct(productId);
    }

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

  app.patch('/api/products/:id/stock', requireAdmin, async (req: Request, res: Response) => {
    const productId = req.params.id;
    const { quantity, delta } = req.body;

    let targetProduct: Product | undefined;
    store.products = store.products.map(p => {
      if (p.id === productId) {
        let newStock = p.stockAvailable || 0;
        if (typeof quantity === 'number') {
          newStock = Math.max(0, quantity);
        } else if (typeof delta === 'number') {
          newStock = Math.max(0, newStock + delta);
        }
        targetProduct = { ...p, stockAvailable: newStock };
        return targetProduct;
      }
      return p;
    });

    if (targetProduct && isPgConnected()) {
      await pgSaveProduct(targetProduct);
    }

    saveStore(store);
    broadcast('PRODUCTS_UPDATED', store.products);

    res.json({ success: true, products: store.products });
  });

  // ============================================================================
  // CATEGORIES API (Admin Protected)
  // ============================================================================
  app.post('/api/categories', requireAdmin, (req: Request, res: Response) => {
    const newCat = req.body as Category;
    store.categories = [...store.categories, newCat];
    saveStore(store);
    broadcast('CATEGORIES_UPDATED', store.categories);
    res.json({ success: true, categories: store.categories });
  });

  app.delete('/api/categories/:id', requireAdmin, (req: Request, res: Response) => {
    const catId = req.params.id;
    store.categories = store.categories.filter(c => c.id !== catId);
    saveStore(store);
    broadcast('CATEGORIES_UPDATED', store.categories);
    res.json({ success: true, categories: store.categories });
  });

  // ============================================================================
  // ADDONS API (Admin Protected)
  // ============================================================================
  app.post('/api/addons', requireAdmin, (req: Request, res: Response) => {
    const addon = req.body as ProductAddon;
    store.addons = [...store.addons, addon];
    saveStore(store);
    broadcast('ADDONS_UPDATED', store.addons);
    res.json({ success: true, addons: store.addons });
  });

  app.delete('/api/addons/:id', requireAdmin, (req: Request, res: Response) => {
    const addonId = req.params.id;
    store.addons = store.addons.filter(a => a.id !== addonId);
    saveStore(store);
    broadcast('ADDONS_UPDATED', store.addons);
    res.json({ success: true, addons: store.addons });
  });

  // ============================================================================
  // STORE SETTINGS & REVENUE (Admin Protected)
  // ============================================================================
  app.put('/api/store-settings', requireAdmin, (req: Request, res: Response) => {
    store.storeSettings = req.body as StoreSettings;
    saveStore(store);
    broadcast('STORE_SETTINGS_UPDATED', store.storeSettings);
    res.json({ success: true, storeSettings: store.storeSettings });
  });

  app.post('/api/revenue/reset', requireAdmin, (req: Request, res: Response) => {
    const { isRevenueReset } = req.body;
    store.isRevenueReset = Boolean(isRevenueReset);
    saveStore(store);
    broadcast('REVENUE_RESET_UPDATED', { isRevenueReset: store.isRevenueReset });
    res.json({ success: true, isRevenueReset: store.isRevenueReset });
  });

  // ============================================================================
  // CUSTOMERS API (Admin Protected)
  // ============================================================================
  app.delete('/api/customers/:id', requireAdmin, (req: Request, res: Response) => {
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
    console.log(`[Dolce Felicitá] Authoritative server running on http://0.0.0.0:${PORT}`);
    console.log(`[PostgreSQL Status] ${isPgConnected() ? 'Online e ativo' : 'Aguardando credenciais / Modo contingência ativo'}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting Dolce Felicitá server:', err);
  process.exit(1);
});
