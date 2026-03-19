import { useState, useEffect } from 'react';
import { relatoriosAPI } from '../api';
import { formatarHoras, nomeMes, downloadCSV } from '../utils';
import { useToast } from '../hooks/useToast';
import PageWrapper from '../components/layout/PageWrapper';
import { Card, Button } from '../components/ui/index.jsx';
import styles from './Relatorio.module.css';
import dayjs from 'dayjs';

export default function Relatorio() {
  const [mes,        setMes]        = useState(dayjs().format('YYYY-MM'));
  const [dados,      setDados]      = useState(null);
  const [carregando, setCarregando] = useState(true);
  const { toast, ToastContainer } = useToast();

  useEffect(() => {
    setCarregando(true);
    relatoriosAPI.meu(mes)
      .then(r => setDados(r.data))
      .catch(() => toast('Erro ao carregar relatório.', 'error'))
      .finally(() => setCarregando(false));
  }, [mes]);

  async function exportar() {
    try {
      const { data } = await relatoriosAPI.exportarCSV(mes);
      downloadCSV(data, mes);
      toast('CSV exportado! ✅', 'success');
    } catch { toast('Erro ao exportar.', 'error'); }
  }

  const saldo = dados?.saldoMin ?? 0;

  return (
    <PageWrapper maxWidth="620px">
      {/* Cabeçalho */}
      <Card>
        <div className={styles.header}>
          <div>
            <h1 className={styles.titulo}>Relatório Mensal</h1>
            <p className={styles.sub}>{nomeMes(mes)}</p>
          </div>
          <div className={styles.mesWrap}>
            <input type="month" value={mes} onChange={e => setMes(e.target.value)} className={styles.mesInput}/>
          </div>
        </div>

        {/* Resumo */}
        <div className={styles.resumo}>
          <div className={styles.resumoItem}>
            <span className={styles.valor}>{dados?.diasComRegistro ?? 0}</span>
            <span className={styles.label}>Dias trabalhados</span>
          </div>
          <div className={styles.resumoItem}>
            <span className={styles.valor}>{formatarHoras(dados?.totalTrabalhadoMin ?? 0)}</span>
            <span className={styles.label}>Total trabalhado</span>
          </div>
          <div className={styles.resumoItem}>
            <span className={styles.valor}>{formatarHoras(dados?.totalEsperadoMin ?? 0)}</span>
            <span className={styles.label}>Esperado</span>
          </div>
        </div>

        {/* Banco de horas */}
        {dados && (
          <div className={styles.banco}>
            <div className={styles.bancoHeader}>
              <span className={styles.bancoLabel}>⏱ Banco de horas</span>
              <span className={`${styles.bancoValor} ${saldo >= 0 ? styles.positivo : styles.negativo}`}>
                {formatarHoras(saldo, true)}
              </span>
            </div>
            <div className={styles.barraWrap}>
              <div className={`${styles.barra} ${saldo >= 0 ? styles.barraPos : styles.barraNeg}`}
                style={{ width: `${Math.min(100, dados.totalEsperadoMin > 0 ? (Math.abs(saldo)/dados.totalEsperadoMin)*100 : 0)}%` }}
              />
            </div>
            <div className={styles.bancoDetalhe}>
              <span>➕ Extras: {formatarHoras(dados.extraMin)}</span>
              <span>⚠️ Débito: {formatarHoras(dados.debitoMin)}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Detalhes por dia */}
      <Card>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle}>Detalhes por dia</h2>
          <Button variant="export" onClick={exportar}>⬇ Exportar CSV</Button>
        </div>

        {carregando && <p className={styles.vazio}>Carregando...</p>}
        {!carregando && !dados?.detalhes?.length && <p className={styles.vazio}>Nenhum registro neste mês.</p>}

        {dados?.detalhes?.slice().reverse().map((d, i) => {
          const diff = d.saldo_min;
          return (
            <div key={i} className={styles.diaItem}>
              <div className={styles.diaHeader}>
                <span className={styles.diaData}>
                  {dayjs(d.data).format('DD/MM/YYYY')} — {dayjs(d.data).format('ddd')}
                </span>
                <div className={styles.diaRight}>
                  {d.esperado_min > 0 && (
                    <span className={`${styles.bancoPill} ${diff > 0 ? styles.extra : diff < 0 ? styles.debito : styles.ok}`}>
                      {diff > 0 ? `+${formatarHoras(diff)}` : diff < 0 ? `-${formatarHoras(Math.abs(diff))}` : '✅ Ok'}
                    </span>
                  )}
                  <span className={styles.diaTotal}>{formatarHoras(d.trabalhado_min)}</span>
                </div>
              </div>
              <div className={styles.pills}>
                {d.registros?.map((r, j) => (
                  <span key={j} className={`${styles.pill} ${styles[r.tipo]}`}>
                    {r.tipo === 'entrada' ? '▶' : '■'} {r.hora?.substring(0,5)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </Card>
      <ToastContainer />
    </PageWrapper>
  );
}
