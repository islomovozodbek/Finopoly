const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('./server/data/database.sqlite');
const erasDb = JSON.parse(fs.readFileSync('./server/data/eras_db.json', 'utf8'));

const state = db.prepare('SELECT currentEraId FROM app_state WHERE id = 1').get();
const era = erasDb.find(e => e.id === state.currentEraId);

if (era) {
    const rooms = db.prepare('SELECT id, deck FROM rooms').all();
    for (const r of rooms) {
        let deck = JSON.parse(r.deck);
        deck = deck.map(card => {
            const newCard = era.investments.find(c => c.name === card.name);
            if (newCard) card.description = newCard.description;
            return card;
        });
        db.prepare('UPDATE rooms SET deck = ? WHERE id = ?').run(JSON.stringify(deck), r.id);
    }
    console.log("Successfully updated all active room decks in the SQLite database!");
} else {
    console.log("Era not found.");
}
