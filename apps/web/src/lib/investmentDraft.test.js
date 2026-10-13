import { describe, expect, it } from 'vitest';
import { readInvestmentDraft, saveInvestmentDraft, clearInvestmentDraft } from './investmentDraft.js';

describe('investment drafts during navigation', () => {
  it('restores the choice and amount only for the same pending turn', () => {
    const map = new Map(); const storage = { getItem: k => map.get(k), setItem: (k,v) => map.set(k,v), removeItem: k => map.delete(k) };
    saveInvestmentDraft('turn-a', { selectedId: 'option-2', bet: 500 }, storage);
    expect(readInvestmentDraft('turn-a', storage)).toEqual({ selectedId: 'option-2', bet: 500 });
    expect(readInvestmentDraft('turn-b', storage)).toEqual({ selectedId: null, bet: 0 });
    clearInvestmentDraft('turn-a', storage);
    expect(readInvestmentDraft('turn-a', storage).selectedId).toBeNull();
  });
  it('recovers from unavailable storage or invalid amounts', () => {
    expect(readInvestmentDraft('a', { getItem: () => '{' })).toEqual({ selectedId: null, bet: 0 });
    expect(readInvestmentDraft('a', { getItem: () => '{"bet":-100}' }).bet).toBe(0);
    expect(() => saveInvestmentDraft('a', {}, { setItem: () => { throw Error('disabled'); } })).not.toThrow();
  });
});
