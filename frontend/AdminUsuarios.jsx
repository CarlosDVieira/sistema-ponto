// ── AdminUsuarios.jsx ────────────────────────────────────
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usuariosAPI, deptosAPI } from '../../api';
import { roleBadge, roleClass } from '../../utils';
import { useToast } from '../../hooks/useToast';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card, Button } from '../../components/ui/index.jsx';
import styles from './Admin.module.css';

export function AdminUsuarios() {
  const [usuarios,   setUsuarios]   = useState([]);
  const [deptos,     setDeptos]     = useState([]);
  const [filtroDepto,setFiltroDepto]= useState('');
  const [busca,      setBusca]      = useState('');
  const { toast, ToastContainer }   = useToast();

  async function carregar() {
    const [u, d] = await Promise.all([
      usuariosAPI.listar({ depto: filtroDepto, busca }),
      deptosAPI.listar(),
    ]);
    setUsuarios(u.data); setDeptos(d.data);
  }

  useEffect(() => { carregar(); }, [filtroDepto, busca]);

  async function excluir(id, nome) {
    if (!confirm(`Desativar ${nome}?`)) return;
    try {
      await usuariosAPI.excluir(id);
      toast(`${nome} desativado.`, 'success');
      carregar();
    } catch { toast('Erro ao desativar.', 'error'); }
  }

  return (
    <PageWrapper maxWidth="740px">
      <Card>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle}>Colaboradores ({usuarios.length})</h2>
          <Link to="/admin/usuarios/novo" className={styles.btnAcao}>➕ Novo</Link>
        </div>
        <div className={styles.filtros}>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome, e-mail..." className={styles.mesInput} style={{flex:1}}/>
          <select value={filtroDepto} onChange={e => setFiltroDepto(e.target.value)} className={styles.mesInput}>
            <option value="">Todos os deptos</option>
            {deptos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>

        {!usuarios.length && <p className={styles.vazio}>Nenhum colaborador encontrado.</p>}
        {usuarios.map(u => (
          <div key={u.id} className={styles.userItem}>
            <div className={styles.userLeft}>
              {u.foto ? <img src={u.foto} alt="" className={styles.avatar}/> : <div className={styles.avatarP}>👤</div>}
              <div>
                <div className={styles.userNome}>
                  {u.nome}
                  <span className={`${styles.badge} ${styles[roleClass(u.role)]}`}>{roleBadge(u.role)}</span>
                </div>
                <div className={styles.userSub}>{u.departamento_nome || '—'} · {u.email}</div>
              </div>
            </div>
            <div className={styles.userRight}>
              <Link to={`/admin/usuarios/${u.id}`} className={styles.btnEdit}>✏️</Link>
              <button className={styles.btnDel} onClick={() => excluir(u.id, u.nome)}>🗑</button>
            </div>
          </div>
        ))}
      </Card>
      <ToastContainer />
    </PageWrapper>
  );
}

export default AdminUsuarios;
