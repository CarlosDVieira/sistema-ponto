import { useState, useEffect } from 'react';
import { relatoriosAPI, deptosAPI } from '../api';
import { formatarHoras, downloadCSV } from '../utils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import PageWrapper from '../components/layout/PageWrapper';
import { Card, Button } from '../components/ui/index.jsx';
import styles from './Departamento.module.css';
import dayjs from 'dayjs';

export default function Departamento() {
  const { usuario } = useAuth();
  const { toast, ToastContainer } = useToast();
  const [mes,   setMes]   = useState(dayjs().format('YYYY-MM'));
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setCarregando(true);
    relatoriosAPI.departamento(mes)
      .then(r => setDados(r.data))
      .catch(() => toast('Erro ao carregar.', 'error'))
      .finally(() => setCarregando(false));
  }, [mes]);

  async function exportar() {
    try {
      const { data } = await relatoriosAPI.exportarCSV(mes);
      downloadCSV(data, mes);
      toast('CSV exportado! ✅', 'success');
    } catch { toast('Erro ao exportar.', 'error'); }
  }

  const colaboradores = dados?.colaboradores || [];
  const alertas = colaboradores.filter(c => c.alerta).length;

  return (
    <PageWrapper maxWidth="700px">
      <Card>
        <div className={styles.header}>
          <div>
            <h1 className={styles.titulo}>Departamento</h1>
            <p className={styles.sub}>{colaboradores.length} colaboradores · {alertas > 0 ? `⚠️ ${alertas} com débito` : '✅ Sem alertas'}</p>
          </div>
          <input type="month" value={mes} onChange={e => setMes(e.target.value)} className={styles.mesInput}/>
        </div>

        <div className={styles.resumo}>
          <div className={styles.resumoItem}><span className={styles.valor}>{colaboradores.length}</span><span className={styles.label}>Colaboradores</span></div>
          <div className={styles.resumoItem}><span className={styles.valor} style={{color: alertas > 0 ? 'var(--red)' : 'var(--green)'}}>{alertas}</span><span className={styles.label}>⚠️ Com débito</span></div>
        </div>
      </Card>

      <Card>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle}>Colaboradores</h2>
          <Button variant="export" onClick={exportar}>⬇ Exportar CSV</Button>
        </div>

        {carregando && <p className={styles.vazio}>Carregando...</p>}
        {!carregando && !colaboradores.length && <p className={styles.vazio}>Nenhum colaborador.</p>}

        {colaboradores.map((c, i) => (
          <div key={i} className={`${styles.item} ${c.alerta ? styles.alerta : ''}`}>
            <div className={styles.itemLeft}>
              {c.usuario.foto
                ? <img src={c.usuario.foto} alt="" className={styles.avatar}/>
                : <div className={styles.avatarPlaceholder}>👤</div>
              }
              <div>
                <p className={styles.nome}>{c.usuario.nome}</p>
                <p className={styles.cargo}>{c.usuario.cargo}</p>
              </div>
            </div>
            <div className={styles.itemRight}>
              {c.alerta && <span className={styles.alertaPill}>⚠️ Débito</span>}
              <span className={`${styles.bancoPill} ${c.saldoMin >= 0 ? styles.pos : styles.neg}`}>
                {formatarHoras(c.saldoMin, true)}
              </span>
              <span className={styles.horas}>{formatarHoras(c.totalTrabalhadoMin)}</span>
            </div>
          </div>
        ))}
      </Card>
      <ToastContainer />
    </PageWrapper>
  );
}
