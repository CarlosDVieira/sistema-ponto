import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { empresasAPI } from '../../api';
import { useToast } from '../../hooks/useToast';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card, Button } from '../../components/ui/index.jsx';
import styles from './Admin.module.css';

export default function AdminEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const { toast, ToastContainer } = useToast();

  async function carregar() {
    const { data } = await empresasAPI.listar();
    setEmpresas(data);
  }
  useEffect(() => { carregar(); }, []);

  async function excluir(id, nome) {
    if (!confirm(`Desativar empresa "${nome}"?`)) return;
    try {
      await empresasAPI.excluir(id);
      toast('Empresa desativada.', 'success'); carregar();
    } catch { toast('Erro.', 'error'); }
  }

  return (
    <PageWrapper maxWidth="740px">
      <Card>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle}>Empresas ({empresas.length})</h2>
          <Link to="/admin/empresas/nova" className={styles.btnAcao}>➕ Nova empresa</Link>
        </div>

        {!empresas.length && <p className={styles.vazio}>Nenhuma empresa.</p>}
        {empresas.map(e => (
          <div key={e.id} className={styles.userItem}>
            <div className={styles.userLeft}>
              {e.logo ? <img src={e.logo} alt="" className={styles.avatar}/> : <div className={styles.avatarP}>🏭</div>}
              <div>
                <div className={styles.userNome}>
                  {e.nome}
                  <span className={e.ativo ? styles.badgeAtivo : styles.badgeInativo}>{e.ativo ? 'Ativa' : 'Inativa'}</span>
                </div>
                <div className={styles.userSub}>CNPJ: {e.cnpj} · {e.cidade}/{e.estado} · {e.total_usuarios} usuários</div>
              </div>
            </div>
            <div className={styles.userRight}>
              <Link to={`/admin/empresas/${e.id}`} className={styles.btnEdit}>✏️</Link>
              <button className={styles.btnDel} onClick={() => excluir(e.id, e.nome)}>🗑</button>
            </div>
          </div>
        ))}
      </Card>
      <ToastContainer />
    </PageWrapper>
  );
}
