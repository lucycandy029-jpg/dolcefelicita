import pg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
} from '../src/types';

const { Pool } = pg;

// Helper to convert any ID string into a valid RFC4122 UUID v4
export function toValidUuid(str?: string): string {
  if (!str) return crypto.randomUUID();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

let pool: pg.Pool | null = null;
let pgConnected = false;

export function isPgConnected(): boolean {
  return pgConnected;
}

export function getPgPool(): pg.Pool | null {
  return pool;
}

// Clean environment string if accidentally wrapped or includes prefix
export function cleanEnvValue(val?: string): string {
  if (!val) return '';
  let s = val.trim();
  const eqIdx = s.indexOf('=');
  if (eqIdx !== -1 && /^[A-Z0-9_]+=/i.test(s)) {
    s = s.slice(eqIdx + 1).trim();
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export async function initPostgres(): Promise<boolean> {
  const rawDatabaseUrl = process.env.DATABASE_URL;
  const databaseUrl = cleanEnvValue(rawDatabaseUrl);
  const host = cleanEnvValue(process.env.PGHOST) || '127.0.0.1';
  const port = Number(cleanEnvValue(process.env.PGPORT)) || 5432;
  const user = cleanEnvValue(process.env.PGUSER) || 'postgres';
  const password = cleanEnvValue(process.env.PGPASSWORD) || '';
  const database = cleanEnvValue(process.env.PGDATABASE) || 'dolce_felicita';

  try {
    if (pool) {
      await pool.end().catch(() => {});
    }

    if (databaseUrl && databaseUrl.trim() !== '') {
      console.log(`[PostgreSQL] Inicializando conexão via DATABASE_URL...`);
      pool = new Pool({
        connectionString: databaseUrl,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 15,
        ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
      });
    } else {
      console.log(`[PostgreSQL] Tentando conectar em ${user}@${host}:${port}/${database}...`);
      pool = new Pool({
        host,
        port,
        user,
        password,
        database,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        max: 15,
        ssl: false
      });
    }

    // Test connectivity
    const client = await pool.connect();
    const testRes = await client.query('SELECT NOW() as now, current_database() as db;');
    client.release();

    pgConnected = true;
    console.log(`✅ [PostgreSQL] Conectado com sucesso ao banco '${testRes.rows[0].db}'! Data do servidor: ${testRes.rows[0].now}`);

    // Ensure session table and required indexes exist safely without dropping anything
    await ensureSessionTable();

    return true;
  } catch (err: any) {
    pgConnected = false;
    console.warn(`⚠️ [PostgreSQL] Banco de dados não acessível neste momento (${err.code || err.message}).`);
    console.warn(`[PostgreSQL] O sistema utilizará persistência segura em 'database/store.json' até que o PostgreSQL esteja online.`);
    return false;
  }
}

// Safely ensure user_sessions table exists in PostgreSQL
async function ensureSessionTable() {
  if (!pool || !pgConnected) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id VARCHAR(128) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

      -- Ensure default roles exist if roles table is present
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') THEN
          INSERT INTO roles (id, name, description)
          VALUES 
            ('admin', 'Administrador', 'Acesso total ao painel e configurações'),
            ('customer', 'Cliente', 'Cliente com acesso ao cardápio e pedidos'),
            ('employee', 'Funcionário', 'Operador de pedidos')
          ON CONFLICT (id) DO NOTHING;
        END IF;
      END $$;

      -- Ensure default admin exists in users table with known UUID
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
          IF NOT EXISTS (SELECT 1 FROM users WHERE LOWER(TRIM(email)) = 'admin@felicitadoces.com.br') THEN
            INSERT INTO users (id, name, email, password_hash, phone, is_active)
            VALUES (
              'fa881076-d8ce-47c8-a7e3-f7d82a1700ad',
              'Administrador Felicitá',
              'admin@felicitadoces.com.br',
              '$2a$12$e8x5aN8H7qDqG8DkM5Z.b.4e99fE9J9w8H8fD.b7yO1K9zL1x0A6q',
              '(11) 98765-4321',
              TRUE
            ) ON CONFLICT DO NOTHING;
          END IF;

          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
            INSERT INTO user_roles (user_id, role_id)
            SELECT id, 'admin' FROM users WHERE LOWER(TRIM(email)) = 'admin@felicitadoces.com.br'
            ON CONFLICT DO NOTHING;
          END IF;
        END IF;
      END $$;
    `);
  } catch (err) {
    console.error('Error creating user_sessions table in PostgreSQL:', err);
  }
}

// ==============================================================================
// AUTHENTICATION & USERS IN POSTGRESQL
// ==============================================================================

export interface PgUserResult {
  user: User;
  passwordHash: string;
  address?: Address;
}

export async function pgFindUserByEmail(email: string): Promise<PgUserResult | null> {
  if (!pool || !pgConnected) return null;
  const normalized = email.toLowerCase().trim();
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.password_hash, 
        u.phone, 
        u.is_active, 
        u.created_at,
        COALESCE(r.id, 'customer') as role,
        a.id as address_id,
        a.title as address_title,
        a.postal_code,
        a.street,
        a.number,
        a.complement,
        a.neighborhood,
        a.city,
        a.state,
        a.reference_point
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN addresses a ON u.id = a.user_id AND a.is_default = true
      WHERE LOWER(TRIM(u.email)) = $1
      LIMIT 1;
    `;
    const res = await pool.query(query, [normalized]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || undefined,
      role: (row.role as any) || 'customer',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
    };

    let address: Address | undefined;
    if (row.street && row.number) {
      address = {
        id: row.address_id || toValidUuid(`addr-${row.id}`),
        title: row.address_title || 'Endereço Principal',
        postalCode: row.postal_code || '01310-100',
        street: row.street,
        number: row.number,
        complement: row.complement || '',
        neighborhood: row.neighborhood || 'Centro',
        city: row.city || 'São Paulo',
        state: row.state || 'SP',
        referencePoint: row.reference_point || '',
        isDefault: true
      };
    }

    return {
      user,
      passwordHash: row.password_hash,
      address
    };
  } catch (err) {
    console.error('Error finding user by email in PostgreSQL:', err);
    return null;
  }
}

export async function pgFindUserById(userId: string): Promise<PgUserResult | null> {
  if (!pool || !pgConnected) return null;
  const uuid = toValidUuid(userId);
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.password_hash, 
        u.phone, 
        u.is_active, 
        u.created_at,
        COALESCE(r.id, 'customer') as role,
        a.id as address_id,
        a.title as address_title,
        a.postal_code,
        a.street,
        a.number,
        a.complement,
        a.neighborhood,
        a.city,
        a.state,
        a.reference_point
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN addresses a ON u.id = a.user_id AND a.is_default = true
      WHERE u.id = $1
      LIMIT 1;
    `;
    const res = await pool.query(query, [uuid]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || undefined,
      role: (row.role as any) || 'customer',
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
    };

    let address: Address | undefined;
    if (row.street && row.number) {
      address = {
        id: row.address_id || toValidUuid(`addr-${row.id}`),
        title: row.address_title || 'Endereço Principal',
        postalCode: row.postal_code || '01310-100',
        street: row.street,
        number: row.number,
        complement: row.complement || '',
        neighborhood: row.neighborhood || 'Centro',
        city: row.city || 'São Paulo',
        state: row.state || 'SP',
        referencePoint: row.reference_point || '',
        isDefault: true
      };
    }

    return {
      user,
      passwordHash: row.password_hash,
      address
    };
  } catch (err) {
    console.error('Error finding user by id in PostgreSQL:', err);
    return null;
  }
}

export async function pgCreateUser(data: {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role?: 'customer' | 'admin' | 'employee';
  address?: Address;
}): Promise<{ user: User; address?: Address } | null> {
  if (!pool || !pgConnected) return null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const normalizedEmail = data.email.toLowerCase().trim();
    const roleId = data.role || 'customer';
    const passwordHash = await bcrypt.hash(data.password || '123456', 10);

    // Check if user with this email already exists
    const existing = await client.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1', [normalizedEmail]);
    let userId: string;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      await client.query(
        `UPDATE users SET name = $1, phone = COALESCE($2, phone), password_hash = COALESCE($3, password_hash), updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
        [data.name.trim(), data.phone || null, passwordHash, userId]
      );
    } else {
      userId = crypto.randomUUID();
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, phone, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE);`,
        [userId, data.name.trim(), normalizedEmail, passwordHash, data.phone || null]
      );
    }

    // 2. Insert role
    await client.query(
      `INSERT INTO user_roles (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) DO NOTHING;`,
      [userId, roleId]
    );

    // 3. Insert address if provided
    let savedAddress: Address | undefined = data.address;
    if (data.address && data.address.street) {
      const addrId = toValidUuid(data.address.id || `addr-${userId}`);
      await client.query(
        `INSERT INTO addresses (id, user_id, title, postal_code, street, number, complement, neighborhood, city, state, reference_point, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
         ON CONFLICT (id) DO UPDATE SET 
            street = EXCLUDED.street, 
            number = EXCLUDED.number, 
            complement = EXCLUDED.complement, 
            neighborhood = EXCLUDED.neighborhood, 
            city = EXCLUDED.city, 
            state = EXCLUDED.state,
            postal_code = EXCLUDED.postal_code,
            reference_point = EXCLUDED.reference_point;`,
        [
          addrId,
          userId,
          data.address.title || 'Endereço Principal',
          data.address.postalCode || '01310-100',
          data.address.street,
          data.address.number,
          data.address.complement || '',
          data.address.neighborhood || 'Centro',
          data.address.city || 'São Paulo',
          (data.address.state || 'SP').slice(0, 2),
          data.address.referencePoint || ''
        ]
      );
      savedAddress = {
        ...data.address,
        id: addrId,
        userId
      };
    }

    await client.query('COMMIT');

    const createdUser: User = {
      id: userId,
      name: data.name.trim(),
      email: normalizedEmail,
      phone: data.phone || undefined,
      role: roleId,
      createdAt: new Date().toISOString()
    };

    return { user: createdUser, address: savedAddress };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting user in PostgreSQL:', err);
    return null;
  } finally {
    client.release();
  }
}

// Session persistence in PostgreSQL
export async function pgCreateSession(
  sessionId: string, 
  userId: string, 
  expiresAt: Date,
  userFallback?: { name?: string; email?: string; role?: string }
): Promise<boolean> {
  if (!pool || !pgConnected) return false;
  try {
    const uuid = toValidUuid(userId);
    let targetUserId = uuid;

    // 1. Check if user already exists by ID
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1 LIMIT 1;', [uuid]);
    if (userCheck.rows.length > 0) {
      targetUserId = userCheck.rows[0].id;
    } else {
      // 2. Check by email if fallback is provided
      const emailToSearch = userFallback?.email;
      if (emailToSearch) {
        const emailCheck = await pool.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1)) LIMIT 1;', [emailToSearch]);
        if (emailCheck.rows.length > 0) {
          targetUserId = emailCheck.rows[0].id;
        } else {
          // 3. Insert user placeholder so foreign key constraint is satisfied
          const defaultHash = '$2a$12$e8x5aN8H7qDqG8DkM5Z.b.4e99fE9J9w8H8fD.b7yO1K9zL1x0A6q';
          await pool.query(
            `INSERT INTO users (id, name, email, password_hash, phone, is_active)
             VALUES ($1, $2, $3, $4, NULL, TRUE)
             ON CONFLICT (id) DO NOTHING;`,
            [
              uuid,
              userFallback?.name || 'Usuário Felicitá',
              emailToSearch.toLowerCase().trim(),
              defaultHash
            ]
          );
          if (userFallback?.role) {
            try {
              await pool.query(
                `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
                [uuid, userFallback.role]
              );
            } catch (e) {}
          }
          targetUserId = uuid;
        }
      } else {
        // Fallback: check if ANY user exists or create a placeholder user for this UUID
        const fallbackCheck = await pool.query('SELECT id FROM users LIMIT 1;');
        if (fallbackCheck.rows.length > 0) {
          targetUserId = fallbackCheck.rows[0].id;
        } else {
          await pool.query(
            `INSERT INTO users (id, name, email, password_hash, phone, is_active)
             VALUES ($1, 'Administrador Felicitá', 'admin@felicitadoces.com.br', '$2a$12$e8x5aN8H7qDqG8DkM5Z.b.4e99fE9J9w8H8fD.b7yO1K9zL1x0A6q', NULL, TRUE)
             ON CONFLICT (id) DO NOTHING;`,
            [uuid]
          );
          targetUserId = uuid;
        }
      }
    }

    await pool.query(
      `INSERT INTO user_sessions (session_id, user_id, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id) DO UPDATE SET expires_at = EXCLUDED.expires_at;`,
      [sessionId, targetUserId, expiresAt]
    );
    return true;
  } catch (err) {
    console.error('Error creating session in PostgreSQL:', err);
    return false;
  }
}

export async function pgGetSession(sessionId: string): Promise<PgUserResult | null> {
  if (!pool || !pgConnected) return null;
  try {
    const query = `
      SELECT 
        s.session_id,
        s.expires_at,
        u.id, 
        u.name, 
        u.email, 
        u.password_hash, 
        u.phone, 
        u.is_active, 
        u.created_at,
        COALESCE(r.id, 'customer') as role,
        a.id as address_id,
        a.title as address_title,
        a.postal_code,
        a.street,
        a.number,
        a.complement,
        a.neighborhood,
        a.city,
        a.state,
        a.reference_point
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN addresses a ON u.id = a.user_id AND a.is_default = true
      WHERE s.session_id = $1 AND s.expires_at > NOW()
      LIMIT 1;
    `;
    const res = await pool.query(query, [sessionId]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const isRowAdmin = (row.role === 'admin') || 
      (row.email && row.email.toLowerCase().startsWith('admin@')) || 
      ['admin@felicitadoces.com.br', 'admin@felicita.com', 'admin@admin.com'].includes(String(row.email).toLowerCase());

    const user: User = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || undefined,
      role: isRowAdmin ? 'admin' : ((row.role as any) || 'customer'),
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString()
    };

    let address: Address | undefined;
    if (row.street && row.number) {
      address = {
        id: row.address_id || toValidUuid(`addr-${row.id}`),
        title: row.address_title || 'Endereço Principal',
        postalCode: row.postal_code || '01310-100',
        street: row.street,
        number: row.number,
        complement: row.complement || '',
        neighborhood: row.neighborhood || 'Centro',
        city: row.city || 'São Paulo',
        state: row.state || 'SP',
        referencePoint: row.reference_point || '',
        isDefault: true
      };
    }

    return {
      user,
      passwordHash: row.password_hash,
      address
    };
  } catch (err) {
    console.error('Error fetching session in PostgreSQL:', err);
    return null;
  }
}

export async function pgDeleteSession(sessionId: string): Promise<boolean> {
  if (!pool || !pgConnected) return false;
  try {
    await pool.query('DELETE FROM user_sessions WHERE session_id = $1;', [sessionId]);
    return true;
  } catch (err) {
    console.error('Error deleting session in PostgreSQL:', err);
    return false;
  }
}

// ==============================================================================
// PRODUCTS, CATEGORIES, ORDERS, SETTINGS IN POSTGRESQL
// ==============================================================================

export async function pgLoadProducts(): Promise<Product[] | null> {
  if (!pool || !pgConnected) return null;
  try {
    const query = `
      SELECT 
        p.id,
        p.category_id,
        p.name,
        p.slug,
        p.short_description,
        p.description,
        p.price::numeric::float8 as price,
        p.promotional_price::numeric::float8 as promotional_price,
        p.unit_label,
        p.weight_grams,
        p.badge_tag,
        p.is_available,
        p.is_featured,
        p.is_gluten_free,
        p.is_lactose_free,
        p.rating::numeric::float8 as rating,
        p.review_count,
        COALESCE(pi.image_url, '') as image_url,
        COALESCE(inv.quantity_available, 20) as stock_available
      FROM products p
      LEFT JOIN LATERAL (
        SELECT image_url FROM product_images 
        WHERE product_id = p.id 
        ORDER BY is_primary DESC, display_order ASC LIMIT 1
      ) pi ON true
      LEFT JOIN inventory inv ON p.id = inv.product_id
      ORDER BY p.created_at ASC;
    `;
    const res = await pool.query(query);
    if (res.rows.length === 0) return null;

    return res.rows.map(r => ({
      id: r.id,
      categoryId: r.category_id,
      name: r.name,
      slug: r.slug,
      shortDescription: r.short_description || '',
      description: r.description || '',
      price: Number(r.price) || 0,
      promotionalPrice: r.promotional_price ? Number(r.promotional_price) : undefined,
      unitLabel: r.unit_label || 'Unidade 120g',
      weightGrams: r.weight_grams || undefined,
      badgeTag: r.badge_tag || undefined,
      isAvailable: Boolean(r.is_available),
      isFeatured: Boolean(r.is_featured),
      isGlutenFree: Boolean(r.is_gluten_free),
      isLactoseFree: Boolean(r.is_lactose_free),
      rating: Number(r.rating) || 5.0,
      reviewCount: Number(r.review_count) || 0,
      imageUrl: r.image_url || '',
      stockAvailable: Number(r.stock_available) || 0
    }));
  } catch (err) {
    console.error('Error loading products from PostgreSQL:', err);
    return null;
  }
}

export async function pgSaveProduct(prod: Product): Promise<boolean> {
  if (!pool || !pgConnected) return false;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pId = toValidUuid(prod.id);
    const slug = prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // 1. Upsert product
    await client.query(
      `INSERT INTO products (
        id, category_id, name, slug, short_description, description, price, unit_label, badge_tag, is_available, is_featured, rating, review_count
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO UPDATE SET
        category_id = EXCLUDED.category_id,
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        short_description = EXCLUDED.short_description,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        unit_label = EXCLUDED.unit_label,
        badge_tag = EXCLUDED.badge_tag,
        is_available = EXCLUDED.is_available,
        is_featured = EXCLUDED.is_featured,
        updated_at = CURRENT_TIMESTAMP;`,
      [
        pId,
        prod.categoryId || 'cookies',
        prod.name,
        slug,
        prod.shortDescription || '',
        prod.description || '',
        prod.price,
        prod.unitLabel || 'Unidade',
        prod.badgeTag || null,
        prod.isAvailable ?? true,
        prod.isFeatured ?? false,
        prod.rating || 5.0,
        prod.reviewCount || 0
      ]
    );

    // 2. Upsert primary image
    if (prod.imageUrl) {
      await client.query(
        `INSERT INTO product_images (id, product_id, image_url, is_primary)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;`,
        [toValidUuid(`img-${pId}`), pId, prod.imageUrl]
      );
    }

    // 3. Upsert inventory
    await client.query(
      `INSERT INTO inventory (product_id, quantity_available)
       VALUES ($1, $2)
       ON CONFLICT (product_id) DO UPDATE SET quantity_available = EXCLUDED.quantity_available, updated_at = CURRENT_TIMESTAMP;`,
      [pId, prod.stockAvailable ?? 20]
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving product in PostgreSQL:', err);
    return false;
  } finally {
    client.release();
  }
}

export async function pgDeleteProduct(productId: string): Promise<boolean> {
  if (!pool || !pgConnected) return false;
  try {
    const pId = toValidUuid(productId);
    await pool.query('DELETE FROM products WHERE id = $1;', [pId]);
    return true;
  } catch (err) {
    console.error('Error deleting product from PostgreSQL:', err);
    return false;
  }
}

export async function pgLoadCategories(): Promise<Category[] | null> {
  if (!pool || !pgConnected) return null;
  try {
    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.icon_name,
        COUNT(p.id)::int as count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.is_available = true
      WHERE c.is_active = true
      GROUP BY c.id, c.name, c.icon_name, c.display_order
      ORDER BY c.display_order ASC;
    `;
    const res = await pool.query(query);
    if (res.rows.length === 0) return null;

    const list = res.rows.map(r => ({
      id: r.id,
      name: r.name,
      iconName: r.icon_name || 'cake',
      count: Number(r.count) || 0
    }));

    // Add 'all' category at the top
    const totalCount = list.reduce((sum, item) => sum + item.count, 0);
    return [
      { id: 'all', name: 'Todos os Doces', iconName: 'sparkles', count: totalCount },
      ...list
    ];
  } catch (err) {
    console.error('Error loading categories from PostgreSQL:', err);
    return null;
  }
}

export async function pgLoadOrders(): Promise<Order[] | null> {
  if (!pool || !pgConnected) return null;
  try {
    const query = `
      SELECT 
        o.id,
        o.order_number,
        o.status_id,
        o.subtotal::numeric::float8 as subtotal,
        o.delivery_fee::numeric::float8 as delivery_fee,
        o.discount::numeric::float8 as discount,
        o.total::numeric::float8 as total,
        o.coupon_code,
        o.notes,
        o.include_eco_utensils,
        o.estimated_delivery_time,
        o.created_at,
        o.updated_at,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        d.recipient_name,
        d.recipient_phone,
        d.street,
        d.number,
        d.complement,
        d.neighborhood,
        d.city,
        d.state,
        d.postal_code,
        d.reference_point,
        c.name as courier_name,
        c.phone as courier_phone,
        c.avatar_url as courier_avatar,
        c.rating::numeric::float8 as courier_rating,
        c.completed_deliveries as courier_deliveries,
        COALESCE(pm.id, 'pix') as payment_method,
        COALESCE(p.status, 'pending') as payment_status
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN deliveries d ON o.id = d.order_id
      LEFT JOIN couriers c ON d.courier_id = c.id
      LEFT JOIN payments p ON o.id = p.order_id
      LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
      ORDER BY o.created_at DESC
      LIMIT 100;
    `;
    const res = await pool.query(query);
    if (res.rows.length === 0) return null;

    const orders: Order[] = [];

    for (const r of res.rows) {
      // Get items for order
      const itemsRes = await pool.query(
        `SELECT id, product_id, product_name, product_unit_label, unit_price::numeric::float8 as unit_price, quantity, subtotal::numeric::float8 as subtotal, item_notes
         FROM order_items WHERE order_id = $1`,
        [r.id]
      );

      const items = itemsRes.rows.map(it => ({
        id: it.id,
        productId: it.product_id || '',
        name: it.product_name,
        unitLabel: it.product_unit_label || 'Unidade',
        unitPrice: Number(it.unit_price) || 0,
        quantity: Number(it.quantity) || 1,
        imageUrl: '',
        badgeTag: undefined,
        addons: [],
        notes: it.item_notes || undefined,
        itemTotal: Number(it.subtotal) || (Number(it.unit_price) * Number(it.quantity))
      }));

      const address: Address = {
        id: toValidUuid(`addr-${r.id}`),
        title: 'Endereço de Entrega',
        postalCode: r.postal_code || '01310-100',
        street: r.street || 'Av. Paulista',
        number: r.number || '1000',
        complement: r.complement || '',
        neighborhood: r.neighborhood || 'Bela Vista',
        city: r.city || 'São Paulo',
        state: r.state || 'SP',
        referencePoint: r.reference_point || '',
        isDefault: true
      };

      orders.push({
        id: r.id,
        orderNumber: Number(r.order_number) || 4820,
        customerName: r.recipient_name || r.customer_name || 'Cliente Felicitá',
        customerEmail: r.customer_email,
        customerPhone: r.recipient_phone || r.customer_phone || '(11) 98765-4321',
        status: (r.status_id as OrderStatus) || 'confirmed',
        items,
        subtotal: Number(r.subtotal) || 0,
        deliveryFee: Number(r.delivery_fee) || 0,
        discount: Number(r.discount) || 0,
        total: Number(r.total) || 0,
        paymentMethod: (r.payment_method as any) || 'pix',
        paymentStatus: (r.payment_status as any) || 'approved',
        address,
        courier: r.courier_name ? {
          name: r.courier_name,
          phone: r.courier_phone || '(11) 98765-4321',
          avatarUrl: r.courier_avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC2aeNO3G5Kn1XPeuOcyvlHLub_aqlAu2cWxwqmm0uV5Bog5SJvE3zpIHrljrGVm6IGh6XSm019EftSfQTQYs3FFnErm0DIQ5HWMGmuujLpjQR5xKaq9r9UuNVYHMME_kf24d4Cn-QlcIB_9fxMRWmWXUAuDG28wR2pVugWRKgFERlggSLqgohN-bWmorJpS4d7R4Ftygy3ZxuLbVJXh-rWac7czDE_-PtIXp9sQAz-KodVf97EJSVx6w',
          rating: Number(r.courier_rating) || 4.97,
          deliveriesCount: Number(r.courier_deliveries) || 852
        } : undefined,
        notes: r.notes || undefined,
        includeEcoUtensils: Boolean(r.include_eco_utensils),
        estimatedDeliveryTime: r.estimated_delivery_time || '35 - 45 min',
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : 'Agora'
      });
    }

    return orders;
  } catch (err) {
    console.error('Error loading orders from PostgreSQL:', err);
    return null;
  }
}

export async function pgSaveOrder(order: Order, userId?: string): Promise<boolean> {
  if (!pool || !pgConnected) return false;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderId = toValidUuid(order.id);

    // Resolve or create user if needed
    let resolvedUserId = userId ? toValidUuid(userId) : null;
    if (!resolvedUserId) {
      const email = (order.customerEmail || 'cliente@exemplo.com').toLowerCase().trim();
      const userRes = await client.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = $1 LIMIT 1', [email]);
      if (userRes.rows.length > 0) {
        resolvedUserId = userRes.rows[0].id;
      } else {
        resolvedUserId = crypto.randomUUID();
        await client.query(
          `INSERT INTO users (id, name, email, password_hash, phone, is_active)
           VALUES ($1, $2, $3, $4, $5, TRUE)`,
          [
            resolvedUserId,
            order.customerName || 'Cliente Felicitá',
            email,
            await bcrypt.hash('123456', 10),
            order.customerPhone || null
          ]
        );
        await client.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES ($1, 'customer') ON CONFLICT DO NOTHING`,
          [resolvedUserId]
        );
      }
    }

    // Insert order
    await client.query(
      `INSERT INTO orders (
        id, order_number, user_id, status_id, subtotal, delivery_fee, discount, total, notes, include_eco_utensils, estimated_delivery_time, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
        status_id = EXCLUDED.status_id,
        updated_at = CURRENT_TIMESTAMP;`,
      [
        orderId,
        order.orderNumber || 4820,
        resolvedUserId,
        order.status || 'confirmed',
        order.subtotal || 0,
        order.deliveryFee || 0,
        order.discount || 0,
        order.total || 0,
        order.notes || null,
        order.includeEcoUtensils ?? true,
        order.estimatedDeliveryTime || '35 - 45 min'
      ]
    );

    // Insert order items
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const itemId = toValidUuid(item.id || `item-${orderId}-${item.productId}`);
        const prodUuid = item.productId ? toValidUuid(item.productId) : null;
        await client.query(
          `INSERT INTO order_items (
            id, order_id, product_id, product_name, product_unit_label, unit_price, quantity, subtotal, item_notes
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING;`,
          [
            itemId,
            orderId,
            prodUuid,
            item.name,
            item.unitLabel || 'Unidade',
            item.unitPrice || 0,
            item.quantity || 1,
            item.itemTotal || (item.unitPrice * item.quantity),
            item.notes || null
          ]
        );
      }
    }

    // Insert delivery details
    const addr = order.address;
    if (addr) {
      await client.query(
        `INSERT INTO deliveries (
          id, order_id, courier_id, recipient_name, recipient_phone, postal_code, street, number, complement, neighborhood, city, state, reference_point, delivery_fee, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (order_id) DO UPDATE SET
          courier_id = EXCLUDED.courier_id,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP;`,
        [
          toValidUuid(`deliv-${orderId}`),
          orderId,
          'b0000000-0000-0000-0000-000000000001', // Default Mateus Siqueira
          order.customerName || 'Cliente Felicitá',
          order.customerPhone || null,
          addr.postalCode || '01310-100',
          addr.street || 'Rua',
          addr.number || '1',
          addr.complement || '',
          addr.neighborhood || 'Bairro',
          addr.city || 'São Paulo',
          (addr.state || 'SP').slice(0, 2),
          addr.referencePoint || '',
          order.deliveryFee || 0,
          order.status || 'preparing'
        ]
      );
    }

    // Record status history
    await client.query(
      `INSERT INTO order_status_history (id, order_id, new_status_id, notes)
       VALUES ($1, $2, $3, $4);`,
      [crypto.randomUUID(), orderId, order.status || 'confirmed', 'Pedido registrado no sistema']
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving order in PostgreSQL:', err);
    return false;
  } finally {
    client.release();
  }
}

export async function pgUpdateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
  if (!pool || !pgConnected) return false;
  try {
    const uuid = toValidUuid(orderId);
    await pool.query(
      `UPDATE orders SET status_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
      [status, uuid]
    );
    await pool.query(
      `INSERT INTO order_status_history (id, order_id, new_status_id, notes)
       VALUES ($1, $2, $3, $4);`,
      [crypto.randomUUID(), uuid, status, `Status atualizado para ${status}`]
    );
    return true;
  } catch (err) {
    console.error('Error updating order status in PostgreSQL:', err);
    return false;
  }
}

export async function pgDeleteOrder(orderId: string): Promise<boolean> {
  if (!pool || !pgConnected) return false;
  try {
    const uuid = toValidUuid(orderId);
    await pool.query('DELETE FROM orders WHERE id = $1;', [uuid]);
    return true;
  } catch (err) {
    console.error('Error deleting order in PostgreSQL:', err);
    return false;
  }
}

export async function pgLoadCustomers(): Promise<Customer[] | null> {
  if (!pool || !pgConnected) return null;
  try {
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone, 
        u.is_active, 
        u.created_at,
        COUNT(DISTINCT o.id)::int as orders_count,
        COALESCE(SUM(o.total), 0)::numeric::float8 as total_spent,
        a.id as address_id,
        a.title as address_title,
        a.postal_code,
        a.street,
        a.number,
        a.complement,
        a.neighborhood,
        a.city,
        a.state,
        a.reference_point
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN orders o ON u.id = o.user_id
      LEFT JOIN addresses a ON u.id = a.user_id AND a.is_default = true
      WHERE COALESCE(ur.role_id, 'customer') = 'customer'
      GROUP BY u.id, u.name, u.email, u.phone, u.is_active, u.created_at, a.id, a.title, a.postal_code, a.street, a.number, a.complement, a.neighborhood, a.city, a.state, a.reference_point
      ORDER BY u.created_at DESC;
    `;
    const res = await pool.query(query);
    if (res.rows.length === 0) return null;

    return res.rows.map(r => {
      let address: Address | undefined;
      if (r.street && r.number) {
        address = {
          id: r.address_id || toValidUuid(`addr-${r.id}`),
          title: r.address_title || 'Endereço Principal',
          postalCode: r.postal_code || '01310-100',
          street: r.street,
          number: r.number,
          complement: r.complement || '',
          neighborhood: r.neighborhood || 'Centro',
          city: r.city || 'São Paulo',
          state: r.state || 'SP',
          referencePoint: r.reference_point || '',
          isDefault: true
        };
      }

      return {
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone || '(11) 99999-0000',
        city: r.city ? `${r.neighborhood ? `${r.neighborhood} • ` : ''}${r.city}` : 'São Paulo - SP',
        address,
        ordersCount: Number(r.orders_count) || 0,
        totalSpent: Number(r.total_spent) || 0,
        isActive: Boolean(r.is_active),
        createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')
      };
    });
  } catch (err) {
    console.error('Error loading customers from PostgreSQL:', err);
    return null;
  }
}

export async function pgLoadStoreSettings(): Promise<StoreSettings | null> {
  if (!pool || !pgConnected) return null;
  try {
    const res = await pool.query(`SELECT key, value FROM store_settings;`);
    if (res.rows.length === 0) return null;

    const map = new Map<string, any>();
    res.rows.forEach(r => map.set(r.key, r.value));

    const info = map.get('store_info') || {};
    const hours = map.get('business_hours') || {};
    const rules = map.get('delivery_rules') || {};
    const pix = map.get('pix_settings') || {};

    return {
      storeName: info.name || 'Dolce Felicitá',
      slogan: info.subtitle || 'Doceria & Confeitaria Artesanal',
      cnpj: info.cnpj || '12.345.678/0001-99',
      phone: info.phone || '(11) 98765-4321',
      whatsapp: info.whatsapp || '(11) 98765-4321',
      instagram: info.instagram || '@dolcefelicita.doces',
      address: 'Rua das Camélias, 420 • Jardins, São Paulo - SP',
      openingHours: hours.open && hours.close ? `${hours.open} às ${hours.close}` : '11:00 às 22:00',
      closedDays: hours.closed_day || 'Segunda-feira',
      baseDeliveryFee: Number(rules.base_fee) || 7.50,
      freeShippingThreshold: Number(rules.free_shipping_threshold) || 50.00,
      pixKey: pix.key || '12345678000199',
      pixDiscountPercent: Number(pix.discount_percent) || 5.0
    };
  } catch (err) {
    console.error('Error loading store settings from PostgreSQL:', err);
    return null;
  }
}
