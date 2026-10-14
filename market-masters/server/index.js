const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { db, erasDb } = require('./db');
const { createTurns, publicTurn } = require('./turns');

// Load market news
const marketNewsPath = path.join(__dirname, 'data', 'market_news.json');
let marketNews = [];
try {
  marketNews = JSON.parse(fs.readFileSync(marketNewsPath, 'utf8'));
} catch (e) {
  console.log("No market_news.json found, special tiles will have no effect.");
}


const app = express();
app.use(cors());

// Public release identity makes deployment verification unambiguous.
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Finopoly', source: 'market-masters', commit: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.BUILD_SHA || 'local' }));

// Serve the React frontend static files
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

// Fallback to React router for all other requests
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/socket.io')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    next();
  }
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all in dev
    methods: ["GET", "POST"]
  }
});

// Helpers
const shuffle = (array) => {
    let curr = array.length, random;
    while (curr != 0) {
        random = Math.floor(Math.random() * curr);
        curr--;
        [array[curr], array[random]] = [array[random], array[curr]];
    }
    return array;
};

const logTransaction = (teamId, roomId, actionType, amount, details) => {
  db.prepare('INSERT INTO transactions (teamId, roomId, actionType, amount, details) VALUES (?, ?, ?, ?, ?)').run(teamId, roomId, actionType, amount, details);
};

const getGlobalState = () => {
  const stateRow = db.prepare('SELECT * FROM app_state WHERE id = 1').get();
  const teamsRows = db.prepare('SELECT * FROM teams ORDER BY rowid').all();
  const roomsRows = db.prepare('SELECT * FROM rooms').all();

  const roomsObj = {};
  for (const r of roomsRows) {
    roomsObj[r.id] = {
      deck: [],
      cardsRemaining: JSON.parse(r.deck).length,
      pendingTurn: publicTurn(r.pendingTurn ? JSON.parse(r.pendingTurn) : null),
      turnIndex: r.turnIndex,
      lapTeamsFinished: r.lapTeamsFinished,
      roundEnding: !!r.roundEnding,
      eraStatus: r.eraStatus || 'ACTIVE'
    };
  }

  const transactions = db.prepare('SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 100').all();

  return {
    currentEraId: stateRow.currentEraId,
    currentEraName: stateRow.currentEraName,
    teams: teamsRows,
    rooms: roomsObj,
    transactions
  };
};

const initializeRoomDeck = (roomId) => {
    const state = db.prepare('SELECT currentEraId FROM app_state WHERE id = 1').get();
    const era = erasDb.find(e => e.id === state.currentEraId);
    let deck = [];
    if (era) {
        deck = JSON.parse(JSON.stringify(era.investments));
        deck = shuffle(deck);
    }

    db.prepare(`
      INSERT INTO rooms (id, deck, turnIndex, lapTeamsFinished)
      VALUES (?, ?, 0, 0)
      ON CONFLICT(id) DO UPDATE SET deck=excluded.deck, turnIndex=0, lapTeamsFinished=0, pendingTurn=NULL, roundEnding=0, eraStatus='ACTIVE'
    `).run(roomId, JSON.stringify(deck));
};

const turns = createTurns({ db, marketNews, logTransaction, shuffle });

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  const onAction = (event, handler) => socket.on(event, (payload, callback) => {
    try {
      const result = db.transaction(() => handler(payload))() || {};
      const state = getGlobalState();
      if (typeof callback === 'function') callback({ ...result, state });
      io.emit('stateUpdate', state);
    } catch (error) {
      const message = error.message || 'The action could not be completed.';
      if (typeof callback === 'function') callback({ error: message });
      socket.emit('actionError', { message });
      socket.emit('stateUpdate', getGlobalState());
    }
  });


  socket.emit('stateUpdate', getGlobalState());

  // Moderator actions
  onAction('joinRoom', (roomId) => {
      if (typeof roomId !== 'string' || !/^[A-Za-z0-9_-]{1,60}$/.test(roomId)) throw new Error('Invalid room.');
      socket.join(roomId);
      const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(roomId);
      if (!room) {
          initializeRoomDeck(roomId);
      }
      socket.emit('stateUpdate', getGlobalState());
  });

  onAction('registerTeam', ({ name, room, startingCash }) => {
      if (typeof name !== 'string' || !name.trim() || name.length > 60 || typeof room !== 'string' || !/^[A-Za-z0-9_-]{1,60}$/.test(room)) throw new Error('Enter a team name of up to 60 characters.');
      const roomTeams = db.prepare('SELECT iconIndex FROM teams WHERE room = ?').all(room);
      if (roomTeams.length >= 8) throw new Error('This room already has eight teams.');
      if (!db.prepare('SELECT id FROM rooms WHERE id = ?').get(room)) initializeRoomDeck(room);
      const iconIndex = Array.from({ length: 8 }, (_, i) => i).find(i => !roomTeams.some(t => t.iconIndex === i));
      if (startingCash !== undefined && (!Number.isSafeInteger(startingCash) || startingCash <= 0)) throw new Error('Starting cash must be a positive whole number.');
      name = name.trim();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO teams (id, name, room, cash, lapTurnsTaken, position, eraStartingCash)
        VALUES (?, ?, ?, ?, 0, 0, ?)
      `).run(id, name, room, startingCash || 2000, startingCash || 2000);
      db.prepare('UPDATE teams SET iconIndex = ? WHERE id = ?').run(iconIndex, id);
      logTransaction(id, room, 'REGISTER', startingCash || 2000, `Team registered with $${startingCash || 2000}`);

  });

  onAction('removeTeam', (teamId) => {
      const team = db.prepare('SELECT room FROM teams WHERE id = ?').get(teamId);
      if (!team) return;
      if (turns.pending(team.room)) throw new Error('Finish the saved turn before removing a team.');
      const room = db.prepare('SELECT turnIndex FROM rooms WHERE id = ?').get(team.room);
      const before = db.prepare('SELECT id FROM teams WHERE room = ? ORDER BY rowid').all(team.room);
      const currentId = before[room?.turnIndex ?? 0]?.id;
      db.prepare('DELETE FROM teams WHERE id = ?').run(teamId);
      const after = before.filter(t => t.id !== teamId);
      let index = after.findIndex(t => t.id === currentId);
      if (index < 0) index = (room?.turnIndex ?? 0) % Math.max(after.length, 1);
      db.prepare('UPDATE rooms SET turnIndex = ? WHERE id = ?').run(index, team.room);
  });

  onAction('forceNextTurn', (roomId) => {
      if (turns.pending(roomId)) throw new Error('Finish the saved turn before skipping.');
      const roomRow = db.prepare('SELECT turnIndex FROM rooms WHERE id = ?').get(roomId);
      if (roomRow) {
          const teamsInRoom = db.prepare('SELECT COUNT(*) as count FROM teams WHERE room = ?').get(roomId).count;
          let newTurnIndex = (roomRow.turnIndex + 1) % Math.max(1, teamsInRoom);
          db.prepare('UPDATE rooms SET turnIndex = ? WHERE id = ?').run(newTurnIndex, roomId);

      }
  });

  onAction('movePiece', payload => turns.move(payload));
  onAction('drawInvestments', ({ roomId, teamId, pendingId }) => {
    const { turn, team } = turns.current(teamId, pendingId);
    if (team.room !== roomId || turn?.stage !== 'investment') throw new Error('No investment choice is waiting.');
    return { cards: publicTurn(turn).cards, pendingTurn: publicTurn(turn) };
  });
  onAction('processInvestment', payload => turns.invest(payload));

  onAction('resolveMarketNews', ({ teamId, roomId, pendingId, targetTeamId, coinTossResult }) => {
      const turn = turns.event({ teamId, roomId, pendingId, eventType: 'MARKET_NEWS', targetTeamId, coinTossResult });
      const newsCard = turn.newsCard;
      const team = db.prepare('SELECT name, cash FROM teams WHERE id = ?').get(teamId);
      if (!team) return;

      const allTeams = db.prepare('SELECT id, name, cash FROM teams WHERE room = ? ORDER BY cash DESC').all(roomId);
      if (allTeams.length === 0) return;

      const firstPlace = allTeams[0];
      const lastPlace = allTeams[allTeams.length - 1];

      let description = newsCard.title;

      switch(newsCard.effect) {
          case 'MULTIPLIER':
              db.prepare('UPDATE teams SET nextMultiplier = ? WHERE id = ?').run(newsCard.value, teamId);
              break;
          case 'HEDGE_FUND':
              db.prepare('UPDATE teams SET hedgeFund = 1 WHERE id = ?').run(teamId);
              break;
          case 'INSIDER_INFO':
              db.prepare('UPDATE teams SET insiderInfo = 1 WHERE id = ?').run(teamId);
              break;
          case 'BLIND_FAITH':
              db.prepare('UPDATE teams SET blindFaith = 1 WHERE id = ?').run(teamId);
              break;
          case 'BIG_SHORT':
              db.prepare('UPDATE teams SET bigShort = 1 WHERE id = ?').run(teamId);
              break;
          case 'MONOPOLY_POWER':
              db.prepare('UPDATE teams SET monopolyPower = 1 WHERE id = ?').run(teamId);
              break;
          case 'FREEZE':
              if (targetTeamId) db.prepare('UPDATE teams SET frozen = 1 WHERE id = ?').run(targetTeamId);
              break;
          case 'SABOTAGE':
              if (targetTeamId) db.prepare('UPDATE teams SET sabotaged = 1 WHERE id = ?').run(targetTeamId);
              break;
          case 'WEALTH_TAX':
              const taxFirst = db.prepare('SELECT immune FROM teams WHERE id = ?').get(firstPlace.id);
              if (!taxFirst || !taxFirst.immune) {
                  const tax = Math.floor(firstPlace.cash * 0.20);
                  db.prepare('UPDATE teams SET cash = cash - ? WHERE id = ?').run(tax, firstPlace.id);
                  logTransaction(firstPlace.id, roomId, 'WEALTH_TAX', -tax, 'Wealth Tax');
              }
              break;
          case 'STIMULUS':
              const stimulus = Math.floor(firstPlace.cash * 0.20);
              db.prepare('UPDATE teams SET cash = cash + ? WHERE room = ? AND id != ?').run(stimulus, roomId, firstPlace.id);
              logTransaction(teamId, roomId, 'STIMULUS', stimulus, 'Stimulus Checks');
              break;
          case 'EMBEZZLE':
              const embezzledFirst = db.prepare('SELECT immune FROM teams WHERE id = ?').get(firstPlace.id);
              if (!embezzledFirst || !embezzledFirst.immune) {
                  const stolen = Math.floor(firstPlace.cash * 0.20);
                  db.prepare('UPDATE teams SET cash = cash - ? WHERE id = ?').run(stolen, firstPlace.id);
                  db.prepare('UPDATE teams SET cash = cash + ? WHERE id = ?').run(stolen, teamId);
                  logTransaction(teamId, roomId, 'EMBEZZLE', stolen, 'Embezzlement');
              }
              break;
          case 'PHILANTHROPY':
              if (teamId !== lastPlace.id) {
                  const donation = Math.floor(team.cash * 0.25);
                  db.prepare('UPDATE teams SET cash = cash - ? WHERE id = ?').run(donation, teamId);
                  db.prepare('UPDATE teams SET cash = cash + ? WHERE id = ?').run(donation, lastPlace.id);
                  logTransaction(teamId, roomId, 'PHILANTHROPY', -donation, 'Donated to last place');
              } else {
                  let totalBailout = 0;
                  allTeams.forEach(t => {
                      if (t.id !== teamId) {
                          const tRow = db.prepare('SELECT immune FROM teams WHERE id = ?').get(t.id);
                          if (!tRow || !tRow.immune) {
                              const amt = Math.floor(t.cash * 0.067);
                              db.prepare('UPDATE teams SET cash = cash - ? WHERE id = ?').run(amt, t.id);
                              totalBailout += amt;
                          }
                      }
                  });
                  db.prepare('UPDATE teams SET cash = cash + ? WHERE id = ?').run(totalBailout, teamId);
                  logTransaction(teamId, roomId, 'PHILANTHROPY_BAILOUT', totalBailout, 'Received bailout from all teams');
              }
              break;
          case 'AUDIT':
              const auditAmt = Math.floor(team.cash * 0.30);
              if (coinTossResult === 'HEADS') {
                  db.prepare('UPDATE teams SET cash = cash + ? WHERE id = ?').run(auditAmt, teamId);
                  logTransaction(teamId, roomId, 'AUDIT_WIN', auditAmt, 'Passed Audit');
              } else {
                  db.prepare('UPDATE teams SET cash = cash - ? WHERE id = ?').run(auditAmt, teamId);
                  logTransaction(teamId, roomId, 'AUDIT_LOSS', -auditAmt, 'Failed Audit');
              }
              break;
          case 'BAILOUT':
              if (team.cash < 2000) {
                  db.prepare('UPDATE teams SET cash = 2000 WHERE id = ?').run(teamId);
                  logTransaction(teamId, roomId, 'BAILOUT', 2000 - team.cash, 'Bailout to $2000');
              }
              break;
          case 'HOSTILE_BID':
              if (targetTeamId && coinTossResult === 'WIN') {
                  const target = db.prepare('SELECT cash FROM teams WHERE id = ?').get(targetTeamId);
                  if (target) {
                      const amount = Math.floor(target.cash * 0.20);
                      db.prepare('UPDATE teams SET cash = cash - ? WHERE id = ?').run(amount, targetTeamId);
                      db.prepare('UPDATE teams SET cash = cash + ? WHERE id = ?').run(amount, teamId);
                      logTransaction(teamId, roomId, 'HOSTILE_BID_WIN', amount, 'Won Hostile Bid');
                  }
              } else if (targetTeamId && coinTossResult === 'LOSS') {
                  const amount = Math.floor(team.cash * 0.20);
                  db.prepare('UPDATE teams SET cash = cash - ? WHERE id = ?').run(amount, teamId);
                  db.prepare('UPDATE teams SET cash = cash + ? WHERE id = ?').run(amount, targetTeamId);
                  logTransaction(teamId, roomId, 'HOSTILE_BID_LOSS', -amount, 'Lost Hostile Bid');
              }
              break;
          case 'BOOM':
              allTeams.forEach(t => {
                  const boomAmt = Math.floor(t.cash * 0.20);
                  db.prepare('UPDATE teams SET cash = cash + ? WHERE id = ?').run(boomAmt, t.id);
              });
              logTransaction(teamId, roomId, 'BOOM', 0, 'Economic Boom');
              break;
          case 'ROBIN_HOOD':
              const robinFirst = db.prepare('SELECT immune FROM teams WHERE id = ?').get(firstPlace.id);
              if (!robinFirst || !robinFirst.immune) {
                  const robinStolen = Math.floor(firstPlace.cash * 0.30);
                  db.prepare('UPDATE teams SET cash = cash - ? WHERE id = ?').run(robinStolen, firstPlace.id);
                  const othersCount = allTeams.length - 1;
                  if (othersCount > 0) {
                      const robinShare = Math.floor(robinStolen / othersCount);
                      db.prepare('UPDATE teams SET cash = cash + ? WHERE room = ? AND id != ?').run(robinShare, roomId, firstPlace.id);
                  }
                  logTransaction(teamId, roomId, 'ROBIN_HOOD', 0, 'The Robin Hood');
              }
              break;
          case 'BLACK_SWAN':
              // This acts as a flag for the frontend to render the global event
              break;
          case 'ANGEL_INVESTOR':
              db.prepare('UPDATE teams SET cash = cash + 1000, blindFaith = 1 WHERE id = ?').run(teamId);
              logTransaction(teamId, roomId, 'ANGEL_INVESTOR', 1000, 'Angel Investor');
              break;
          case 'HIGH_STAKES_COIN':
              if (coinTossResult === 'HEADS') {
                  const winAmt = Math.floor(team.cash * 0.33);
                  db.prepare('UPDATE teams SET cash = cash + ? WHERE id = ?').run(winAmt, teamId);
                  logTransaction(teamId, roomId, 'COIN_WIN', winAmt, 'High Stakes Win');
              } else {
                  db.prepare('UPDATE teams SET cash = cash + 1000 WHERE room = ? AND id != ?').run(roomId, teamId);
                  logTransaction(teamId, roomId, 'COIN_LOSS', 0, 'High Stakes Loss');
              }
              break;
      }

      turns.finish(teamId, pendingId);
  });

  onAction('resolveCornerEvent', ({ teamId, roomId, pendingId, eventType, coinTossResult, targetTeamId }) => {
      turns.event({ teamId, roomId, pendingId, eventType, targetTeamId, coinTossResult });
      const team = db.prepare('SELECT name, cash FROM teams WHERE id = ?').get(teamId);
      if (!team) return;

      if (eventType === 'ANGEL_INVESTMENT') {
          const invested = Math.floor(team.cash / 2);
          if (coinTossResult === 'HEADS') {
              const won = invested * 3; // Triples investment
              // Net gain is won - invested
              db.prepare('UPDATE teams SET cash = cash + ? WHERE id = ?').run(won - invested, teamId);
              logTransaction(teamId, roomId, 'ANGEL_WIN', won - invested, 'Angel Investment Win');
          } else {
              db.prepare('UPDATE teams SET cash = cash - ? WHERE id = ?').run(invested, teamId);
              logTransaction(teamId, roomId, 'ANGEL_LOSS', -invested, 'Angel Investment Loss');
          }
      } else if (eventType === 'CORPORATE_BUYOUT' && targetTeamId) {
          if (coinTossResult === 'WIN') {
              const target = db.prepare('SELECT cash FROM teams WHERE id = ?').get(targetTeamId);
              if (target) {
                  db.prepare('UPDATE teams SET cash = cash - 1000 WHERE id = ?').run(targetTeamId);
                  db.prepare('UPDATE teams SET cash = cash + 1000 WHERE id = ?').run(teamId);
                  logTransaction(teamId, roomId, 'BUYOUT_WIN', 1000, 'Won Corporate Buyout');
              }
          } else if (coinTossResult === 'LOSS') {
              db.prepare('UPDATE teams SET cash = cash - 1000 WHERE id = ?').run(teamId);
              db.prepare('UPDATE teams SET cash = cash + 1000 WHERE id = ?').run(targetTeamId);
              logTransaction(teamId, roomId, 'BUYOUT_LOSS', -1000, 'Lost Corporate Buyout');
          }
      } else if (eventType === 'WHITE_COLLAR_PRISON') {
          db.prepare('UPDATE teams SET frozen = 1, immune = 1 WHERE id = ?').run(teamId);
          logTransaction(teamId, roomId, 'JAIL', 0, 'Sent to White Collar Prison');
      }

      turns.finish(teamId, pendingId);
  });

  onAction('advanceEra', () => {
      if (db.prepare('SELECT id FROM rooms WHERE pendingTurn IS NOT NULL').get()) throw new Error('Finish all pending turns before advancing the era.');
      const state = db.prepare('SELECT currentEraId FROM app_state WHERE id = 1').get();
      const currentIdx = erasDb.findIndex(e => e.id === state.currentEraId);
      let nextEra = erasDb[currentIdx + 1];
      if (!nextEra) {
          nextEra = erasDb[0];
      }
      db.prepare('UPDATE app_state SET currentEraId = ?, currentEraName = ? WHERE id = 1').run(nextEra.id, nextEra.name);

      const rooms = db.prepare('SELECT id FROM rooms').all();
      rooms.forEach(r => {
          initializeRoomDeck(r.id);
          db.prepare("UPDATE rooms SET eraStatus = 'ACTIVE' WHERE id = ?").run(r.id);
      });

      db.prepare('UPDATE teams SET eraStartingCash = cash').run();



  });

  onAction('cornerAction', ({ teamId, actionType, amount }) => {
      if (!Number.isSafeInteger(amount) || amount < 0) throw new Error('Enter a valid whole-number amount.');
      let diff = 0;
      if (actionType === 'START') {
          diff = 200;
      } else if (actionType === 'GAMBLE_WIN') {
          diff = amount;
      } else if (actionType === 'GAMBLE_LOSS') {
          diff = -amount;
      } else if (actionType === 'PENALTY') {
          diff = -amount;
      }

      if (diff !== 0) {
          db.prepare('UPDATE teams SET cash = cash + ? WHERE id = ?').run(diff, teamId);
      }

  });

  onAction('resetGame', () => {
    db.prepare('DELETE FROM teams').run();
    db.prepare('DELETE FROM rooms').run();
    db.prepare('DELETE FROM transactions').run();
    const defaultEra = erasDb.find(e => e.investments.length === 72) || erasDb[0];
    db.prepare('UPDATE app_state SET currentEraId = ?, currentEraName = ? WHERE id = 1').run(defaultEra.id, defaultEra.name);
    console.log('Game reset: all teams, rooms, and transactions cleared.');

  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = Number(process.env.PORT ?? 3001);
server.listen(PORT, () => {
  const port = server.address().port;
  console.log(`Finopoly server listening on port ${port}`);
  if (process.send) process.send({ type: 'listening', port });
});
