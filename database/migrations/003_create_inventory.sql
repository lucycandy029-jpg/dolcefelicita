-- ==============================================================================
-- Migração 003: Controle de Estoque e Movimentações
-- Banco de Dados: dolce_felicita (PostgreSQL 17)
-- Aplicação: Dolce Felicitá Doces e Cookies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA: inventory (Saldo de estoque por produto)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    quantity_available INT NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    quantity_reserved INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    min_alert_threshold INT NOT NULL DEFAULT 5,
    last_batch_time TIMESTAMPTZ, -- Data/hora da última fornada
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE inventory IS 'Controle em tempo real de saldo físico e reservas para pedidos';

-- ------------------------------------------------------------------------------
-- 2. TIPO ENUM / CHECK: Tipos de Movimentação de Estoque
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 3. TABELA: inventory_movements (Histórico auditado de movimentações)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type VARCHAR(30) NOT NULL REFERENCES inventory_movement_types(id),
    quantity INT NOT NULL, -- Positivo para entradas/devoluções, negativo para baixas
    order_id UUID, -- Referência opcional ao pedido
    responsible_user_id UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    balance_after INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON inventory_movements(created_at);

DROP TRIGGER IF EXISTS trg_inventory_updated_at ON inventory;
CREATE TRIGGER trg_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
