export const initialRoomState = {
  status: 'loading', // 'loading' | 'ready' | 'error'
  error: null,
  syncing: true,
  game: null,
  room: null,
  syndicates: [],
  pendingTurn: null,
  transactions: [],
};

/**
 * Every push (snapshot fetch or broadcast) replaces state wholesale —
 * never merged, never locally recomputed. This is the only action type;
 * derived display values (rank, delta, whose turn) are computed read-only
 * by components from this state, not stored here.
 */
export function roomReducer(state, action) {
  switch (action.type) {
    case 'STATE_RECEIVED':
      // A slow fetch must never erase a newer, persisted pending turn.
      if (state.room && action.payload.room.version < state.room.version) return state;
      return {
        status: 'ready',
        error: null,
        syncing: false,
        game: action.payload.game,
        room: action.payload.room,
        syndicates: action.payload.syndicates,
        pendingTurn: action.payload.pendingTurn,
        transactions: action.payload.transactions,
      };
    case 'ERROR':
      return { ...state, status: state.room ? 'ready' : 'error', error: action.error, syncing: true };
    case 'SYNCING':
      return { ...state, syncing: true };
    case 'RESET':
      return initialRoomState;
    default:
      return state;
  }
}
