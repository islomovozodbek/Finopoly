import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Flag, HandCoins, Landmark, LockKeyhole, Newspaper, ShieldCheck, X } from 'lucide-react';
import { useGame, useGameAction, useRoom } from '../game';
import type { InvestmentResult, Team } from '../types';
import TeamAvatar, { teamIdentity } from './TeamAvatar';

const NEWS = [2, 7, 17, 22, 33, 36];
const CORNERS = { 0: { title: 'Start', Icon: Flag }, 10: { title: 'Angel', Icon: HandCoins }, 20: { title: 'Prison', Icon: LockKeyhole }, 30: { title: 'Buyout', Icon: Landmark } };
const EVENT_COPY: Record<string, { title: string; body: string }> = {
  START_BONUS: { title: 'Landed on Start', body: 'Your team receives the passing bonus and an extra $200 for landing on Start.' },
  ANGEL_INVESTMENT: { title: 'Angel Investment', body: 'Invest half your cash. Heads triples that investment; tails loses it. Record the coin toss result below.' },
  CORPORATE_BUYOUT: { title: 'Corporate Buyout', body: 'Choose an eligible opponent and roll against them. The winner receives $1,000 from the other team.' },
  WHITE_COLLAR_PRISON: { title: 'White Collar Prison', body: 'Your team will skip its next turn. Until then, your cash is protected from targeted negative effects.' },
  FROZEN: { title: 'Assets frozen', body: 'Your team skips this turn. Finish here to unfreeze your assets for the next round.' },
};
const money = (n: number) => `$${n.toLocaleString()}`;
function gridPosition(i: number) {
  if (i <= 10) return { gridRow: 11, gridColumn: 11 - i };
  if (i <= 20) return { gridRow: 21 - i, gridColumn: 1 };
  if (i <= 30) return { gridRow: 1, gridColumn: i - 19 };
  return { gridRow: i - 29, gridColumn: 11 };
}

function BoardSpace({ index, teams }: { index: number; teams: Team[] }) {
  const special = CORNERS[index as keyof typeof CORNERS];
  const isNews = NEWS.includes(index);
  const Icon = special?.Icon ?? Newspaper;
  const title = special?.title ?? (isNews ? 'Market news' : `Investment ${index}`);
  return <div className={`board-space ${special ? 'corner-space' : isNews ? 'news-space' : 'asset-space'}`} style={gridPosition(index)} data-sector={Math.floor(index / 5) % 8} title={`${title}${teams.length ? ': ' + teams.map(t => t.name).join(', ') : ''}`} aria-label={`${title}${teams.length ? ': ' + teams.map(t => t.name).join(', ') : ''}`}>
    {special || isNews ? <><Icon size={20} aria-hidden="true" /><span className="space-label">{special?.title ?? 'News'}</span></> : <><span className="space-number">{index}</span><span className="space-label">Investment</span></>}
    {!!teams.length && <span className="board-pieces" data-count={teams.length}>{teams.slice(0, 3).map(t => <TeamAvatar key={t.id} team={t} size="xs" />)}{teams.length > 3 && <b className="desktop-token-count">+{teams.length - 3}</b>}{teams.length > 1 && <b className="mobile-token-count">+{teams.length - 1}</b>}</span>}
  </div>;
}

function readDraft(id?: string) {
  try { return JSON.parse(sessionStorage.getItem(`finopoly:live-draft:${id}`) || '{}') as { cardId?: string; amount?: string }; }
  catch { return {}; }
}

export default function ProjectorBoard() {
  const { roomId = 'Room_1' } = useParams();
  useRoom(roomId);
  const { state, connected } = useGame();
  const { act, busy, error } = useGameAction();
  const room = state?.rooms[roomId];
  const teams = state?.teams.filter(t => t.room === roomId) ?? [];
  const current = teams[room?.turnIndex ?? 0];
  const pending = room?.pendingTurn ?? null;
  const [result, setResult] = useState<InvestmentResult | null>(null);
  const [rolling, setRolling] = useState(false);
  const [selection, setSelection] = useState('');
  const [amount, setAmount] = useState('');
  const [target, setTarget] = useState('');
  const [coin, setCoin] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    const draft = readDraft(pending?.id);
    setSelection(draft.cardId ?? ''); setAmount(draft.amount ?? '');
    setTarget(''); setCoin(''); setDraftId(pending?.id ?? null);
  }, [pending?.id]);
  useEffect(() => {
    if (!pending || draftId !== pending.id) return;
    try { sessionStorage.setItem(`finopoly:live-draft:${pending.id}`, JSON.stringify({ cardId: selection, amount })); } catch { /* The server still owns the pending turn. */ }
  }, [selection, amount, draftId, pending]);

  if (!state || !room) return <p className="empty-state" role="status">Connecting to the game board…</p>;
  const ranked = [...teams].sort((a, b) => b.cash - a.cash);
  const actor = teams.find(t => t.id === pending?.teamId) ?? current;
  const stake = actor?.blindFaith ? actor.cash : Number(amount);
  const selected = pending?.cards.find(c => c.id === selection);
  async function roll() {
    if (!current || busy || rolling) return;
    setRolling(true);
    try { await act('movePiece', { teamId: current.id }); }
    finally { setRolling(false); }
  }
  async function invest(pass = false) {
    if (!pending || !actor) return;
    const response = await act('processInvestment', { teamId: actor.id, pendingId: pending.id, cardId: selection, betAmount: stake, pass });
    if (response?.result) {
      try { sessionStorage.removeItem(`finopoly:live-draft:${pending.id}`); } catch { /* Optional local draft. */ }
      setResult(response.result);
    }
  }
  async function finishEvent() {
    if (!pending || !actor) return;
    await act(pending.eventType === 'MARKET_NEWS' ? 'resolveMarketNews' : 'resolveCornerEvent', {
      teamId: actor.id, roomId, pendingId: pending.id, eventType: pending.eventType, targetTeamId: target, coinTossResult: coin,
    });
  }
  const event = pending?.eventType ? EVENT_COPY[pending.eventType] : null;
  const opponents = teams.filter(t => t.id !== actor?.id && !t.immune);
  const needsTarget = pending?.eventType === 'CORPORATE_BUYOUT' || pending?.newsCard?.type === 'TARGET_OPPONENT';
  const needsCoin = pending?.eventType === 'ANGEL_INVESTMENT' || pending?.newsCard?.type === 'COIN_TOSS';
  const needsContest = pending?.eventType === 'CORPORATE_BUYOUT' || pending?.newsCard?.effect === 'HOSTILE_BID';
  const txs = state.transactions.filter(tx => tx.roomId === roomId).slice(0, 6);
  const DiceIcon = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6][(pending?.dice ?? 5) - 1];

  return <div className="board-page">
    <div className="board-heading"><div><span className="eyebrow">{state.currentEraName}</span><h1>{roomId.replaceAll('_', ' ')} game board</h1></div><span className={`badge ${pending ? 'accent-badge' : ''}`}>{pending ? 'Turn saved · choice pending' : room.eraStatus === 'INTERMISSION' ? 'Research break' : 'Ready to roll'}</span></div>
    {error && <p className="error-banner" role="alert">{error}</p>}
    <div className="game-layout"><div className="game-main">
      <section className="game-board" aria-label="Forty-space game board">{Array.from({ length: 40 }, (_, i) => <BoardSpace key={i} index={i} teams={teams.filter(t => t.position === i)} />)}
        <div className="board-center">
          {actor ? <TeamAvatar team={actor} size="lg" /> : <Flag size={32} aria-hidden="true" />}
          <span className="eyebrow">{pending ? 'Turn in progress' : room.eraStatus === 'INTERMISSION' ? 'Era complete' : 'Current turn'}</span>
          <h2>{actor?.name ?? 'Ready to begin?'}</h2>
          {actor && <span className="center-cash money">{money(actor.cash)}</span>}
          <DiceIcon size={32} className={rolling ? 'dice-rolling' : 'dice-readout'} aria-hidden="true" />
          <p className="center-help">{pending ? `${pending.dice ? `Rolled ${pending.dice} · Space ${pending.position}. ` : ''}Finish your saved ${pending.stage === 'investment' ? 'investment' : 'event'} below.` : room.eraStatus === 'INTERMISSION' ? 'Research break. Ask your host to start the next era.' : actor ? 'Roll the die, land on a space, then decide together.' : 'Add teams in Host Control to start your game.'}</p>
          {!pending && !result && <button className="button primary" disabled={busy || rolling || !actor || room.eraStatus === 'INTERMISSION'} onClick={() => void roll()}>{rolling ? 'Rolling…' : 'Roll the die'}<ArrowRight size={18} aria-hidden="true" /></button>}
          {pending && <a className="button secondary" href="#pending-choice">{pending.stage === 'investment' ? 'View investment options' : 'View board event'}<ArrowRight size={18} aria-hidden="true" /></a>}
          {!actor && <Link to={`/room/${roomId}/moderator`} className="button secondary">Open Host Control</Link>}
        </div>
      </section>

      {result && <section className="panel result-panel" aria-live="polite"><span className="eyebrow"><Check size={18} aria-hidden="true" />Turn complete</span><h2>{result.passed ? 'Investment passed' : result.card?.name}</h2><p className="muted">{result.teamName}</p>{!result.passed && <><p className={`result-amount money ${result.profitLoss >= 0 ? 'gain' : 'loss'}`}>{result.profitLoss >= 0 ? '+' : '−'}{money(Math.abs(result.profitLoss))}</p><p className="muted">{result.percentage >= 0 ? '+' : ''}{result.percentage}% return · Cash now {money(result.cash)}</p><details><summary>Why this investment performed this way</summary><p>{result.card?.reason}</p></details></>}<button className="button primary" onClick={() => setResult(null)}>Continue<ArrowRight size={18} aria-hidden="true" /></button></section>}

      {pending?.stage === 'investment' && actor && <section className="panel investment-panel" id="pending-choice" aria-label="Pending investment choice">
        <div className="section-heading"><div><span className="eyebrow">Step 2 · Discuss and decide</span><h2>Choose an investment</h2></div><span className="badge">{pending.cards.length} options</span></div>
        <p className="muted">Choose one option, then set how much to invest. These same options return if you leave or refresh.</p>
        <div className={`investment-options ${pending.cards.length > 3 ? 'many-options' : ''}`}>{pending.cards.map((card, i) => <button className={`investment-card ${selection === card.id ? 'selected' : ''}`} key={card.id} aria-pressed={selection === card.id} disabled={busy} onClick={() => setSelection(card.id)}><span className="option-label">Option {i + 1}{selection === card.id && <Check size={18} aria-hidden="true" />}</span><strong>{card.name}</strong><span>{card.description || 'Compare this investment with your research from the current era.'}</span><small>{selection === card.id ? 'Selected' : 'Choose this investment'}</small></button>)}</div>
        <p className="hidden-return"><LockKeyhole size={16} aria-hidden="true" />Returns are revealed after you invest.</p>
        <div className="investment-controls"><label className="field" htmlFor="investment-amount">Investment amount ($)<input id="investment-amount" type="number" min="1" max={actor.cash} step="1" placeholder="0" value={actor.blindFaith ? actor.cash : amount} onChange={e => setAmount(e.target.value)} disabled={busy || !!actor.blindFaith} /></label><div className="amount-presets">{[25, 50, 100].map(p => <button className="button secondary" key={p} disabled={busy || !!actor.blindFaith} onClick={() => setAmount(String(Math.floor(actor.cash * p / 100)))}>{p === 100 ? 'All in' : `${p}%`}</button>)}</div><p className="small muted">Available cash: <strong className="money">{money(actor.cash)}</strong>{actor.blindFaith ? ' · Blind Faith requires investing all your cash.' : ''}</p><button className="button primary full-width" disabled={busy || !selected || !Number.isSafeInteger(stake) || stake <= 0 || stake > actor.cash} onClick={() => void invest()}>{!selected ? 'Select an option to continue' : busy ? 'Saving investment…' : `Invest ${money(stake || 0)}`}<ArrowRight size={18} aria-hidden="true" /></button><button className="button text-button" disabled={busy} onClick={() => void invest(true)}>Pass this investment and end turn</button></div>
      </section>}

      {pending?.stage === 'event' && <section className="panel event-panel" id="pending-choice" aria-label="Pending board event"><span className="eyebrow">Step 2 · Resolve the board event</span><h2>{pending.newsCard?.title ?? event?.title ?? 'Board event'}</h2><p className="muted">{pending.newsCard?.description ?? event?.body}</p>
        {needsTarget && <label className="field">Target team<select value={target} onChange={e => setTarget(e.target.value)}><option value="">Choose an eligible opponent</option>{opponents.map(t => <option key={t.id} value={t.id}>{teamIdentity(t).emoji} {t.name}</option>)}</select></label>}
        {needsCoin && <ResultChoices value={coin} onChange={setCoin} values={[['HEADS', 'Heads'], ['TAILS', 'Tails']]} label="Coin toss result" disabled={busy} />}
        {needsContest && <ResultChoices value={coin} onChange={setCoin} values={[['WIN', 'Current team won'], ['LOSS', 'Opponent won']]} label="Dice contest result" disabled={busy} />}
        {needsTarget && !opponents.length && <p className="info-banner">No eligible opponent is available. Finish this event without a transfer.</p>}
        <button className="button primary" disabled={busy || (needsTarget && opponents.length > 0 && !target) || ((needsCoin || (needsContest && opponents.length > 0)) && !coin)} onClick={() => void finishEvent()}>Finish event<ArrowRight size={18} aria-hidden="true" /></button>
      </section>}
    </div>
    <aside className="game-rail"><section className="panel"><div className="section-heading"><h2>Room standings</h2></div>{ranked.length ? <ol className="standings-list">{ranked.map((t, i) => <li key={t.id}><span className="rank">{i + 1}</span><TeamAvatar team={t} /><span className="standing-name">{t.name}</span><strong className="money">{money(t.cash)}</strong></li>)}</ol> : <p className="muted">Your teams will appear here once the host adds them.</p>}</section>
      {actor && <section className="panel"><h2>Team status</h2><p className="small muted">Space {actor.position} · {actor.lapTurnsTaken} completed turns</p><div className="team-flags">{(['hedgeFund', 'insiderInfo', 'blindFaith', 'bigShort', 'monopolyPower', 'frozen', 'sabotaged', 'immune'] as const).filter(k => actor[k]).map(k => <span className="badge" key={k}><ShieldCheck size={14} aria-hidden="true" />{k.replace(/([A-Z])/g, ' $1')}</span>)}</div></section>}
      <section className="panel"><div className="section-heading"><h2>Recent activity</h2></div>{txs.map(tx => { const team = teams.find(t => t.id === tx.teamId); return <div className="activity-row" key={tx.id}>{team && <TeamAvatar team={team} size="sm" />}<span><strong>{team?.name ?? 'Team'}</strong><span className="small muted">{tx.details}</span></span><strong className={`small money ${tx.amount >= 0 ? 'gain' : 'loss'}`}>{tx.amount >= 0 ? '+' : '−'}{money(Math.abs(tx.amount))}</strong></div>; })}{!txs.length && <p className="muted">Moves and investment results will appear here.</p>}</section>
      <p className="small muted">{room.cardsRemaining} investments remain in this era. {connected ? 'Connected · progress saved on the server.' : 'Reconnecting…'}</p>
    </aside></div>
  </div>;
}

function ResultChoices({ value, onChange, values, label, disabled }: { value: string; onChange: (value: string) => void; values: string[][]; label: string; disabled: boolean }) {
  return <fieldset className="result-choices"><legend>{label}</legend><div>{values.map(([id, title]) => <button key={id} className={`button secondary ${value === id ? 'selected' : ''}`} aria-pressed={value === id} onClick={() => onChange(id)} disabled={disabled}>{value === id ? <Check size={17} aria-hidden="true" /> : <X size={17} aria-hidden="true" />}{title}</button>)}</div></fieldset>;
}
