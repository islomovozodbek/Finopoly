const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { restoreSnapshot } = require('./restore');

// Keep the existing path by default. Deployments with a persistent volume can
// set FINOPOLY_DB_PATH without moving or resetting the current database.
const dbPath = process.env.FINOPOLY_DB_PATH || path.join(__dirname, 'data', 'database.sqlite');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const db = new Database(dbPath);

// Initialization
db.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    currentEraId TEXT,
    currentEraName TEXT
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    deck TEXT,
    turnIndex INTEGER,
    lapTeamsFinished INTEGER
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT,
    room TEXT,
    cash INTEGER,
    lapTurnsTaken INTEGER,
    position INTEGER
  );
`);

try { db.exec("ALTER TABLE rooms ADD COLUMN roundEnding INTEGER DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE rooms ADD COLUMN eraStatus TEXT DEFAULT 'ACTIVE'"); } catch (e) {}
try { db.exec("ALTER TABLE teams ADD COLUMN eraStartingCash INTEGER DEFAULT 2000"); } catch (e) {}
try { db.exec("ALTER TABLE rooms ADD COLUMN pendingTurn TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE teams ADD COLUMN iconIndex INTEGER"); } catch (e) {}

// New Market News Modifiers
try { db.exec("ALTER TABLE teams ADD COLUMN nextMultiplier INTEGER DEFAULT 1"); } catch (e) {}
try { db.exec("ALTER TABLE teams ADD COLUMN hedgeFund INTEGER DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE teams ADD COLUMN insiderInfo INTEGER DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE teams ADD COLUMN blindFaith INTEGER DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE teams ADD COLUMN bigShort INTEGER DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE teams ADD COLUMN monopolyPower INTEGER DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE teams ADD COLUMN frozen INTEGER DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE teams ADD COLUMN sabotaged INTEGER DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE teams ADD COLUMN immune INTEGER DEFAULT 0"); } catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teamId TEXT,
    roomId TEXT,
    actionType TEXT,
    amount INTEGER,
    details TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const erasDb = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'eras_db.json'), 'utf8'));
const defaultEra = erasDb.find(e => e.investments.length === 72) || erasDb[0];

if (restoreSnapshot(db, process.env.FINOPOLY_RESTORE_GZIP_BASE64)) {
  console.log('Existing game snapshot restored to the new database.');
}

// Assign once, including teams imported from the previous deployment.
const identityRooms = db.prepare('SELECT DISTINCT room FROM teams').all();
for (const { room } of identityRooms) {
  const teams = db.prepare('SELECT id, iconIndex FROM teams WHERE room = ? ORDER BY rowid').all(room);
  const used = new Set(teams.filter(t => t.iconIndex !== null).map(t => t.iconIndex));
  for (const team of teams.filter(t => t.iconIndex === null)) {
    const free = Array.from({ length: 8 }, (_, i) => i).find(i => !used.has(i)) ?? 0;
    db.prepare('UPDATE teams SET iconIndex = ? WHERE id = ?').run(free, team.id);
    used.add(free);
  }
}

// Insert default state if not exists
const state = db.prepare('SELECT * FROM app_state WHERE id = 1').get();
if (!state) {
  db.prepare('INSERT INTO app_state (id, currentEraId, currentEraName) VALUES (1, ?, ?)').run(defaultEra.id, defaultEra.name);
}

module.exports = {
  db,
  erasDb
};
