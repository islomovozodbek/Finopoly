import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowLeft, WifiOff } from 'lucide-react';
import { GameProvider, useGame } from './game';
import ThemeToggle from './components/ThemeToggle';
import ProjectorBoard from './components/ProjectorBoard';
import ModeratorPanel from './components/ModeratorPanel';
import GlobalLeaderboard from './components/GlobalLeaderboard';
import LandingPage from './components/LandingPage';

function AppContent() {
  const { connected } = useGame();
  const location = useLocation();
  const roomId = location.pathname.match(/^\/room\/([^/]+)/)?.[1];
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="app-header">
      <NavLink to="/" className="brand" aria-label="Finopoly home"><span className="brand-mark">F</span>Finopoly</NavLink>
      {roomId && <span className="room-badge">{roomId.replaceAll('_', ' ')}</span>}
      <nav aria-label="Main navigation">
        {roomId && <><NavLink to={`/room/${roomId}/board`}>Game board</NavLink><NavLink to={`/room/${roomId}/moderator`}>Host control</NavLink></>}
        <NavLink to="/leaderboard">Rankings</NavLink>
      </nav>
      <ThemeToggle />
      {location.pathname !== '/' && <NavLink to="/" className="leave-link" aria-label="Back to room selection"><ArrowLeft size={18} aria-hidden="true" /><span>Leave</span></NavLink>}
    </header>
    {!connected && <div className="connection-banner" role="status"><WifiOff size={18} aria-hidden="true" />Connecting to the game. Any pending turn will be restored.</div>}
    <main id="main-content"><Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/room/:roomId/board" element={<ProjectorBoard />} />
      <Route path="/room/:roomId/moderator" element={<ModeratorPanel />} />
      <Route path="/leaderboard" element={<GlobalLeaderboard />} />
      <Route path="*" element={<LandingPage />} />
    </Routes></main>
  </div>;
}
export default function App() {
  return <BrowserRouter><GameProvider><AppContent /></GameProvider></BrowserRouter>;
}
