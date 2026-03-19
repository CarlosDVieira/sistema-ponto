const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { cacheDelPattern } = require('../config/redis');

// Filtra usuários visíveis conforme role
function filtroVisibilidade(user) {
  if (user.role === 'master') return { where: 'u.empresa_id = $1', params: [user.empresa_id] };
  if (user.role === 'admin') {
    const deptos = user.deptos_acesso?.length ? user.deptos_acesso : [user.departamento_id];
    return { where: 'u.empresa_id = $1 AND u.departamento_id = ANY($2::uuid[])', params: [user.empresa_id, deptos] };
  }
  // supervisor vê só seu depto
  return { where: 'u.empresa_id = $1 AND u.departamento_id = $2', params: [user.empresa_id, user.departamento_id] };
}

const UsuarioController = {

  async listar(req, res, next) {
    try {
      const { where, params } = filtroVisibilidade(req.user);
      const { depto, role, busca } = req.query;
      let sql = `SELECT u.id, u.nome, u.email, u.matricula, u.cargo, u.role,
                        u.foto, u.telefone, u.nascimento, u.admissao, u.ativo,
                        u.jornada_horas_dia, u.jornada_horas_semana, u.jornada_dias, u.alerta_debito,
                        u.departamento_id, d.nome as departamento_nome,
                        u.criado_em
                 FROM usuarios u
                 LEFT JOIN departamentos d ON d.id = u.departamento_id
                 WHERE ${where}`;
      if (depto)  { sql += ` AND u.departamento_id = $${params.length+1}`; params.push(depto); }
      if (role)   { sql += ` AND u.role = $${params.length+1}`; params.push(role); }
      if (busca)  { sql += ` AND (u.nome ILIKE $${params.length+1} OR u.email ILIKE $${params.length+1} OR u.matricula ILIKE $${params.length+1})`; params.push(`%${busca}%`); }
      sql += ' ORDER BY u.nome';

      const { rows } = await query(sql, params);
      res.json(rows);
    } catch (err) { next(err); }
  },

  async buscar(req, res, next) {
    try {
      const id = req.params.id;
      // Usuário comum só acessa a si mesmo
      if (req.user.role === 'user' && req.user.id !== id)
        return res.status(403).json({ error: 'Acesso negado.' });

      const { rows } = await query(
        `SELECT u.*, d.nome as departamento_nome
         FROM usuarios u LEFT JOIN departamentos d ON d.id = u.departamento_id
         WHERE u.id = $1 AND u.empresa_id = $2`,
        [id, req.user.empresa_id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
      delete rows[0].senha_hash;
      res.json(rows[0]);
    } catch (err) { next(err); }
  },

  async criar(req, res, next) {
    try {
      const {
        nome, email, senha, matricula, cargo, role, departamento_id, deptos_acesso,
        cpf, telefone, nascimento, admissao,
        logradouro, numero, complemento, bairro, cidade, estado, cep,
        jornada_horas_dia, jornada_horas_semana, jornada_dias, alerta_debito
      } = req.body;

      if (!nome || !email || !senha || !matricula)
        return res.status(400).json({ error: 'Nome, e-mail, senha e matrícula são obrigatórios.' });

      const hash = await bcrypt.hash(senha, 12);
      const { rows } = await query(
        `INSERT INTO usuarios
          (empresa_id, departamento_id, nome, email, senha_hash, matricula, cargo, role, deptos_acesso,
           cpf, telefone, nascimento, admissao, logradouro, numero, complemento, bairro, cidade, estado, cep,
           jornada_horas_dia, jornada_horas_semana, jornada_dias, alerta_debito)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
         RETURNING id, nome, email, matricula, cargo, role, departamento_id, criado_em`,
        [req.user.empresa_id, departamento_id, nome, email, hash, matricula,
         cargo, role || 'user', deptos_acesso || null,
         cpf, telefone, nascimento || null, admissao || null,
         logradouro, numero, complemento, bairro, cidade, estado, cep,
         jornada_horas_dia || null, jornada_horas_semana || null,
         jornada_dias || null, alerta_debito || null]
      );

      await cacheDelPattern(`usuarios:${req.user.empresa_id}`);
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'E-mail ou matrícula já cadastrado.' });
      next(err);
    }
  },

  async atualizar(req, res, next) {
    try {
      const id = req.params.id;
      const {
        nome, email, cargo, role, departamento_id, deptos_acesso,
        cpf, telefone, nascimento, admissao,
        logradouro, numero, complemento, bairro, cidade, estado, cep,
        jornada_horas_dia, jornada_horas_semana, jornada_dias, alerta_debito, ativo
      } = req.body;

      const { rows } = await query(
        `UPDATE usuarios SET
          nome=$1, email=$2, cargo=$3, role=$4, departamento_id=$5, deptos_acesso=$6,
          cpf=$7, telefone=$8, nascimento=$9, admissao=$10,
          logradouro=$11, numero=$12, complemento=$13, bairro=$14, cidade=$15, estado=$16, cep=$17,
          jornada_horas_dia=$18, jornada_horas_semana=$19, jornada_dias=$20, alerta_debito=$21, ativo=$22
         WHERE id=$23 AND empresa_id=$24
         RETURNING id, nome, email, cargo, role, departamento_id, ativo`,
        [nome, email, cargo, role, departamento_id, deptos_acesso || null,
         cpf, telefone, nascimento || null, admissao || null,
         logradouro, numero, complemento, bairro, cidade, estado, cep,
         jornada_horas_dia || null, jornada_horas_semana || null,
         jornada_dias || null, alerta_debito || null, ativo ?? true,
         id, req.user.empresa_id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
      await cacheDelPattern(`usuarios:${req.user.empresa_id}`);
      res.json(rows[0]);
    } catch (err) { next(err); }
  },

  async excluir(req, res, next) {
    try {
      await query('UPDATE usuarios SET ativo = FALSE WHERE id = $1 AND empresa_id = $2',
        [req.params.id, req.user.empresa_id]);
      res.json({ message: 'Usuário desativado.' });
    } catch (err) { next(err); }
  },

  async uploadFoto(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      const id = req.params.id;
      // Usuário comum só atualiza a própria foto
      if (req.user.role === 'user' && req.user.id !== id)
        return res.status(403).json({ error: 'Acesso negado.' });
      const url = `/uploads/${req.file.filename}`;
      await query('UPDATE usuarios SET foto = $1 WHERE id = $2 AND empresa_id = $3',
        [url, id, req.user.empresa_id]);
      res.json({ foto: url });
    } catch (err) { next(err); }
  },
};

module.exports = UsuarioController;
