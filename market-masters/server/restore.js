const { gunzipSync } = require('node:zlib');

// Used only when moving the existing game onto a new persistent disk. Never
// overwrite an initialized database, including a game deliberately reset later.
function restoreSnapshot(db, encoded) {
  if (!encoded || db.prepare('SELECT 1 FROM app_state LIMIT 1').get()) return false;
  for (const table of ['rooms', 'teams', 'transactions']) {
    if (db.prepare(`SELECT 1 FROM ${table} LIMIT 1`).get()) {
      throw new Error('Snapshot restore requires a new, empty database');
    }
  }
  const snapshot = JSON.parse(gunzipSync(Buffer.from(encoded, 'base64'), { maxOutputLength: 8 * 1024 * 1024 }).toString('utf8'));
  if (typeof snapshot.currentEraId !== 'string' || typeof snapshot.currentEraName !== 'string'
    || !Array.isArray(snapshot.teams) || !Array.isArray(snapshot.transactions)
    || !snapshot.rooms || typeof snapshot.rooms !== 'object' || Array.isArray(snapshot.rooms)) {
    throw new Error('Invalid game snapshot');
  }
  const teamColumns = ['id', 'name', 'room', 'cash', 'lapTurnsTaken', 'position', 'eraStartingCash', 'iconIndex',
    'nextMultiplier', 'hedgeFund', 'insiderInfo', 'blindFaith', 'bigShort', 'monopolyPower', 'frozen', 'sabotaged', 'immune'];
  const transactionColumns = ['id', 'teamId', 'roomId', 'actionType', 'amount', 'details', 'timestamp'];
  const insertRow = (table, columns, row) => {
    const included = columns.filter(column => Object.hasOwn(row, column));
    db.prepare(`INSERT INTO ${table} (${included.join(',')}) VALUES (${included.map(() => '?').join(',')})`)
      .run(...included.map(column => row[column]));
  };
  db.transaction(() => {
    db.prepare('INSERT INTO app_state (id, currentEraId, currentEraName) VALUES (1, ?, ?)')
      .run(snapshot.currentEraId, snapshot.currentEraName);
    for (const [id, room] of Object.entries(snapshot.rooms)) {
      if (!Array.isArray(room.deck)) throw new Error('Snapshot is missing a room deck');
      db.prepare('INSERT INTO rooms (id, deck, turnIndex, lapTeamsFinished, roundEnding, eraStatus, pendingTurn) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, JSON.stringify(room.deck), room.turnIndex ?? 0, room.lapTeamsFinished ?? 0,
          room.roundEnding ? 1 : 0, room.eraStatus || 'ACTIVE', room.pendingTurn ? JSON.stringify(room.pendingTurn) : null);
    }
    for (const team of snapshot.teams) insertRow('teams', teamColumns, team);
    for (const transaction of snapshot.transactions) insertRow('transactions', transactionColumns, transaction);
  })();
  return true;
}

module.exports = { restoreSnapshot };
