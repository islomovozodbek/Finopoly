import { subscribeToHostChannel } from '../lib/roomRealtime.js';
import { useRoomState } from './useRoomState.js';

export function useHostConnection(slug, accessToken) {
  return useRoomState(slug, accessToken, subscribeToHostChannel);
}
