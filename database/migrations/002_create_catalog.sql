-- ==============================================================================
-- Migração 002: Catálogo de Produtos, Categorias e Imagens
-- Banco de Dados: dolce_felicita (PostgreSQL 17)
-- Aplicação: Dolce Felicitá Doces e Cookies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABELA: categories (Categorias comerciais)
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

COMMENT ON TABLE categories IS 'Categorias para organização de cookies, brownies, bolos e kits';

-- ------------------------------------------------------------------------------
-- 2. TABELA: products (Produtos da confeitaria)
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
    badge_tag VARCHAR(50), -- Ex: 'Fornada do Dia', 'Mais Pedido', 'Edição Limitada', 'Cacau 70%'
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

-- ------------------------------------------------------------------------------
-- 3. TABELA: product_images (Imagens e fotografias artesanais)
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
-- 4. TABELA: product_addons (Opcionais e adicionais para turbinar o doce)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- NULL significa adicional global
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_addons_product ON product_addons(product_id);

-- Trigger de updated_at
DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
