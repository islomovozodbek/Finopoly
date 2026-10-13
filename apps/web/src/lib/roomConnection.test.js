import { describe, expect, it, vi } from 'vitest';
import { connectRoom } from './roomConnection.js';
import { initialRoomState, roomReducer } from '../reducer/roomReducer.js';

const payload = (version, pendingTurn = null) => ({ room: { slug: 'room-a', version }, game: { status: 'active' }, syndicates: [], pendingTurn, transactions: [] });
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

function setup(fetchSnapshot) {
  let state = initialRoomState;
  let message; let status;
  const unsubscribe = vi.fn();
  const receive = vi.fn(p => { state = roomReducer(state, { type: 'STATE_RECEIVED', payload: p }); });
  const fail = vi.fn(); const syncing = vi.fn();
  const connection = connectRoom({
    subscribe: (onMessage, onStatus) => { message = onMessage; status = onStatus; return unsubscribe; },
    fetchSnapshot, receive, fail, syncing,
  });
  return { connection, receive, fail, syncing, unsubscribe, message: p => message(p), status: s => status(s), state: () => state };
}

describe('persisted room connection', () => {
  it('keeps investment choices when an older navigation fetch arrives after a roll broadcast', async () => {
    const initial = deferred();
    const c = setup(() => initial.promise);
    const pending = { id: 'turn-1', stage: 'awaiting_pick', drawnCards: [{ id: 'card-1' }] };
    c.message(payload(3, pending));
    initial.resolve(payload(1));
    await initial.promise; await Promise.resolve();
    expect(c.state().room.version).toBe(3);
    expect(c.state().pendingTurn).toEqual(pending);
    c.connection.close();
  });

  it('loads the same unfinished choice after leaving and returning to the page', async () => {
    const pending = { id: 'saved-turn', stage: 'awaiting_pick', drawnCards: [{ id: 'option-a' }] };
    const c = setup(async () => payload(5, pending));
    await c.connection.refresh();
    c.connection.close();
    const returned = setup(async () => payload(5, pending));
    await returned.connection.refresh();
    expect(returned.state().pendingTurn).toEqual(pending);
    returned.connection.close();
  });

  it('recovers changes missed while joining or reconnecting the socket', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(payload(1)).mockResolvedValue(payload(4, { id: 'missed-turn' }));
    const c = setup(fetch);
    await Promise.resolve();
    c.status('CHANNEL_ERROR');
    expect(c.syncing).toHaveBeenCalledOnce();
    c.status('SUBSCRIBED');
    await Promise.resolve(); await Promise.resolve();
    expect(c.state().pendingTurn.id).toBe('missed-turn');
    expect(fetch).toHaveBeenCalledTimes(2);
    c.connection.close();
  });

  it('ignores fetch completions and broadcast callbacks after leaving the page', async () => {
    const initial = deferred(); const c = setup(() => initial.promise);
    c.connection.close();
    initial.resolve(payload(2));
    await initial.promise; await Promise.resolve();
    c.message(payload(3)); c.status('SUBSCRIBED');
    expect(c.receive).not.toHaveBeenCalled();
    expect(c.unsubscribe).toHaveBeenCalledOnce();
  });

  it('does not replace a successful broadcast with an older failed fetch', async () => {
    const initial = deferred(); const c = setup(() => initial.promise);
    c.message(payload(4, { id: 'turn-4' })); initial.reject(new Error('offline'));
    await Promise.resolve(); await Promise.resolve();
    expect(c.fail).not.toHaveBeenCalled(); c.connection.close();
  });

  it('accepts a newer resolution and resets when switching rooms', () => {
    const playing = roomReducer(initialRoomState, { type: 'STATE_RECEIVED', payload: payload(3, { id: 'turn-3' }) });
    const finished = roomReducer(playing, { type: 'STATE_RECEIVED', payload: payload(4) });
    expect(finished.pendingTurn).toBeNull();
    expect(roomReducer(finished, { type: 'RESET' })).toEqual(initialRoomState);
  });
});
