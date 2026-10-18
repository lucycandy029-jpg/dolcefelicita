-- ==============================================================================
-- Seed Inicial: Catálogo Completo Felicitá Doces e Cookies
-- Banco de Dados: dolce_felicita (PostgreSQL 17)
-- ==============================================================================

-- 1. Categorias
INSERT INTO categories (id, name, description, icon_name, display_order)
VALUES
    ('cookies', 'Cookies Artesanais', 'Cookies recheados com massa crocante e centro cremoso', 'cookie', 1),
    ('brownies', 'Brownies & Fudges', 'Brownies molhadinhos feitos com puro chocolate belga', 'cake', 2),
    ('bolos-tortas', 'Bolos & Tortas', 'Fatias gourmets e bolos no pote refrescantes', 'bakery_dining', 3),
    ('doces-finos', 'Doces Finos & Bombons', 'Brigadeiros nobres e docinhos gourmet', 'lunch_dining', 4),
    ('bebidas-cafes', 'Bebidas & Cafés', 'Cappuccinos, cafés especiais e bebidas geladas', 'coffee', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 2. Produtos Principais
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
        5.0,
        89
    ),
    (
        'c0010000-0000-0000-0000-000000000004',
        'cookies',
        'Cookie Triplo Chocolate Belga',
        'cookie-triplo-chocolate-belga',
        'Três variações de puro chocolate Callebaut: meio amargo 70%, ao leite suave e raspas de chocolate branco.',
        'Intensa explosão achocolatada para quem não dispensa cacau de primeira linha com textura macia por dentro.',
        15.50,
        'Unidade 120g',
        120,
        'Cacau 70%',
        TRUE,
        4.9,
        310
    ),
    (
        'b0010000-0000-0000-0000-000000000001',
        'brownies',
        'Brownie Fudge Caramelo',
        'brownie-fudge-caramelo',
        'Brownie denso de chocolate belga com swirl de caramelo salgado e flor de sal Maldon.',
        'Textura extremamente fudge e aveludada, coberto por calda generosa de caramelo artesanal toffee.',
        14.00,
        'Fatia 150g',
        150,
        'Caramelo Flor de Sal',
        TRUE,
        4.9,
        215
    ),
    (
        'b0010000-0000-0000-0000-000000000002',
        'brownies',
        'Brownie Vulcão Brigadeiro',
        'brownie-vulcao-brigadeiro',
        'Brownie de puro chocolate 70% cacau coberto de brigadeiro cremoso de colher e granulado nobre.',
        'O clássico brasileiro elevado à alta confeitaria. Molhadinho, denso e repleto de afeto.',
        15.00,
        'Fatia 160g',
        160,
        'Super Recheado',
        TRUE,
        5.0,
        410
    ),
    (
        'b0010000-0000-0000-0000-000000000003',
        'brownies',
        'Brownie Supremo Nutella & Morango',
        'brownie-supremo-nutella-morango',
        'Brownie denso de cacau 70%, farta cobertura de Nutella e morangos frescos selecionados.',
        'Fatia gourmet de brownie fudge com ganache de Nutella e morangos frescos colhidos no dia.',
        22.00,
        'Fatia Gourmet 180g',
        180,
        'Top #1 Vendas',
        TRUE,
        5.0,
        518
    ),
    (
        't0010000-0000-0000-0000-000000000001',
        'bolos-tortas',
        'Bolo no Pote Pistache & Framboesa',
        'bolo-no-pote-pistache-framboesa',
        'Pão de ló levinho, brigadeiro aveludado de pistache artesanal e geleia pura de framboesa.',
        'Camadas perfeitas em pote de vidro reutilizável. Equilíbrio sofisticado entre a doçura do pistache e a acidez fresca da framboesa.',
        24.00,
        'Pote Vidro 220g',
        220,
        'Pistache Puro',
        TRUE,
        4.9,
        120
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Imagens dos Produtos
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order)
VALUES
    ('c0010000-0000-0000-0000-000000000001', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCI9Q2Q983DUN78ApFjsf6giUl5bNQw43hicPMNuQdfluHfpxDWQnPMwyexvuvkGoMti9NDD_gC8YvkEi_VgvHyTi7gkcta7R7V7yNP-WFjTOBRBqSprkpCCh0amzAIONLS0SawvXJWEXo1-8vKn0rJ6MMVwtj29R7ugGXBHgyfNzUOH7PzIy5XagYcXz0XUN7Gpt4s1wfUfOpiRYJZGxAM9E2yyubWUWv_QpNYA_oOx9u0tGvSpYf9Iw', 'Cookie Tortinha de Nutella', TRUE, 1),
    ('c0010000-0000-0000-0000-000000000002', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsqumJSa2Vni1uc1DMkqjBTHipMbIMwQLpNekxoTQldB77pVSnNLPV-rVVaOMhx5FnpwmxYSrXEHVLp-BeL84CQ8OUmY5H2VxDRL9XLBsLGQjhSnyOHxb2mlVz_QuJERan6u8fnqBhb5MjEEjFOEL0y1odcawp7wVu3gfAwp0_qE4p22dA7TDrxq_eUydB0pODiOhluOK5HO7kp92O5vBhVyvcBJQSx8Xm_mY2jEAoMBSV7DI6pWePsA', 'Cookie Pistache & Chocolate Branco', TRUE, 1),
    ('c0010000-0000-0000-0000-000000000003', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSYv2MAFkg1lkYyQwN5FU_KqxmKgE2p7p7KBogHGErHFY6NJJsHWb0fvCBiI9vXPu2sH0pHhetFNBIUI2reu05lwqIaJ4bvhAbxbBCnU-JZrtE5BgIxgFG8NZ9Jl2y27oAQRw7Q67R0QUtv4OcKwf8sCGT2rFxbhW2dftpT2zPeNbr5MJdhsePtcTh4UDTWtUvue_QrjqTfjay2IBQzhH-VkKqKUQPGxWjpyk3DhOlWUndxHYRpf2pfA', 'Cookie Red Velvet Melt', TRUE, 1),
    ('c0010000-0000-0000-0000-000000000004', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqHvKDPsEqQAIKcBSAvfDtdR_VUiurSwD55GuZFQuCedRm88_XDYYyyaEb9H-_phN0Wdig1myiTPg1azhgXGrhfigUaO1J2NGY0itmtmSzaBsGwfDU8UBqws3BR-f62fum7xm52buAk99lk9Xf7l9iUFnFGP552eD11IkFQfokBL4Is0S5syrxLE5E1M4psSYBYwig2mCfYuVOXi9FOjKgIhIUJLwxpNPQAukp8cxnBrUzP2aN6itQ6A', 'Cookie Triplo Chocolate Belga', TRUE, 1),
    ('b0010000-0000-0000-0000-000000000001', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB6mO69ISAt0b0uufvBMXKkw0Qs-B02I-wIC_aOv7AHGFJDchqcsJ100Jr0dV0bXByjtCU-m6EXFTD5x1v6FmYRUNv-wnuUqU7qD1LahVgB0Dv5Zdzh1ZtVNeGwHdUK70R29yhJK2oNqGD47yi7vEiy9ibNSnedzrHnK39Mj0tRYnbto3SPNkFmDIG83B-xglNUXh3Td2HOzPSDJqpoGW0Gll0NSVqfe4FPskvir0rWJFjZUFJZdfOwZA', 'Brownie Fudge Caramelo', TRUE, 1),
    ('b0010000-0000-0000-0000-000000000002', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBd_4s4R7pCkqY-8cSuNNNIV18E7ixpraBrFQP28964Pw9HdeZeUaSaWQq6ZYJWSVXDxQa4-U_EgsokM-9Hx9MzHBxZ7IdihhQzKiP-_MkiEFpJ8NZrKyzirjtNlyM0F02vFRDYLxDkg5fJVByOtTO-8Ecdvi6NAWarrpJFIwLmBdRoULSIwDffjKFuFhUJ4KbsgxMTxHMlSP79XnaTkkaLVo775t1tCp5t7nMi-ujDfwCWEpOzejs0SA', 'Brownie Vulcão Brigadeiro', TRUE, 1)
ON CONFLICT DO NOTHING;

-- 4. Opcionais / Adicionais Globais
INSERT INTO product_addons (id, product_id, name, description, price)
VALUES
    ('a0010000-0000-0000-0000-000000000001', NULL, 'Calda extra de Nutella morna', 'Pote separado 30ml para regar', 4.50),
    ('a0010000-0000-0000-0000-000000000002', NULL, 'Cobertura de Leite Ninho', 'Generosamente polvilhado no topo', 3.00),
    ('a0010000-0000-0000-0000-000000000003', NULL, 'Embalagem para Presente', 'Caixa rígida com fita de cetim rosa', 5.00),
    ('a0010000-0000-0000-0000-000000000004', NULL, 'Toque de Ninho & Mensagem Afetiva', 'Mini cartão caligrafado à mão', 3.00)
ON CONFLICT (id) DO NOTHING;

-- 5. Inicialização de Estoque
INSERT INTO inventory (product_id, quantity_available, quantity_reserved, min_alert_threshold, last_batch_time)
VALUES
    ('c0010000-0000-0000-0000-000000000001', 35, 2, 8, CURRENT_TIMESTAMP - INTERVAL '1 hour'),
    ('c0010000-0000-0000-0000-000000000002', 20, 0, 5, CURRENT_TIMESTAMP - INTERVAL '2 hours'),
    ('c0010000-0000-0000-0000-000000000003', 28, 1, 6, CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
    ('c0010000-0000-0000-0000-000000000004', 40, 3, 10, CURRENT_TIMESTAMP - INTERVAL '1 hour 30 minutes'),
    ('b0010000-0000-0000-0000-000000000001', 25, 0, 5, CURRENT_TIMESTAMP - INTERVAL '3 hours'),
    ('b0010000-0000-0000-0000-000000000002', 30, 2, 8, CURRENT_TIMESTAMP - INTERVAL '2 hours')
ON CONFLICT (product_id) DO NOTHING;
