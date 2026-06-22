import { useState } from 'react';
import { Users, AlertCircle, Settings, Plus, FastForward, Trash2, History, RotateCcw, TriangleAlert } from 'lucide-react';
import type { GameState, Team } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ModeratorPanel({ socket, gameState, roomId }: { socket: any, gameState: GameState, roomId: string }) {
  const [newTeamName, setNewTeamName] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  
  const [selectedTeam, setSelectedTeam] = useState('');
  const [cornerAction, setCornerAction] = useState('PENALTY');
  const [cornerAmount, setCornerAmount] = useState('300');

  const handleRegister = () => {
    if (!newTeamName) return;
    socket.emit('registerTeam', { name: newTeamName, room: roomId, startingCash: 2000 });
    setNewTeamName('');
  };

  const handleCornerAction = () => {
    if (!selectedTeam) return alert("Select a team");
    socket.emit('cornerAction', {
      teamId: selectedTeam,
      actionType: cornerAction,
      amount: parseInt(cornerAmount)
    });
    setCornerAmount('');
  };

  const advanceEra = () => {
    if (confirm("Are you sure you want to advance to the next Era? This replaces the deck for all rooms.")) {
      socket.emit('advanceEra');
    }
  };

  const removeTeam = (teamId: string) => {
    if (confirm("Are you sure you want to remove this team?")) {
      socket.emit('removeTeam', teamId);
    }
  };

  const forceNextTurn = () => {
    if (confirm("Skip the current team's turn and advance to the next player?")) {
      socket.emit('forceNextTurn', roomId);
    }
  };

  const handleResetGame = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    socket.emit('resetGame');
    setConfirmReset(false);
  };

  const teamsInRoom = gameState?.teams?.filter((t: Team) => t.room === roomId) || [];
  const roomState = gameState?.rooms?.[roomId] || { deck: [], turnIndex: 0, eraStatus: 'ACTIVE' };
  const transactions = gameState?.transactions?.filter(t => t.roomId === roomId) || [];

  return (
    <div className="h-full flex flex-col items-center pt-8 overflow-y-auto pb-20 px-4">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
          <Settings className="text-brand-500" size={28}/> 
          Host Control Panel
        </h1>
        <p className="text-[var(--text-tertiary)] mt-2">Manage room {roomId.replace('_', ' ')} and manual overrides</p>
      </div>

      {/* New Game — Danger Zone */}
      <div className={`w-full max-w-5xl rounded-2xl border-2 p-5 flex items-center justify-between gap-4 transition-all duration-300 ${confirmReset ? 'border-rose-500 bg-rose-50 shadow-lg shadow-rose-200' : 'border-rose-200 bg-white'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${confirmReset ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-100 text-rose-600'}`}>
            <TriangleAlert size={20} />
          </div>
          <div>
            <div className="font-bold text-rose-700 text-sm">New Game</div>
            <div className="text-xs text-rose-500">
              {confirmReset
                ? '⚠️ This will wipe ALL teams, rooms, and history. Click again to confirm.'
                : 'Clears all teams, rooms, and transactions — start fresh.'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {confirmReset && (
            <button
              onClick={() => setConfirmReset(false)}
              className="px-4 py-2 rounded-lg border border-rose-200 text-rose-500 text-sm font-semibold hover:bg-rose-100 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            id="new-game-btn"
            onClick={handleResetGame}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-white shadow-md transition-all duration-200 ${confirmReset ? 'bg-rose-600 hover:bg-rose-700 scale-105 ring-4 ring-rose-400/30' : 'bg-rose-500 hover:bg-rose-600'}`}
          >
            <RotateCcw size={15} />
            {confirmReset ? 'Yes, Reset Everything' : 'New Game'}
          </button>
        </div>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Room & Team Registration */}
        <div className="soft-panel p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Users className="text-brand-500" size={20}/> 
              Room Setup
            </h2>
            <div className="text-sm text-[var(--text-tertiary)]">
              {teamsInRoom.length} / 8 Teams
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between bg-brand-50 p-4 rounded-xl border border-[var(--border-subtle)]">
              <div>
                <div className="text-xs font-bold text-brand-600 uppercase tracking-widest">Active Era</div>
                <div className="text-xl font-black text-[var(--text-primary)] leading-tight">{gameState?.currentEraName || 'Loading...'}</div>
                {roomState.eraStatus === 'INTERMISSION' && (
                  <div className="mt-1 text-xs font-bold text-rose-600 uppercase tracking-widest animate-pulse">
                     INTERMISSION PAUSE
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={advanceEra} 
                  className={`px-4 py-2 text-white rounded-lg text-sm font-semibold shadow-md flex items-center justify-center gap-2 ${roomState.eraStatus === 'INTERMISSION' ? 'bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-500/30' : 'bg-brand-900 hover:bg-brand-800'}`}
                >
                  <FastForward size={16}/> {roomState.eraStatus === 'INTERMISSION' ? 'Start Next Era' : 'Force Advance Era'}
                </button>
                <button 
                  onClick={forceNextTurn} 
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold shadow-md flex items-center justify-center gap-2"
                >
                  Skip Turn
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Add New Team</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter team name..."
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-strong)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-[var(--text-tertiary)]"
                  value={newTeamName} 
                  onChange={e => setNewTeamName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  disabled={teamsInRoom.length >= 8}
                />
                <button 
                  onClick={handleRegister} 
                  disabled={!newTeamName || teamsInRoom.length >= 8}
                  className="px-4 py-2 bg-brand-900 hover:bg-brand-800 disabled:bg-brand-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  <Plus size={18}/> Add
                </button>
              </div>
            </div>
            
            {teamsInRoom.length > 0 && (
              <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-y-auto">
                <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Registered Teams</h3>
                <ul className="space-y-2">
                  {teamsInRoom.map((t: Team, idx: number) => (
                    <li key={t.id} className="flex justify-between items-center bg-white border border-[var(--border-subtle)] px-3 py-2 rounded-md shadow-sm">
                      <div className="flex items-center gap-2">
                         <button onClick={() => removeTeam(t.id)} className="text-rose-400 hover:text-rose-600 transition-colors p-1" title="Remove Team">
                           <Trash2 size={16} />
                         </button>
                         <span className="font-medium text-[var(--text-primary)] text-sm">{idx + 1}. {t.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-600">${t.cash.toLocaleString()}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">Pos: {t.position || 0}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Manual Controls */}
        <div className="soft-panel p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <AlertCircle className="text-orange-500" size={20}/> 
              Manual Adjustments
            </h2>
          </div>
          
          <div className="space-y-5 flex-grow">
             <div>
               <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Target Team</label>
               <select 
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-strong)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
                >
                  <option value="">-- Select a Team --</option>
                  {teamsInRoom.map((t: Team) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
              </select>
             </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Action & Amount</label>
              <div className="flex gap-2">
                 <select 
                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-strong)] rounded-lg p-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    value={cornerAction} onChange={e => setCornerAction(e.target.value)}
                  >
                    <option value="START">Pass Start (+)</option>
                    <option value="GAMBLE_WIN">Casino Win (+)</option>
                    <option value="GAMBLE_LOSS">Casino Loss (-)</option>
                    <option value="PENALTY">Manual Penalty (-)</option>
                </select>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] font-medium">$</span>
                  <input 
                      type="number"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-strong)] rounded-lg p-2.5 pl-7 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                      value={cornerAmount} onChange={e => setCornerAmount(e.target.value)}
                    />
                </div>
              </div>
            </div>
            
             <button 
                onClick={handleCornerAction} 
                className="w-full py-3 mt-4 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-semibold rounded-lg transition-colors flex justify-center items-center gap-2 shadow-sm"
              >
              Execute Adjustment
            </button>
          </div>
        </div>

      </div>
      
      {/* Transaction History */}
      <div className="w-full max-w-5xl mt-8 soft-panel p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <History className="text-indigo-500" size={20}/> 
            Transaction History
          </h2>
          <div className="text-sm text-[var(--text-tertiary)]">
            Latest Events
          </div>
        </div>
        
        <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg max-h-[400px] overflow-y-auto">
          {transactions.length === 0 ? (
             <div className="p-8 text-center text-[var(--text-tertiary)]">No transactions recorded yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)]">
                     <th className="p-3 text-xs font-bold text-[var(--text-secondary)] uppercase">Time</th>
                     <th className="p-3 text-xs font-bold text-[var(--text-secondary)] uppercase">Team</th>
                     <th className="p-3 text-xs font-bold text-[var(--text-secondary)] uppercase">Action</th>
                     <th className="p-3 text-xs font-bold text-[var(--text-secondary)] uppercase">Amount</th>
                     <th className="p-3 text-xs font-bold text-[var(--text-secondary)] uppercase">Details</th>
                  </tr>
               </thead>
               <tbody>
                  {transactions.map(tx => {
                     const team = gameState.teams.find(t => t.id === tx.teamId);
                     const isPositive = tx.amount > 0;
                     return (
                       <tr key={tx.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-secondary)]/50">
                         <td className="p-3 text-sm text-[var(--text-tertiary)] whitespace-nowrap">{new Date(tx.timestamp).toLocaleTimeString()}</td>
                         <td className="p-3 text-sm font-semibold text-[var(--text-primary)]">{team ? team.name : 'Unknown'}</td>
                         <td className="p-3 text-sm">
                           <span className="bg-white border border-[var(--border-subtle)] px-2 py-1 rounded-md text-[10px] font-bold text-[var(--text-secondary)] tracking-widest">{tx.actionType}</span>
                         </td>
                         <td className={`p-3 text-sm font-bold ${isPositive ? 'text-emerald-600' : tx.amount < 0 ? 'text-rose-600' : 'text-[var(--text-secondary)]'}`}>
                           {isPositive ? '+' : ''}{tx.amount === 0 ? '-' : `$${Math.abs(tx.amount).toLocaleString()}`}
                         </td>
                         <td className="p-3 text-sm text-[var(--text-secondary)]">{tx.details}</td>
                       </tr>
                     );
                  })}
               </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
