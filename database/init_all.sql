-- ==============================================================================
-- DOLCE FELICITÁ - SCRIPT CONSOLIDADO DE INICIALIZAÇÃO DO BANCO DE DADOS
-- Banco de Dados: dolce_felicita
-- Compatibilidade: PostgreSQL 17, 16, 15, 14, 13
-- 100% Idempotente e Seguro para Execuções Múltiplas
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 0. EXTENSÕES & UTILITÁRIOS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EXCEPTION WHEN OTHERS THEN
    -- Em PostgreSQL 13+, gen_random_uuid() já é nativo no core do banco
    RAISE NOTICE 'Extensao pgcrypto ignorada (gen_random_uuid ja e nativo no PG13+)';
END $$;

CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 1. TABELA: roles (Perfis de Acesso do Sistema)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (id, name, description)
VALUES 
    ('customer', 'Cliente', 'Acesso à loja, cardápio, pedidos pessoais e histórico de compras'),
    ('employee', 'Funcionário', 'Acesso ao controle de pedidos, atualização de status e cozinha'),
    ('admin', 'Administrador', 'Acesso irrestrito a configurações, finanças, relatórios e usuários')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 2. TABELA: users (Contas de Usuários)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_email_non_empty CHECK (LENGTH(TRIM(email)) > 3),
    CONSTRAINT chk_users_name_non_empty CHECK (LENGTH(TRIM(name)) >= 2)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_lower_email ON users (LOWER(TRIM(email)));
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone) WHERE phone IS NOT NULL;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 3. TABELA: user_roles (Associação Usuário <-> Perfil)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(30) NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);

-- ------------------------------------------------------------------------------
-- 4. TABELA: addresses (Endereços dos Clientes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(60) NOT NULL DEFAULT 'Casa',
    postal_code VARCHAR(10) NOT NULL,
    street VARCHAR(200) NOT NULL,
    number VARCHAR(30) NOT NULL,
    complement VARCHAR(100),
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    reference_point VARCHAR(255),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_addresses_state_length CHECK (LENGTH(state) = 2)
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_postal_code ON addresses (postal_code);

DROP TRIGGER IF EXISTS trg_addresses_updated_at ON addresses;
CREATE TRIGGER trg_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 5. TABELA: categories (Categorias do Cardápio)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'cake',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 6. TABELA: products (Produtos Artesanais)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) NOT NULL UNIQUE,
    short_description VARCHAR(255),
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    promotional_price NUMERIC(10, 2) CHECK (promotional_price >= 0 AND promotional_price < price),
    unit_label VARCHAR(50) NOT NULL DEFAULT 'Unidade 120g',
    weight_grams INT,
    badge_tag VARCHAR(50),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_gluten_free BOOLEAN NOT NULL DEFAULT FALSE,
    is_lactose_free BOOLEAN NOT NULL DEFAULT FALSE,
    rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0,
    review_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 7. TABELA: product_images (Imagens dos Produtos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- ------------------------------------------------------------------------------
-- 8. TABELA: product_addons (Opcionais e Adicionais)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_addon_relations (
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES product_addons(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, addon_id)
);

-- ------------------------------------------------------------------------------
-- 9. TABELA: inventory (Saldo de Estoque)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    quantity_available INT NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    min_alert_threshold INT NOT NULL DEFAULT 5,
    last_batch_time TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_inventory_updated_at ON inventory;
CREATE TRIGGER trg_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

CREATE TABLE IF NOT EXISTS inventory_movement_types (
    id VARCHAR(30) PRIMARY KEY,
    description VARCHAR(100) NOT NULL
);

INSERT INTO inventory_movement_types (id, description)
VALUES 
    ('production_entry', 'Entrada de fornada / Produção fresca'),
    ('order_reservation', 'Reserva de unidades para pedido confirmado'),
    ('order_dispatch', 'Baixa definitiva após saída para entrega'),
    ('order_cancelled', 'Liberação de reserva devido a cancelamento'),
    ('manual_adjustment', 'Ajuste manual de inventário / quebra ou perda')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type VARCHAR(30) NOT NULL REFERENCES inventory_movement_types(id),
    quantity INT NOT NULL,
    order_id UUID,
    responsible_user_id UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    balance_after INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 10. TABELA: order_statuses (Fluxo de Pedidos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_statuses (
    id VARCHAR(30) PRIMARY KEY,
    name_pt VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    step_order INT NOT NULL
);

INSERT INTO order_statuses (id, name_pt, description, step_order)
VALUES
    ('pending', 'Aguardando Confirmação', 'Pedido recebido no ateliê, aguardando validação de pagamento', 1),
    ('confirmed', 'Confirmado', 'Pagamento aprovado e encaminhado para a confeitaria', 2),
    ('preparing', 'Na Cozinha: Fornada Fresquinha', 'Doces sendo assados, recheados e embalados em caixa térmica selada', 3),
    ('ready', 'Pronto para Envio', 'Embalado e aguardando partida do motoboy', 4),
    ('out_for_delivery', 'Saiu para Entrega', 'Em rota de entrega com motoboy exclusivo e bag térmica', 5),
    ('delivered', 'Pedido Entregue', 'Entregue com sucesso ao cliente', 6),
    ('cancelled', 'Cancelado', 'Pedido cancelado e reservas de estoque liberadas', 7),
    ('delivery_failed', 'Tentativa sem Sucesso', 'Destinatário ausente ou problema no endereço', 8)
ON CONFLICT (id) DO UPDATE SET name_pt = EXCLUDED.name_pt, description = EXCLUDED.description;

CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 4820;

-- ------------------------------------------------------------------------------
-- 11. TABELA: orders (Pedidos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number INT NOT NULL UNIQUE DEFAULT nextval('order_number_seq'),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status_id VARCHAR(30) NOT NULL REFERENCES order_statuses(id) DEFAULT 'pending',
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    coupon_code VARCHAR(50),
    notes TEXT,
    include_eco_utensils BOOLEAN NOT NULL DEFAULT TRUE,
    estimated_delivery_time VARCHAR(50) DEFAULT '35 - 45 min',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

-- ------------------------------------------------------------------------------
-- 12. TABELAS: order_items, order_item_addons, order_status_history
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL,
    product_unit_label VARCHAR(50),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    item_notes VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_item_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    addon_name VARCHAR(150) NOT NULL,
    addon_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (addon_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_item_addons_item ON order_item_addons(order_item_id);

CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    previous_status_id VARCHAR(30) REFERENCES order_statuses(id),
    new_status_id VARCHAR(30) NOT NULL REFERENCES order_statuses(id),
    changed_by_user_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

-- ------------------------------------------------------------------------------
-- 13. TABELAS: payment_methods, payments, refunds
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_methods (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO payment_methods (id, name, discount_percentage, is_online)
VALUES
    ('pix', 'PIX Dinâmico Instantâneo', 5.00, TRUE),
    ('credit', 'Cartão de Crédito', 0.00, TRUE),
    ('credit_card', 'Cartão de Crédito Online', 0.00, TRUE),
    ('credit_card_delivery', 'Cartão de Crédito (Maquininha na Entrega)', 0.00, FALSE),
    ('debit', 'Cartão de Débito (Maquininha na Entrega)', 0.00, FALSE),
    ('debit_card_delivery', 'Cartão de Débito (Maquininha na Entrega)', 0.00, FALSE),
    ('cash', 'Dinheiro Físico na Entrega', 0.00, FALSE),
    ('cash_delivery', 'Dinheiro Físico na Entrega', 0.00, FALSE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method_id VARCHAR(30) NOT NULL REFERENCES payment_methods(id),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    gateway_transaction_id VARCHAR(255),
    pix_qr_code TEXT,
    pix_copy_paste TEXT,
    pix_expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    change_for NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    processed_by_user_id UUID REFERENCES users(id),
    gateway_refund_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 14. TABELAS: couriers, deliveries
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS couriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'Moto',
    avatar_url TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.95,
    completed_deliveries INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO couriers (id, name, phone, vehicle_type, avatar_url, rating, completed_deliveries)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'Mateus Siqueira',
    '(11) 98765-4321',
    'Honda CG 160 Fan - Bag Térmica Felicitá',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC2aeNO3G5Kn1XPeuOcyvlHLub_aqlAu2cWxwqmm0uV5Bog5SJvE3zpIHrljrGVm6IGh6XSm019EftSfQTQYs3FFnErm0DIQ5HWMGmuujLpjQR5xKaq9r9UuNVYHMME_kf24d4Cn-QlcIB_9fxMRWmWXUAuDG28wR2pVugWRKgFERlggSLqgohN-bWmorJpS4d7R4Ftygy3ZxuLbVJXh-rWac7czDE_-PtIXp9sQAz-KodVf97EJSVx6w',
    4.97,
    850
) ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, name = EXCLUDED.name;

CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
    recipient_name VARCHAR(150) NOT NULL,
    recipient_phone VARCHAR(30),
    postal_code VARCHAR(10) NOT NULL,
    street VARCHAR(200) NOT NULL,
    number VARCHAR(30) NOT NULL,
    complement VARCHAR(100),
    neighborhood VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    reference_point VARCHAR(255),
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'preparing',
    estimated_delivery_time TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    delivery_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_courier_id ON deliveries(courier_id);

-- ------------------------------------------------------------------------------
-- 15. TABELAS: store_settings, audit_logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS store_settings (
    key VARCHAR(60) PRIMARY KEY,
    value JSONB NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO store_settings (key, value, description)
VALUES
    ('store_info', '{"name": "Felicitá Doces", "subtitle": "Doceria Artesanal", "cnpj": "12.345.678/0001-99", "phone": "(11) 98765-4321", "instagram": "@felicitadoces"}'::jsonb, 'Dados institucionais da loja'),
    ('business_hours', '{"open": "11:00", "close": "22:00", "days": "Terça a Domingo", "closed_day": "Segunda-feira"}'::jsonb, 'Horário de funcionamento do ateliê'),
    ('delivery_rules', '{"base_fee": 7.50, "free_shipping_threshold": 50.00, "average_time": "35 - 45 min"}'::jsonb, 'Regras de frete e prazos'),
    ('pix_settings', '{"key_type": "cnpj", "key": "12345678000199", "discount_percent": 5.0}'::jsonb, 'Configurações de PIX e incentivo'),
    ('finance_state', '{"is_revenue_reset": false, "reset_at": null}'::jsonb, 'Estado do faturamento da loja')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(80) NOT NULL,
    entity_name VARCHAR(60) NOT NULL,
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_name, entity_id);

-- ------------------------------------------------------------------------------
-- 16. CARGA INICIAL (SEEDS): Administrador Padrão, Categorias e Produtos
-- ------------------------------------------------------------------------------

-- Administrador padrão: admin@felicita.com (Senha: admin123)
INSERT INTO users (id, name, email, password_hash, phone, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Administrador Felicitá',
    'admin@felicita.com',
    '$2a$12$e8x5aN8H7qDqG8DkM5Z.b.4e99fE9J9w8H8fD.b7yO1K9zL1x0A6q',
    '(11) 98765-4321',
    TRUE
) ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone;

INSERT INTO user_roles (user_id, role_id)
VALUES ('a0000000-0000-0000-0000-000000000001', 'admin')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Categorias
INSERT INTO categories (id, name, description, icon_name, display_order)
VALUES
    ('cookies', 'Cookies Artesanais', 'Cookies recheados com massa crocante e centro cremoso', 'cookie', 1),
    ('brownies', 'Brownies & Fudges', 'Brownies molhadinhos feitos com puro chocolate belga', 'cake', 2),
    ('bolos-tortas', 'Bolos & Tortas', 'Fatias gourmets e bolos no pote refrescantes', 'bakery_dining', 3),
    ('doces-finos', 'Doces Finos & Bombons', 'Brigadeiros nobres e docinhos gourmet', 'lunch_dining', 4),
    ('bebidas-cafes', 'Bebidas & Cafés', 'Cappuccinos, cafés especiais e bebidas geladas', 'coffee', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Produtos
INSERT INTO products (id, category_id, name, slug, short_description, description, price, unit_label, weight_grams, badge_tag, is_featured, rating, review_count)
VALUES
    (
        'c0010000-0000-0000-0000-000000000001',
        'cookies',
        'Cookie Tortinha de Nutella',
        'cookie-tortinha-de-nutella',
        'Bordas crocantes, centro cremoso recheado com Nutella pura e avelãs tostadas selecionadas.',
        'Cookie artesanal dourado com bordas crocantes e centro fofo, generosamente recheado com Nutella pura e finalizado com avelãs crocantes selecionadas.',
        16.00,
        'Unidade 130g',
        130,
        'Fornada do Dia',
        TRUE,
        4.9,
        480
    ),
    (
        'c0010000-0000-0000-0000-000000000002',
        'cookies',
        'Cookie Pistache & Chocolate Branco',
        'cookie-pistache-chocolate-branco',
        'Massa perfumada de pistache natural de Bronte, gotas de chocolate belga branco e flor de sal.',
        'Massa especial perfumada de pistache puro importado, generosas gotas de chocolate branco Callebaut e toque de flor de sal.',
        18.50,
        'Unidade 120g',
        120,
        'Edição Limitada',
        TRUE,
        4.8,
        120
    ),
    (
        'c0010000-0000-0000-0000-000000000003',
        'cookies',
        'Cookie Red Velvet Melt',
        'cookie-red-velvet-melt',
        'Massa vermelha aveludada com cacau suave e recheio cremoso e azedinho de cream cheese original.',
        'Massa aveludada vermelha vibrante com notas sutis de cacau nobre e recheio farto de cream cheese Philadelphia artesanalmente preparado.',
        17.00,
        'Unidade 120g',
        120,
        'Novo',
        TRUE,
        4.9,
        95
    ),
    (
        'c0010000-0000-0000-0000-000000000004',
        'cookies',
        'Cookie Tradicional Gotas Belga 54%',
        'cookie-tradicional-gotas-belga-54',
        'Massa amanteigada clássica de baunilha de Madagascar com abundante chocolate belga meio amargo.',
        'A receita tradicional americana aperfeiçoada com fava de baunilha de Madagascar e 54% cacau belga Callebaut.',
        14.50,
        'Unidade 115g',
        115,
        'Clássico',
        FALSE,
        5.0,
        640
    ),
    (
        'c0010000-0000-0000-0000-000000000005',
        'brownies',
        'Fudge Brownie Caramelo Salgado',
        'fudge-brownie-caramelo-salgado',
        'Textura densa e úmida com crostinha fina craquelada e ondas de caramelo toffee com flor de sal de Guérande.',
        'Brownie autêntico super denso e cremoso, coberto por caramelo artesanal toffee e flor de sal.',
        15.00,
        'Fatia 110g',
        110,
        'Mais Vendido',
        TRUE,
        4.9,
        310
    ),
    (
        'c0010000-0000-0000-0000-000000000006',
        'brownies',
        'Brownie Ninho & Morangos Frescos',
        'brownie-ninho-morangos-frescos',
        'Base de chocolate intense coberta com brigadeiro de leite Ninho artesanal e pedaços de morango.',
        'Combinação irresistível de brownie com brigadeiro cremoso de Ninho e morangos frescos picados.',
        19.00,
        'Pote 220g',
        220,
        'Favorito',
        TRUE,
        4.9,
        215
    )
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_available = EXCLUDED.is_available;

-- Imagens dos Produtos
INSERT INTO product_images (id, product_id, image_url, is_primary)
VALUES
    ('d0010000-0000-0000-0000-000000000001', 'c0010000-0000-0000-0000-000000000001', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCI9Q2Q983DUN78ApFjsf6giUl5bNQw43hicPMNuQdfluHfpxDWQnPMwyexvuvkGoMti9NDD_gC8YvkEi_VgvHyTi7gkcta7R7V7yNP-WFjTOBRBqSprkpCCh0amzAIONLS0SawvXJWEXo1-8vKn0rJ6MMVwtj29R7ugGXBHgyfNzUOH7PzIy5XagYcXz0XUN7Gpt4s1wfUfOpiRYJZGxAM9E2yyubWUWv_QpNYA_oOx9u0tGvSpYf9Iw', TRUE),
    ('d0010000-0000-0000-0000-000000000002', 'c0010000-0000-0000-0000-000000000002', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMsR881q2tHqDoxg-k40r541tDqO8Yp1aYd2F9J_W3d0G9V5nZ4J2W8mY7L6kP0Q8oX5V3b2N1M9L8K7J6H5G4F3D2S1A0', TRUE),
    ('d0010000-0000-0000-0000-000000000003', 'c0010000-0000-0000-0000-000000000003', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTqR881q2tHqDoxg-k40r541tDqO8Yp1aYd2F9J_W3d0G9V5nZ4J2W8mY7L6kP0Q8oX5V3b2N1M9L8K7J6H5G4F3D2S1A1', TRUE),
    ('d0010000-0000-0000-0000-000000000004', 'c0010000-0000-0000-0000-000000000004', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFqR881q2tHqDoxg-k40r541tDqO8Yp1aYd2F9J_W3d0G9V5nZ4J2W8mY7L6kP0Q8oX5V3b2N1M9L8K7J6H5G4F3D2S1A2', TRUE),
    ('d0010000-0000-0000-0000-000000000005', 'c0010000-0000-0000-0000-000000000005', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMqR881q2tHqDoxg-k40r541tDqO8Yp1aYd2F9J_W3d0G9V5nZ4J2W8mY7L6kP0Q8oX5V3b2N1M9L8K7J6H5G4F3D2S1A3', TRUE),
    ('d0010000-0000-0000-0000-000000000006', 'c0010000-0000-0000-0000-000000000006', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPqR881q2tHqDoxg-k40r541tDqO8Yp1aYd2F9J_W3d0G9V5nZ4J2W8mY7L6kP0Q8oX5V3b2N1M9L8K7J6H5G4F3D2S1A4', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Opcionais Globais
INSERT INTO product_addons (id, name, description, price)
VALUES
    ('a0010000-0000-0000-0000-000000000001', 'Calda extra de Nutella pura (potinho 40g)', 'Nutella original cremosa morna servida em potinho selado', 4.50),
    ('a0010000-0000-0000-0000-000000000002', 'Brigadeiro Belga de Colher (potinho 40g)', 'Brigadeiro artesanal cremoso feito com chocolate Callebaut', 4.00),
    ('a0010000-0000-0000-0000-000000000003', 'Farofinha Crocante de Pistache de Bronte (25g)', 'Pistache levemente tostado com toque sutil de flor de sal', 6.00),
    ('a0010000-0000-0000-0000-000000000004', 'Gotas de Chocolate Branco Callebaut (30g)', 'Gotas puras belgas para polvilhar', 3.50)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;

-- Estoque Inicial para os Produtos
INSERT INTO inventory (product_id, quantity_available, quantity_reserved, min_alert_threshold, last_batch_time)
VALUES
    ('c0010000-0000-0000-0000-000000000001', 24, 0, 5, CURRENT_TIMESTAMP),
    ('c0010000-0000-0000-0000-000000000002', 15, 0, 5, CURRENT_TIMESTAMP),
    ('c0010000-0000-0000-0000-000000000003', 18, 0, 5, CURRENT_TIMESTAMP),
    ('c0010000-0000-0000-0000-000000000004', 32, 0, 8, CURRENT_TIMESTAMP),
    ('c0010000-0000-0000-0000-000000000005', 16, 0, 5, CURRENT_TIMESTAMP),
    ('c0010000-0000-0000-0000-000000000006', 12, 0, 4, CURRENT_TIMESTAMP)
ON CONFLICT (product_id) DO NOTHING;

COMMIT;
