const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'data', 'eras_db.json');
const mapPath = path.join(__dirname, 'descriptions_map.json');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

let count = 0;
let missing = [];

db.forEach(era => {
    era.investments.forEach(card => {
        if (map[card.name]) {
            card.description = map[card.name];
            count++;
        } else {
            // fallback
            let baseName = card.name.split(' (')[0];
            card.description = `A financial asset representing ${baseName}.`;
            missing.push(card.name);
        }
    });
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`Descriptions updated successfully! Replaced ${count} descriptions.`);
if (missing.length > 0) {
    console.log(`Missing custom descriptions for ${missing.length} items (used generic fallback):`);
    console.log(missing.slice(0, 10));
}
