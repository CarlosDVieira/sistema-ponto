import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usuariosAPI, deptosAPI, relatoriosAPI } from '../../api';
import { formatarHoras, roleBadge, roleClass } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card, Button, Select } from '../../components/ui/index.jsx';
import styles from './Admin.module.css';
import dayjs from 'dayjs';

export default function AdminPainel() {
  const { usuario } = useAuth();
  const { toast, ToastContainer } = useToast();
  const [mes,     setMes]     = useState(dayjs().format('YYYY-MM'));
  const [deptos,  setDeptos]  = useState([]);
  const [filtro,  setFiltro]  = useState('');
  const [dados,   setDados]   = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    deptosAPI.listar().then(r => setDeptos(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setCarregando(true);
    relatoriosAPI.empresa(mes)
      .then(r => setDados(r.data))
      .catch(() => toast('Erro ao carregar.', 'error'))
      .finally(() => setCarregando(false));
  }, [mes]);

  const colaboradores = (dados?.colaboradores || [])
    .filter(c => !filtro || c.usuario.departamento === filtro);
  const alertas = colaboradores.filter(c => c.alerta).length;

  async function exportar() {
    try {
      const { data } = await relatoriosAPI.exportarCSV(mes);
      const url = URL.createObjectURL(data);
      const a = document.createElement('a'); a.href = url; a.download = `relatorio_${mes}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast('CSV exportado! ✅', 'success');
    } catch { toast('Erro ao exportar.', 'error'); }
  }

  return (
    <PageWrapper maxWidth="740px">
      {/* Header */}
      <Card>
        <div className={styles.painelHeader}>
          <div>
            <h1 className={styles.titulo}>Painel Admin</h1>
            <p className={styles.sub}>{usuario.role === 'master' ? 'Acesso total' : `Acesso restrito`}</p>
          </div>
          <div className={styles.painelAcoes}>
            <Link to="/admin/usuarios/novo" className={styles.btnAcao}>➕ Novo usuário</Link>
            <Link to="/admin/departamentos" className={styles.btnAcao}>🏢 Departamentos</Link>
            {usuario.role === 'master' && <Link to="/admin/empresas" className={styles.btnAcao}>🏭 Empresas</Link>}
          </div>
        </div>
        <div className={styles.resumo}>
          <div className={styles.resumoItem}><span className={styles.valor}>{dados?.colaboradores?.length ?? 0}</span><span className={styles.label}>Colaboradores</span></div>
          <div className={styles.resumoItem}><span className={styles.valor}>{deptos.length}</span><span className={styles.label}>Departamentos</span></div>
          <div className={styles.resumoItem}><span className={styles.valor} style={{color: alertas > 0 ? 'var(--red)' : undefined}}>{alertas}</span><span className={styles.label}>⚠️ Com débito</span></div>
        </div>
      </Card>

      {/* Lista */}
      <Card>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle}>Colaboradores</h2>
          <div className={styles.filtros}>
            <select value={mes} onChange={e => setMes(e.target.value)} className={styles.mesInput}>
              {Array.from({length:6},(_,i) => dayjs().subtract(i,'month').format('YYYY-MM')).map(m => (
                <option key={m} value={m}>{dayjs(m+'-01').format('MMM/YYYY')}</option>
              ))}
            </select>
            <select value={filtro} onChange={e => setFiltro(e.target.value)} className={styles.mesInput}>
              <option value="">Todos os deptos</option>
              {deptos.map(d => <option key={d.id} value={d.nome}>{d.nome}</option>)}
            </select>
            <Button variant="export" onClick={exportar}>⬇ CSV</Button>
          </div>
        </div>

        {carregando && <p className={styles.vazio}>Carregando...</p>}
        {!carregando && !colaboradores.length && <p className={styles.vazio}>Nenhum colaborador.</p>}

        {colaboradores.map((c, i) => (
          <div key={i} className={`${styles.userItem} ${c.alerta ? styles.alerta : ''}`}>
            <div className={styles.userLeft}>
              {c.usuario.foto
                ? <img src={c.usuario.foto} alt="" className={styles.avatar}/>
                : <div className={styles.avatarP}>👤</div>
              }
              <div>
                <div className={styles.userNome}>
                  {c.usuario.nome}
                  <span className={`${styles.badge} ${styles[roleClass(c.usuario.role)]}`}>{roleBadge(c.usuario.role)}</span>
                  {c.alerta && <span className={styles.alertaPill}>⚠️ Débito</span>}
                </div>
                <div className={styles.userSub}>{c.usuario.departamento || '—'} · {c.usuario.cargo}</div>
              </div>
            </div>
            <div className={styles.userRight}>
              <span className={`${styles.bancoPill} ${c.saldoMin >= 0 ? styles.pos : styles.neg}`}>{formatarHoras(c.saldoMin, true)}</span>
              <Link to={`/admin/usuarios/${c.usuario.id}`} className={styles.btnEdit}>✏️ Editar</Link>
            </div>
          </div>
        ))}
      </Card>
      <ToastContainer />
    </PageWrapper>
  );
}
