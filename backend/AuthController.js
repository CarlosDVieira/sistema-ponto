const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { query } = require('../config/database');
const { blacklistToken } = require('../config/redis');

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, empresa_id: usuario.empresa_id, role: usuario.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

const AuthController = {

  async login(req, res, next) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });

      const { rows } = await query(
        `SELECT u.*, e.nome as empresa_nome, e.ativo as empresa_ativa
         FROM usuarios u
         JOIN empresas e ON e.id = u.empresa_id
         WHERE LOWER(u.email) = LOWER($1) AND u.ativo = TRUE`,
        [email.trim()]
      );

      if (!rows.length) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

      const usuario = rows[0];
      if (!usuario.empresa_ativa) return res.status(403).json({ error: 'Empresa inativa. Contate o administrador.' });

      const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
      if (!senhaOk) return res.status(401).json({ error: 'E-mail ou senha incorretos.' });

      const token = gerarToken(usuario);

      // Remove campos sensíveis
      delete usuario.senha_hash;

      res.json({
        token,
        usuario: {
          id:            usuario.id,
          nome:          usuario.nome,
          email:         usuario.email,
          matricula:     usuario.matricula,
          cargo:         usuario.cargo,
          role:          usuario.role,
          foto:          usuario.foto,
          empresa_id:    usuario.empresa_id,
          empresa_nome:  usuario.empresa_nome,
          departamento_id: usuario.departamento_id,
          deptos_acesso: usuario.deptos_acesso,
          jornada_horas_dia:    usuario.jornada_horas_dia,
          jornada_horas_semana: usuario.jornada_horas_semana,
          jornada_dias:         usuario.jornada_dias,
          alerta_debito:        usuario.alerta_debito,
          primeiro_acesso:      usuario.primeiro_acesso,
        }
      });
    } catch (err) { next(err); }
  },

  async logout(req, res, next) {
    try {
      await blacklistToken(req.token, 28800);
      res.json({ message: 'Logout realizado com sucesso.' });
    } catch (err) { next(err); }
  },

  async me(req, res) {
    const u = req.user;
    delete u.senha_hash;
    res.json(u);
  },

  async alterarSenha(req, res, next) {
    try {
      const { senha_atual, senha_nova, senha_confirma } = req.body;
      if (!senha_atual || !senha_nova || !senha_confirma)
        return res.status(400).json({ error: 'Preencha todos os campos.' });
      if (senha_nova !== senha_confirma)
        return res.status(400).json({ error: 'As senhas não conferem.' });
      if (senha_nova.length < 6)
        return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });

      const { rows } = await query('SELECT senha_hash FROM usuarios WHERE id = $1', [req.user.id]);
      const ok = await bcrypt.compare(senha_atual, rows[0].senha_hash);
      if (!ok) return res.status(401).json({ error: 'Senha atual incorreta.' });

      const hash = await bcrypt.hash(senha_nova, 12);
      await query(
        'UPDATE usuarios SET senha_hash = $1, primeiro_acesso = FALSE WHERE id = $2',
        [hash, req.user.id]
      );
      res.json({ message: 'Senha alterada com sucesso.' });
    } catch (err) { next(err); }
  },

  async refresh(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ error: 'Token não fornecido.' });
      const payload = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      const { rows } = await query('SELECT * FROM usuarios WHERE id = $1 AND ativo = TRUE', [payload.id]);
      if (!rows.length) return res.status(401).json({ error: 'Usuário não encontrado.' });
      res.json({ token: gerarToken(rows[0]) });
    } catch (err) { next(err); }
  },
};

module.exports = AuthController;
