import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { roleBadge, roleClass, fotoUrl } from '../../utils';
import styles from './Topbar.module.css';

export default function Topbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (!usuario) return null;

  const podeVerDepto = ['master','admin','supervisor'].includes(usuario.role);
  const podeAdmin    = ['master','admin'].includes(usuario.role);

  return (
    <header className={styles.topbar}>
      <Link to="/" className={styles.logo}>⏱ PontoFácil</Link>

      <nav className={styles.nav}>
        {usuario.foto && (
          <img src={fotoUrl(usuario.foto)} alt="" className={styles.avatar}
               onError={e => e.target.style.display = 'none'}/>
        )}
        <span className={styles.nome}>{usuario.nome}</span>
        <span className={`${styles.badge} ${styles[roleClass(usuario.role)]}`}>
          {roleBadge(usuario.role)}
        </span>

        <Link to="/relatorio"   className={styles.btnNav}>📊 Relatório</Link>
        {podeVerDepto && <Link to="/departamento" className={styles.btnNav}>🏢 Departamento</Link>}
        {podeAdmin    && <Link to="/admin"        className={styles.btnNav}>👑 Admin</Link>}
        <Link to="/perfil"      className={styles.btnNav}>👤 Perfil</Link>
        <button onClick={handleLogout} className={styles.btnSair}>Sair</button>
      </nav>
    </header>
  );
}
