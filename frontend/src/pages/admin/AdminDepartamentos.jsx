import { useState, useEffect } from 'react';
import { deptosAPI } from '../../api';
import { useToast } from '../../hooks/useToast';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card, Input, Button } from '../../components/ui/index.jsx';
import styles from './Admin.module.css';

export default function AdminDepartamentos() {
  const [deptos, setDeptos] = useState([]);
  const [nome,   setNome]   = useState('');
  const [editId, setEditId] = useState(null);
  const { toast, ToastContainer } = useToast();

  async function carregar() {
    const { data } = await deptosAPI.listar();
    setDeptos(data);
  }
  useEffect(() => { carregar(); }, []);

  async function salvar() {
    if (!nome.trim()) { toast('Digite o nome.', 'error'); return; }
    try {
      if (editId) {
        await deptosAPI.atualizar(editId, nome);
        toast('Departamento atualizado! ✅', 'success');
      } else {
        await deptosAPI.criar(nome);
        toast('Departamento criado! ✅', 'success');
      }
      setNome(''); setEditId(null); carregar();
    } catch (err) {
      toast(err.response?.data?.error || 'Erro ao salvar.', 'error');
    }
  }

  async function excluir(id, nome) {
    if (!confirm(`Remover "${nome}"?`)) return;
    try {
      await deptosAPI.excluir(id);
      toast('Removido.', 'success'); carregar();
    } catch (err) {
      toast(err.response?.data?.error || 'Erro.', 'error');
    }
  }

  return (
    <PageWrapper maxWidth="600px">
      <Card>
        <h2 className={styles.cardTitle}>Gerenciar Departamentos</h2>
        <div className={styles.deptoAdd}>
          <input value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Nome do departamento"
            className={styles.mesInput} style={{flex:1}}
            onKeyDown={e => e.key === 'Enter' && salvar()}
          />
          <Button onClick={salvar} style={{width:'auto', padding:'10px 20px', marginTop:0}}>
            {editId ? 'Salvar' : 'Adicionar'}
          </Button>
          {editId && <Button variant="outline" onClick={() => {setEditId(null); setNome('');}} style={{width:'auto',marginTop:0}}>Cancelar</Button>}
        </div>

        {!deptos.length && <p className={styles.vazio}>Nenhum departamento.</p>}
        {deptos.map(d => (
          <div key={d.id} className={styles.deptoItem}>
            <div>
              <p className={styles.deptoNome}>{d.nome}</p>
              <p className={styles.deptoCount}>{d.total_usuarios} colaboradores</p>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button className={styles.btnEdit} onClick={() => {setEditId(d.id); setNome(d.nome);}}>✏️</button>
              <button className={styles.btnDel}  onClick={() => excluir(d.id, d.nome)}>🗑</button>
            </div>
          </div>
        ))}
      </Card>
      <ToastContainer />
    </PageWrapper>
  );
}
