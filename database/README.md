# Guia de Implantação no PostgreSQL 17 — Dolce Felicitá

Este guia passo a passo ensina como configurar o banco de dados relacional completo da **Confeitaria Dolce Felicitá** no seu servidor **PostgreSQL 17** (local, VPS ou nuvem).

---

## 📋 Sumário
1. [Pré-requisitos](#1-pré-requisitos)
2. [Criação do Banco de Dados (`dolce_felicita`)](#2-criação-do-banco-de-dados)
3. [Execução do Script Consolidado (`init_all.sql`)](#3-execução-do-script)
4. [Verificação e Testes de Conexão](#4-verificação-e-testes)
5. [Consultas Úteis para o Dia a Dia](#5-consultas-úteis-para-o-dia-a-dia)
6. [Integração com Backend Node / Express](#6-integração-com-backend)

---

## 1. Pré-requisitos
- **PostgreSQL 17** (ou versões 14, 15, 16) instalado e em execução na porta padrão `5432`.
- Uma das ferramentas de administração:
  - **Terminal / Shell** com comando `psql`
  - **pgAdmin 4** (interface gráfica oficial)
  - **DBeaver** ou **VS Code** (extensão PostgreSQL)

---

## 2. Criação do Banco de Dados

Abra seu terminal ou console SQL como superusuário (`postgres`):

```bash
# Conectar como usuário postgres
psql -U postgres
```

Dentro do `psql`, crie o banco de dados com codificação UTF-8:

```sql
-- Criação do banco com suporte a acentuação e emojis
CREATE DATABASE dolce_felicita
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'C.UTF-8'
    LC_CTYPE = 'C.UTF-8'
    TEMPLATE = template0;

-- (Opcional) Crie um usuário dedicado para a aplicação:
CREATE USER felicita_app WITH ENCRYPTED PASSWORD 'SuaSenhaSegura123!';
GRANT ALL PRIVILEGES ON DATABASE dolce_felicita TO felicita_app;
```

---

## 3. Execução do Script Consolidado

O repositório já contém o arquivo único **`database/init_all.sql`**, que cria:
- Extensão `pgcrypto` para chaves UUID v4 automáticas.
- Tabelas de **Usuários**, **Perfis (RBAC)** e **Endereços com CEP**.
- Catálogo de **Categorias**, **Produtos**, **Fotos** e **Opcionais**.
- Controle de **Estoque** com alertas de fornada.
- Tabela de **Pedidos** com exclusão em cascata segura (`ON DELETE CASCADE`).
- Tabela de **Entregadores** (com telefone editável para WhatsApp) e **Entregas**.
- Configurações da loja e auditoria.
- Dados iniciais (seeds) com administrador padrão e produtos do cardápio.

### Opção A: Pelo Terminal / Linha de Comando (Mais Rápido)

No diretório raiz do projeto:

```bash
psql -U postgres -d dolce_felicita -f database/init_all.sql
```

Se criou o usuário `felicita_app`:
```bash
psql -U felicita_app -d dolce_felicita -f database/init_all.sql
```

### Opção B: Pelo pgAdmin 4

1. Abra o **pgAdmin 4** e conecte-se ao seu servidor.
2. Na árvore à esquerda, clique com o botão direito em **Databases** > **Refresh**.
3. Localize o banco **`dolce_felicita`**.
4. Clique com o botão direito sobre `dolce_felicita` e selecione **Query Tool**.
5. Abra o arquivo `database/init_all.sql` (ícone de pasta ou copie e cole todo o conteúdo).
6. Clique no botão **Execute / Run** (ícone de Play ou tecla **F5**).
7. Verifique a mensagem: `"COMMIT - Query returned successfully"`.

### Opção C: Pelo DBeaver

1. Abra o **DBeaver** e crie uma nova conexão PostgreSQL apontando para `dolce_felicita`.
2. Abra um novo editor SQL (`Ctrl + Alt + Enter`).
3. Cole o conteúdo de `database/init_all.sql` e execute como script (`Alt + X`).

---

## 4. Verificação e Testes

Execute os comandos abaixo no `psql` ou pgAdmin para confirmar que tudo subiu corretamente:

```sql
-- 1. Listar todas as tabelas criadas (deve listar 17 tabelas)
\dt

-- 2. Conferir o usuário Administrador cadastrado
SELECT id, name, email, phone, is_active FROM users;

-- 3. Conferir produtos do cardápio com preços e categorias
SELECT p.name, c.name AS categoria, p.price, p.badge_tag
FROM products p
JOIN categories c ON c.id = p.category_id;

-- 4. Conferir saldo de estoque inicial
SELECT p.name, i.quantity_available AS estoque_atual, i.min_alert_threshold
FROM inventory i
JOIN products p ON p.id = i.product_id;

-- 5. Conferir entregador padrão com telefone
SELECT name, phone, vehicle_type, rating FROM couriers;
```

---

## 5. Consultas Úteis para o Dia a Dia

### Como Excluir um Pedido com Segurança (Cascade)
Como as chaves estrangeiras de pagamentos, itens e entregas usam `ON DELETE CASCADE`, basta um comando:

```sql
-- Excluir um pedido específico pelo número:
DELETE FROM orders WHERE order_number = 4829;

-- Excluir todos os pedidos de teste:
DELETE FROM orders;
```

### Como Zerar o Faturamento da Loja
```sql
-- Atualiza o parâmetro na tabela store_settings:
UPDATE store_settings
SET value = jsonb_build_object(
    'is_revenue_reset', true, 
    'reset_at', CURRENT_TIMESTAMP
)
WHERE key = 'finance_state';
```

### Como Atualizar o Telefone de um Entregador
```sql
UPDATE couriers
SET phone = '(11) 97777-8888'
WHERE name = 'Mateus Siqueira';
```

---

## 6. Integração com Backend (Node.js / TypeScript)

Exemplo de string de conexão no arquivo `.env`:

```env
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/dolce_felicita?sslmode=disable
```

Exemplo com `pg` (node-postgres) ou Drizzle ORM:

```typescript
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```
