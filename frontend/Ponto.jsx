import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pontoAPI } from '../api';
import { formatarHoras } from '../utils';
import { useToast } from '../hooks/useToast';
import PageWrapper from '../components/layout/PageWrapper';
import { Card } from '../components/ui/index.jsx';
import styles from './Ponto.module.css';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');

export default function Ponto() {
  const { usuario } = useAuth();
  const { toast, ToastContainer } = useToast();

  const [relogio,    setRelogio]    = useState(dayjs().format('HH:mm:ss'));
  const [hoje,       setHoje]       = useState(null);
  const [carregando, setCarregando] = useState(false);

  // Atualiza relógio a cada segundo
  useEffect(() => {
    const t = setInterval(() => setRelogio(dayjs().format('HH:mm:ss')), 1000);
    return () => clearInterval(t);
  }, []);

  const carregarHoje = useCallback(async () => {
    try {
      const { data } = await pontoAPI.hoje();
      setHoje(data);
    } catch {}
  }, []);

  useEffect(() => { carregarHoje(); }, [carregarHoje]);

  async function baterPonto() {
    setCarregando(true);
    try {
      const { data } = await pontoAPI.registrar();
      const tipo = data.tipo;
      if (tipo === 'entrada') {
        toast(`Entrada registrada às ${data.hora} ✅`, 'success');
      } else {
        const min = data.horas_trabalhadas_min;
        toast(`Saída às ${data.hora}${min ? ` — ${formatarHoras(min)} trabalhados` : ''} 👋`, 'success');
      }
      await carregarHoje();
    } catch (err) {
      toast(err.response?.data?.error || 'Erro ao registrar ponto.', 'error');
    } finally {
      setCarregando(false);
    }
  }

  // Calcula status atual
  const registros  = hoje?.registros || [];
  const ultimo     = registros[registros.length - 1];
  const trabalhando = ultimo?.tipo === 'entrada';
  const temRegistro = registros.length > 0;

  // Horas ao vivo (se trabalhando)
  const [aoVivo, setAoVivo] = useState('');
  useEffect(() => {
    if (!trabalhando || !ultimo) { setAoVivo(''); return; }
    const t = setInterval(() => {
      const [hh, mm] = ultimo.hora.split(':').map(Number);
      const agora = dayjs();
      const diffMin = agora.diff(dayjs().hour(hh).minute(mm).second(0), 'minute');
      const base = hoje?.minutos_trabalhados || 0;
      setAoVivo(formatarHoras(base + diffMin));
    }, 1000);
    return () => clearInterval(t);
  }, [trabalhando, ultimo, hoje]);

  const dataFormatada = dayjs().format('dddd, DD [de] MMMM [de] YYYY');
  const esperado = hoje?.minutos_esperados || 0;
  const saldo    = hoje?.saldo_min ?? null;

  return (
    <PageWrapper>
      <div className={styles.pontoCard}>
        <p className={styles.data}>{dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}</p>
        <p className={styles.relogio}>{relogio}</p>

        {/* Status badge */}
        <span className={`${styles.badge} ${trabalhando ? styles.trabalhando : temRegistro ? styles.pausado : ''}`}>
          {trabalhando ? '● Trabalhando' : temRegistro ? '⏸ Pausado' : 'Sem registro hoje'}
        </span>

        {/* Botão único */}
        <button
          className={`${styles.btnPonto} ${trabalhando ? styles.saida : styles.entrada}`}
          onClick={baterPonto}
          disabled={carregando}
        >
          {trabalhando ? '■ Ponto — Saída' : '▶ Ponto — Entrada'}
        </button>

        {/* Horas */}
        {(aoVivo || (temRegistro && !trabalhando)) && (
          <p className={styles.horas}>
            {trabalhando
              ? `⏳ Trabalhando há ${aoVivo}`
              : `${saldo !== null && saldo >= 0 ? '✅' : '⏸'} Acumulado: ${formatarHoras(hoje?.minutos_trabalhados)}`}
          </p>
        )}

        {/* Jornada esperada */}
        {esperado > 0 && !trabalhando && (
          <p className={styles.jornadaInfo}>
            Jornada esperada: {formatarHoras(esperado)}
          </p>
        )}
      </div>

      {/* Histórico do dia */}
      <Card>
        <h2 className={styles.cardTitle}>Registros de hoje</h2>
        {!registros.length
          ? <p className={styles.vazio}>Nenhum registro ainda.</p>
          : registros.map((r, i) => (
            <div key={i} className={styles.regItem}>
              <span className={`${styles.regTipo} ${styles[r.tipo]}`}>
                {r.tipo === 'entrada' ? '▶ Entrada' : '■ Saída'}
              </span>
              <span className={styles.regHora}>{r.hora.substring(0,5)}</span>
            </div>
          ))
        }
      </Card>

      <ToastContainer />
    </PageWrapper>
  );
}
