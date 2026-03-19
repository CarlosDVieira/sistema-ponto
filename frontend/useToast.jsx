import { useState, useCallback } from 'react';
import styles from './Toast.module.css';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, tipo = '') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, tipo }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return { toast, ToastContainer: () => (
    <div className={styles.container}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${styles[t.tipo] || ''}`}>{t.msg}</div>
      ))}
    </div>
  )};
}
