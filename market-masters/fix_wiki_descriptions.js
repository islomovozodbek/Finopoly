const fs = require('fs');
const https = require('https');

const fetch = (url) => new Promise((resolve, reject) => {
  https.get(url, { headers: { 'User-Agent': 'MarketMastersApp/1.0 (contact@example.com)' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch (e) { resolve(null); }
    });
  }).on('error', reject);
});

// Hardcoded high-quality descriptions for tricky ones that Wikipedia fails on
const MANUAL_OVERRIDES = {
  'Petrobras': 'Petrobras is the Brazilian state-owned oil giant and one of the largest energy companies in the Americas.',
  'Adobe': 'Adobe Inc. is an American multinational software company known for Photoshop, Illustrator, Acrobat PDF, and the Creative Cloud suite.',
  'Occidental Petroleum': 'Occidental Petroleum (Oxy) is a major American oil and gas exploration company with operations across the US, Middle East, and Latin America.',
  'NIO': 'NIO is a Chinese electric vehicle startup and competitor to Tesla, known for premium EVs and battery swap technology.',
  'Aeroflot': 'Aeroflot is the flag carrier airline of Russia and one of the world\'s oldest airlines.',
  'Sberbank': 'Sberbank is Russia\'s largest state-owned bank and financial institution.',
  'Gazprom': 'Gazprom is a Russian state-controlled energy company and the world\'s largest producer of natural gas.',
  'Lukoil': 'Lukoil is one of Russia\'s largest privately-owned oil companies with global exploration and refining operations.',
  'Alrosa': 'ALROSA is a Russian diamond mining company and one of the world\'s largest producers of rough diamonds.',
  'Norilsk Nickel': 'Norilsk Nickel (Nornickel) is a Russian mining and metallurgical company and the world\'s largest producer of nickel and palladium.',
  'Yandex': 'Yandex is Russia\'s largest technology company, operating the dominant search engine and digital services across Eastern Europe.',
  'Magnit': 'Magnit is one of Russia\'s largest retail grocery chains with thousands of stores across the country.',
  'Tatneft': 'Tatneft is a major Russian oil company headquartered in Tatarstan, focused on oil and gas extraction and refining.',
  'Silicon Valley Bank': 'Silicon Valley Bank (SVB) was a US commercial bank specializing in lending to technology startups and venture capital firms, collapsed in 2023.',
  'Signature Bank': 'Signature Bank was a New York-based commercial bank that served crypto and real estate clients, shut by regulators in 2023.',
  'First Republic Bank': 'First Republic Bank was a US private bank focused on high-net-worth clients, acquired by JPMorgan Chase in 2023 after a bank run.',
  'Daewoo Group': 'Daewoo Group was a major South Korean conglomerate (chaebol) involved in shipbuilding, electronics, and construction before its collapse in 1999.',
  'Hanbo Steel': 'Hanbo Steel was a South Korean steelmaker whose bankruptcy in 1997 helped trigger the Asian Financial Crisis.',
  'Sammi Steel': 'Sammi Steel was a South Korean steelmaker that went bankrupt during the 1997 Asian Financial Crisis.',
  'Jinro Group': 'Jinro Group was a South Korean conglomerate known for its Jinro soju brand, which went bankrupt during the 1997 crisis.',
  'Berkshire Hathaway': 'Berkshire Hathaway is the multinational conglomerate holding company run by legendary investor Warren Buffett.',
  'Bridgewater\'s Pure Alpha Fund': 'Bridgewater Associates\' Pure Alpha Fund is one of the world\'s largest hedge funds, known for its macro investment strategies.',
  'Paulson & Co. Fund': 'Paulson & Co. is a New York-based hedge fund famous for profiting billions by shorting the US housing market in 2008.',
  'Lehman Brothers Stock': 'Lehman Brothers was a major US investment bank that filed for the largest bankruptcy in history in 2008, triggering the global financial crisis.',
  'Bear Stearns Stock': 'Bear Stearns was a US investment bank that collapsed in 2008, sold to JPMorgan Chase, marking the beginning of the financial crisis.',
  'AIG Stock': 'AIG (American International Group) is a global insurance conglomerate that required a $182 billion US government bailout in 2008.',
};

const dbPath = 'server/data/eras_db.json';
const cachePath = 'server/data/wiki_cache.json';

async function fixDescriptions() {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

  // Apply manual overrides first
  for (const [name, desc] of Object.entries(MANUAL_OVERRIDES)) {
    cache[name] = desc;
  }

  // Find all names that still have bad generic descriptions
  const badEntries = Object.entries(cache).filter(([k, v]) => v.includes('An investment opportunity representing'));
  console.log(`Fixing ${badEntries.length} remaining bad entries...`);

  for (const [name] of badEntries) {
    try {
      // Search with "company" or "stock" appended to disambiguate
      const query = encodeURIComponent(name + ' company stock');
      const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&utf8=&format=json`);
      
      if (searchRes?.query?.search?.length > 0) {
        const title = searchRes.query.search[0].title;
        const summaryRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exchars=200&titles=${encodeURIComponent(title)}&explaintext=1&format=json`);
        
        if (summaryRes?.query?.pages) {
          const pages = summaryRes.query.pages;
          const extract = pages[Object.keys(pages)[0]]?.extract;
          if (extract && !extract.includes(name + ' may refer to') && extract.length > 30) {
            cache[name] = extract.replace(/\n/g, ' ').trim().slice(0, 200);
            console.log(`  ✓ Fixed: ${name}`);
          } else {
            console.log(`  ✗ No good result for: ${name}`);
          }
        }
      }
    } catch (e) {
      console.log(`  Error for ${name}: ${e.message}`);
    }
  }

  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));

  // Apply all descriptions back to the database
  db.forEach(era => {
    era.investments.forEach(card => {
      let baseName = card.name;
      const match = card.name.match(/\(([A-Z]{1,5})\)/);
      if (match || card.name.includes(' (')) {
        baseName = card.name.split(' (')[0].trim();
      }
      if (cache[baseName] && !cache[baseName].includes('An investment opportunity representing')) {
        card.description = cache[baseName];
      }
      // else leave whatever it has
    });
  });

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  
  // Summary
  let stillBad = 0;
  db.forEach(era => era.investments.forEach(c => { if (!c.description || c.description.includes('An investment opportunity representing')) stillBad++; }));
  console.log(`\nDone! Cards still with generic description: ${stillBad}`);
}

fixDescriptions();
