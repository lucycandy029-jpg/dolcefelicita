-- ==============================================================================
-- Migração 006: Entregas, Rastreamento e Entregadores
-- Banco de Dados: dolce_felicita (PostgreSQL 17)
-- Aplicação: Dolce Felicitá Doces e Cookies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA: couriers (Entregadores da Loja)
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

INSERT INTO couriers (name, phone, vehicle_type, avatar_url, rating, completed_deliveries)
VALUES (
    'Mateus Siqueira',
    '(11) 98765-4321',
    'Honda CG 160 Fan - Bag Térmica Felicitá',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC2aeNO3G5Kn1XPeuOcyvlHLub_aqlAu2cWxwqmm0uV5Bog5SJvE3zpIHrljrGVm6IGh6XSm019EftSfQTQYs3FFnErm0DIQ5HWMGmuujLpjQR5xKaq9r9UuNVYHMME_kf24d4Cn-QlcIB_9fxMRWmWXUAuDG28wR2pVugWRKgFERlggSLqgohN-bWmorJpS4d7R4Ftygy3ZxuLbVJXh-rWac7czDE_-PtIXp9sQAz-KodVf97EJSVx6w',
    4.97,
    850
) ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. TABELA: deliveries (Registro de Entrega e Snapshot de Endereço)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
    
    -- Snapshot estático imutável do endereço no momento do pedido
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
    status VARCHAR(30) NOT NULL DEFAULT 'preparing', -- preparing, in_transit, delivered, failed
    estimated_delivery_time TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    delivery_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_courier_id ON deliveries(courier_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

DROP TRIGGER IF EXISTS trg_deliveries_updated_at ON deliveries;
CREATE TRIGGER trg_deliveries_updated_at
    BEFORE UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
