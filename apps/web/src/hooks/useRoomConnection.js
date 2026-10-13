import { subscribeToRoomChannel } from '../lib/roomRealtime.js';
import { useRoomState } from './useRoomState.js';

export function useRoomConnection(slug, accessToken) {
  return useRoomState(slug, accessToken, subscribeToRoomChannel);
}
