import { Trophy, Medal, Award, TrendingUp, MapPin } from 'lucide-react';
import type { GameState } from '../types';

export default function GlobalLeaderboard({ gameState }: { gameState: GameState }) {
  const sortedTeams = [...(gameState?.teams || [])].sort((a, b) => b.cash - a.cash);

  return (
    <div className="h-full flex flex-col items-center pt-8 overflow-y-auto pb-20 px-4">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-3">
          <Trophy className="text-brand-500" size={40}/>
          Global Rankings
        </h1>
        <p className="text-[var(--text-secondary)] mt-2 font-medium">Active Era: <span className="text-brand-600 font-bold">{gameState?.currentEraName || 'Pre-Market'}</span></p>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-3">
        {/* Header Row */}
        <div className="flex px-6 py-3 text-[var(--text-tertiary)] font-bold text-xs uppercase tracking-widest border-b border-[var(--border-subtle)]">
          <div className="w-16 text-center">Rank</div>
          <div className="flex-1 pl-4">Syndicate</div>
          <div className="w-40 text-center">Location</div>
          <div className="w-48 text-right">Net Worth</div>
        </div>

        {/* Teams List */}
        {sortedTeams.map((team, idx) => {
          const isFirst = idx === 0;
          const isSecond = idx === 1;
          const isThird = idx === 2;

          let rankStyle = "bg-white border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-brand-300 hover:shadow-lg";
          let icon = null;

          if (isFirst) {
            rankStyle = "bg-brand-50 border-brand-300 text-brand-900 shadow-lg ring-2 ring-brand-500/20 scale-[1.02] z-10";
            icon = <Trophy size={28} className="text-brand-500" />;
          } else if (isSecond) {
            rankStyle = "bg-white border-slate-300 text-[var(--text-primary)] shadow-md hover:border-brand-300";
            icon = <Medal size={28} className="text-slate-400" />;
          } else if (isThird) {
            rankStyle = "bg-white border-amber-200 text-[var(--text-primary)] shadow-md hover:border-brand-300";
            icon = <Award size={28} className="text-amber-600" />;
          }

          return (
            <div 
              key={team.id} 
              className={`flex items-center px-6 py-5 rounded-2xl border transition-all duration-300 ${rankStyle}`}
            >
              <div className="w-16 flex justify-center items-center">
                {icon ? icon : <span className="text-2xl font-bold">{idx + 1}</span>}
              </div>
              
              <div className={`flex-1 pl-4 flex flex-col justify-center`}>
                <div className={`text-xl font-bold tracking-tight ${isFirst ? 'text-brand-900' : 'text-[var(--text-primary)]'}`}>
                  {team.name}
                </div>
                <div className="text-xs font-semibold text-[var(--text-tertiary)] mt-1 flex gap-3">
                  <span>Laps: {team.lapTurnsTaken || 0}</span>
                  <span>Pos: {team.position || 0}</span>
                </div>
              </div>
              
              <div className="w-40 flex justify-center">
                <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm font-semibold text-sm">
                  <MapPin size={14} className="text-brand-500"/>
                  {team.room.replace('_', ' ')}
                </div>
              </div>
              
              <div className={`w-48 text-right text-3xl font-black tracking-tighter ${team.cash >= 2000 ? 'text-emerald-600' : 'text-rose-600'}`}>
                ${team.cash.toLocaleString()}
              </div>
            </div>
          )
        })}
        
        {sortedTeams.length === 0 && (
          <div className="soft-panel p-16 mt-4 text-center text-[var(--text-secondary)] font-medium flex flex-col items-center gap-4 border border-dashed border-[var(--border-strong)]">
            <TrendingUp size={48} className="text-[var(--text-tertiary)] opacity-50"/>
            <div className="text-xl">Awaiting Market Open</div>
            <p className="text-sm text-[var(--text-tertiary)]">Teams will appear here once they are registered by room hosts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
