-- ==============================================================================
-- Migração 004: Pedidos, Itens, Adicionais e Histórico de Status
-- Banco de Dados: dolce_felicita (PostgreSQL 17)
-- Aplicação: Dolce Felicitá Doces e Cookies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA: order_statuses (Estados do fluxo de pedidos)
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
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. SEQUÊNCIA: Número amigável do pedido (Ex: #4829)
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 4820;

-- ------------------------------------------------------------------------------
-- 3. TABELA: orders (Cabeçalho do Pedido)
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
    notes TEXT, -- Instruções do cliente (ex: deixar na portaria)
    include_eco_utensils BOOLEAN NOT NULL DEFAULT TRUE,
    estimated_delivery_time VARCHAR(50) DEFAULT '35 - 45 min',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ------------------------------------------------------------------------------
-- 4. TABELA: order_items (Itens com snapshot histórico de valores)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(150) NOT NULL, -- Snapshot imutável no momento da compra
    product_unit_label VARCHAR(50),     -- Ex: Unidade 120g
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    item_notes VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ------------------------------------------------------------------------------
-- 5. TABELA: order_item_addons (Adicionais escolhidos para o item)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_item_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    addon_name VARCHAR(150) NOT NULL,
    addon_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (addon_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_item_addons_item ON order_item_addons(order_item_id);

-- ------------------------------------------------------------------------------
-- 6. TABELA: order_status_history (Linha do tempo de auditoria de status)
-- ------------------------------------------------------------------------------
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

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
