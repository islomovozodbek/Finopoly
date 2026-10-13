import { supabase } from './supabase.js';

/**
 * Subscribes to a private Realtime broadcast topic. Same pattern already
 * proven in presence.js, plus `private: true` so the server's RLS policies
 * on realtime.messages gate who can subscribe (see apps/server/schema.sql).
 * @param {string} topic
 * @param {string} event
 * @param {(payload: object) => void} onMessage
 * @returns {() => void} unsubscribe
 */
function subscribeToTopic(topic, event, onMessage, onStatus) {
  const channel = supabase.channel(topic, { config: { private: true } });
  channel.on('broadcast', { event }, ({ payload }) => onMessage(payload));
  channel.subscribe((status) => onStatus?.(status));
  return () => supabase.removeChannel(channel);
}

/** Projector Board + team phones: room:{slug}, stripped card fronts only. */
export function subscribeToRoomChannel(slug, onState, onStatus) {
  return subscribeToTopic(`room:${slug}`, 'state', onState, onStatus);
}

/** Host Control only: host:{slug}, full card percentages. */
export function subscribeToHostChannel(slug, onState, onStatus) {
  return subscribeToTopic(`host:${slug}`, 'state', onState, onStatus);
}

/** /leaderboard: cross-room standings delta. */
export function subscribeToGlobalChannel(onStandings) {
  return subscribeToTopic('global', 'standings', onStandings);
}
