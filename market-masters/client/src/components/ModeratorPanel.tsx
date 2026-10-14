import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, Plus, Trash2, Users, Settings, AlertTriangle } from 'lucide-react';
import { useGame, useGameAction, useRoom } from '../game';
import TeamAvatar, { teamIdentity } from './TeamAvatar';

export default function ModeratorPanel() {
  const { roomId = 'Room_1' } = useParams();
  useRoom(roomId);
  const { state } = useGame();
  const { act, busy, error } = useGameAction();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [adjustment, setAdjustment] = useState('PENALTY');
  const [amount, setAmount] = useState('300');
  const [resetText, setResetText] = useState('');
  const [showReset, setShowReset] = useState(false);
  const teams = state?.teams.filter(t => t.room === roomId) ?? [];
  const room = state?.rooms[roomId];
  const pending = room?.pendingTurn;
  const current = teams[room?.turnIndex ?? 0];
  const transactions = state?.transactions.filter(t => t.roomId === roomId) ?? [];
  const globalPending = Object.values(state?.rooms ?? {}).some(r => r.pendingTurn);
  if (!state || !room) return <p className="empty-state" role="status">Connecting to your room…</p>;
  return <div className="page-container">
    <div className="page-heading heading-row"><div><span className="eyebrow"><Settings size={18} aria-hidden="true" />{roomId.replaceAll('_', ' ')}</span><h1>Host Control Panel</h1><p className="muted">Guide your teams through the market, one finished turn at a time.</p></div><Link className="button secondary" to={`/room/${roomId}/board`}>Open game board<ArrowUpRight size={18} aria-hidden="true" /></Link></div>
    {error && <p className="error-banner" role="alert">{error}</p>}
    {pending && <div className="info-banner"><strong>A turn is saved and waiting.</strong><span>Finish the {pending.stage === 'investment' ? 'investment choice' : 'board event'} on the game board before rolling, skipping, or changing eras.</span><Link to={`/room/${roomId}/board`}>Resume saved turn →</Link></div>}
    <div className="host-columns">
      <section className="panel"><div className="section-heading"><h2><Users size={21} aria-hidden="true" />Teams &amp; turns</h2><span className="badge">{teams.length} / 8 teams</span></div>
        <div className="era-block"><div><span className="eyebrow">Active era</span><h3>{state.currentEraName}</h3><p className="small muted">{room.eraStatus === 'INTERMISSION' ? 'Research break. Start the next era when teams are ready.' : 'Roll, discuss the options, then make one investment.'}</p></div><button className="button secondary" disabled={busy || globalPending} onClick={() => { if (confirm('Advance the era for every room? Each room receives a new deck.')) void act('advanceEra'); }}>Next era</button></div>
        <div className="current-team"><span className="small muted">Current turn</span>{current ? <span className="team-name"><TeamAvatar team={current} /><strong>{current.name}</strong></span> : <p>Add a team to begin.</p>}<button className="button secondary" disabled={busy || !!pending || !current} onClick={() => { if (confirm('Skip this team’s turn?')) void act('forceNextTurn', roomId); }}>Skip turn</button></div>
        <form className="add-team" onSubmit={async e => { e.preventDefault(); const response = await act('registerTeam', { name, room: roomId, startingCash: 2000 }); if (response) setName(''); }}><label className="field" htmlFor="team-name">Add new team<input id="team-name" value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Enter team name" disabled={busy || teams.length >= 8} /></label><button type="submit" className="button primary" disabled={busy || !name.trim() || teams.length >= 8}><Plus size={18} aria-hidden="true" />Add</button></form>
        <ul className="team-list">{teams.map(t => <li key={t.id}><span className="team-name"><TeamAvatar team={t} /><strong>{t.name}</strong></span><span className="money">${t.cash.toLocaleString()}</span><button className="icon-button" aria-label={`Remove ${t.name}`} title={`Remove ${t.name}`} disabled={busy || !!pending} onClick={() => { if (confirm(`Remove ${t.name}?`)) void act('removeTeam', t.id); }}><Trash2 size={18} aria-hidden="true" /></button></li>)}</ul>
      </section>
      <section className="panel"><div className="section-heading"><h2>Cash adjustments</h2></div><p className="muted">Record a bonus or penalty agreed with your teams.</p><form className="form-stack" onSubmit={e => { e.preventDefault(); void act('cornerAction', { teamId: target, actionType: adjustment, amount: Number(amount) }); }}>
        <label className="field">Target team<select value={target} onChange={e => setTarget(e.target.value)} required><option value="">Choose a team</option>{teams.map(t => <option key={t.id} value={t.id}>{teamIdentity(t).emoji} {t.name}</option>)}</select></label>
        <label className="field">Action<select value={adjustment} onChange={e => setAdjustment(e.target.value)}><option value="START">Pass Start (+$200)</option><option value="GAMBLE_WIN">Casino win (+)</option><option value="GAMBLE_LOSS">Casino loss (−)</option><option value="PENALTY">Manual penalty (−)</option></select></label>
        <label className="field">Amount ($)<input type="number" min="0" step="1" value={amount} onChange={e => setAmount(e.target.value)} required /></label><button type="submit" className="button primary" disabled={busy || !target || !amount}>Apply adjustment</button>
      </form></section>
    </div>
    <section className="panel history-panel"><div className="section-heading"><h2>Transaction history</h2></div><div className="table-scroll" role="region" aria-label="Room transactions" tabIndex={0}><table><thead><tr><th>Time</th><th>Team</th><th>Action</th><th>Amount</th><th>Details</th></tr></thead><tbody>{transactions.map(tx => { const team = teams.find(t => t.id === tx.teamId); return <tr key={tx.id}><td className="small muted">{new Date(tx.timestamp.replace(' ', 'T') + (tx.timestamp.includes('Z') ? '' : 'Z')).toLocaleTimeString()}</td><td><span className="team-name">{team && <TeamAvatar team={team} size="sm" />}{team?.name ?? 'Removed team'}</span></td><td className="small">{tx.actionType.replaceAll('_', ' ')}</td><td className={`money ${tx.amount > 0 ? 'gain' : tx.amount < 0 ? 'loss' : ''}`}>{tx.amount >= 0 ? '+' : '−'}${Math.abs(tx.amount).toLocaleString()}</td><td className="small muted">{tx.details}</td></tr>; })}</tbody></table>{!transactions.length && <p className="empty-state">Moves and investment results will appear here.</p>}</div></section>
    <section className="panel reset-panel"><div><h2><AlertTriangle size={20} aria-hidden="true" />Reset all rooms</h2><p className="small muted">Removes every team and all game history. Use this only when starting a new session.</p></div><button className="button secondary" onClick={() => setShowReset(v => !v)}>Reset options</button>{showReset && <form onSubmit={async e => { e.preventDefault(); if (resetText !== 'RESET') return; if (await act('resetGame')) { setResetText(''); setShowReset(false); } }}><label className="field">Type RESET to confirm<input value={resetText} onChange={e => setResetText(e.target.value)} autoComplete="off" /></label><button className="button danger" disabled={busy || resetText !== 'RESET'}>Reset everything</button></form>}</section>
  </div>;
}
