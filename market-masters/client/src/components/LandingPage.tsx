import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, MonitorPlay, Users, Trophy } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<'BOARD' | 'MODERATOR' | 'LEADERBOARD'>('BOARD');
  const [roomId, setRoomId] = useState('Room_1');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'BOARD') navigate(`/room/${roomId}/board`);
    if (role === 'MODERATOR') navigate(`/room/${roomId}/moderator`);
    if (role === 'LEADERBOARD') navigate(`/leaderboard`);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="soft-panel p-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-900 text-white flex items-center justify-center text-3xl font-black mx-auto mb-4 shadow-md">
            M
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Market Masters</h1>
          <p className="text-[var(--text-tertiary)] mt-2">Connect to the Finopoly platform</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Select Role</label>
            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={() => setRole('BOARD')}
                className={`flex items-center gap-3 p-4 border rounded-xl transition-all text-left ${role === 'BOARD' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20' : 'border-[var(--border-subtle)] bg-white hover:border-[var(--border-strong)]'}`}
              >
                <MonitorPlay className={role === 'BOARD' ? 'text-brand-600' : 'text-[var(--text-tertiary)]'} />
                <div>
                  <div className={`font-semibold ${role === 'BOARD' ? 'text-brand-900' : 'text-[var(--text-primary)]'}`}>Projector Board</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Main room display</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('MODERATOR')}
                className={`flex items-center gap-3 p-4 border rounded-xl transition-all text-left ${role === 'MODERATOR' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20' : 'border-[var(--border-subtle)] bg-white hover:border-[var(--border-strong)]'}`}
              >
                <Users className={role === 'MODERATOR' ? 'text-brand-600' : 'text-[var(--text-tertiary)]'} />
                <div>
                  <div className={`font-semibold ${role === 'MODERATOR' ? 'text-brand-900' : 'text-[var(--text-primary)]'}`}>Host Control</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Manage game flow & teams</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('LEADERBOARD')}
                className={`flex items-center gap-3 p-4 border rounded-xl transition-all text-left ${role === 'LEADERBOARD' ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20' : 'border-[var(--border-subtle)] bg-white hover:border-[var(--border-strong)]'}`}
              >
                <Trophy className={role === 'LEADERBOARD' ? 'text-brand-600' : 'text-[var(--text-tertiary)]'} />
                <div>
                  <div className={`font-semibold ${role === 'LEADERBOARD' ? 'text-brand-900' : 'text-[var(--text-primary)]'}`}>Global Leaderboard</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Aggregate ranking view</div>
                </div>
              </button>
            </div>
          </div>

          {(role === 'BOARD' || role === 'MODERATOR') && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Room Selection</label>
              <select
                className="w-full bg-white border border-[var(--border-strong)] rounded-lg p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              >
                <option value="Room_1">Room 1</option>
                <option value="Room_2">Room 2</option>
                <option value="Room_3">Room 3</option>
                <option value="Room_4">Room 4</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 mt-4 bg-brand-900 hover:bg-brand-800 text-white font-semibold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-md"
          >
            <LogIn size={20} />
            Enter {role === 'LEADERBOARD' ? 'Leaderboard' : 'Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
