const fs = require('fs');

const dbPath = 'server/data/eras_db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

db.forEach(era => {
    era.investments.forEach(card => {
        let baseName = card.name;
        const match = card.name.match(/\(([A-Z]{1,5})\)/);
        if (match) {
            baseName = card.name.split(' (')[0];
        } else if (card.name.includes(' (')) {
            baseName = card.name.split(' (')[0];
        }
        card.description = `An investment opportunity representing the market performance of ${baseName}.`;
    });
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('Descriptions updated to be specific based on name.');
