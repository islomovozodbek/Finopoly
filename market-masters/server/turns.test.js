const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
process.env.FINOPOLY_DB_PATH = ':memory:';
const { db } = require('./db');
const { createTurns, publicTurn } = require('./turns');
const cards = Array.from({ length: 12 }, (_, i) => ({ name: `Investment ${i}`, description: 'Research this asset.', type: i % 2 ? 'Bad' : 'Good', percentage: i % 2 ? -25 : 20, reason: 'Historic outcome' }));
const makeTurns = (steps = 1) => createTurns({ db, marketNews: [], logTransaction: () => {}, shuffle: d => d, roll: () => steps });
const run = callback => db.transaction(callback)();
beforeEach(() => {
  db.exec('DELETE FROM teams; DELETE FROM rooms; DELETE FROM transactions;');
  db.prepare("INSERT INTO rooms (id, deck, turnIndex, lapTeamsFinished, eraStatus) VALUES ('Room_1', ?, 0, 0, 'ACTIVE')").run(JSON.stringify(cards));
  db.prepare("INSERT INTO teams (id, name, room, cash, lapTurnsTaken, position, eraStartingCash, iconIndex) VALUES ('team-a', 'First', 'Room_1', 2000, 0, 0, 2000, 0), ('team-b', 'Second', 'Room_1', 2000, 0, 0, 2000, 1)").run();
});

test('a repeated roll returns the exact saved options without moving twice', () => {
  const turns = makeTurns();
  const first = run(() => turns.move({ teamId: 'team-a' }));
  const second = run(() => turns.move({ teamId: 'team-a' }));
  assert.deepEqual(second, first);
  assert.equal(db.prepare("SELECT position FROM teams WHERE id='team-a'").get().position, 1);
  assert.equal(JSON.parse(db.prepare("SELECT deck FROM rooms WHERE id='Room_1'").get().deck).length, 9);
});
test('new server state restores the pending turn from SQLite', () => {
  const first = run(() => makeTurns().move({ teamId: 'team-a' }));
  const restored = makeTurns(6).pending('Room_1');
  assert.equal(restored.id, first.pendingTurn.id);
  assert.deepEqual(publicTurn(restored), first.pendingTurn);
});
test('public state never reveals offered investment returns or reasons', () => {
  const { pendingTurn } = run(() => makeTurns().move({ teamId: 'team-a' }));
  assert.equal(pendingTurn.cards.length, 3);
  for (const card of pendingTurn.cards) {
    assert.equal(card.percentage, undefined); assert.equal(card.type, undefined); assert.equal(card.reason, undefined);
  }
});
test('investment uses the saved card, rejects replay, and advances once', () => {
  const turns = makeTurns();
  const { pendingTurn: turn } = run(() => turns.move({ teamId: 'team-a' }));
  const payload = { teamId: 'team-a', pendingId: turn.id, cardId: turn.cards[0].id, betAmount: 1000, percentage: 100000 };
  const { result } = run(() => turns.invest(payload));
  assert.equal(result.profitLoss, 200);
  assert.equal(result.card.percentage, 20);
  assert.equal(db.prepare("SELECT cash,lapTurnsTaken FROM teams WHERE id='team-a'").get().cash, 2200);
  assert.equal(db.prepare("SELECT turnIndex FROM rooms WHERE id='Room_1'").get().turnIndex, 1);
  assert.equal(turns.pending('Room_1'), null);
  assert.throws(() => run(() => turns.invest(payload)), /turn has changed|already finished/);
  assert.equal(db.prepare("SELECT lapTurnsTaken FROM teams WHERE id='team-a'").get().lapTurnsTaken, 1);
});
test('invalid bets and card IDs leave both cash and pending choice intact', () => {
  const turns = makeTurns();
  const { pendingTurn: turn } = run(() => turns.move({ teamId: 'team-a' }));
  for (const amount of [-1, 0, 2001, 1.5, NaN]) assert.throws(() => run(() => turns.invest({ teamId: 'team-a', pendingId: turn.id, cardId: turn.cards[0].id, betAmount: amount })));
  assert.throws(() => run(() => turns.invest({ teamId: 'team-a', pendingId: turn.id, cardId: 'fake', betAmount: 100 })));
  assert.equal(turns.pending('Room_1').id, turn.id);
  assert.equal(db.prepare("SELECT cash FROM teams WHERE id='team-a'").get().cash, 2000);
});
test('another team cannot move during the current turn', () => {
  assert.throws(() => run(() => makeTurns().move({ teamId: 'team-b' })), /turn has changed/);
});
test('passing returns all cards and advances exactly once', () => {
  const turns = makeTurns(); const { pendingTurn } = run(() => turns.move({ teamId: 'team-a' }));
  run(() => turns.invest({ teamId: 'team-a', pendingId: pendingTurn.id, pass: true }));
  assert.equal(JSON.parse(db.prepare("SELECT deck FROM rooms WHERE id='Room_1'").get().deck).length, 12);
  assert.equal(db.prepare("SELECT cash FROM teams WHERE id='team-a'").get().cash, 2000);
});
test('corner events restore with the same ID and reject stale completion', () => {
  db.prepare("UPDATE teams SET position=9 WHERE id='team-a'").run();
  const turns = makeTurns(); const { pendingTurn } = run(() => turns.move({ teamId: 'team-a' }));
  assert.equal(pendingTurn.eventType, 'ANGEL_INVESTMENT');
  assert.equal(makeTurns().pending('Room_1').id, pendingTurn.id);
  assert.throws(() => turns.event({ teamId: 'team-a', roomId: 'Room_1', pendingId: 'stale', eventType: 'ANGEL_INVESTMENT', coinTossResult: 'HEADS' }));
  assert.throws(() => turns.event({ teamId: 'team-a', roomId: 'Room_1', pendingId: pendingTurn.id, eventType: 'ANGEL_INVESTMENT' }), /coin toss/);
});
test('an exhausted deck rolls back movement', () => {
  db.prepare("UPDATE rooms SET deck='[]' WHERE id='Room_1'").run();
  assert.throws(() => run(() => makeTurns().move({ teamId: 'team-a' })), /Not enough investments/);
  assert.equal(db.prepare("SELECT position FROM teams WHERE id='team-a'").get().position, 0);
});
test('frozen turn skips movement and clears the modifier only when completed', () => {
  db.prepare("UPDATE teams SET frozen=1, immune=1 WHERE id='team-a'").run();
  const turns = makeTurns(); const { pendingTurn } = run(() => turns.move({ teamId: 'team-a' }));
  assert.equal(pendingTurn.dice, null); assert.equal(pendingTurn.eventType, 'FROZEN');
  run(() => turns.finish('team-a', pendingTurn.id));
  const team = db.prepare("SELECT frozen,immune,position FROM teams WHERE id='team-a'").get();
  assert.deepEqual(team, { frozen: 0, immune: 0, position: 0 });
});
test('last turn after passing Start ends the era', () => {
  db.prepare("UPDATE rooms SET turnIndex=1 WHERE id='Room_1'").run();
  db.prepare("UPDATE teams SET position=39 WHERE id='team-b'").run();
  const turns = makeTurns(2); const { pendingTurn } = run(() => turns.move({ teamId: 'team-b' }));
  run(() => turns.invest({ teamId: 'team-b', pendingId: pendingTurn.id, pass: true }));
  assert.equal(db.prepare("SELECT eraStatus FROM rooms WHERE id='Room_1'").get().eraStatus, 'INTERMISSION');
});
test('an event with no eligible opponents can finish without a transfer', () => {
  db.prepare("UPDATE teams SET position=29 WHERE id='team-a'").run();
  db.prepare("UPDATE teams SET immune=1 WHERE id='team-b'").run();
  const turns = makeTurns(); const { pendingTurn } = run(() => turns.move({ teamId: 'team-a' }));
  assert.doesNotThrow(() => turns.event({ teamId: 'team-a', roomId: 'Room_1', pendingId: pendingTurn.id, eventType: 'CORPORATE_BUYOUT' }));
  run(() => turns.finish('team-a', pendingTurn.id));
  assert.equal(turns.pending('Room_1'), null);
});
