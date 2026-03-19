import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Input, Button } from '../components/ui/index.jsx';
import styles from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const { toast, ToastContainer } = useToast();

  const [email, setEmail]   = useState('');
  const [senha, setSenha]   = useState('');
  const [mostraSenha, setMostraSenha] = useState(false);
  const [carregando, setCarregando]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !senha) { toast('Preencha e-mail e senha.', 'error'); return; }
    setCarregando(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch (err) {
      toast(err.response?.data?.error || 'Erro ao fazer login.', 'error');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className="blob blob1"/><div className="blob blob2"/>
      <div className={styles.card}>
        <div className={styles.logo}>⏱ PontoFácil</div>
        <h1 className={styles.titulo}>Entrar</h1>
        <p className={styles.sub}>Acesse com seu e-mail e senha</p>

        <form onSubmit={handleSubmit}>
          <Input label="E-mail" id="email" type="email"
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com" autoFocus/>

          <div className={styles.senhaWrap}>
            <Input label="Senha" id="senha" type={mostraSenha ? 'text' : 'password'}
              value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"/>
            <button type="button" className={styles.olho}
              onClick={() => setMostraSenha(v => !v)}>
              {mostraSenha ? '🙈' : '👁'}
            </button>
          </div>

          <Button type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar →'}
          </Button>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}
