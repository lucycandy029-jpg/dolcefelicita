-- ==============================================================================
-- Migração 005: Pagamentos, Métodos e Estornos
-- Banco de Dados: dolce_felicita (PostgreSQL 17)
-- Aplicação: Dolce Felicitá Doces e Cookies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA: payment_methods (Formas de Pagamento Disponíveis)
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
    ('credit_card', 'Cartão de Crédito Online', 0.00, TRUE),
    ('debit_card_delivery', 'Cartão de Débito (Maquininha na Entrega)', 0.00, FALSE),
    ('cash_delivery', 'Dinheiro Físico na Entrega', 0.00, FALSE)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. TABELA: payments (Transações de Pagamento)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method_id VARCHAR(30) NOT NULL REFERENCES payment_methods(id),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, refunded
    gateway_transaction_id VARCHAR(255),
    pix_qr_code TEXT,
    pix_copy_paste TEXT,
    pix_expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    change_for NUMERIC(10, 2), -- Valor para troco caso seja dinheiro
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ------------------------------------------------------------------------------
-- 3. TABELA: refunds (Estornos e Devoluções)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    processed_by_user_id UUID REFERENCES users(id),
    gateway_refund_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
