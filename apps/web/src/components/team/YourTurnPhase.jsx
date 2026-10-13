import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Clock, LockKey } from '@phosphor-icons/react';
import { useCountdown, formatCountdown } from '../../hooks/useCountdown.js';
import { callRoomAction } from '../../lib/roomActions.js';
import { formatMoney } from '../../lib/money.js';
import { readInvestmentDraft, saveInvestmentDraft, clearInvestmentDraft } from '../../lib/investmentDraft.js';
import styles from './YourTurnPhase.module.css';

export default function YourTurnPhase({ pendingTurn, syndicate, isActor, actorName, roomSlug, accessToken, onClaimed, roomVersion, syncing, receiveSnapshot, onRefresh }) {
  const [draft] = useState(() => readInvestmentDraft(pendingTurn.id));
  const [selectedId, setSelectedId] = useState(draft.selectedId);
  const [betDraft, setBet] = useState(draft.bet);
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);
  const inFlight = useRef(false);
  const remainingMs = useCountdown(pendingTurn.decisionDeadline);
  const cash = syndicate.cash;
  const bet = Math.min(betDraft, cash);
  const hasSelection = pendingTurn.drawnCards?.some(card => card.id === selectedId);
  useEffect(() => { saveInvestmentDraft(pendingTurn.id, { selectedId, bet }); }, [pendingTurn.id, selectedId, bet]);

  if (!isActor) {
    return (
      <div className={styles.takeOverPhase}>
        <p className={styles.takeOverText}>
          {actorName ? `${actorName} is submitting for your team.` : 'Another device is submitting for your team.'}
        </p>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={claiming || syncing}
          onClick={async () => {
            setClaiming(true);
            try {
              const snapshot = await callRoomAction(roomSlug, accessToken, 'CLAIM_ACTOR', {});
              receiveSnapshot(snapshot);
              await onClaimed?.();
            } catch (e) {
              setError(e.message);
            } finally {
              setClaiming(false);
            }
          }}
        >
          Take over on this device
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    );
  }

  async function handleSubmit() {
    if (inFlight.current || syncing || !hasSelection) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const snapshot = await callRoomAction(roomSlug, accessToken, 'SUBMIT_INVESTMENT', { cardId: selectedId, betAmount: bet }, roomVersion);
      clearInvestmentDraft(pendingTurn.id);
      receiveSnapshot(snapshot);
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
      inFlight.current = false;
      if (['STALE_ROOM_STATE', 'NOT_ACTING_DEVICE'].includes(e.code)) await onRefresh?.();
    }
    // no re-enable on success: the screen transitions to RESOLUTION once the
    // broadcast lands, so there's nothing to re-enable back into
  }

  if (!pendingTurn.drawnCards) {
    return (
      <div className={styles.phase}>
        <p className={styles.betLabel}>Loading options…</p>
      </div>
    );
  }

  return (
    <div className={styles.phase}>
      <div className={styles.intro}><h1>Choose your investment</h1><p>Your move is saved. Pick one option, then decide how much to invest.</p></div>
      {pendingTurn.decisionDeadline && (
        <div className={`${styles.deadline} timer`}><Clock size={18} aria-hidden="true" /> {formatCountdown(remainingMs)} <span>to decide</span></div>
      )}

      <div className={styles.cards}>
        {pendingTurn.drawnCards.map((card, index) => (
          <button
            key={card.id}
            type="button"
            className={`${styles.card} ${selectedId === card.id ? styles.cardSelected : ''}`}
            onClick={() => setSelectedId(card.id)}
            disabled={submitting}
            aria-pressed={selectedId === card.id}
          >
            <span className={styles.cardType}>Option {index + 1} · {card.assetType}{selectedId === card.id && <CheckCircle size={20} weight="fill" aria-label="Selected" />}</span>
            <span className={styles.cardName}>{card.name}</span>
            <span className={styles.cardReason}>{card.reason}</span>
          </button>
        ))}
      </div>
      <p className={styles.hiddenHint}><LockKey size={16} aria-hidden="true" /> Returns are revealed after you invest.</p>

      <div className={styles.betSection}>
        <div className={styles.betAmountRow}>
          <label className={styles.betLabel} htmlFor="investment-amount">Investment amount</label>
          <span className={`${styles.betAmount} money`}>{formatMoney(bet)}</span>
        </div>
        <input
          type="range"
          id="investment-amount"
          className={styles.slider}
          min={0}
          max={cash}
          step={Math.max(1, Math.round(cash / 100))}
          value={bet}
          onChange={(e) => setBet(Number(e.target.value))}
          disabled={submitting}
        />
        <div className={styles.chipRow}>
          <button type="button" className={styles.chip} disabled={submitting} onClick={() => setBet(Math.floor(cash * 0.25))}>25%</button>
          <button type="button" className={styles.chip} disabled={submitting} onClick={() => setBet(Math.floor(cash * 0.5))}>50%</button>
          <button type="button" className={styles.chip} disabled={submitting} onClick={() => setBet(cash)}>All in</button>
        </div>
      </div>

      <button
        type="button"
        className={styles.submitButton}
        disabled={submitting || syncing || !hasSelection || bet < 0 || bet > cash}
        onClick={handleSubmit}
      >
        {submitting ? 'Saving investment…' : syncing ? 'Reconnecting…' : hasSelection ? `Invest ${formatMoney(bet)}` : 'Select an option to continue'}
      </button>

      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
