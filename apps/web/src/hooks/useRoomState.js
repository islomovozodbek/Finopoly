import { useCallback, useEffect, useReducer, useRef } from 'react';
import { fetchRoomSnapshot } from '../lib/roomActions.js';
import { connectRoom } from '../lib/roomConnection.js';
import { roomReducer, initialRoomState } from '../reducer/roomReducer.js';

export function useRoomState(slug, accessToken, subscribe) {
  const [state, dispatch] = useReducer(roomReducer, initialRoomState);
  const connectionRef = useRef(null);
  const receiveSnapshot = useCallback((payload) => dispatch({ type: 'STATE_RECEIVED', payload }), []);
  const refresh = useCallback(() => connectionRef.current?.refresh(), []);

  useEffect(() => {
    dispatch({ type: 'RESET' });
    if (!slug || !accessToken) return undefined;
    const connection = connectRoom({
      subscribe: (receive, onStatus) => subscribe(slug, receive, onStatus),
      fetchSnapshot: () => fetchRoomSnapshot(slug, accessToken),
      receive: receiveSnapshot,
      fail: (error) => dispatch({ type: 'ERROR', error }),
      syncing: () => dispatch({ type: 'SYNCING' }),
    });
    connectionRef.current = connection;
    const onVisible = () => { if (document.visibilityState === 'visible') connection.refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', connection.refresh);
    window.addEventListener('focus', connection.refresh);
    const onOffline = () => dispatch({ type: 'SYNCING' });
    window.addEventListener('offline', onOffline);
    return () => {
      connection.close();
      connectionRef.current = null;
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', connection.refresh);
      window.removeEventListener('focus', connection.refresh);
      window.removeEventListener('offline', onOffline);
    };
  }, [slug, accessToken, subscribe, receiveSnapshot]);

  return { ...state, receiveSnapshot, refresh };
}
