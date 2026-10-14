import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MonitorPlay, Users, Trophy, Check } from 'lucide-react';

const VIEWS = [
  { id: 'BOARD', title: 'Projector Board', description: 'Roll, explore the board, and make investment choices.', Icon: MonitorPlay },
  { id: 'MODERATOR', title: 'Host Control', description: 'Add teams, guide the game, and manage the current era.', Icon: Users },
  { id: 'LEADERBOARD', title: 'Global Leaderboard', description: 'Follow every team’s progress across all rooms.', Icon: Trophy },
] as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<string>('BOARD');
  const [roomId, setRoomId] = useState('Room_1');
  return <div className="landing-layout">
    <section className="landing-intro">
      <span className="eyebrow">The market is your classroom</span>
      <h1>Make your next<br /><span>move together.</span></h1>
      <p>Travel through financial history. Research the market, invest as a team, and discover what every decision can teach you.</p>
      <ol className="how-to"><li><span>1</span>Join your room</li><li><span>2</span>Roll and choose an investment</li><li><span>3</span>Discover the result</li></ol>
      <div className="landing-board" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} data-sector={i % 4}>{i === 5 ? <Trophy size={32} /> : i === 10 ? <Users size={30} /> : null}</span>)}</div>
    </section>
    <form className="panel join-panel" onSubmit={e => { e.preventDefault(); navigate(role === 'LEADERBOARD' ? '/leaderboard' : `/room/${roomId}/${role === 'BOARD' ? 'board' : 'moderator'}`); }}>
      <span className="eyebrow">Welcome to Finopoly</span>
      <h2>Choose your view</h2>
      <p className="muted">Start with a room, then bring your team’s strategy to life.</p>
      <fieldset className="view-picker"><legend>Select role</legend>{VIEWS.map(({ id, title, description, Icon }) => <label key={id} className={`view-option ${role === id ? 'selected' : ''}`}>
        <input type="radio" name="view" value={id} checked={role === id} onChange={() => setRole(id)} />
        <Icon size={24} aria-hidden="true" /><span><strong>{title}</strong><small>{description}</small></span>{role === id && <Check size={20} aria-hidden="true" />}
      </label>)}</fieldset>
      {role !== 'LEADERBOARD' && <label className="field">Room selection<select value={roomId} onChange={e => setRoomId(e.target.value)}>{[1, 2, 3, 4].map(i => <option key={i} value={`Room_${i}`}>Room {i}</option>)}</select></label>}
      <button className="button primary full-width" type="submit">Enter {role === 'LEADERBOARD' ? 'leaderboard' : 'room'}<ArrowRight size={20} aria-hidden="true" /></button>
      <p className="small muted">Your game progress stays saved when you leave this page.</p>
    </form>
  </div>;
}
