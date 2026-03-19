const jwt = require('jsonwebtoken');
const { isTokenBlacklisted, setOnline } = require('../config/redis');
const { query } = require('../config/database');

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido.' });
    }

    const token = header.split(' ')[1];

    // Verifica blacklist
    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Token inválido (sessão encerrada).' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Carrega usuário atualizado do banco
    const { rows } = await query(
      `SELECT u.id, u.empresa_id, u.departamento_id, u.nome, u.email,
              u.matricula, u.cargo, u.role, u.deptos_acesso,
              u.ativo, u.foto,
              u.jornada_horas_dia, u.jornada_horas_semana,
              u.jornada_dias, u.alerta_debito
       FROM usuarios u
       WHERE u.id = $1 AND u.ativo = TRUE`,
      [payload.id]
    );

    if (!rows.length) return res.status(401).json({ error: 'Usuário não encontrado.' });

    req.user  = rows[0];
    req.token = token;

    // Atualiza status online no Redis
    await setOnline(req.user.id, req.user.empresa_id);

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expirado.' });
    if (err.name === 'JsonWebTokenError')  return res.status(401).json({ error: 'Token inválido.' });
    next(err);
  }
}

// Verifica roles
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    next();
  };
}

// Garante que usuário acessa só dados da própria empresa
function sameEmpresa(req, res, next) {
  const empresaId = req.params.empresaId || req.body.empresa_id;
  if (empresaId && empresaId !== req.user.empresa_id) {
    return res.status(403).json({ error: 'Acesso negado a esta empresa.' });
  }
  next();
}

module.exports = { authMiddleware, requireRole, sameEmpresa };
