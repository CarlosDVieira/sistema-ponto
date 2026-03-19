const { query }              = require('../config/database');
const { cacheSet, cacheGet } = require('../config/redis');
const dayjs = require('dayjs');

// ── HELPERS ───────────────────────────────────────────────
function calcularMinutosDia(registros) {
  let total = 0;
  for (let i = 0; i + 1 < registros.length; i += 2) {
    if (registros[i].tipo === 'entrada' && registros[i+1]?.tipo === 'saida') {
      const [h1,m1] = registros[i].hora.split(':').map(Number);
      const [h2,m2] = registros[i+1].hora.split(':').map(Number);
      total += Math.max(0, (h2*60+m2)-(h1*60+m1));
    }
  }
  return total;
}

function minutosEsperadosDia(usuario, dataStr) {
  if (!usuario.jornada_dias || !usuario.jornada_horas_dia) return 0;
  const dia = new Date(dataStr + 'T12:00:00').getDay();
  if (!usuario.jornada_dias.includes(dia)) return 0;
  return Math.round(parseFloat(usuario.jornada_horas_dia) * 60);
}

function formatarHoras(min) {
  const h = Math.floor(Math.abs(min) / 60);
  const m = Math.abs(min) % 60;
  const sinal = min < 0 ? '-' : '+';
  return `${sinal}${h}h ${String(m).padStart(2,'0')}m`;
}

function calcularBancoMes(usuario, registros, mes) {
  const hoje = dayjs().format('YYYY-MM-DD');
  const [ano, mesN] = mes.split('-').map(Number);
  const totalDias   = new Date(ano, mesN, 0).getDate();

  // Agrupa registros por dia
  const diasMap = {};
  registros.forEach(r => {
    if (!diasMap[r.data]) diasMap[r.data] = [];
    diasMap[r.data].push(r);
  });

  let totalTrabalhadoMin = 0, extraMin = 0, debitoMin = 0;
  const detalhes = [];

  for (let d = 1; d <= totalDias; d++) {
    const dataStr = `${mes}-${String(d).padStart(2,'0')}`;
    if (dataStr > hoje) break;

    const esperado  = minutosEsperadosDia(usuario, dataStr);
    const regsdia   = diasMap[dataStr] || [];
    const trabalhado = calcularMinutosDia(regsdia);

    if (esperado === 0 && regsdia.length === 0) continue;

    totalTrabalhadoMin += trabalhado;
    const diff = trabalhado - esperado;
    if (diff > 0)       extraMin  += diff;
    else if (diff < 0)  debitoMin += Math.abs(diff);

    detalhes.push({
      data:        dataStr,
      esperado_min: esperado,
      trabalhado_min: trabalhado,
      saldo_min:   diff,
      registros:   regsdia,
    });
  }

  const diasEsperados = detalhes.filter(d => d.esperado_min > 0).length;
  const totalEsperado = detalhes.reduce((a, d) => a + d.esperado_min, 0);

  return {
    totalTrabalhadoMin,
    totalEsperadoMin: totalEsperado,
    extraMin,
    debitoMin,
    saldoMin: totalTrabalhadoMin - totalEsperado,
    diasComRegistro: detalhes.filter(d => d.trabalhado_min > 0).length,
    diasEsperados,
    detalhes,
  };
}

// ── CONTROLLER ────────────────────────────────────────────
const RelatorioController = {

  // Relatório pessoal do usuário logado
  async meu(req, res, next) {
    try {
      const mes = req.query.mes || dayjs().format('YYYY-MM');
      const cacheKey = `rel:meu:${req.user.id}:${mes}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return res.json(cached);

      const { rows } = await query(
        `SELECT tipo, hora, data FROM registros_ponto
         WHERE usuario_id = $1
           AND to_char(data,'YYYY-MM') = $2
         ORDER BY data ASC, hora ASC`,
        [req.user.id, mes]
      );

      const banco = calcularBancoMes(req.user, rows, mes);
      const resultado = {
        mes,
        usuario: { id: req.user.id, nome: req.user.nome },
        ...banco,
        detalhes: banco.detalhes,
      };

      // Cache por 5 min (se não for o mês atual, cache mais longo)
      const ttl = mes === dayjs().format('YYYY-MM') ? 300 : 3600;
      await cacheSet(cacheKey, resultado, ttl);
      res.json(resultado);
    } catch (err) { next(err); }
  },

  // Relatório do departamento (supervisor/admin)
  async departamento(req, res, next) {
    try {
      const mes    = req.query.mes   || dayjs().format('YYYY-MM');
      const deptoId = req.query.depto || req.user.departamento_id;

      // Verifica acesso ao depto
      if (req.user.role === 'supervisor' && deptoId !== req.user.departamento_id)
        return res.status(403).json({ error: 'Acesso negado a este departamento.' });

      const cacheKey = `rel:depto:${req.user.empresa_id}:${deptoId}:${mes}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return res.json(cached);

      // Busca colaboradores do depto
      const { rows: colaboradores } = await query(
        `SELECT id, nome, cargo, foto, jornada_horas_dia, jornada_horas_semana,
                jornada_dias, alerta_debito
         FROM usuarios
         WHERE empresa_id = $1 AND departamento_id = $2 AND ativo = TRUE`,
        [req.user.empresa_id, deptoId]
      );

      const resultado = [];
      let totalAlertas = 0;

      for (const c of colaboradores) {
        const { rows: regs } = await query(
          `SELECT tipo, hora, data FROM registros_ponto
           WHERE usuario_id = $1 AND to_char(data,'YYYY-MM') = $2
           ORDER BY data ASC, hora ASC`,
          [c.id, mes]
        );

        const banco = calcularBancoMes(c, regs, mes);
        const temAlerta = c.alerta_debito && banco.debitoMin >= parseFloat(c.alerta_debito) * 60;
        if (temAlerta) totalAlertas++;

        resultado.push({
          usuario: { id: c.id, nome: c.nome, cargo: c.cargo, foto: c.foto },
          ...banco,
          alerta: temAlerta,
        });
      }

      const resposta = { mes, depto_id: deptoId, total_alertas: totalAlertas, colaboradores: resultado };
      await cacheSet(cacheKey, resposta, 300);
      res.json(resposta);
    } catch (err) { next(err); }
  },

  // Relatório geral da empresa (admin/master)
  async empresa(req, res, next) {
    try {
      const mes = req.query.mes || dayjs().format('YYYY-MM');
      const cacheKey = `rel:empresa:${req.user.empresa_id}:${mes}`;
      const cached = await cacheGet(cacheKey);
      if (cached) return res.json(cached);

      const { rows: colaboradores } = await query(
        `SELECT u.id, u.nome, u.cargo, u.foto, u.jornada_horas_dia,
                u.jornada_horas_semana, u.jornada_dias, u.alerta_debito,
                d.nome as departamento
         FROM usuarios u
         LEFT JOIN departamentos d ON d.id = u.departamento_id
         WHERE u.empresa_id = $1 AND u.ativo = TRUE
         ORDER BY d.nome, u.nome`,
        [req.user.empresa_id]
      );

      const resultado = [];
      let totalAlertas = 0;

      for (const c of colaboradores) {
        const { rows: regs } = await query(
          `SELECT tipo, hora, data FROM registros_ponto
           WHERE usuario_id = $1 AND to_char(data,'YYYY-MM') = $2
           ORDER BY data ASC, hora ASC`,
          [c.id, mes]
        );
        const banco = calcularBancoMes(c, regs, mes);
        const temAlerta = c.alerta_debito && banco.debitoMin >= parseFloat(c.alerta_debito) * 60;
        if (temAlerta) totalAlertas++;

        resultado.push({
          usuario: { id: c.id, nome: c.nome, cargo: c.cargo, foto: c.foto, departamento: c.departamento },
          ...banco,
          alerta: temAlerta,
        });
      }

      const resposta = { mes, empresa_id: req.user.empresa_id, total_alertas: totalAlertas, colaboradores: resultado };
      await cacheSet(cacheKey, resposta, 300);
      res.json(resposta);
    } catch (err) { next(err); }
  },

  // Exporta CSV
  async exportarCSV(req, res, next) {
    try {
      const mes = req.query.mes || dayjs().format('YYYY-MM');
      let colaboradores;

      if (req.user.role === 'supervisor') {
        const { rows } = await query(
          `SELECT u.id, u.nome, u.cargo, u.matricula, u.jornada_horas_dia,
                  u.jornada_horas_semana, u.jornada_dias, u.alerta_debito,
                  d.nome as departamento
           FROM usuarios u LEFT JOIN departamentos d ON d.id = u.departamento_id
           WHERE u.empresa_id = $1 AND u.departamento_id = $2 AND u.ativo = TRUE`,
          [req.user.empresa_id, req.user.departamento_id]
        );
        colaboradores = rows;
      } else {
        const { rows } = await query(
          `SELECT u.id, u.nome, u.cargo, u.matricula, u.jornada_horas_dia,
                  u.jornada_horas_semana, u.jornada_dias, u.alerta_debito,
                  d.nome as departamento
           FROM usuarios u LEFT JOIN departamentos d ON d.id = u.departamento_id
           WHERE u.empresa_id = $1 AND u.ativo = TRUE ORDER BY d.nome, u.nome`,
          [req.user.empresa_id]
        );
        colaboradores = rows;
      }

      let csv = 'Nome,Cargo,Departamento,Matricula,Dias Trabalhados,Total Trabalhado,Esperado,Saldo,Extras,Debito\n';

      for (const c of colaboradores) {
        const { rows: regs } = await query(
          `SELECT tipo, hora, data FROM registros_ponto
           WHERE usuario_id = $1 AND to_char(data,'YYYY-MM') = $2
           ORDER BY data ASC, hora ASC`,
          [c.id, mes]
        );
        const b = calcularBancoMes(c, regs, mes);
        csv += `"${c.nome}","${c.cargo}","${c.departamento||''}","${c.matricula}",` +
               `"${b.diasComRegistro}","${formatarHoras(b.totalTrabalhadoMin)}","${formatarHoras(b.totalEsperadoMin)}",` +
               `"${formatarHoras(b.saldoMin)}","${formatarHoras(b.extraMin)}","${formatarHoras(b.debitoMin)}"\n`;
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio_${mes}.csv"`);
      res.send('\uFEFF' + csv); // BOM para Excel reconhecer UTF-8
    } catch (err) { next(err); }
  },
};

module.exports = RelatorioController;
