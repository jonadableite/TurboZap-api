/**
 * Script para executar a migration da tabela reminders
 * Uso: node scripts/run-reminders-migration.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Try to load from multiple env files
const envFiles = [
  path.join(__dirname, '../.env.local'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../../.env'),
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    require('dotenv').config({ path: envFile });
    break;
  }
}

// Also try loading from process.env (may be set by system)
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no .env.local');
  console.error('Por favor, defina DATABASE_URL no arquivo .env.local');
  process.exit(1);
}

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔄 Conectando ao banco de dados...');
    await pool.query('SELECT 1');
    console.log('✅ Conectado com sucesso!');

    console.log('🔄 Lendo arquivo de migration...');
    const migrationPath = path.join(__dirname, '../migrations/create_reminders_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Executando migration...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration executada com sucesso!');
    
    // Verificar se a tabela foi criada
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reminders'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('✅ Tabela "reminders" criada e verificada!');
      
      // Contar índices
      const indexes = await pool.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'reminders';
      `);
      console.log(`✅ ${indexes.rows.length} índices criados`);
    } else {
      console.warn('⚠️  Tabela "reminders" não foi encontrada após a migration');
    }
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    
    if (error.code === '42P01') {
      console.error('   Tabela já existe ou erro na estrutura SQL');
    } else if (error.code === '23503') {
      console.error('   Erro de foreign key - verifique se a tabela "users" existe');
    } else {
      console.error('   Detalhes:', error);
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

