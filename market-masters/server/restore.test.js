const { test } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('better-sqlite3');
const { gzipSync } = require('node:zlib');
process.env.FINOPOLY_DB_PATH = ':memory:';
delete process.env.FINOPOLY_RESTORE_GZIP_BASE64;
const { db: schema } = require('./db');
const { restoreSnapshot } = require('./restore');
const encode = snapshot => gzipSync(JSON.stringify(snapshot)).toString('base64');
const fixture = () => ({
  currentEraId: 'saved-era', currentEraName: 'Saved era',
  rooms: { Room_1: { deck: [{ id: 'card-2', percentage: 25 }], turnIndex: 1, lapTeamsFinished: 2,
    roundEnding: true, eraStatus: 'ACTIVE', pendingTurn: { id: 'pending-1', cards: [{ id: 'card-1', percentage: -10 }] } } },
  teams: [{ id: 'team-1', name: 'Harbor', room: 'Room_1', cash: 1900, position: 4, lapTurnsTaken: 2, nextMultiplier: 2, hedgeFund: 1 }],
  transactions: [{ id: 115, teamId: 'team-1', roomId: 'Room_1', actionType: 'INVESTMENT', amount: -100, details: 'Saved result', timestamp: '2026-10-11 17:48:17' }]
});
function emptyDatabase() {
  const db = new Database(':memory:');
  for (const { sql } of schema.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()) db.exec(sql);
  return db;
}

test('snapshot migration retains exact decks, pending turns, modifiers, and history IDs', () => {
  const db = emptyDatabase();
  try {
    const snapshot = fixture();
    assert.equal(restoreSnapshot(db, encode(snapshot)), true);
    const room = db.prepare('SELECT * FROM rooms').get();
    assert.deepEqual(JSON.parse(room.deck), snapshot.rooms.Room_1.deck);
    assert.deepEqual(JSON.parse(room.pendingTurn), snapshot.rooms.Room_1.pendingTurn);
    assert.equal(room.turnIndex, 1); assert.equal(room.roundEnding, 1);
    const team = db.prepare('SELECT * FROM teams').get();
    assert.equal(team.cash, 1900); assert.equal(team.nextMultiplier, 2); assert.equal(team.hedgeFund, 1);
    assert.equal(team.iconIndex, null);
    assert.deepEqual(db.prepare('SELECT * FROM transactions').all(), snapshot.transactions);
    assert.equal(db.prepare('SELECT currentEraId FROM app_state').get().currentEraId, 'saved-era');
  } finally { db.close(); }
});

test('startup never restores over initialized or intentionally reset game state', () => {
  const db = emptyDatabase();
  try {
    const encoded = encode(fixture()); restoreSnapshot(db, encoded);
    db.exec("DELETE FROM rooms; DELETE FROM teams; DELETE FROM transactions; UPDATE app_state SET currentEraId='reset-era'");
    assert.equal(restoreSnapshot(db, encoded), false);
    assert.equal(db.prepare('SELECT count(*) AS count FROM teams').get().count, 0);
    assert.equal(db.prepare('SELECT currentEraId FROM app_state').get().currentEraId, 'reset-era');
  } finally { db.close(); }
});

test('a malformed snapshot rolls back the entire migration', () => {
  const db = emptyDatabase();
  try {
    const snapshot = fixture(); snapshot.rooms.Room_2 = { deck: null };
    assert.throws(() => restoreSnapshot(db, encode(snapshot)), /room deck/);
    for (const table of ['app_state', 'rooms', 'teams', 'transactions']) {
      assert.equal(db.prepare(`SELECT count(*) AS count FROM ${table}`).get().count, 0);
    }
    assert.throws(() => restoreSnapshot(db, 'invalid'), /header|buffer|compression/i);
  } finally { db.close(); }
});

test('a partially populated database cannot be overwritten', () => {
  const db = emptyDatabase();
  try {
    db.prepare('INSERT INTO teams (id, name) VALUES (?, ?)').run('existing', 'Existing team');
    assert.throws(() => restoreSnapshot(db, encode(fixture())), /empty database/);
    assert.equal(db.prepare('SELECT name FROM teams').get().name, 'Existing team');
  } finally { db.close(); }
});
