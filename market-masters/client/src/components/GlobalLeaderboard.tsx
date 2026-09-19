import { Trophy, Medal, Award, TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import type { GameState } from '../types';

export default function GlobalLeaderboard({ gameState }: { gameState: GameState }) {
  const sortedTeams = [...(gameState?.teams || [])].sort((a, b) => b.cash - a.cash);

  return (
    <div className="min-h-[calc(100dvh-64px)] sm:min-h-[calc(100dvh-72px)] flex flex-col items-center pt-[var(--space-xl)] overflow-y-auto pb-20 px-[var(--space-sm)]">
      <div className="mb-[var(--space-xl)] text-center">
        <h1 className="text-[length:var(--text-heading-xl)] display-font text-[var(--text-primary)] flex items-center justify-center gap-3">
          <Trophy className="text-[var(--color-brand-hover)]" size={32}/>
          Global Rankings
        </h1>
        <p className="text-[var(--text-secondary)] mt-[var(--space-2xs)] font-medium text-sm sm:text-base">
          Active Era: <span className="text-[var(--color-brand-hover)] font-bold">{gameState?.currentEraName || 'Pre-Market'}</span>
        </p>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-[var(--space-xs)]">
        {/* Header Row */}
        <div className="hidden sm:flex px-6 py-3 text-[var(--text-tertiary)] font-bold text-xs uppercase tracking-widest border-b border-[var(--border-subtle)]">
          <div className="w-16 text-center">Rank</div>
          <div className="flex-1 pl-4">Syndicate</div>
          <div className="w-40 text-center">Location</div>
          <div className="w-44 text-right">Net Worth</div>
        </div>

        {/* Teams List */}
        {sortedTeams.map((team, idx) => {
          const isFirst = idx === 0;
          const isSecond = idx === 1;
          const isThird = idx === 2;
          const isPositive = team.cash >= 2000;

          let rankStyle = "bg-[var(--bg-secondary)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]";
          let icon = null;

          if (isFirst) {
            rankStyle = "bg-[var(--color-brand-subtle)] border-[var(--color-brand)] shadow-[var(--shadow-brand-glow)] sm:scale-[1.02] z-10";
            icon = <Trophy size={26} className="text-[var(--color-brand-hover)]" />;
          } else if (isSecond) {
            rankStyle = "bg-[var(--bg-elevated)] border-[var(--border-strong)] shadow-[var(--shadow-soft)]";
            icon = <Medal size={26} className="text-[var(--text-primary)]" />;
          } else if (isThird) {
            rankStyle = "bg-[var(--bg-elevated)] border-[var(--border-subtle)] shadow-[var(--shadow-soft)]";
            icon = <Award size={26} className="text-[var(--text-secondary)]" />;
          }

          return (
            <div
              key={team.id}
              className={`flex flex-wrap sm:flex-nowrap items-center gap-x-[var(--space-sm)] gap-y-3 p-[var(--space-md)] rounded-2xl border transition-all duration-300 ${rankStyle}`}
            >
              <div className="w-12 sm:w-16 flex justify-center items-center shrink-0">
                {icon ? icon : <span className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{idx + 1}</span>}
              </div>

              <div className="flex-1 min-w-[9rem] flex flex-col justify-center">
                <div className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {team.name}
                </div>
                <div className="text-xs font-semibold text-[var(--text-tertiary)] mt-1 flex gap-3">
                  <span>Laps: {team.lapTurnsTaken || 0}</span>
                  <span>Pos: {team.position || 0}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] font-semibold text-xs sm:text-sm shrink-0">
                <MapPin size={14} className="text-[var(--color-brand-hover)]"/>
                {team.room.replace('_', ' ')}
              </div>

              <div className={`w-full sm:w-44 flex items-center sm:justify-end gap-1.5 text-2xl sm:text-3xl font-black tracking-tighter tabular-nums ${isPositive ? 'text-white' : 'text-[var(--color-danger)]'}`}>
                {isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                ${team.cash.toLocaleString()}
              </div>
            </div>
          )
        })}

        {sortedTeams.length === 0 && (
          <div className="soft-panel p-[var(--space-2xl)] mt-[var(--space-xs)] text-center text-[var(--text-secondary)] font-medium flex flex-col items-center gap-4 border-dashed">
            <TrendingUp size={48} className="text-[var(--text-tertiary)] opacity-50"/>
            <div className="text-xl">Awaiting Market Open</div>
            <p className="text-sm text-[var(--text-tertiary)]">Teams will appear here once they are registered by room hosts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
