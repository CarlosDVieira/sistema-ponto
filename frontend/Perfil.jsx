import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usuariosAPI, authAPI } from '../api';
import { formatarData, fotoUrl } from '../utils';
import { useToast } from '../hooks/useToast';
import PageWrapper from '../components/layout/PageWrapper';
import { Card, Input, Button } from '../components/ui/index.jsx';
import styles from './Perfil.module.css';

export default function Perfil() {
  const { usuario, atualizarUsuario } = useAuth();
  const { toast, ToastContainer } = useToast();
  const inputFoto = useRef(null);

  const [senhaAtual,   setSenhaAtual]   = useState('');
  const [senhaNova,    setSenhaNova]    = useState('');
  const [senhaConfirma,setSenhaConfirma]= useState('');
  const [salvando,     setSalvando]     = useState(false);

  async function handleFoto(e) {
    const file = e.target.files[0]; if (!file) return;
    try {
      const { data } = await usuariosAPI.uploadFoto(usuario.id, file);
      atualizarUsuario({ foto: data.foto });
      toast('Foto atualizada! ✅', 'success');
    } catch { toast('Erro ao atualizar foto.', 'error'); }
  }

  async function handleUrlFoto() {
    const url = prompt('Cole a URL da imagem:'); if (!url) return;
    try {
      await usuariosAPI.atualizar(usuario.id, { foto: url });
      atualizarUsuario({ foto: url });
      toast('Foto atualizada! ✅', 'success');
    } catch { toast('Erro ao atualizar foto.', 'error'); }
  }

  async function handleSenha(e) {
    e.preventDefault();
    if (!senhaAtual || !senhaNova || !senhaConfirma) { toast('Preencha todos os campos.', 'error'); return; }
    if (senhaNova !== senhaConfirma) { toast('As senhas não conferem.', 'error'); return; }
    if (senhaNova.length < 6) { toast('Mínimo 6 caracteres.', 'error'); return; }
    setSalvando(true);
    try {
      await authAPI.alterarSenha({ senha_atual: senhaAtual, senha_nova: senhaNova, senha_confirma: senhaConfirma });
      toast('Senha alterada! ✅', 'success');
      setSenhaAtual(''); setSenhaNova(''); setSenhaConfirma('');
    } catch (err) {
      toast(err.response?.data?.error || 'Erro ao alterar senha.', 'error');
    } finally { setSalvando(false); }
  }

  const jornadaDias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const diasNomes   = usuario.jornada_dias?.map(d => jornadaDias[d]).join(', ') || '';

  return (
    <PageWrapper maxWidth="600px">
      {/* Foto + dados */}
      <Card className={styles.perfilCard}>
        <div className={styles.fotoWrap}>
          {usuario.foto
            ? <img src={fotoUrl(usuario.foto)} alt="Foto" className={styles.foto}/>
            : <div className={styles.fotoPlaceholder}>👤</div>
          }
          <div className={styles.fotoBtns}>
            <input type="file" accept="image/*" ref={inputFoto} style={{display:'none'}} onChange={handleFoto}/>
            <button className={styles.btnFoto} onClick={() => inputFoto.current.click()}>📁 Upload</button>
            <button className={styles.btnFoto} onClick={handleUrlFoto}>🔗 URL</button>
          </div>
        </div>
        <div className={styles.info}>
          <p className={styles.nome}>{usuario.nome}</p>
          <p className={styles.cargo}>{usuario.cargo}</p>
          <div className={styles.dados}>
            {usuario.departamento_id && <span>🏢 {usuario.departamento_nome || 'Departamento'}</span>}
            {diasNomes && <span>⏰ {usuario.jornada_horas_dia}h/dia · {usuario.jornada_horas_semana}h/sem · {diasNomes}</span>}
            <span>✉️ {usuario.email}</span>
            <span>🪪 Matrícula: {usuario.matricula}</span>
            {usuario.nascimento && <span>🎂 {formatarData(usuario.nascimento)}</span>}
            {usuario.admissao   && <span>📅 Admissão: {formatarData(usuario.admissao)}</span>}
            {usuario.telefone   && <span>📞 {usuario.telefone}</span>}
          </div>
        </div>
      </Card>

      {/* Alterar senha */}
      <Card>
        <h2 className={styles.cardTitle}>Alterar senha</h2>
        <form onSubmit={handleSenha}>
          <Input label="Senha atual" type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} placeholder="••••••••"/>
          <Input label="Nova senha"  type="password" value={senhaNova}  onChange={e => setSenhaNova(e.target.value)}  placeholder="••••••••"/>
          <Input label="Confirmar"   type="password" value={senhaConfirma} onChange={e => setSenhaConfirma(e.target.value)} placeholder="••••••••"/>
          <Button type="submit" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar nova senha'}</Button>
        </form>
      </Card>
      <ToastContainer />
    </PageWrapper>
  );
}
