import { Rocket, Leaf, Zap, Compass, Crown, Diamond, Orbit, Mountain } from 'lucide-react';
import type { Team } from '../types';

const IDENTITIES = [
  { Icon: Rocket, label: 'Rocket', emoji: '🚀', color: '#F5BF53' },
  { Icon: Leaf, label: 'Leaf', emoji: '🌿', color: '#6BCDA1' },
  { Icon: Zap, label: 'Lightning', emoji: '⚡', color: '#85B9F4' },
  { Icon: Compass, label: 'Compass', emoji: '🧭', color: '#F29ABA' },
  { Icon: Crown, label: 'Crown', emoji: '👑', color: '#F6CE64' },
  { Icon: Diamond, label: 'Diamond', emoji: '💎', color: '#C1A3F3' },
  { Icon: Orbit, label: 'Orbit', emoji: '🪐', color: '#72CDDE' },
  { Icon: Mountain, label: 'Mountain', emoji: '⛰️', color: '#F0AA7D' },
];
export function teamIdentity(team: Team) {
  const fallback = [...team.id].reduce((n, c) => n + c.charCodeAt(0), 0);
  return IDENTITIES[(team.iconIndex ?? fallback) % IDENTITIES.length];
}
export default function TeamAvatar({ team, size = 'md' }: { team: Team; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const { Icon, label, color } = teamIdentity(team);
  return <span className={`team-avatar team-avatar-${size}`} style={{ background: color }} role="img" aria-label={`${team.name} · ${label}`} title={`${team.name} · ${label}`} data-team-icon={label}>
    <Icon size={size === 'xs' ? 12 : size === 'sm' ? 16 : size === 'lg' ? 28 : 20} strokeWidth={2.5} aria-hidden="true" />
  </span>;
}
