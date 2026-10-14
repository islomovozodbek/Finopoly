const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { io } = require('socket.io-client');

test('real sockets and server restart restore saved choices without extra moves', { timeout: 40000 }, async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'finopoly-live-test-'));
  let child; const clients = [];
  const start = async () => {
    child = fork(path.join(__dirname, 'index.js'), [], { env: { ...process.env, PORT: '0', FINOPOLY_DB_PATH: path.join(dir, 'database.sqlite') }, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
    let output = ''; child.stderr.on('data', data => { output += data; });
    const ready = await Promise.race([once(child, 'message'), once(child, 'exit').then(() => { throw new Error(output || 'Server exited before startup'); })]);
    return `http://127.0.0.1:${ready[0].port}`;
  };
  const stop = async () => { if (child && child.exitCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; } };
  const connect = async url => {
    const client = io(url, { autoConnect: false, reconnection: false }); clients.push(client);
    const snapshot = once(client, 'stateUpdate'); client.connect(); await snapshot; return client;
  };
  const action = (client, name, payload) => new Promise((resolve, reject) => client.timeout(6000).emit(name, payload, (err, result) => err ? reject(err) : resolve(result)));
  try {
    let url = await start(); let client = await connect(url);
    assert.equal((await (await fetch(url + '/health')).json()).source, 'market-masters');
    await action(client, 'joinRoom', 'Room_1');
    const registration = await action(client, 'registerTeam', { name: 'Harbor Capital', room: 'Room_1', startingCash: 2000 });
    const team = registration.state.teams[0];
    const first = await action(client, 'movePiece', { teamId: team.id });
    const turn = first.state.rooms.Room_1.pendingTurn;
    assert.ok(turn); assert.equal(turn.dice >= 1 && turn.dice <= 6, true);
    assert.deepEqual((await action(client, 'movePiece', { teamId: team.id })).state.rooms.Room_1.pendingTurn, turn);
    assert.match((await action(client, 'forceNextTurn', 'Room_1')).error, /saved turn/);
    assert.match((await action(client, 'advanceEra')).error, /pending turns/);
    assert.equal(first.state.rooms.Room_1.deck.length, 0);
    client.disconnect(); await stop();
    url = await start(); client = await connect(url);
    const restored = (await action(client, 'joinRoom', 'Room_1')).state;
    assert.deepEqual(restored.rooms.Room_1.pendingTurn, turn);
    assert.equal(restored.teams[0].iconIndex, team.iconIndex);
    assert.equal(restored.teams[0].position, first.state.teams[0].position);
    const submit = turn.stage === 'investment'
      ? ['processInvestment', { teamId: team.id, pendingId: turn.id, cardId: turn.cards[0].id, betAmount: 100 }]
      : ['resolveMarketNews', { teamId: team.id, roomId: 'Room_1', pendingId: turn.id }];
    // A roll from Start can only reach investment spaces or market-news 2.
    // Targeted/coin news requires recording its inputs, using a second team.
    if (turn.stage === 'event') {
      const second = await action(client, 'registerTeam', { name: 'Northstar', room: 'Room_1', startingCash: 2000 });
      submit[1].targetTeamId = second.state.teams.find(t => t.id !== team.id).id;
      submit[1].coinTossResult = turn.newsCard?.effect === 'HOSTILE_BID' ? 'WIN' : 'HEADS';
    }
    const finished = await action(client, ...submit);
    assert.equal(finished.error, undefined);
    assert.equal(finished.state.rooms.Room_1.pendingTurn, null);
    assert.equal(finished.state.teams.find(t => t.id === team.id).lapTurnsTaken, 1);
    assert.ok((await action(client, ...submit)).error);
  } finally {
    clients.forEach(client => client.disconnect()); await stop();
    const root = path.resolve(os.tmpdir()) + path.sep;
    assert.ok(path.resolve(dir).startsWith(root));
    await rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});
