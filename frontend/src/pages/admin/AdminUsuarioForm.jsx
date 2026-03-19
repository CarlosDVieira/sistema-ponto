import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usuariosAPI, deptosAPI } from '../../api';
import { useToast } from '../../hooks/useToast';
import PageWrapper from '../../components/layout/PageWrapper';
import { Card, Input, Select, Button } from '../../components/ui/index.jsx';
import styles from './Admin.module.css';

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

export default function AdminUsuarioForm() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { toast, ToastContainer } = useToast();
  const inputFoto  = useRef(null);
  const editando   = Boolean(id);

  const [deptos,  setDeptos]  = useState([]);
  const [salvando,setSalvando]= useState(false);
  const [fotoPreview, setFotoPreview] = useState('');

  const [form, setForm] = useState({
    nome:'', email:'', matricula:'', cargo:'', role:'user',
    departamento_id:'', cpf:'', telefone:'',
    nascimento:'', admissao:'',
    logradouro:'', numero:'', complemento:'', bairro:'', cidade:'', estado:'', cep:'',
    jornada_horas_dia:'', jornada_horas_semana:'', alerta_debito:'',
    jornada_dias: [1,2,3,4,5],
    senha:'', senha2:'',
  });

  useEffect(() => {
    deptosAPI.listar().then(r => setDeptos(r.data));
    if (editando) {
      usuariosAPI.buscar(id).then(r => {
        const u = r.data;
        setForm(f => ({...f, ...u, senha:'', senha2:'', jornada_dias: u.jornada_dias || [1,2,3,4,5]}));
        if (u.foto) setFotoPreview(u.foto);
      });
    }
  }, [id]);

  function set(field) { return e => setForm(f => ({...f, [field]: e.target.value})); }

  function toggleDia(d) {
    setForm(f => ({...f,
      jornada_dias: f.jornada_dias.includes(d) ? f.jornada_dias.filter(x=>x!==d) : [...f.jornada_dias, d]
    }));
  }

  async function handleFoto(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setFotoPreview(ev.target.result);
    reader.readAsDataURL(file);
    // Upload imediato só se editando
    if (editando) {
      try {
        const { data } = await usuariosAPI.uploadFoto(id, file);
        setForm(f => ({...f, foto: data.foto}));
        toast('Foto atualizada! ✅', 'success');
      } catch { toast('Erro ao subir foto.', 'error'); }
    } else {
      setForm(f => ({...f, _fotoFile: file}));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome || !form.email || !form.matricula) { toast('Preencha os campos obrigatórios.', 'error'); return; }
    if (!editando && !form.senha) { toast('Defina uma senha.', 'error'); return; }
    if (form.senha && form.senha !== form.senha2) { toast('Senhas não conferem.', 'error'); return; }

    setSalvando(true);
    try {
      const payload = { ...form };
      delete payload.senha2; delete payload._fotoFile;
      if (!payload.senha) delete payload.senha;

      let userId = id;
      if (editando) {
        await usuariosAPI.atualizar(id, payload);
      } else {
        const { data } = await usuariosAPI.criar(payload);
        userId = data.id;
        // Upload de foto se selecionada
        if (form._fotoFile) await usuariosAPI.uploadFoto(userId, form._fotoFile);
      }

      toast(editando ? 'Usuário atualizado! ✅' : 'Usuário criado! ✅', 'success');
      setTimeout(() => navigate('/admin'), 800);
    } catch (err) {
      toast(err.response?.data?.error || 'Erro ao salvar.', 'error');
    } finally { setSalvando(false); }
  }

  return (
    <PageWrapper maxWidth="660px">
      <Card style={{maxWidth:'100%'}}>
        <h1 className={styles.titulo}>{editando ? 'Editar Colaborador' : 'Novo Colaborador'}</h1>
        <p className={styles.sub}>Preencha os dados do colaborador</p>

        <form onSubmit={handleSubmit}>
          {/* Foto */}
          <div className={styles.fotoWrap}>
            {fotoPreview
              ? <img src={fotoPreview} alt="" className={styles.fotoPrev}/>
              : <div className={styles.fotoPrevPlaceholder}>👤</div>
            }
            <div>
              <input type="file" accept="image/*" ref={inputFoto} style={{display:'none'}} onChange={handleFoto}/>
              <button type="button" className={styles.btnFoto} onClick={() => inputFoto.current.click()}>📁 Upload</button>
            </div>
          </div>

          {/* Dados básicos */}
          <div className={styles.formRow}>
            <Input label="Nome completo *" value={form.nome} onChange={set('nome')} placeholder="Carlos Vieira"/>
            <Input label="Cargo *" value={form.cargo} onChange={set('cargo')} placeholder="Desenvolvedor"/>
          </div>
          <div className={styles.formRow}>
            <Input label="Matrícula *" value={form.matricula} onChange={set('matricula')} placeholder="00123" disabled={editando}/>
            <Input label="E-mail *" type="email" value={form.email} onChange={set('email')} placeholder="carlos@empresa.com"/>
          </div>
          <div className={styles.formRow}>
            <Select label="Perfil de acesso *" value={form.role} onChange={set('role')}>
              <option value="user">👤 Usuário comum</option>
              <option value="supervisor">👔 Supervisor</option>
              <option value="admin">🛡️ Admin de departamento</option>
              <option value="master">👑 Admin master</option>
            </Select>
            {form.role !== 'master' && (
              <Select label="Departamento *" value={form.departamento_id} onChange={set('departamento_id')}>
                <option value="">Selecione...</option>
                {deptos.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </Select>
            )}
          </div>

          {/* Contato */}
          <div className={styles.sectionTitle}>📞 Contato</div>
          <div className={styles.formRow}>
            <Input label="CPF" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00"/>
            <Input label="Telefone" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-9999"/>
          </div>

          {/* Endereço */}
          <div className={styles.sectionTitle}>📍 Endereço</div>
          <div className={styles.formRow}>
            <Input label="CEP" value={form.cep} onChange={set('cep')} placeholder="00000-000"/>
            <Input label="Logradouro" value={form.logradouro} onChange={set('logradouro')} placeholder="Rua..."/>
          </div>
          <div className={styles.formRow}>
            <Input label="Número" value={form.numero} onChange={set('numero')} placeholder="123"/>
            <Input label="Complemento" value={form.complemento} onChange={set('complemento')} placeholder="Apto..."/>
          </div>
          <div className={styles.formRow}>
            <Input label="Bairro" value={form.bairro} onChange={set('bairro')} placeholder="Centro"/>
            <Input label="Cidade" value={form.cidade} onChange={set('cidade')} placeholder="São Paulo"/>
          </div>
          <div className={styles.formRow}>
            <Input label="Estado" value={form.estado} onChange={set('estado')} placeholder="SP"/>
            <Input label="Nascimento" type="date" value={form.nascimento} onChange={set('nascimento')}/>
          </div>
          <Input label="Data de admissão" type="date" value={form.admissao} onChange={set('admissao')}/>

          {/* Jornada */}
          <div className={styles.sectionTitle}>⏰ Jornada de Trabalho</div>
          <div className={styles.formRow}>
            <Input label="Horas por dia" type="number" step="0.5" min="1" max="24" value={form.jornada_horas_dia} onChange={set('jornada_horas_dia')} placeholder="9"/>
            <Input label="Horas por semana" type="number" step="0.5" min="1" max="168" value={form.jornada_horas_semana} onChange={set('jornada_horas_semana')} placeholder="44"/>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.fieldLabel}>Dias de trabalho</label>
            <div className={styles.diasWrap}>
              {DIAS.map((d, i) => (
                <label key={i} className={`${styles.diaLabel} ${form.jornada_dias.includes(i) ? styles.diaAtivo : ''}`}>
                  <input type="checkbox" checked={form.jornada_dias.includes(i)} onChange={() => toggleDia(i)} style={{display:'none'}}/>
                  {d}
                </label>
              ))}
            </div>
          </div>
          <Input label="Alertar supervisor se débito passar de (horas)" type="number" step="0.5" min="0" value={form.alerta_debito} onChange={set('alerta_debito')} placeholder="2"/>

          {/* Senha */}
          <div className={styles.sectionTitle}>🔒 Senha {editando && '(deixe em branco para não alterar)'}</div>
          <div className={styles.formRow}>
            <Input label={`Senha ${editando ? '' : '*'}`} type="password" value={form.senha} onChange={set('senha')} placeholder="••••••••"/>
            <Input label="Confirmar senha" type="password" value={form.senha2} onChange={set('senha2')} placeholder="••••••••"/>
          </div>

          <div className={styles.formBtns}>
            <Button type="button" variant="outline" onClick={() => navigate('/admin')}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar colaborador →'}</Button>
          </div>
        </form>
      </Card>
      <ToastContainer />
    </PageWrapper>
  );
}
