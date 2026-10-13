import { beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock('../supabase.js', () => ({ supabase: db }));
vi.mock('./broadcast.js', () => ({ sendBroadcast: vi.fn(), roomTopic: s => s, hostTopic: s => s, GLOBAL_TOPIC: 'global' }));
import { callRoomAction, loadRoomSnapshot } from './dispatch.js';
import { needsTurnVersion, validRoomVersion } from './actionVersion.js';

describe('turn version guard', () => {
  beforeEach(() => vi.clearAllMocks());
  it('passes the displayed version to the transactional roll without loading a newer one', async () => {
    db.rpc.mockResolvedValue({ data: { roomId: 'a' }, error: null });
    await callRoomAction('a', 'host', 'ROLL', {}, 7);
    expect(db.from).not.toHaveBeenCalled();
    expect(db.rpc).toHaveBeenCalledWith('apply_room_action', expect.objectContaining({ p_expected_version: 7 }));
  });
  it('does not retry a stale or duplicate roll against the next turn', async () => {
    const conflict = { code: '40001', message: 'VERSION_CONFLICT' };
    db.rpc.mockResolvedValue({ error: conflict });
    await expect(callRoomAction('a', 'host', 'ROLL', {}, 7)).rejects.toEqual(conflict);
    expect(db.rpc).toHaveBeenCalledOnce();
    expect(db.from).not.toHaveBeenCalled();
  });
  it('rejects two concurrent requests with the same displayed version after the first commits', async () => {
    let version = 8; let moves = 0;
    db.rpc.mockImplementation(async (_name, args) => {
      if (args.p_expected_version !== version) return { error: { code: '40001' } };
      version += 1; moves += 1; return { data: { roomId: 'a' } };
    });
    const results = await Promise.allSettled([callRoomAction('a', 'host', 'ROLL', {}, 8), callRoomAction('a', 'host', 'ROLL', {}, 8)]);
    expect(moves).toBe(1); expect(results.map(r => r.status).sort()).toEqual(['fulfilled', 'rejected']);
  });
  it('requires valid versions for all turn-changing actions', () => {
    for (const type of ['ROLL', 'SUBMIT_INVESTMENT', 'SKIP_TURN', 'RESOLVE_NEWS', 'RESOLVE_CORNER', 'ADVANCE_ERA']) expect(needsTurnVersion(type)).toBe(true);
    expect(needsTurnVersion('UPDATE_NOTES')).toBe(false);
    for (const value of [undefined, null, '7', 0, -1, 1.5, Infinity]) expect(validRoomVersion(value)).toBe(false);
    expect(validRoomVersion(7)).toBe(true);
  });
});

describe('coherent persisted snapshot', () => {
  it('retries reads spanning a committed roll instead of returning a mixed version', async () => {
    let passes = 0;
    db.from.mockImplementation(table => {
      let fields;
      return {
        select(value) { fields = value; return this; }, eq() { return this; }, order() { return this; },
        single: async () => ({ data: fields === '*' ? { id: 'a', version: ++passes } : { version: 2 } }),
        maybeSingle: async () => ({ data: passes === 1 ? null : { id: 'saved-turn', stage: 'awaiting_pick' } }),
        limit: async () => ({ data: [] }),
        then(resolve, reject) { return Promise.resolve({ data: [] }).then(resolve, reject); },
      };
    });
    const result = await loadRoomSnapshot('a');
    expect(passes).toBe(2); expect(result.room.version).toBe(2);
    expect(result.pendingTurn.id).toBe('saved-turn');
  });
  it('does not return an inconsistent snapshot when the room keeps changing', async () => {
    let version = 0;
    db.from.mockImplementation(() => ({
      select() { return this; }, eq() { return this; }, order() { return this; },
      single: async () => ({ data: { version: ++version } }),
      maybeSingle: async () => ({ data: null }), limit: async () => ({ data: [] }),
      then(resolve, reject) { return Promise.resolve({ data: [] }).then(resolve, reject); },
    }));
    await expect(loadRoomSnapshot('a')).rejects.toThrow('Room is updating');
    expect(version).toBe(6);
  });
});
