import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import type { GameState, InvestmentResult } from './types';
import type { ReactNode } from 'react';

const socket = io(import.meta.env.PROD ? window.location.origin : (import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'), { autoConnect: false });
type Response = { error?: string; state?: GameState; result?: InvestmentResult };
const GameContext = createContext<{ state: GameState | null; connected: boolean }>({ state: null, connected: false });

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const onState = (next: GameState) => { setState(next); setConnected(socket.connected); };
    // Register before connecting: the server sends a snapshot immediately.
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('stateUpdate', onState);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.connect();
    const resync = () => { if (socket.connected) socket.emit('joinRoom', currentRoom()); else socket.connect(); };
    const onVisible = () => { if (document.visibilityState === 'visible') resync(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', resync);
    return () => {
      socket.off('stateUpdate', onState);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', resync);
      socket.disconnect();
    };
  }, []);
  return <GameContext.Provider value={{ state, connected }}>{children}</GameContext.Provider>;
}

const currentRoom = () => window.location.pathname.match(/^\/room\/([^/]+)/)?.[1] || 'Room_1';
export const useGame = () => useContext(GameContext);
export function useRoom(roomId?: string) {
  useEffect(() => {
    if (!roomId) return;
    const join = () => socket.emit('joinRoom', roomId);
    socket.on('connect', join);
    if (socket.connected) join();
    return () => { socket.off('connect', join); };
  }, [roomId]);
}

export function useGameAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const { connected } = useGame();
  async function act(event: string, payload?: unknown): Promise<Response | null> {
    if (inFlight.current) return null;
    if (!socket.connected) { setError('Reconnecting. Your pending turn is saved; wait for the connection to return.'); return null; }
    inFlight.current = true;
    setBusy(true); setError('');
    try {
      const response = await new Promise<Response>((resolve, reject) => {
        socket.timeout(10000).emit(event, payload, (err: Error | null, result: Response) => err ? reject(err) : resolve(result));
      });
      if (response.error) throw new Error(response.error);
      return response;
    } catch (err) {
      setError(err instanceof Error && err.message !== 'operation has timed out' ? err.message : 'Connection interrupted. Reopen the board to restore the saved turn before trying again.');
      return null;
    } finally { inFlight.current = false; setBusy(false); }
  }
  return { act, busy: busy || !connected, error, clearError: () => setError('') };
}
