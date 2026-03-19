const { query, transaction } = require('../config/database');
const { cacheDelPattern }    = require('../config/redis');
const path = require('path');
const fs   = require('fs');

const EmpresaController = {

  async listar(req, res, next) {
    try {
      const { rows } = await query(
        `SELECT e.*, COUNT(u.id) as total_usuarios
         FROM empresas e
         LEFT JOIN usuarios u ON u.empresa_id = e.id AND u.ativo = TRUE
         GROUP BY e.id ORDER BY e.nome`
      );
      res.json(rows);
    } catch (err) { next(err); }
  },

  async criar(req, res, next) {
    try {
      const { nome, cnpj, email, telefone, logradouro, numero, complemento, bairro, cidade, estado, cep } = req.body;
      if (!nome || !cnpj) return res.status(400).json({ error: 'Nome e CNPJ são obrigatórios.' });

      const { rows } = await query(
        `INSERT INTO empresas (nome,cnpj,email,telefone,logradouro,numero,complemento,bairro,cidade,estado,cep)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [nome, cnpj, email, telefone, logradouro, numero, complemento, bairro, cidade, estado, cep]
      );

      // Cria departamentos padrão
      const deptos = ['Comercial','Administrativo','Desenvolvimento','RH','Operacional'];
      for (const d of deptos) {
        await query('INSERT INTO departamentos (empresa_id, nome) VALUES ($1,$2) ON CONFLICT DO NOTHING', [rows[0].id, d]);
      }

      res.status(201).json(rows[0]);
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'CNPJ já cadastrado.' });
      next(err);
    }
  },

  async buscar(req, res, next) {
    try {
      const id = req.params.id;
      // Admin só acessa a própria empresa
      if (req.user.role === 'admin' && req.user.empresa_id !== id)
        return res.status(403).json({ error: 'Acesso negado.' });

      const { rows } = await query('SELECT * FROM empresas WHERE id = $1', [id]);
      if (!rows.length) return res.status(404).json({ error: 'Empresa não encontrada.' });
      res.json(rows[0]);
    } catch (err) { next(err); }
  },

  async atualizar(req, res, next) {
    try {
      const id = req.params.id;
      if (req.user.role === 'admin' && req.user.empresa_id !== id)
        return res.status(403).json({ error: 'Acesso negado.' });

      const { nome, cnpj, email, telefone, logradouro, numero, complemento, bairro, cidade, estado, cep, ativo } = req.body;
      const { rows } = await query(
        `UPDATE empresas SET nome=$1,cnpj=$2,email=$3,telefone=$4,logradouro=$5,
         numero=$6,complemento=$7,bairro=$8,cidade=$9,estado=$10,cep=$11,ativo=$12
         WHERE id=$13 RETURNING *`,
        [nome, cnpj, email, telefone, logradouro, numero, complemento, bairro, cidade, estado, cep, ativo ?? true, id]
      );
      await cacheDelPattern(`empresa:${id}`);
      res.json(rows[0]);
    } catch (err) { next(err); }
  },

  async excluir(req, res, next) {
    try {
      await query('UPDATE empresas SET ativo = FALSE WHERE id = $1', [req.params.id]);
      res.json({ message: 'Empresa desativada.' });
    } catch (err) { next(err); }
  },

  async uploadLogo(req, res, next) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      const url = `/uploads/${req.file.filename}`;
      await query('UPDATE empresas SET logo = $1 WHERE id = $2', [url, req.params.id]);
      res.json({ logo: url });
    } catch (err) { next(err); }
  },
};

module.exports = EmpresaController;
