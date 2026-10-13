import { describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), snapshot: vi.fn(), from: vi.fn() }));
vi.mock('../../src/auth.js', () => ({ withAuth: handler => handler }));
vi.mock('../../src/supabase.js', () => ({ supabase: { from: mocks.from } }));
vi.mock('../../src/rooms/dispatch.js', () => ({ loadRoomBySlug: mocks.lookup, loadRoomSnapshot: mocks.snapshot }));
import handler from './state.js';

describe('navigation snapshot', () => {
  it('uses the fresh snapshot version, not the room lookup from before a roll', async () => {
    mocks.lookup.mockResolvedValue({ id: 'r', slug: 'a', version: 1 });
    mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { app_role: 'player' } }) }) }) });
    mocks.snapshot.mockResolvedValue({ room: { id: 'r', slug: 'a', version: 4 }, syndicates: [], transactions: [],
      pendingTurn: { id: 'saved-turn', stage: 'awaiting_pick', drawn_cards: [{ id: 'choice', name: 'Choice', assetType: 'Stock', reason: 'Test', percentage: 30, type: 'Good' }] } });
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    await handler({ method: 'GET', query: { slug: 'a' }, userId: 'player' }, res);
    const result = res.json.mock.calls[0][0];
    expect(result.room.version).toBe(4); expect(result.pendingTurn.id).toBe('saved-turn');
    expect(result.pendingTurn.drawnCards[0]).not.toHaveProperty('percentage');
  });
});
