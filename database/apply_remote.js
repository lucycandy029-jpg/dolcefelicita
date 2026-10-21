import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const host = 'ltfdm-186-205-20-191.run.pinggy-free.link';
const port = 39721;
const password = '...';

const userCandidates = ['admin', 'postgres', 'leserver'];
const dbCandidates = ['dolce_felicita', 'postgres', 'template1'];

async function tryConnect(user, database) {
  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    connectionTimeoutMillis: 10000,
    ssl: false
  });
  try {
    await client.connect();
    return client;
  } catch (err) {
    console.log(`[${err.code || ''} - ${err.message}]`);
    await client.end().catch(() => {});
    return null;
  }
}

async function main() {
  console.log(`Conectando ao túnel Pinggy em ${host}:${port}...`);

  let workingClient = null;
  let activeUser = null;
  let activeDb = null;

  for (const u of userCandidates) {
    for (const d of dbCandidates) {
      process.stdout.write(`Tentando usuário '${u}' no banco '${d}'... `);
      const client = await tryConnect(u, d);
      if (client) {
        console.log('✅ SUCESSO!');
        workingClient = client;
        activeUser = u;
        activeDb = d;
        break;
      } else {
        console.log('falhou.');
      }
    }
    if (workingClient) break;
  }

  if (!workingClient) {
    console.error('❌ Não foi possível autenticar com nenhuma das combinações.');
    process.exit(1);
  }

  try {
    console.log(`\nAutenticado com sucesso como '${activeUser}' no banco '${activeDb}'!`);

    // Check if dolce_felicita database exists
    const checkDb = await workingClient.query(
      "SELECT 1 FROM pg_database WHERE datname = 'dolce_felicita'"
    );

    if (checkDb.rows.length === 0) {
      console.log("Criando banco de dados 'dolce_felicita'...");
      await workingClient.query("CREATE DATABASE dolce_felicita WITH ENCODING = 'UTF8';");
      console.log("✅ Banco 'dolce_felicita' criado com sucesso!");
    } else {
      console.log("ℹ️ Banco de dados 'dolce_felicita' já existe.");
    }
    await workingClient.end();

    // Now connect directly to dolce_felicita
    console.log("\nConectando ao banco 'dolce_felicita' para aplicar a estrutura...");
    const targetClient = new Client({
      host,
      port,
      user: activeUser,
      password,
      database: 'dolce_felicita',
      connectionTimeoutMillis: 15000,
      ssl: false
    });

    await targetClient.connect();
    console.log("✅ Conectado ao banco 'dolce_felicita'!");

    const sqlPath = path.resolve('database/init_all.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executando migrações, criação de tabelas, índices e dados iniciais...');
    await targetClient.query(sqlContent);
    console.log('✅ TODAS AS TABELAS E SEEDS FORAM CRIADOS COM SUCESSO!');

    // Verification
    console.log('\n--- VERIFICAÇÃO DAS TABELAS NO SEU SERVIDOR POSTGRESQL 17 ---');
    const tablesRes = await targetClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`Tabelas criadas (${tablesRes.rows.length}):`);
    tablesRes.rows.forEach(r => console.log('  • ' + r.table_name));

    const usersRes = await targetClient.query('SELECT name, email, phone FROM users;');
    console.log('\nUsuários no banco:');
    usersRes.rows.forEach(u => console.log(`  • ${u.name} (${u.email})`));

    const productsRes = await targetClient.query('SELECT name, price, badge_tag FROM products LIMIT 6;');
    console.log('\nProdutos cadastrados no catálogo:');
    productsRes.rows.forEach(p => console.log(`  • ${p.name}: R$ ${p.price} [${p.badge_tag || ''}]`));

    const courierRes = await targetClient.query('SELECT name, phone, vehicle_type FROM couriers;');
    console.log('\nEntregadores:');
    courierRes.rows.forEach(c => console.log(`  • ${c.name} (${c.phone}) - ${c.vehicle_type}`));

    console.log('\n🎉 IMPLANTAÇÃO FINALIZADA COM 100% DE SUCESSO NO SEU SERVIDOR!');
    await targetClient.end();
  } catch (err) {
    console.error('❌ Erro durante a execução:', err);
    process.exit(1);
  }
}

main();
