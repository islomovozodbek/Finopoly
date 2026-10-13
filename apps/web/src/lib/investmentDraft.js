const key = (turnId) => `finopoly:investment:${turnId}`;

export function readInvestmentDraft(turnId, storage) {
  try {
    const value = JSON.parse((storage ?? globalThis.sessionStorage).getItem(key(turnId)));
    return { selectedId: typeof value?.selectedId === 'string' ? value.selectedId : null,
      bet: Number.isSafeInteger(value?.bet) && value.bet >= 0 ? value.bet : 0 };
  } catch { return { selectedId: null, bet: 0 }; }
}

export function saveInvestmentDraft(turnId, draft, storage) {
  try { (storage ?? globalThis.sessionStorage).setItem(key(turnId), JSON.stringify(draft)); } catch { /* Storage may be disabled. */ }
}

export function clearInvestmentDraft(turnId, storage) {
  try { (storage ?? globalThis.sessionStorage).removeItem(key(turnId)); } catch { /* The server still owns the turn. */ }
}
