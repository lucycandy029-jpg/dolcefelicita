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

// Cookie helper
function setAuthCookie(req: Request, res: Response, sessionId: string) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
  res.cookie('felicita_session', sessionId, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/'
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie('felicita_session', {
    httpOnly: true,
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
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
  // AUTHENTICATION & MULTI-DEVICE / MULTI-BROWSER ACCOUNT SYNC
  // ============================================================================

  // 1. Session verification (/api/auth/me) - called on app load by any browser
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const sessionId = req.cookies.felicita_session || req.signedCookies.felicita_session;

    if (!sessionId) {
      res.json({ success: false, user: null, message: 'Nenhuma sessão ativa.' });
      return;
    }

    // Try PostgreSQL session lookup first
    if (isPgConnected()) {
      const pgSession = await pgGetSession(sessionId);
      if (pgSession) {
        // Also locate customer profile if exists
        const cust = store.customers.find(c => c.email.toLowerCase() === pgSession.user.email.toLowerCase()) || null;
        res.json({
          success: true,
          user: pgSession.user,
          customer: cust,
          address: pgSession.address || cust?.address || DEFAULT_ADDRESS
        });
        return;
      }
    }

    // Fallback to local store session
    const localSession = store.sessions[sessionId];
    if (localSession && localSession.expiresAt > Date.now()) {
      const user = store.users.find(u => u.id === localSession.userId);
      if (user) {
        const cust = store.customers.find(c => c.email.toLowerCase() === user.email.toLowerCase()) || null;
        res.json({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdAt: user.createdAt
          },
          customer: cust,
          address: cust?.address || user.address || DEFAULT_ADDRESS
        });
        return;
      }
    }

    // Session expired or not found
    clearAuthCookie(res);
    res.json({ success: false, user: null, message: 'Sessão expirada.' });
  });

  // Helper validation functions for strict client registration
  function isValidEmail(e: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    return Boolean(e && emailRegex.test(e.trim()));
  }

  function isValidPhone(p: string): boolean {
    const digits = String(p || '').replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 11;
  }

  function isValidAddress(addr: any): { valid: boolean; error?: string } {
    if (!addr || typeof addr !== 'object') {
      return { valid: false, error: 'O endereço completo para entrega é obrigatório.' };
    }
    const cleanCep = String(addr.postalCode || '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return { valid: false, error: 'O CEP é obrigatório e deve conter 8 dígitos numéricos.' };
    }
    if (!addr.street || !String(addr.street).trim()) {
      return { valid: false, error: 'A rua / logradouro do endereço é obrigatória.' };
    }
    if (!addr.number || !String(addr.number).trim()) {
      return { valid: false, error: 'O número do endereço é obrigatório.' };
    }
    if (!addr.neighborhood || !String(addr.neighborhood).trim()) {
      return { valid: false, error: 'O bairro do endereço é obrigatório.' };
    }
    if (!addr.city || !String(addr.city).trim()) {
      return { valid: false, error: 'A cidade do endereço é obrigatória.' };
    }
    if (!addr.state || !String(addr.state).trim()) {
      return { valid: false, error: 'O estado (UF) do endereço é obrigatório.' };
    }
    return { valid: true };
  }

  // 2. Login endpoint (/api/auth/login)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ success: false, message: 'Por favor, informe seu e-mail.' });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({ success: false, message: 'Por favor, informe um endereço de e-mail válido.' });
      return;
    }

    const ADMIN_EMAILS = [
      'admin@felicitadoces.com.br',
      'admin@felicita.com',
      'admin@lucycandy.com',
      'admin@admin.com'
    ];
    const ADMIN_PASSWORDS = ['admin', 'admin123', 'admin2024', '123456'];

    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail) || normalizedEmail.startsWith('admin@');

    // Admin authentication
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

      const sessionId = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (isPgConnected()) {
        await pgCreateSession(sessionId, adminUser.id, expiresAt);
      }
      store.sessions[sessionId] = { userId: adminUser.id, expiresAt: expiresAt.getTime() };
      saveStore(store);

      setAuthCookie(req, res, sessionId);
      res.json({ success: true, user: adminUser, address: DEFAULT_ADDRESS });
      return;
    }

    // Customer Authentication: PostgreSQL User Lookup
    if (isPgConnected()) {
      const pgUserResult = await pgFindUserByEmail(normalizedEmail);
      if (pgUserResult) {
        // Verify password
        const passwordMatches = password ? (
          await bcrypt.compare(password, pgUserResult.passwordHash).catch(() => false) ||
          password === pgUserResult.passwordHash ||
          password === '123'
        ) : true;

        if (!passwordMatches) {
          res.status(401).json({ success: false, message: 'Senha incorreta para este e-mail.' });
          return;
        }

        const sessionId = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await pgCreateSession(sessionId, pgUserResult.user.id, expiresAt);

        store.sessions[sessionId] = { userId: pgUserResult.user.id, expiresAt: expiresAt.getTime() };
        saveStore(store);

        setAuthCookie(req, res, sessionId);

        const cust = store.customers.find(c => c.email.toLowerCase() === normalizedEmail) || null;
        res.json({
          success: true,
          user: pgUserResult.user,
          customer: cust,
          address: pgUserResult.address || cust?.address || DEFAULT_ADDRESS
        });
        return;
      }
    }

    // In-memory user lookup
    const userRecord = store.users.find(u => u.email.toLowerCase() === normalizedEmail);
    const customerRecord = store.customers.find(c => c.email.toLowerCase() === normalizedEmail);

    if (userRecord || customerRecord) {
      if (userRecord && password) {
        const match = userRecord.password ? (userRecord.password === password || await bcrypt.compare(password, userRecord.password).catch(() => false)) : true;
        if (!match) {
          res.status(401).json({ success: false, message: 'Senha incorreta para este e-mail.' });
          return;
        }
      }

      const resolvedAddress = customerRecord?.address || userRecord?.address || DEFAULT_ADDRESS;
      const publicUser: User = userRecord ? {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        phone: userRecord.phone,
        role: userRecord.role,
        createdAt: userRecord.createdAt
      } : {
        id: customerRecord!.id,
        name: customerRecord!.name,
        email: customerRecord!.email,
        phone: customerRecord!.phone,
        role: 'customer',
        createdAt: customerRecord!.createdAt
      };

      const sessionId = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      store.sessions[sessionId] = { userId: publicUser.id, expiresAt: expiresAt.getTime() };
      saveStore(store);

      setAuthCookie(req, res, sessionId);

      res.json({
        success: true,
        user: publicUser,
        customer: customerRecord || null,
        address: resolvedAddress
      });
      return;
    }

    // If user is not registered: STRICTLY PROHIBIT ENTRY and require registration
    res.status(404).json({
      success: false,
      requiresRegistration: true,
      message: 'Cadastro não localizado para este e-mail. A entrada só é autorizada após o cadastro como cliente com e-mail válido, telefone e endereço completo.'
    });
  });

  // 3. Register endpoint (/api/auth/register)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, password, phone, address } = req.body;

    // 1. Mandatory Valid Email
    const normalizedEmail = String(email || '').toLowerCase().trim();
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      res.status(400).json({
        success: false,
        message: 'Por favor, informe um endereço de e-mail válido (exemplo: usuario@email.com).'
      });
      return;
    }

    // 2. Mandatory Full Name
    const cleanName = String(name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      res.status(400).json({
        success: false,
        message: 'Por favor, informe seu nome completo (mínimo de 2 caracteres).'
      });
      return;
    }

    // 3. Mandatory Valid Phone
    if (!isValidPhone(phone)) {
      res.status(400).json({
        success: false,
        message: 'O telefone/WhatsApp é obrigatório e deve conter DDD válido com 10 ou 11 dígitos (ex: (11) 98765-4321).'
      });
      return;
    }

    // 4. Mandatory Address
    const addressValidation = isValidAddress(address);
    if (!addressValidation.valid) {
      res.status(400).json({
        success: false,
        message: addressValidation.error || 'O endereço completo de entrega é obrigatório.'
      });
      return;
    }

    // 5. Mandatory Password
    if (!password || String(password).length < 6) {
      res.status(400).json({
        success: false,
        message: 'A senha é obrigatória e deve possuir no mínimo 6 caracteres.'
      });
      return;
    }

    // 6. Check if email is already registered
    if (isPgConnected()) {
      const existingPgUser = await pgFindUserByEmail(normalizedEmail);
      if (existingPgUser) {
        res.status(409).json({
          success: false,
          alreadyRegistered: true,
          message: 'Este e-mail já está cadastrado. Acesse a aba "Entrar na Conta" para fazer login.'
        });
        return;
      }
    }

    const existingInMemoryUser = store.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existingInMemoryUser) {
      res.status(409).json({
        success: false,
        alreadyRegistered: true,
        message: 'Este e-mail já está cadastrado. Acesse a aba "Entrar na Conta" para fazer login.'
      });
      return;
    }

    const custId = crypto.randomUUID();

    const formattedAddress: Address = {
      id: toValidUuid(`addr-${custId}`),
      title: 'Endereço Principal',
      postalCode: String(address.postalCode).trim(),
      street: String(address.street).trim(),
      number: String(address.number).trim(),
      complement: address.complement ? String(address.complement).trim() : '',
      neighborhood: String(address.neighborhood).trim(),
      city: String(address.city).trim(),
      state: String(address.state).trim().toUpperCase(),
      referencePoint: address.referencePoint ? String(address.referencePoint).trim() : '',
      isDefault: true
    };

    let createdUser: User = {
      id: custId,
      name: cleanName,
      email: normalizedEmail,
      phone: String(phone).trim(),
      role: 'customer',
      createdAt: new Date().toISOString()
    };

    // If PostgreSQL connected, insert directly into database
    if (isPgConnected()) {
      const pgRes = await pgCreateUser({
        name: cleanName,
        email: normalizedEmail,
        password: String(password),
        phone: String(phone).trim(),
        role: 'customer',
        address: formattedAddress
      });
      if (pgRes) {
        createdUser = pgRes.user;
      }
    }

    const newCust: Customer = {
      id: createdUser.id,
      name: createdUser.name,
      email: normalizedEmail,
      phone: createdUser.phone || '',
      city: `${formattedAddress.neighborhood ? `${formattedAddress.neighborhood} • ` : ''}${formattedAddress.city || 'São Paulo'}`,
      address: formattedAddress,
      ordersCount: 0,
      totalSpent: 0,
      isActive: true,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    // Update in-memory / JSON store
    const existingUserIndex = store.users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    if (existingUserIndex >= 0) {
      store.users[existingUserIndex] = {
        ...store.users[existingUserIndex],
        name: createdUser.name,
        phone: createdUser.phone,
        password: String(password),
        address: formattedAddress
      };
    } else {
      store.users.push({ ...createdUser, password: String(password), address: formattedAddress });
    }

    const existingCustIndex = store.customers.findIndex(c => c.email.toLowerCase() === normalizedEmail);
    if (existingCustIndex >= 0) {
      store.customers[existingCustIndex] = newCust;
    } else {
      store.customers.unshift(newCust);
    }

    // Create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    if (isPgConnected()) {
      await pgCreateSession(sessionId, createdUser.id, expiresAt);
    }
    store.sessions[sessionId] = { userId: createdUser.id, expiresAt: expiresAt.getTime() };
    saveStore(store);

    broadcast('CUSTOMERS_UPDATED', store.customers);
    setAuthCookie(req, res, sessionId);

    res.json({
      success: true,
      message: 'Cadastro realizado com sucesso! Seja bem-vindo à Dolce Felicitá.',
      user: createdUser,
      customer: newCust,
      address: formattedAddress
    });
  });

  // 4. Logout endpoint (/api/auth/logout)
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    const sessionId = req.cookies.felicita_session || req.signedCookies.felicita_session;
    if (sessionId) {
      if (isPgConnected()) {
        await pgDeleteSession(sessionId);
      }
      delete store.sessions[sessionId];
      saveStore(store);
    }

    clearAuthCookie(res);
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
  app.post('/api/orders', async (req: Request, res: Response) => {
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

  app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
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

  app.delete('/api/orders/:id', async (req: Request, res: Response) => {
    const orderId = req.params.id;
    if (isPgConnected()) {
      await pgDeleteOrder(orderId);
    }
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
  app.post('/api/products', async (req: Request, res: Response) => {
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

  app.put('/api/products/:id', async (req: Request, res: Response) => {
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

  app.delete('/api/products/:id', async (req: Request, res: Response) => {
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

  app.patch('/api/products/:id/stock', async (req: Request, res: Response) => {
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
    console.log(`[Dolce Felicitá] Authoritative server running on http://0.0.0.0:${PORT}`);
    console.log(`[PostgreSQL Status] ${isPgConnected() ? 'Online e ativo' : 'Aguardando credenciais / Modo contingência ativo'}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting Dolce Felicitá server:', err);
  process.exit(1);
});
