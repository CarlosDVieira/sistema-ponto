import Topbar from './Topbar';
import styles  from './PageWrapper.module.css';

export default function PageWrapper({ children, maxWidth = '560px' }) {
  return (
    <>
      <div className="blob blob1" />
      <div className="blob blob2" />
      <Topbar />
      <main className={styles.main} style={{ maxWidth }}>
        {children}
      </main>
    </>
  );
}
