import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { empresasAPI } from '../../api';
import { useToast } from '../../hooks/useToast';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card, Input, Button } from '../../components/ui/index.jsx';
import styles from './Admin.module.css';

export default function AdminEmpresaForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { toast, ToastContainer } = useToast();
  const editando = Boolean(id);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    nome:'', cnpj:'', email:'', telefone:'',
    logradouro:'', numero:'', complemento:'',
    bairro:'', cidade:'', estado:'', cep:'',
  });

  useEffect(() => {
    if (editando) {
      empresasAPI.buscar(id).then(r => setForm(r.data)).catch(() => {});
    }
  }, [id]);

  function set(field) { return e => setForm(f => ({...f, [field]: e.target.value})); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome || !form.cnpj) { toast('Nome e CNPJ são obrigatórios.', 'error'); return; }
    setSalvando(true);
    try {
      if (editando) await empresasAPI.atualizar(id, form);
      else          await empresasAPI.criar(form);
      toast(editando ? 'Empresa atualizada! ✅' : 'Empresa criada! ✅', 'success');
      setTimeout(() => navigate('/admin/empresas'), 800);
    } catch (err) {
      toast(err.response?.data?.error || 'Erro ao salvar.', 'error');
    } finally { setSalvando(false); }
  }

  return (
    <PageWrapper maxWidth="640px">
      <Card style={{maxWidth:'100%'}}>
        <h1 className={styles.titulo}>{editando ? 'Editar Empresa' : 'Nova Empresa'}</h1>
        <form onSubmit={handleSubmit}>
          <div className={styles.sectionTitle}>🏭 Dados da Empresa</div>
          <div className={styles.formRow}>
            <Input label="Razão social *" value={form.nome}     onChange={set('nome')}     placeholder="Empresa Ltda"/>
            <Input label="CNPJ *"         value={form.cnpj}     onChange={set('cnpj')}     placeholder="00.000.000/0001-00"/>
          </div>
          <div className={styles.formRow}>
            <Input label="E-mail"         value={form.email}    onChange={set('email')}    placeholder="contato@empresa.com" type="email"/>
            <Input label="Telefone"       value={form.telefone} onChange={set('telefone')} placeholder="(11) 3000-0000"/>
          </div>

          <div className={styles.sectionTitle}>📍 Endereço</div>
          <div className={styles.formRow}>
            <Input label="CEP"       value={form.cep}       onChange={set('cep')}       placeholder="00000-000"/>
            <Input label="Logradouro" value={form.logradouro} onChange={set('logradouro')} placeholder="Rua..."/>
          </div>
          <div className={styles.formRow}>
            <Input label="Número"      value={form.numero}      onChange={set('numero')}      placeholder="123"/>
            <Input label="Complemento" value={form.complemento} onChange={set('complemento')} placeholder="Sala 1"/>
          </div>
          <div className={styles.formRow}>
            <Input label="Bairro"  value={form.bairro}  onChange={set('bairro')}  placeholder="Centro"/>
            <Input label="Cidade"  value={form.cidade}  onChange={set('cidade')}  placeholder="São Paulo"/>
          </div>
          <Input label="Estado" value={form.estado} onChange={set('estado')} placeholder="SP"/>

          <div className={styles.formBtns}>
            <Button type="button" variant="outline" onClick={() => navigate('/admin/empresas')}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar empresa →'}</Button>
          </div>
        </form>
      </Card>
      <ToastContainer />
    </PageWrapper>
  );
}
