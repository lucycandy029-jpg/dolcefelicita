-- ==============================================================================
-- Migração 001: Usuários, Perfis (Roles), Associação e Endereços
-- Banco de Dados: dolce_felicita (PostgreSQL 17)
-- Aplicação: Dolce Felicitá Doces e Cookies
-- ==============================================================================

-- Habilita extensão pgcrypto para UUID v4 seguro
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. TABELA: roles (Perfis de Acesso do Sistema)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE roles IS 'Perfis de controle de acesso (RBAC) do sistema Dolce Felicitá';
COMMENT ON COLUMN roles.id IS 'Identificador textual do perfil: customer, employee, admin';

-- Inserção inicial dos perfis padrão (idempotente)
INSERT INTO roles (id, name, description)
VALUES 
    ('customer', 'Cliente', 'Acesso à loja, cardápio, pedidos pessoais e histórico de compras'),
    ('employee', 'Funcionário', 'Acesso ao controle de pedidos, atualização de status e cozinha'),
    ('admin', 'Administrador', 'Acesso irrestrito a configurações, finanças, relatórios e usuários')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. TABELA: users (Cadastro central de contas de usuários)
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

COMMENT ON TABLE users IS 'Armazena clientes, funcionários e administradores da Dolce Felicitá';
COMMENT ON COLUMN users.password_hash IS 'Hash seguro gerado via Argon2id ou bcrypt com salt alto';

-- Índice único case-insensitive para o e-mail (garante unicidade sem duplicidade por caixa)
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_lower_email ON users (LOWER(TRIM(email)));

-- Índice para busca rápida por telefone
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone) WHERE phone IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 3. TABELA: user_roles (Associação N:N entre Usuários e Perfis)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(30) NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

COMMENT ON TABLE user_roles IS 'Associação de perfis concedidos aos usuários';
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);

-- ------------------------------------------------------------------------------
-- 4. TABELA: addresses (Endereços de entrega dos clientes)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(60) NOT NULL DEFAULT 'Casa', -- Ex: Casa, Trabalho, Apartamento
    postal_code VARCHAR(10) NOT NULL,          -- CEP brasileiro formatado ou limpo (Ex: 01310-100)
    street VARCHAR(200) NOT NULL,              -- Logradouro (Rua, Avenida, etc.)
    number VARCHAR(30) NOT NULL,               -- Número
    complement VARCHAR(100),                   -- Apartamento, bloco, sala
    neighborhood VARCHAR(100) NOT NULL,        -- Bairro
    city VARCHAR(100) NOT NULL,                -- Cidade
    state VARCHAR(2) NOT NULL,                 -- UF (SP, RJ, MG, etc.)
    reference_point VARCHAR(255),              -- Ponto de referência / Instruções para portaria
    is_default BOOLEAN NOT NULL DEFAULT FALSE, -- Endereço padrão de entrega
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_addresses_state_length CHECK (LENGTH(state) = 2)
);

COMMENT ON TABLE addresses IS 'Endereços de entrega cadastrados pelos clientes';
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_postal_code ON addresses (postal_code);

-- ------------------------------------------------------------------------------
-- 5. TRIGGER: Atualização automática de updated_at
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_addresses_updated_at ON addresses;
CREATE TRIGGER trg_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
