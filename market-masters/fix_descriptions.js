const fs = require('fs');

const db = JSON.parse(fs.readFileSync('server/data/eras_db.json', 'utf8'));

db.forEach(era => {
    era.investments.forEach(card => {
        // Delete description so it falls back to the generic string
        delete card.description;
    });
});

fs.writeFileSync('server/data/eras_db.json', JSON.stringify(db, null, 2));
console.log("Descriptions removed to avoid spoilers!");
