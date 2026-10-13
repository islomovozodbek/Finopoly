import { Compass, Crown, Diamond, Leaf, Lightning, Mountains, Planet, RocketLaunch } from '@phosphor-icons/react';
import { getTeamIcon } from '@finopoly/content/client';
import styles from './TeamAvatar.module.css';

const ICONS = { rocket: RocketLaunch, leaf: Leaf, lightning: Lightning, compass: Compass, crown: Crown, diamond: Diamond, planet: Planet, mountains: Mountains };

function iconInk(color) {
  if (!/^#[0-9a-f]{6}$/i.test(color ?? '')) return 'var(--token-ink)';
  const channels = color.slice(1).match(/../g).map(hex => parseInt(hex, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  const luminance = channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  return luminance < .18 ? 'var(--color-on-accent)' : 'var(--token-ink)';
}

/** One recognizable team symbol across board, phones, and rankings. */
export default function TeamAvatar({ team, size = 'md', className = '' }) {
  if (!team) return null;
  const identity = getTeamIcon(team);
  const Icon = ICONS[identity.id];
  const label = `${team.name ?? 'Team'} · ${identity.label}`;
  return (
    <span className={`${styles.avatar} ${styles[size]} ${className}`}
      style={{ '--team-avatar-color': team.color ?? identity.color, '--team-avatar-ink': iconInk(team.color ?? identity.color) }}
      role="img" aria-label={label} title={label} data-team-id={team.id ?? team.syndicateId} data-team-icon={identity.id}>
      <Icon weight="fill" aria-hidden="true" />
    </span>
  );
}
