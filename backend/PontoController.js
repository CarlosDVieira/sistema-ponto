const { query }   = require('../config/database');
const { getOnlineList } = require('../config/redis');
const dayjs = require('dayjs');

const PontoController = {

  // Registra entrada ou saída automaticamente
  async registrar(req, res, next) {
    try {
      const usuario  = req.user;
      const agora    = dayjs();
      const data     = agora.format('YYYY-MM-DD');
      const hora     = agora.format('HH:mm:ss');

      // Busca último registro do dia
      const { rows: ultimos } = await query(
        `SELECT tipo FROM registros_ponto
         WHERE usuario_id = $1 AND data = $2
         ORDER BY hora DESC LIMIT 1`,
        [usuario.id, data]
      );

      const ultimo = ultimos[0]?.tipo;
      const tipo   = (!ultimo || ultimo === 'saida') ? 'entrada' : 'saida';

      const { rows } = await query(
        `INSERT INTO registros_ponto (usuario_id, empresa_id, tipo, data, hora)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [usuario.id, usuario.empresa_id, tipo, data, hora]
      );

      // Calcula horas trabalhadas se for saída
      let horasTrabalhadas = null;
      if (tipo === 'saida') {
        const { rows: deHoje } = await query(
          `SELECT tipo, hora FROM registros_ponto
           WHERE usuario_id = $1 AND data = $2
           ORDER BY hora ASC`,
          [usuario.id, data]
        );
        horasTrabalhadas = calcularMinutosDia(deHoje);
      }

      res.status(201).json({
        registro: rows[0],
        tipo,
        hora,
        horas_trabalhadas_min: horasTrabalhadas,
      });
    } catch (err) { next(err); }
  },

  // Registros do dia atual do usuário logado
  async hoje(req, res, next) {
    try {
      const data = dayjs().format('YYYY-MM-DD');
      const { rows } = await query(
        `SELECT id, tipo, hora, criado_em
         FROM registros_ponto
         WHERE usuario_id = $1 AND data = $2
         ORDER BY hora ASC`,
        [req.user.id, data]
      );

      const minutos = calcularMinutosDia(rows);
      const esperado = minutosEsperadosDia(req.user, data);

      res.json({
        data,
        registros: rows,
        minutos_trabalhados: minutos,
        minutos_esperados:   esperado,
        saldo_min:           minutos - esperado,
      });
    } catch (err) { next(err); }
  },

  // Status atual (trabalhando / pausado / sem registro)
  async status(req, res, next) {
    try {
      const data = dayjs().format('YYYY-MM-DD');
      const { rows } = await query(
        `SELECT tipo, hora FROM registros_ponto
         WHERE usuario_id = $1 AND data = $2
         ORDER BY hora DESC LIMIT 1`,
        [req.user.id, data]
      );

      const ultimo = rows[0];
      let status = 'sem_registro';
      if (ultimo?.tipo === 'entrada') status = 'trabalhando';
      if (ultimo?.tipo === 'saida')   status = 'pausado';

      res.json({ status, ultimo_registro: ultimo || null });
    } catch (err) { next(err); }
  },

  // Lista colaboradores online (via Redis)
  async online(req, res, next) {
    try {
      const ids = await getOnlineList(req.user.empresa_id);
      if (!ids.length) return res.json([]);

      const { rows } = await query(
        `SELECT u.id, u.nome, u.foto, u.cargo, d.nome as departamento
         FROM usuarios u
         LEFT JOIN departamentos d ON d.id = u.departamento_id
         WHERE u.id = ANY($1::uuid[]) AND u.empresa_id = $2`,
        [ids, req.user.empresa_id]
      );
      res.json(rows);
    } catch (err) { next(err); }
  },
};

// ── HELPERS ───────────────────────────────────────────────
function calcularMinutosDia(registros) {
  let total = 0;
  for (let i = 0; i + 1 < registros.length; i += 2) {
    if (registros[i].tipo === 'entrada' && registros[i+1]?.tipo === 'saida') {
      const [h1, m1] = registros[i].hora.split(':').map(Number);
      const [h2, m2] = registros[i+1].hora.split(':').map(Number);
      total += Math.max(0, (h2*60+m2) - (h1*60+m1));
    }
  }
  return total;
}

function minutosEsperadosDia(usuario, dataStr) {
  if (!usuario.jornada_dias || !usuario.jornada_horas_dia) return 0;
  const diaSemana = new Date(dataStr + 'T12:00:00').getDay();
  if (!usuario.jornada_dias.includes(diaSemana)) return 0;
  return Math.round(parseFloat(usuario.jornada_horas_dia) * 60);
}

module.exports = PontoController;
