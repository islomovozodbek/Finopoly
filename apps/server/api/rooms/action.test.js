import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ lookup: vi.fn(), action: vi.fn(), broadcast: vi.fn(), fill: vi.fn() }));
vi.mock('../../src/auth.js', () => ({ withAuth: handler => handler }));
vi.mock('../../src/supabase.js', () => ({ supabase: {} }));
vi.mock('../../src/rooms/dispatch.js', () => ({ loadRoomBySlug: mocks.lookup, callRoomAction: mocks.action, broadcastRoomUpdate: mocks.broadcast, fillPendingInvestmentCards: mocks.fill }));
import handler from './action.js';

describe('stale turn API requests', () => {
  beforeEach(() => vi.clearAllMocks());
  const response = () => ({ status: vi.fn().mockReturnThis(), json: vi.fn() });
  it('requires the displayed version before any roll can mutate the room', async () => {
    const res = response();
    await handler({ method: 'POST', body: { roomSlug: 'a', actionType: 'ROLL', payload: {} } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.action).not.toHaveBeenCalled();
  });
  it('returns 409 for a stale roll without filling cards or broadcasting a second move', async () => {
    mocks.lookup.mockResolvedValue({ id: 'r' });
    mocks.action.mockRejectedValue({ code: '40001', message: 'VERSION_CONFLICT' });
    const res = response();
    await handler({ method: 'POST', userId: 'host', body: { roomSlug: 'a', actionType: 'ROLL', expectedVersion: 7 } }, res);
    expect(mocks.action).toHaveBeenCalledWith('r', 'host', 'ROLL', expect.objectContaining({ newsCard: expect.any(Object) }), 7);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'STALE_ROOM_STATE' });
    expect(mocks.fill).not.toHaveBeenCalled(); expect(mocks.broadcast).not.toHaveBeenCalled();
  });
});
