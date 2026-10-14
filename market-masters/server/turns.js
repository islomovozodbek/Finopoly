const crypto = require('node:crypto');

const NEWS_SPACES = [2, 7, 17, 22, 33, 36];
const CORNERS = { 0: 'START_BONUS', 10: 'ANGEL_INVESTMENT', 20: 'WHITE_COLLAR_PRISON', 30: 'CORPORATE_BUYOUT' };

function publicTurn(turn) {
  if (!turn) return null;
  return { ...turn, cards: turn.cards?.map(({ id, name, description }) => ({ id, name, description })) ?? [] };
}

function createTurns({ db, marketNews, logTransaction, shuffle, roll = () => crypto.randomInt(1, 7) }) {
  const pending = roomId => {
    const row = db.prepare('SELECT pendingTurn FROM rooms WHERE id = ?').get(roomId);
    return row?.pendingTurn ? JSON.parse(row.pendingTurn) : null;
  };
  const save = (roomId, turn) => db.prepare('UPDATE rooms SET pendingTurn = ? WHERE id = ?').run(JSON.stringify(turn), roomId);

  function current(teamId, pendingId) {
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
    if (!team) throw new Error('This team no longer exists. Refresh the board.');
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(team.room);
    const teams = db.prepare('SELECT id FROM teams WHERE room = ? ORDER BY rowid').all(team.room);
    if (!room || teams[room.turnIndex]?.id !== team.id) throw new Error('The turn has changed. Refresh the board.');
    const turn = pending(team.room);
    if (pendingId !== undefined && (!turn || turn.id !== pendingId || turn.teamId !== teamId)) {
      throw new Error('This turn has already finished. Refresh the board.');
    }
    return { team, room, teams, turn };
  }

  function deal(deck, team) {
    const count = team.monopolyPower ? 5 : 3;
    if (deck.length < count) throw new Error('Not enough investments remain. Ask the host to start the next era.');
    const cards = [];
    for (let i = 0; i < count; i++) {
      let wanted;
      if (team.insiderInfo) wanted = 'Good';
      else if (team.sabotaged) wanted = 'Bad';
      else if (cards.length >= 2) {
        if (cards.filter(c => c.type === 'Good').length >= 2) wanted = 'Bad';
        else if (cards.filter(c => c.type === 'Bad').length >= 2) wanted = 'Good';
      }
      const index = wanted ? Math.max(0, deck.findIndex(c => c.type === wanted)) : 0;
      cards.push({ ...deck.splice(index, 1)[0], id: crypto.randomUUID() });
    }
    return cards;
  }

  function move({ teamId }) {
    const { team, room, turn } = current(teamId);
    // Reopening a page or retrying the same click returns the saved choice.
    if (turn) return { pendingTurn: publicTurn(turn) };
    if (room.eraStatus === 'INTERMISSION') throw new Error('The era has ended. Ask the host to start the next era.');
    const dice = team.frozen ? null : roll();
    const position = team.frozen ? team.position : (team.position + dice) % 40;
    let eventType = team.frozen ? 'FROZEN' : CORNERS[position] ?? null;
    const isNews = !team.frozen && NEWS_SPACES.includes(position) && marketNews.length > 0;
    if (isNews) eventType = 'MARKET_NEWS';
    const next = { id: crypto.randomUUID(), teamId, roomId: team.room, dice, position,
      stage: eventType ? 'event' : 'investment', eventType,
      newsCard: isNews ? marketNews[crypto.randomInt(marketNews.length)] : null, cards: [] };
    if (next.stage === 'investment') {
      const deck = JSON.parse(room.deck);
      next.cards = deal(deck, team);
      db.prepare('UPDATE rooms SET deck = ? WHERE id = ?').run(JSON.stringify(deck), team.room);
    }
    let bonus = 0;
    if (dice && team.position + dice >= 40) {
      bonus += 200;
      db.prepare('UPDATE rooms SET roundEnding = 1 WHERE id = ?').run(team.room);
    }
    if (dice && position === 0) bonus += 200;
    db.prepare('UPDATE teams SET position = ?, cash = cash + ? WHERE id = ?').run(position, bonus, teamId);
    if (bonus) logTransaction(teamId, team.room, 'START_BONUS', bonus, position === 0 ? 'Passed and landed on START' : 'Passed START');
    save(team.room, next);
    return { pendingTurn: publicTurn(next) };
  }

  function finish(teamId, pendingId) {
    if (typeof pendingId !== 'string') throw new Error('Refresh the board to restore the saved turn.');
    const { team, room, teams, turn } = current(teamId, pendingId);
    const nextIndex = (room.turnIndex + 1) % teams.length;
    db.prepare('UPDATE teams SET lapTurnsTaken = lapTurnsTaken + 1 WHERE id = ?').run(teamId);
    if (turn.eventType === 'FROZEN') db.prepare('UPDATE teams SET frozen = 0, immune = 0 WHERE id = ?').run(teamId);
    const ended = room.roundEnding && nextIndex === 0;
    db.prepare('UPDATE rooms SET pendingTurn = NULL, turnIndex = ?, eraStatus = ?, roundEnding = ? WHERE id = ?')
      .run(nextIndex, ended ? 'INTERMISSION' : room.eraStatus, ended ? 0 : room.roundEnding, team.room);
  }

  function invest({ teamId, pendingId, cardId, betAmount, pass = false }) {
    if (typeof pendingId !== 'string') throw new Error('Refresh the board to restore the saved turn.');
    const { team, room, turn } = current(teamId, pendingId);
    if (turn.stage !== 'investment') throw new Error('Finish the current board event first.');
    const card = turn.cards.find(c => c.id === cardId);
    if (!pass && (!card || !Number.isSafeInteger(betAmount) || betAmount <= 0 || betAmount > team.cash)) {
      throw new Error('Choose an investment and an amount within your available cash.');
    }
    if (!pass && team.blindFaith && betAmount !== team.cash) throw new Error('Blind Faith requires investing all your cash.');
    let percentage = card?.percentage ?? 0;
    if (team.bigShort) percentage = -percentage;
    if (team.blindFaith && percentage > 0) percentage *= 2;
    let profitLoss = pass ? 0 : Math.floor(betAmount * percentage / 100) * team.nextMultiplier;
    if (team.hedgeFund && profitLoss < 0) profitLoss = 0;
    const returned = turn.cards.filter(c => pass || c.id !== cardId).map(({ id, ...rest }) => rest);
    db.prepare('UPDATE rooms SET deck = ? WHERE id = ?').run(JSON.stringify(shuffle([...JSON.parse(room.deck), ...returned])), team.room);
    db.prepare(`UPDATE teams SET cash = cash + ?, nextMultiplier = 1, hedgeFund = 0, insiderInfo = 0,
      blindFaith = 0, bigShort = 0, monopolyPower = 0, sabotaged = 0 WHERE id = ?`).run(profitLoss, teamId);
    logTransaction(teamId, team.room, pass ? 'PASS' : 'INVESTMENT', profitLoss,
      pass ? 'Passed the investment choice' : `${card.name}: invested $${betAmount} at ${percentage > 0 ? '+' : ''}${percentage}%`);
    finish(teamId, pendingId);
    return { result: { teamName: team.name, card, percentage, profitLoss, cash: team.cash + profitLoss, passed: pass } };
  }

  function event({ teamId, roomId, pendingId, eventType, targetTeamId, coinTossResult }) {
    if (typeof pendingId !== 'string') throw new Error('Refresh the board to restore the saved event.');
    const { team, turn } = current(teamId, pendingId);
    if (team.room !== roomId || turn.stage !== 'event' || turn.eventType !== eventType) throw new Error('This event is no longer active.');
    const targetRequired = eventType === 'CORPORATE_BUYOUT' || turn.newsCard?.type === 'TARGET_OPPONENT';
    const eligible = targetRequired ? db.prepare('SELECT id FROM teams WHERE room = ? AND id != ? AND immune = 0').all(roomId, teamId) : [];
    if (targetRequired && eligible.length) {
      const target = db.prepare('SELECT room, immune FROM teams WHERE id = ?').get(targetTeamId);
      if (!target || target.room !== roomId || targetTeamId === teamId || target.immune) throw new Error('Choose an eligible opponent in this room.');
    }
    const coinRequired = eventType === 'ANGEL_INVESTMENT' || turn.newsCard?.type === 'COIN_TOSS';
    const contest = eventType === 'CORPORATE_BUYOUT' || turn.newsCard?.effect === 'HOSTILE_BID';
    if (coinRequired && !['HEADS', 'TAILS'].includes(coinTossResult)) throw new Error('Record the coin toss result first.');
    if (contest && eligible.length && !['WIN', 'LOSS'].includes(coinTossResult)) throw new Error('Record the contest result first.');
    return turn;
  }

  return { pending, current, move, invest, event, finish, publicTurn };
}

module.exports = { createTurns, publicTurn };
