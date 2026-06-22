const fs = require('fs');
const yahooFinance = new (require('yahoo-finance2').default)({ suppressNotices: ['yahooSurvey'] });

const dbPath = 'server/data/eras_db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

async function updateDescriptions() {
    const cachePath = 'server/data/ticker_cache.json';
    let cache = {};
    if (fs.existsSync(cachePath)) {
        cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }

    const promises = [];
    
    // Pass 1: Collect unique tickers
    const uniqueTickers = new Set();
    db.forEach(era => {
        era.investments.forEach(card => {
            const match = card.name.match(/\(([A-Z]{1,5})\)/);
            if (match) {
                uniqueTickers.add(match[1]);
            }
        });
    });

    console.log(`Found ${uniqueTickers.size} unique tickers.`);

    // Pass 2: Fetch summaries
    const tickerArray = Array.from(uniqueTickers);
    for (let i = 0; i < tickerArray.length; i++) {
        const ticker = tickerArray[i];
        if (!cache[ticker]) {
            try {
                console.log(`Fetching ${ticker}... (${i+1}/${tickerArray.length})`);
                const res = await yahooFinance.quoteSummary(ticker, { modules: ['summaryProfile'] });
                if (res && res.summaryProfile && res.summaryProfile.longBusinessSummary) {
                    const firstSentence = res.summaryProfile.longBusinessSummary.split('. ')[0] + '.';
                    cache[ticker] = firstSentence;
                } else {
                    cache[ticker] = "A publicly traded market asset.";
                }
            } catch (e) {
                console.log(`Failed to fetch ${ticker}: ${e.message}`);
                cache[ticker] = "A publicly traded market asset.";
            }
            // Add a small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 500));
        }
    }

    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));

    // Pass 3: Update DB
    db.forEach(era => {
        era.investments.forEach(card => {
            const match = card.name.match(/\(([A-Z]{1,5})\)/);
            if (match && cache[match[1]] && cache[match[1]] !== "A publicly traded market asset.") {
                card.description = cache[match[1]];
            } else {
                // If no ticker, just use the name as specific description
                let baseName = card.name;
                if (match) baseName = card.name.split(' (')[0];
                card.description = `Invest in the market performance of ${baseName}.`;
            }
        });
    });

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    console.log('Descriptions updated.');
}

updateDescriptions();
