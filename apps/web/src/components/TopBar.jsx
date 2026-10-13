import { SignOut } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';
import Button from './Button.jsx';
import EditableName from './EditableName.jsx';
import styles from './TopBar.module.css';

export default function TopBar() {
  const { profile, profileLoading, signOut } = useAuth();
  const name = profile?.display_name || profile?.email?.split('@')[0] || null;

  return (
    <header className={styles.bar}>
      <div className={styles.left}><Link to="/select" className={styles.brand} aria-label="Finopoly games"><Logo size="sm" /></Link><nav aria-label="Main navigation"><Link to="/select">Games</Link><Link to="/leaderboard">Rankings</Link></nav></div>
      <div className={styles.right}>
        {!profileLoading && name ? <EditableName name={name} /> : null}
        <Button variant="ghost" size="sm" icon={SignOut} onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
