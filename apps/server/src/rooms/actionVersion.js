const TURN_ACTIONS = new Set([
  'ROLL', 'SUBMIT_INVESTMENT', 'FORCE_SUBMIT', 'RESOLVE_NEWS',
  'RESOLVE_CORNER', 'SKIP_TURN', 'CANCEL_PENDING_TURN', 'ADVANCE_ERA',
]);

export function needsTurnVersion(actionType) {
  return TURN_ACTIONS.has(actionType);
}

export function validRoomVersion(version) {
  return Number.isSafeInteger(version) && version > 0;
}
