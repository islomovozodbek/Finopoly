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
    <div className="min-h-dvh bg-[var(--bg-primary)] flex items-center justify-center p-[var(--space-md)]">
      <div className="soft-panel p-[var(--space-xl)] w-full max-w-md">
        <div className="text-center mb-[var(--space-lg)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand)] text-white flex items-center justify-center text-3xl display-font mx-auto mb-[var(--space-sm)] shadow-[var(--shadow-brand-glow)]">
            M
          </div>
          <h1 className="text-[length:var(--text-heading-lg)] display-font tracking-tight text-[var(--text-primary)]">Market Masters</h1>
          <p className="text-[var(--text-tertiary)] mt-[var(--space-2xs)] text-sm sm:text-base">Connect to the Finopoly platform</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-[var(--space-lg)]">
          <div className="space-y-[var(--space-xs)]">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Select Role</label>
            <div className="grid grid-cols-1 gap-[var(--space-xs)]">
              <button
                type="button"
                onClick={() => setRole('BOARD')}
                className={`flex items-center gap-3 p-[var(--space-md)] border rounded-xl transition-all text-left min-h-0 ${role === 'BOARD' ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)]' : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'}`}
              >
                <MonitorPlay className={role === 'BOARD' ? 'text-[var(--color-brand-hover)]' : 'text-[var(--text-tertiary)]'} />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Projector Board</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Main room display</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('MODERATOR')}
                className={`flex items-center gap-3 p-[var(--space-md)] border rounded-xl transition-all text-left min-h-0 ${role === 'MODERATOR' ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)]' : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'}`}
              >
                <Users className={role === 'MODERATOR' ? 'text-[var(--color-brand-hover)]' : 'text-[var(--text-tertiary)]'} />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Host Control</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Manage game flow & teams</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('LEADERBOARD')}
                className={`flex items-center gap-3 p-[var(--space-md)] border rounded-xl transition-all text-left min-h-0 ${role === 'LEADERBOARD' ? 'border-[var(--color-brand)] bg-[var(--color-brand-subtle)]' : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'}`}
              >
                <Trophy className={role === 'LEADERBOARD' ? 'text-[var(--color-brand-hover)]' : 'text-[var(--text-tertiary)]'} />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Global Leaderboard</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5">Aggregate ranking view</div>
                </div>
              </button>
            </div>
          </div>

          {(role === 'BOARD' || role === 'MODERATOR') && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Room Selection</label>
              <select
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-lg p-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] transition-all"
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
            className="w-full py-[var(--space-sm)] bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white rounded-xl transition-colors flex justify-center items-center gap-2 shadow-[var(--shadow-brand-glow)]"
          >
            <LogIn size={20} />
            Enter {role === 'LEADERBOARD' ? 'Leaderboard' : 'Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
