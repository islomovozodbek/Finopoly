import { Trophy } from 'lucide-react';
import { useGame } from '../game';
import TeamAvatar from './TeamAvatar';

export default function GlobalLeaderboard() {
  const { state } = useGame();
  const teams = [...(state?.teams ?? [])].sort((a, b) => b.cash - a.cash);
  return <div className="page-container">
    <div className="page-heading"><span className="eyebrow"><Trophy size={18} aria-hidden="true" />Across every room</span><h1>Global Rankings</h1><p className="muted">{state?.currentEraName ?? 'Waiting for the market to open'}. Signed amounts show each team’s change this era.</p></div>
    <div className="panel table-scroll" role="region" aria-label="Global rankings" tabIndex={0}>
      <table><thead><tr><th>Rank</th><th>Team</th><th>Room</th><th>Cash</th><th>This era</th></tr></thead><tbody>{teams.map((team, i) => {
        const delta = team.cash - team.eraStartingCash;
        return <tr key={team.id} className={i < 3 ? 'top-rank' : ''}><td className="muted">{i + 1}</td><td><span className="team-name"><TeamAvatar team={team} /><strong>{team.name}</strong></span></td><td className="muted">{team.room.replaceAll('_', ' ')}</td><td className="money">${team.cash.toLocaleString()}</td><td className={`money ${delta >= 0 ? 'gain' : 'loss'}`}>{delta >= 0 ? '+' : '−'}${Math.abs(delta).toLocaleString()}</td></tr>;
      })}</tbody></table>
      {!teams.length && <p className="empty-state">No teams yet. Add your teams in Host Control to get started.</p>}
    </div>
  </div>;
}
