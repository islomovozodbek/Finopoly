const fs = require('fs');
const https = require('https');

const fetch = (url) => new Promise((resolve, reject) => {
  https.get(url, { headers: { 'User-Agent': 'MarketMastersApp/1.0 (test@example.com)' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve(null);
      }
    });
  }).on('error', reject);
});

const dbPath = 'server/data/eras_db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

async function updateDescriptions() {
    const cachePath = 'server/data/wiki_cache.json';
    let cache = {};
    if (fs.existsSync(cachePath)) {
        cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }

    const uniqueNames = new Set();
    db.forEach(era => {
        era.investments.forEach(card => {
            let baseName = card.name;
            const match = card.name.match(/\(([A-Z]{1,5})\)/);
            if (match) {
                baseName = card.name.split(' (')[0].trim();
            } else if (card.name.includes(' (')) {
                baseName = card.name.split(' (')[0].trim();
            }
            uniqueNames.add(baseName);
        });
    });

    const namesArray = Array.from(uniqueNames).filter(name => !cache[name]);
    console.log(`Found ${namesArray.length} items left to fetch.`);

    const concurrencyLimit = 15;
    let index = 0;
    
    async function worker() {
        while (index < namesArray.length) {
            const i = index++;
            const name = namesArray[i];
            try {
                console.log(`Fetching ${name}... (${i+1}/${namesArray.length})`);
                const searchRes = await fetch('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' + encodeURIComponent(name) + '&utf8=&format=json');
                
                if (searchRes && searchRes.query && searchRes.query.search && searchRes.query.search.length > 0) {
                    const title = searchRes.query.search[0].title;
                    const summaryRes = await fetch('https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exchars=150&titles=' + encodeURIComponent(title) + '&explaintext=1&format=json');
                    
                    if (summaryRes && summaryRes.query && summaryRes.query.pages) {
                        const pages = summaryRes.query.pages;
                        const extract = pages[Object.keys(pages)[0]].extract;
                        if (extract) {
                            let cleanExtract = extract.replace(/\n/g, ' ').trim();
                            cache[name] = cleanExtract;
                        } else {
                            cache[name] = `An investment opportunity representing the market performance of ${name}.`;
                        }
                    }
                } else {
                    cache[name] = `An investment opportunity representing the market performance of ${name}.`;
                }
            } catch (e) {
                console.log(`Failed to fetch ${name}: ${e.message}`);
                cache[name] = `An investment opportunity representing the market performance of ${name}.`;
            }
        }
    }

    const workers = [];
    for (let i = 0; i < concurrencyLimit; i++) workers.push(worker());
    await Promise.all(workers);

    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));

    db.forEach(era => {
        era.investments.forEach(card => {
            let baseName = card.name;
            const match = card.name.match(/\(([A-Z]{1,5})\)/);
            if (match) {
                baseName = card.name.split(' (')[0].trim();
            } else if (card.name.includes(' (')) {
                baseName = card.name.split(' (')[0].trim();
            }
            
            if (cache[baseName]) {
                card.description = cache[baseName];
            } else {
                card.description = `An investment opportunity representing the market performance of ${baseName}.`;
            }
        });
    });

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('Descriptions updated with Wikipedia summaries.');
}

updateDescriptions();
