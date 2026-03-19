import styles from './ui.module.css';

export function Card({ children, className = '' }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}

export function Button({ children, variant = 'primary', onClick, disabled, type = 'button', style }) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled} style={style}
      className={`${styles.btn} ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export function Input({ label, id, error, ...props }) {
  return (
    <div className={styles.formGroup}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input id={id} className={`${styles.input} ${error ? styles.inputError : ''}`} {...props}/>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
}

export function Select({ label, id, children, error, ...props }) {
  return (
    <div className={styles.formGroup}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <select id={id} className={`${styles.select} ${error ? styles.inputError : ''}`} {...props}>
        {children}
      </select>
      {error && <span className={styles.errorMsg}>{error}</span>}
    </div>
  );
}

export function Badge({ role }) {
  const map = { master:'👑 Master', admin:'🛡️ Admin', supervisor:'👔 Supervisor', user:'👤 Usuário' };
  return <span className={`${styles.badge} ${styles[role]}`}>{map[role] || '👤'}</span>;
}

export function Spinner() {
  return <div className={styles.spinner} />;
}

export function EmptyState({ msg = 'Nenhum registro encontrado.' }) {
  return <p className={styles.empty}>{msg}</p>;
}
