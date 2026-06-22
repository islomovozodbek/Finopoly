import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import ProjectorBoard from './components/ProjectorBoard';
import GlobalLeaderboard from './components/GlobalLeaderboard';
import ModeratorPanel from './components/ModeratorPanel';
import LandingPage from './components/LandingPage';
import { LogOut } from 'lucide-react';
import type { GameState } from './types';

const socket = io(import.meta.env.PROD ? '/' : 'http://localhost:3001');

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  let viewName = 'LANDING';
  let roomId = '';
  
  if (location.pathname.includes('/board')) {
    viewName = 'BOARD';
    roomId = location.pathname.split('/')[2];
  } else if (location.pathname.includes('/moderator')) {
    viewName = 'MODERATOR';
    roomId = location.pathname.split('/')[2];
  } else if (location.pathname.includes('/leaderboard')) {
    viewName = 'LEADERBOARD';
  }

  if (viewName === 'LANDING') return null;

  return (
    <nav className="fixed top-0 w-full bg-[var(--bg-secondary)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] px-6 py-4 flex justify-between items-center z-50 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-brand-900 text-white flex items-center justify-center text-xs">M</span>
          Market Masters
        </h1>
        {roomId && (
          <div className="px-3 py-1 rounded-full bg-brand-50 text-xs font-semibold text-brand-600 border border-[var(--border-subtle)] uppercase tracking-wide">
            {roomId.replace('_', ' ')}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-sm font-semibold text-[var(--text-secondary)] bg-white px-3 py-1 rounded-md border border-[var(--border-subtle)]">
          VIEW: {viewName}
        </div>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-medium text-rose-500 hover:text-rose-700 transition-colors bg-rose-50 px-3 py-1 rounded-md"
        >
          <LogOut size={16}/> Leave
        </button>
      </div>
    </nav>
  );
}

function BoardRoute({ gameState }: { gameState: GameState | null }) {
  const { roomId } = useParams<{ roomId: string }>();
  useEffect(() => {
    if (roomId) socket.emit('joinRoom', roomId);
  }, [roomId]);
  if (!gameState || !roomId) return <div className="h-screen flex items-center justify-center animate-pulse text-[var(--text-secondary)] font-medium">CONNECTING TO MARKETS...</div>;
  return <ProjectorBoard socket={socket} gameState={gameState} roomId={roomId} />;
}

function ModeratorRoute({ gameState }: { gameState: GameState | null }) {
  const { roomId } = useParams<{ roomId: string }>();
  useEffect(() => {
    if (roomId) socket.emit('joinRoom', roomId);
  }, [roomId]);
  if (!gameState || !roomId) return <div className="h-screen flex items-center justify-center animate-pulse text-[var(--text-secondary)] font-medium">CONNECTING TO MARKETS...</div>;
  return <ModeratorPanel socket={socket} gameState={gameState} roomId={roomId} />;
}

function LeaderboardRoute({ gameState }: { gameState: GameState | null }) {
  if (!gameState) return <div className="h-screen flex items-center justify-center animate-pulse text-[var(--text-secondary)] font-medium">CONNECTING TO MARKETS...</div>;
  return <GlobalLeaderboard gameState={gameState} />;
}

function AppContent() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    socket.on('stateUpdate', (state: GameState) => {
      setGameState(state);
    });
    return () => {
      socket.off('stateUpdate');
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-brand-100">
      <Navigation />
      <main className={`${!isLanding ? 'pt-[72px]' : ''} h-screen overflow-hidden`}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/room/:roomId/board" element={<BoardRoute gameState={gameState} />} />
          <Route path="/room/:roomId/moderator" element={<ModeratorRoute gameState={gameState} />} />
          <Route path="/leaderboard" element={<LeaderboardRoute gameState={gameState} />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
