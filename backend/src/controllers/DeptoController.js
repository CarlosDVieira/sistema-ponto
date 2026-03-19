const { query } = require('../config/database');

const DeptoController = {

  async listar(req, res, next) {
    try {
      const { rows } = await query(
        `SELECT d.*, COUNT(u.id) as total_usuarios
         FROM departamentos d
         LEFT JOIN usuarios u ON u.departamento_id = d.id AND u.ativo = TRUE
         WHERE d.empresa_id = $1
         GROUP BY d.id ORDER BY d.nome`,
        [req.user.empresa_id]
      );
      res.json(rows);
    } catch (err) { next(err); }
  },

  async criar(req, res, next) {
    try {
      const { nome } = req.body;
      if (!nome) return res.status(400).json({ error: 'Nome é obrigatório.' });
      const { rows } = await query(
        'INSERT INTO departamentos (empresa_id, nome) VALUES ($1,$2) RETURNING *',
        [req.user.empresa_id, nome]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Departamento já existe.' });
      next(err);
    }
  },

  async atualizar(req, res, next) {
    try {
      const { nome } = req.body;
      const { rows } = await query(
        'UPDATE departamentos SET nome=$1 WHERE id=$2 AND empresa_id=$3 RETURNING *',
        [nome, req.params.id, req.user.empresa_id]
      );
      if (!rows.length) return res.status(404).json({ error: 'Departamento não encontrado.' });
      res.json(rows[0]);
    } catch (err) { next(err); }
  },

  async excluir(req, res, next) {
    try {
      const { rows } = await query(
        'SELECT COUNT(*) FROM usuarios WHERE departamento_id = $1 AND ativo = TRUE',
        [req.params.id]
      );
      if (parseInt(rows[0].count) > 0)
        return res.status(409).json({ error: 'Remova os colaboradores antes de excluir o departamento.' });

      await query('DELETE FROM departamentos WHERE id=$1 AND empresa_id=$2',
        [req.params.id, req.user.empresa_id]);
      res.json({ message: 'Departamento removido.' });
    } catch (err) { next(err); }
  },
};

module.exports = DeptoController;
