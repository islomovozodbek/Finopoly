import { formatMoney } from '../../lib/money.js';
import TeamAvatar from '../TeamAvatar.jsx';
import styles from './FinishedPhase.module.css';

export default function FinishedPhase({ mySyndicate, syndicates }) {
  const ranked = [...syndicates].sort((a, b) => b.cash - a.cash);
  const rank = ranked.findIndex((s) => s.id === mySyndicate.id) + 1;

  return (
    <div className={styles.phase}>
      <span className={styles.heading}>Game complete</span>
      <TeamAvatar team={mySyndicate} size="lg" />
      <span className={styles.rankLine}>
        {mySyndicate.name} finished #{rank} of {syndicates.length}
      </span>
      <span className={`${styles.cash} money`}>{formatMoney(mySyndicate.cash)}</span>

      <div className={styles.standings}>
        {ranked.map((s, i) => (
          <div key={s.id} className={`${styles.standingRow} ${s.id === mySyndicate.id ? styles.standingMine : ''}`}>
            <span className={styles.rank}>{i + 1}</span>
            <TeamAvatar team={s} />
            <span className={styles.name}>{s.name}</span>
            <span className={`${styles.rowCash} money`}>{formatMoney(s.cash)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
