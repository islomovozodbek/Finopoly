/** Public team identities. No game outcomes or private content. */
export const TEAM_ICONS = [
  { id: 'rocket', label: 'Rocket', emoji: '🚀', color: '#E8B44A' },
  { id: 'leaf', label: 'Leaf', emoji: '🌿', color: '#34D399' },
  { id: 'lightning', label: 'Lightning', emoji: '⚡', color: '#60A5FA' },
  { id: 'compass', label: 'Compass', emoji: '🧭', color: '#F472B6' },
  { id: 'crown', label: 'Crown', emoji: '👑', color: '#F59E0B' },
  { id: 'diamond', label: 'Diamond', emoji: '💎', color: '#A78BFA' },
  { id: 'planet', label: 'Planet', emoji: '🪐', color: '#F43F5E' },
  { id: 'mountains', label: 'Mountains', emoji: '⛰️', color: '#22D3EE' },
];

export function getTeamIcon(team) {
  return TEAM_ICONS.find(icon => icon.id === team?.iconId)
    ?? TEAM_ICONS.find(icon => icon.color.toLowerCase() === team?.color?.toLowerCase())
    ?? TEAM_ICONS[0];
}

/** Reserve each team's color identity first, then handle reused colors.
 * Creation order and id make assignment independent of cash/rank or query order.
 * At most eight teams play in a room; every room gets all eight symbols.
 */
export function assignTeamIcons(teams) {
  const identities = new Map();
  const used = new Set();
  const remaining = [];
  const ordered = [...teams].sort((a, b) =>
    String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''))
    || String(a.id).localeCompare(String(b.id)));
  for (const team of ordered) {
    const preferred = getTeamIcon(team);
    if (!used.has(preferred.id)) {
      identities.set(team.id, preferred.id);
      used.add(preferred.id);
    } else remaining.push(team);
  }
  for (const team of remaining) {
    const icon = TEAM_ICONS.find(candidate => !used.has(candidate.id)) ?? getTeamIcon(team);
    identities.set(team.id, icon.id);
    used.add(icon.id);
  }
  return identities;
}
