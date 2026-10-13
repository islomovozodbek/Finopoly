const SERVER_URL = import.meta.env.VITE_SERVER_URL;

/**
 * Calls a room-scoped server action. Its response is an authoritative
 * snapshot, identical to the broadcast. Applying it also recovers callers
 * whose socket dropped while the request was in flight.
 * @param {string} roomSlug
 * @param {string} accessToken
 * @param {string} actionType
 * @param {object} [payload]
 */
export async function callRoomAction(roomSlug, accessToken, actionType, payload = {}, expectedVersion) {
  const res = await fetch(`${SERVER_URL}/api/rooms/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ roomSlug, actionType, payload, expectedVersion }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const messages = {
      STALE_ROOM_STATE: 'The game changed. Syncing the latest turn — please try again.',
      ROOM_VERSION_REQUIRED: 'Reload this page to sync the current turn.',
      TURN_ALREADY_PENDING: 'Finish the current investment or event before rolling again.',
      DEADLINE_NOT_PASSED: 'The team still has time to choose. Wait for the decision timer to finish.',
      NOT_ACTING_DEVICE: 'Another teammate is submitting. Select Take over to use this device.',
    };
    const error = new Error(messages[data.error] || data.error || `Action ${actionType} failed`);
    error.code = data.error;
    throw error;
  }
  return data;
}

/**
 * GET which syndicate (if any) the caller is bound to, in which room, and
 * whether they're the acting device — global, no slug needed. /join uses
 * this to redirect an already-bound device to /team; /team uses it to know
 * which room it's in (the route carries no slug).
 */
export async function fetchMyBinding(accessToken) {
  const res = await fetch(`${SERVER_URL}/api/rooms/my-syndicate`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load your syndicate');
  return data;
}

/** GET which room a syndicate's join code belongs to. */
export async function resolveJoinCode(code, accessToken) {
  const res = await fetch(`${SERVER_URL}/api/rooms/resolve-join-code?code=${encodeURIComponent(code)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Invalid join code');
  return data.roomSlug;
}

/** GET /select's room picker list. */
export async function fetchRoomList(accessToken) {
  const res = await fetch(`${SERVER_URL}/api/rooms/list`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load rooms');
  return data.rooms ?? [];
}

/**
 * Initial-snapshot fetch for page load/reconnect, before any broadcast has
 * arrived yet. Audience is derived server-side from the caller's own role.
 * @param {string} roomSlug
 * @param {string} accessToken
 */
export async function fetchRoomSnapshot(roomSlug, accessToken) {
  const res = await fetch(`${SERVER_URL}/api/rooms/state?slug=${encodeURIComponent(roomSlug)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load room state');
  }
  return data;
}

/** GET the initial cross-room standings snapshot for /leaderboard. */
export async function fetchStandings(accessToken) {
  const res = await fetch(`${SERVER_URL}/api/standings`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load standings');
  return data;
}

/**
 * Host/admin only. Creates a new room in one shot: era(s), starting cash,
 * and named teams. ADVANCE_ERA/SET_ERA_SEQUENCE/SET_STARTING_CASH/RESET_ROOM
 * are now plain room-scoped actions -- call them via callRoomAction like
 * any other action, they're no longer separate global endpoints.
 * @param {string} accessToken
 * @param {{name: string, eraSequence: string[], startingCash: number, teamNames: string[]}} params
 * @returns {Promise<string>} the new room's slug
 */
export async function createRoom(accessToken, { name, eraSequence, startingCash, teamNames }) {
  const res = await fetch(`${SERVER_URL}/api/rooms/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ name, eraSequence, startingCash, teamNames }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to create room');
  return data.slug;
}
