const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || 'pontofacil',
  user:     process.env.DB_USER     || 'pontofacil_user',
  password: process.env.DB_PASS,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool do PostgreSQL:', err);
});

async function connectDB() {
  const client = await pool.connect();
  console.log('✓ PostgreSQL conectado');
  client.release();
}

// Helper para queries
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 1000) console.warn(`Query lenta (${duration}ms):`, text);
  return res;
}

// Helper para transações
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, transaction, connectDB };
