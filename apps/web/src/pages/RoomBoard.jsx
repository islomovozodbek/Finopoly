import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowSquareOut, Buildings, Flag, HandCoins, LockKey, Newspaper } from '@phosphor-icons/react';
import { useParams } from 'react-router-dom';
import { BOARD, ERA_BRIEFINGS } from '@finopoly/content/client';
import { useAuth } from '../context/AuthContext.jsx';
import { useRoomConnection } from '../hooks/useRoomConnection.js';
import { useRoomAction } from '../hooks/useRoomAction.js';
import { useCountdown, formatCountdown } from '../hooks/useCountdown.js';
import { getGridPosition } from '../lib/boardGeometry.js';
import { formatMoney, formatSignedMoney } from '../lib/money.js';
import PageLoader from '../components/PageLoader.jsx';
import ResolvePanel from '../components/turn/ResolvePanel.jsx';
import Logo from '../components/Logo.jsx';
import TeamAvatar from '../components/TeamAvatar.jsx';
import styles from './RoomBoard.module.css';

const GROUP_VAR = (group) => `var(--group-${group}, var(--border-hi))`;
const GROUPS = { financials: 'Financials', consumer: 'Consumer', energy: 'Energy', realestate: 'Real estate', tech: 'Technology', industrials: 'Industrials', macro: 'Bonds & currency', crypto: 'Crypto' };
const CORNERS = { 0: Flag, 10: HandCoins, 20: LockKey, 30: Buildings };

function BoardSpace({ space, tokens }) {
  const { row, col } = getGridPosition(space.id);
  const style = { gridRow: row + 1, gridColumn: col + 1 };

  const Icon = CORNERS[space.id] ?? Newspaper;
  const label = `${space.id}. ${space.name}${tokens.length ? ` — ${tokens.map(s => s.name).join(', ')}` : ''}`;
  return (
    <div className={space.type === 'corner' ? styles.corner : space.type === 'market_news' ? styles.newsSpace : styles.assetSpace}
      style={{ ...style, '--group-color': GROUP_VAR(space.group), '--group-surface': `var(--group-${space.group}-soft, var(--surface-2))` }} title={label} aria-label={label} data-occupied={tokens.length > 0} data-crowded={tokens.length > 4}>
      {space.type === 'asset' ? <><div className={styles.groupBar} /><span className={styles.spaceNumber}>{space.id}</span><span className={styles.spaceName}>{space.name}</span></>
        : <><Icon size={22} weight="duotone" aria-hidden="true" /><span className={styles.specialName}>{space.name}</span></>}
      {tokens.length > 0 && (
        <div className={styles.tokenGrid} data-count={tokens.length} data-crowded={tokens.length > 4}>
          {tokens.map((s) => (
            <TeamAvatar key={s.id} team={s} size="token" className={styles.token} />
          ))}
        </div>
      )}
      {tokens.length > 1 && <div className={styles.tokenOverflow}><TeamAvatar team={tokens[0]} size="token" /><span>+{tokens.length - 1}</span></div>}
    </div>
  );
}

function CenterFinished() {
  return (
    <div className={styles.centerIdle}>
      <Flag size={36} weight="duotone" aria-hidden="true" />
      <h2 className={styles.turnSyndicate}>Game complete</h2>
      <p className={styles.centerHelp}>The final standings are ready. Well played, investors.</p>
    </div>
  );
}

// Classic 3x3 pip layout per face, numbered 1-9 left-to-right/top-to-bottom.
const PIP_LAYOUT = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

function Die({ value, rolling, animate }) {
  const lit = PIP_LAYOUT[value] ?? [];
  return (
    <div className={`${styles.die} ${rolling ? styles.dieRolling : animate ? styles.dieSettled : ''}`}>
      <div className={styles.pipGrid}>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={lit.includes(i + 1) ? styles.pip : styles.pipEmpty} />
        ))}
      </div>
    </div>
  );
}

// Shared by every stage below that has a resolved roll to show — CenterIdle
// never renders one (it's only mounted while pendingTurn is null, i.e.
// before a roll), so this is the only place dice are ever visible.
//
// The server resolves a roll atomically (dice + landing square land in the
// same pending_turns row, no separate "in progress" tick to watch), so
// there's nothing to poll mid-roll. Instead, the instant a new roll's result
// arrives, briefly cycle random faces before settling on the real one — this
// plays the same way on every screen watching the board, not just whichever
// device tapped Roll.
function DiceReadout({ dice, rollId, animate }) {
  const [shownValue, setShownValue] = useState(dice?.[0]);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (!dice) return undefined;
    if (!animate) {
      setShownValue(dice[0]);
      setRolling(false);
      return undefined;
    }
    setRolling(true);
    const tumble = setInterval(() => {
      setShownValue(1 + Math.floor(Math.random() * 6));
    }, 120);
    const settle = setTimeout(() => {
      clearInterval(tumble);
      setShownValue(dice[0]);
      setRolling(false);
    }, 1500);
    return () => {
      clearInterval(tumble);
      clearTimeout(settle);
    };
    // Re-runs only when a genuinely new roll lands, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollId, animate]);

  if (!dice) return null;
  return (
    <div className={styles.dice}>
      <Die value={shownValue ?? dice[0]} rolling={rolling} animate={animate} />
    </div>
  );
}

function CenterIdle({ era, turnSyndicate, isHost, busy, gameActive, onRoll, onSkip }) {
  return (
    <div className={styles.centerIdle}>
      {era && (
        <div className={styles.eraHeader}>
          <span className={styles.eraTitle}>{era.title}</span>
          <span className={styles.eraYears}>{era.years}</span>
        </div>
      )}
      <TeamAvatar team={turnSyndicate} size="lg" />
      <h2 className={styles.turnSyndicate}>{turnSyndicate?.name ?? 'Ready to begin?'}</h2>
      <p className={styles.centerHelp}>{gameActive ? 'Roll, land on a space, then make your investment.' : 'Choose your eras and start the game in host controls.'}</p>
      {isHost && (
        <div className={styles.hostControls}>
          <button type="button" className={styles.rollButton} disabled={busy || !gameActive} onClick={onRoll}>
            Roll the die
          </button>
          <button type="button" className={styles.skipButton} disabled={busy || !gameActive} onClick={onSkip}>
            Skip Turn
          </button>
        </div>
      )}
    </div>
  );
}

function CenterCards({ pendingTurn, syndicate }) {
  if (!pendingTurn.drawnCards) {
    return (
      <div className={styles.centerCards}>
        <span className={styles.turnLabel}>Loading options…</span>
      </div>
    );
  }
  return (
    <div className={styles.centerCards}>
      <h2 className={styles.centerTitle}>Choose an investment</h2>
      <p className={styles.centerHelp}><TeamAvatar team={syndicate} size="sm" /> {syndicate?.name} is choosing on their team device. Finish this choice before the next roll.</p>
      <div className={styles.centerCardsRow}>
        {pendingTurn.drawnCards.map((card, index) => (
          <div key={card.id} className={styles.card}>
            <span className={styles.cardType}>Option {index + 1} · {card.assetType}</span>
            <span className={styles.cardName}>{card.name}</span>
            <span className={styles.cardReason}>{card.reason}</span>
            <span className={styles.cardFlap}>Return hidden</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CenterNews({ pendingTurn, isHost, syndicates, busy, onResolve }) {
  return (
    <div className={styles.centerNews}>
      <Newspaper className={styles.newsGlyph} size={36} weight="duotone" aria-hidden="true" />
      {pendingTurn.newsCard && (
        <>
          <span className={styles.newsTitle}>{pendingTurn.newsCard.title}</span>
          <p className={styles.newsBody}>{pendingTurn.newsCard.body}</p>
        </>
      )}
      {isHost && (
        <ResolvePanel kind="news" pendingTurn={pendingTurn} syndicates={syndicates} busy={busy} onResolve={onResolve} />
      )}
    </div>
  );
}

function CenterCorner({ pendingTurn, isHost, syndicates, busy, onResolve }) {
  return (
    <div className={styles.centerCorner}>
      <HandCoins className={styles.newsGlyph} size={36} weight="duotone" aria-hidden="true" />
      <span className={styles.newsTitle}>{pendingTurn.cornerEvent?.replace(/_/g, ' ')}</span>
      {isHost && (
        <ResolvePanel kind="corner" pendingTurn={pendingTurn} syndicates={syndicates} busy={busy} onResolve={onResolve} />
      )}
    </div>
  );
}

export default function RoomBoard() {
  const { slug } = useParams();
  const { session, profile } = useAuth();
  const state = useRoomConnection(slug, session?.access_token);
  const { busy: actionBusy, error, clearError, act } = useRoomAction(slug, session?.access_token, state);
  const busy = actionBusy || state.syncing;
  const isHost = ['host', 'admin'].includes(profile?.app_role);

  // Pending-turn decisions (60-90s to force-submit/resolve) take priority
  // over the room's own research-phase timer when both happen to be set.
  const deadline = state.pendingTurn?.decisionDeadline ?? state.room?.timerDeadline ?? null;
  const remainingMs = useCountdown(deadline);
  const previousTurn = useRef(undefined);
  const [animatedRollId, setAnimatedRollId] = useState(null);
  useEffect(() => {
    if (state.status !== 'ready') return;
    const id = state.pendingTurn?.id ?? null;
    if (previousTurn.current !== undefined && id && previousTurn.current !== id) setAnimatedRollId(id);
    previousTurn.current = id;
  }, [state.status, state.pendingTurn?.id]);

  if (state.status === 'loading') return <PageLoader label="Loading board…" />;
  if (state.status === 'error') return <div className={styles.error}>{state.error}</div>;

  const { game, room, syndicates, pendingTurn, transactions } = state;
  const era = ERA_BRIEFINGS.find((e) => e.id === game?.eraId);
  const turnSyndicate = syndicates[room.turnIndex] ?? null;
  const tokensByPosition = new Map();
  for (const s of syndicates) {
    if (!tokensByPosition.has(s.position)) tokensByPosition.set(s.position, []);
    tokensByPosition.get(s.position).push(s);
  }

  const ranked = [...syndicates].sort((a, b) => b.cash - a.cash);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.identity}><Link to="/select" aria-label="Finopoly games"><Logo size="sm" /></Link><span className={styles.roomName}>{room.name}</span></div>
        <div className={styles.headerActions}><span className={styles.phaseBadge}>{state.syncing ? 'Reconnecting…' : pendingTurn ? 'Turn in progress' : game?.status === 'lobby' ? 'Waiting to start' : game?.status === 'finished' ? 'Game complete' : 'Ready to roll'}</span>
        {isHost && <Link className={styles.hostLink} to={`/room/${slug}/host`}>Host controls <ArrowSquareOut size={16} aria-hidden="true" /></Link>}</div>
      </header>
      {error && (
        <div className={styles.actionError} role="alert">
          <span>{error}</span>
          <button type="button" className={styles.actionErrorDismiss} onClick={clearError} aria-label="Dismiss error">×</button>
        </div>
      )}
      <main className={styles.layout}>
      <div className={styles.boardArea}><div className={styles.board}>
        {BOARD.map((space) => (
          <BoardSpace key={space.id} space={space} tokens={tokensByPosition.get(space.id) ?? []} />
        ))}
        <div className={styles.center}>
          {pendingTurn && <DiceReadout dice={pendingTurn.dice} rollId={pendingTurn.id} animate={animatedRollId === pendingTurn.id} />}
          {game?.status === 'finished' && <CenterFinished />}
          {game?.status !== 'finished' && !pendingTurn && (
            <CenterIdle
              era={era}
              turnSyndicate={turnSyndicate}
              isHost={isHost}
              busy={busy}
              gameActive={game?.status === 'active'}
              onRoll={() => act('ROLL', {})}
              onSkip={() => act('SKIP_TURN', {})}
            />
          )}
          {pendingTurn?.stage === 'awaiting_pick' && <CenterCards pendingTurn={pendingTurn} syndicate={syndicates.find(s => s.id === pendingTurn.syndicateId)} />}
          {pendingTurn?.stage === 'news' && (
            <CenterNews
              pendingTurn={pendingTurn}
              isHost={isHost}
              syndicates={syndicates}
              busy={busy}
              onResolve={(targetId) => act('RESOLVE_NEWS', { targetId })}
            />
          )}
          {pendingTurn?.stage === 'corner' && (
            <CenterCorner
              pendingTurn={pendingTurn}
              isHost={isHost}
              syndicates={syndicates}
              busy={busy}
              onResolve={(targetId) => act('RESOLVE_CORNER', { targetId })}
            />
          )}
        </div>
      </div></div>

      <div className={styles.rail}>
        {deadline && (
          <div className={`${styles.timerBlock} ${remainingMs < 10000 ? styles.timerUrgent : ''}`}>
            <span className={styles.timerLabel}>{pendingTurn ? 'Decision time' : 'Research time'}</span>
            <span className={`${styles.timerValue} timer`}>{formatCountdown(remainingMs)}</span>
          </div>
        )}

        <section className={styles.standings}><h2 className={styles.railTitle}>Standings</h2>
          {ranked.length === 0 && <p className={styles.empty}>Add teams in host controls to begin.</p>}
          {ranked.map((s, i) => (
            <div key={s.id} className={styles.standingRow}>
              <span className={styles.rank}>{i + 1}</span>
              <TeamAvatar team={s} />
              <span className={styles.name}>{s.name}</span>
              <span className={`${styles.cash} money`}>{formatMoney(s.cash)}</span>
            </div>
          ))}
        </section>

        <section className={styles.transactions}><h2 className={styles.railTitle}>Recent activity</h2>
          {transactions.length === 0 && <p className={styles.empty}>Moves and investment results will appear here.</p>}
          {transactions.slice(0, 8).map((t) => {
            const syn = syndicates.find((s) => s.id === t.syndicateId);
            return (
              <div key={t.id} className={styles.txRow}>
                <TeamAvatar team={syn} size="sm" />
                <span className={styles.txNote}>{syn?.name ?? '—'} · {t.note || t.actionType}</span>
                <span className={`${styles.txAmount} ${t.amount >= 0 ? styles.gain : styles.loss} money`}>
                  {formatSignedMoney(t.amount)}
                </span>
              </div>
            );
          })}
        </section>
        <section className={styles.legend}><h2 className={styles.railTitle}>Explore the market</h2><div className={styles.legendGrid}>{Object.entries(GROUPS).map(([key, name]) => <div key={key}><span style={{ background: GROUP_VAR(key) }} />{name}</div>)}</div></section>
      </div>
      </main>
    </div>
  );
}
