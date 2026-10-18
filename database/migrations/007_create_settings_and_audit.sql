-- ==============================================================================
-- Migração 007: Configurações Comerciais e Auditoria
-- Banco de Dados: dolce_felicita (PostgreSQL 17)
-- Aplicação: Dolce Felicitá Doces e Cookies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA: store_settings (Parâmetros da Confeitaria)
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
    ('pix_settings', '{"key_type": "cnpj", "key": "12345678000199", "discount_percent": 5.0}'::jsonb, 'Configurações de PIX e incentivo')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. TABELA: audit_logs (Auditoria Imutável de Operações Administrativas)
-- ------------------------------------------------------------------------------
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
