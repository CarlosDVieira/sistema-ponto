require('dotenv').config();
const { pool } = require('../config/database');

const migrations = `

-- ── EMPRESAS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empresas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          VARCHAR(150) NOT NULL,
  cnpj          VARCHAR(18)  NOT NULL UNIQUE,
  email         VARCHAR(150),
  telefone      VARCHAR(20),
  logradouro    VARCHAR(200),
  numero        VARCHAR(20),
  complemento   VARCHAR(100),
  bairro        VARCHAR(100),
  cidade        VARCHAR(100),
  estado        CHAR(2),
  cep           VARCHAR(9),
  logo          TEXT,
  ativo         BOOLEAN DEFAULT TRUE,
  criado_em     TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ── DEPARTAMENTOS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departamentos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nome          VARCHAR(100) NOT NULL,
  criado_em     TIMESTAMP DEFAULT NOW(),
  UNIQUE(empresa_id, nome)
);

-- ── USUÁRIOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id            UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  departamento_id       UUID REFERENCES departamentos(id) ON DELETE SET NULL,
  nome                  VARCHAR(150) NOT NULL,
  email                 VARCHAR(150) NOT NULL,
  senha_hash            VARCHAR(255) NOT NULL,
  matricula             VARCHAR(50)  NOT NULL,
  cargo                 VARCHAR(100),
  role                  VARCHAR(20)  NOT NULL DEFAULT 'user'
                          CHECK (role IN ('master','admin','supervisor','user')),
  -- Deptos que admin/supervisor pode visualizar
  deptos_acesso         UUID[],
  -- Dados pessoais
  cpf                   VARCHAR(14),
  telefone              VARCHAR(20),
  foto                  TEXT,
  nascimento            DATE,
  admissao              DATE,
  -- Endereço
  logradouro            VARCHAR(200),
  numero                VARCHAR(20),
  complemento           VARCHAR(100),
  bairro                VARCHAR(100),
  cidade                VARCHAR(100),
  estado                CHAR(2),
  cep                   VARCHAR(9),
  -- Jornada
  jornada_horas_dia     NUMERIC(4,1),
  jornada_horas_semana  NUMERIC(5,1),
  jornada_dias          INT[],
  alerta_debito         NUMERIC(4,1),
  -- Controle
  ativo                 BOOLEAN DEFAULT TRUE,
  primeiro_acesso       BOOLEAN DEFAULT TRUE,
  criado_em             TIMESTAMP DEFAULT NOW(),
  atualizado_em         TIMESTAMP DEFAULT NOW(),
  UNIQUE(empresa_id, email),
  UNIQUE(empresa_id, matricula)
);

-- ── REGISTROS DE PONTO ───────────────────────────────────
CREATE TABLE IF NOT EXISTS registros_ponto (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  tipo        VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada','saida')),
  data        DATE        NOT NULL,
  hora        TIME        NOT NULL,
  criado_em   TIMESTAMP DEFAULT NOW()
);

-- ── ÍNDICES ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa    ON usuarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email      ON usuarios(empresa_id, email);
CREATE INDEX IF NOT EXISTS idx_departamentos_empresa ON departamentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ponto_usuario       ON registros_ponto(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ponto_empresa_data  ON registros_ponto(empresa_id, data);
CREATE INDEX IF NOT EXISTS idx_ponto_data          ON registros_ponto(data);

-- ── TRIGGER: atualiza atualizado_em ──────────────────────
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_empresas_updated  ON empresas;
DROP TRIGGER IF EXISTS trg_usuarios_updated  ON usuarios;

CREATE TRIGGER trg_empresas_updated
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_usuarios_updated
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

`;

async function migrate() {
  console.log('→ Executando migrations...');
  try {
    await pool.query(migrations);
    console.log('✓ Tabelas criadas com sucesso!');
  } catch (err) {
    console.error('✗ Erro na migration:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
