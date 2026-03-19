require('dotenv').config();
const { pool } = require('../config/database');
const bcrypt   = require('bcryptjs');

async function seed() {
  console.log('→ Executando seed...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Empresa padrão
    const empRes = await client.query(`
      INSERT INTO empresas (nome, cnpj, email, telefone, cidade, estado)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (cnpj) DO UPDATE SET nome = EXCLUDED.nome
      RETURNING id
    `, ['PontoFácil Demo', '00.000.000/0001-00', 'admin@pontofacil.com', '(00) 0000-0000', 'São Paulo', 'SP']);

    const empresaId = empRes.rows[0].id;

    // Departamentos padrão
    const deptos = ['Comercial','Administrativo','Desenvolvimento','RH','Operacional'];
    for (const nome of deptos) {
      await client.query(`
        INSERT INTO departamentos (empresa_id, nome)
        VALUES ($1, $2) ON CONFLICT DO NOTHING
      `, [empresaId, nome]);
    }

    // Admin master padrão
    const senhaHash = await bcrypt.hash('admin123', 12);
    await client.query(`
      INSERT INTO usuarios (empresa_id, nome, email, senha_hash, matricula, cargo, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (empresa_id, email) DO NOTHING
    `, [empresaId, 'Administrador', 'admin@pontofacil.com', senhaHash, '00001', 'Admin Master', 'master']);

    await client.query('COMMIT');
    console.log('✓ Seed concluído!');
    console.log('  Empresa:  PontoFácil Demo');
    console.log('  Login:    admin@pontofacil.com');
    console.log('  Senha:    admin123');
    console.log('  ⚠️  Troque a senha após o primeiro acesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Erro no seed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
