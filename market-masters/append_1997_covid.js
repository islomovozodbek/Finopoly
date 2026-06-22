const fs = require('fs');

const extractCards = (goodText, badText) => {
    const cards = [];
    
    // Parse Good Cards
    const goodLines = goodText.split('\n').map(l => l.trim()).filter(l => l.includes('|'));
    goodLines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3) {
            const name = parts[0].replace(/^\d+\.\s*/, '');
            const reason = parts[2];
            let percentage = 10;
            if (parts[3]) {
                const pctMatch = parts[3].match(/([+-]?\d+)/);
                if (pctMatch) percentage = parseInt(pctMatch[1]);
            }
            cards.push({
                name,
                type: 'Good',
                percentage: Math.abs(percentage),
                reason,
                description: reason
            });
        }
    });

    // Parse Bad Cards
    const badLines = badText.split('\n').map(l => l.trim()).filter(l => l.includes('|'));
    badLines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3) {
            const name = parts[0].replace(/^\d+\.\s*/, '');
            const reason = parts[2];
            let percentage = -10;
            if (parts[3]) {
                const pctMatch = parts[3].match(/([+-]?\d+)/);
                if (pctMatch) percentage = parseInt(pctMatch[1]);
            }
            cards.push({
                name,
                type: 'Bad',
                percentage: -Math.abs(percentage),
                reason,
                description: reason
            });
        }
    });
    
    return cards;
};

const covidGood = `
1. Pfizer (PFE) | Stock | Vaccine success | +120%
2. Moderna (MRNA) | Stock | mRNA tech breakthrough | +300%
3. Zoom Video (ZM) | Stock | WFH surge | +400%
4. DocuSign (DOCU) | Stock | e-signature demand | +100%
5. Netflix (NFLX) | Stock | Home streaming growth | +70%
6. Amazon (AMZN) | Stock | E-commerce boom | +80%
7. Shopify (SHOP) | Stock | E-commerce SMB tools | +150%
8. Peloton (PTON) | Stock | Home fitness boom | +400%
9. Wayfair (W) | Stock | Furniture demand | +140%
10. Etsy (ETSY) | Stock | DIY/home goods boom | +180%
11. Cloudflare (NET) | Stock | Online infrastructure demand | +90%
12. CrowdStrike (CRWD) | Stock | Security needs spike | +150%
13. Salesforce (CRM) | Stock | Remote CRM adoption | +70%
14. Nvidia (NVDA) | Stock | AI and cloud processing | +130%
15. Apple (AAPL) | Stock | Surged with tech resilience | +80%
16. SPDR Technology ETF (XLK) | ETF | Tech-led recovery | +60%
17. ARK Innovation ETF (ARKK) | ETF | High growth tech | +120%
18. Work-from-Home ETFs (e.g., WFH) | ETF | Remote work trend | +100%
19. Biotech ETFs (e.g., IBB) | ETF | Vaccine & pharma rally | +60%
20. Bitcoin (BTC) | Crypto | Flight to digital gold | +300%
21. Ethereum (ETH) | Crypto | DeFi and institutional interest | +200%
22. Spot Silver ETF (e.g., SLV) | ETF | Institutional crypto shift | +100%
23. Gold (XAU) | Commodity | Safe haven | +25%
24. Silver (XAG) | Commodity | Industrial and safe haven | +30%
25. U.S. Treasury Bonds (TLT) | Bond | Flight to safety | +10%
26. TIPS | Bond | Inflation hedge | +5%
27. Short S&P 500 ETFs (SH) | ETF | Profited from crash | +30%
28. VIX Futures | Derivative | Volatility spike | +200%
29. Money Market Funds | Cash equivalent | Safe capital hold | ~0%
30. Short Homebuilder ETFs (e.g. XHB) | ETF | Housing pullback early 2020 | +50%
31. Grocery Retail Stocks (e.g., Kroger) | Stock | Essential business improvement | +40%
32. Healthcare Providers (e.g., UNH) | Stock | Stable demand | +20%
33. e-Commerce Funds (e.g. EBIZ) | ETF | Consumer shift online | +50%
34. Workday (WDAY) | Stock | Cloud HR adoption | +70%
35. Snowflake (SNOW) | Stock | Cloud data platform growth | +150%
36. Smart Home ETF (XLRN) | ETF | Security non essential | +60%
`;

const covidBad = `
1. Airline Stocks (e.g. DAL) | Stock | Travel halted | -60%
2. Cruise Lines (e.g. CCL) | Stock | Complete stoppage | -70%
3. Hotel REITs (e.g. Host Hotels) | REIT | Tourism crash | -70%
4. Oil Stocks (e.g. Exxon) | Stock | Demand collapse | -40%
5. Oil Futures (WTI) | Commodity | Negative prices in April 2020 | -100%
6. Hotel/REIT Bonds | Bond | Defaults and losses | -50%
7. Commercial Real Estate | REIT/Stock | Office vacancy rise | -40%
8. Regional Bank Stocks (e.g. FITB) | Stock | Lending freezes & credit losses | -50%
9. Small Business Lending ETFs | ETF | Defaults rise | -30%
10. Movie Theater Stocks (AMC) | Stock | No in-person business | -60%
11. Retail REITs (e.g. SPG) | REIT | Foot traffic disappearance | -60%
12. Department Store Chains (e.g. JCP) | Stock | Consumer pullback | -80%
13. Oil services (e.g. Halliburton) | Stock | Drilling paused | -60%
14. Energy Infrastructure Funds | Fund | Demand shock | -40%
15. Small-Cap Value ETFs | ETF | Out of favor vs growth | -30%
16. Cable TV Stocks (e.g., DISH) | Stock | Cord cutting speeded up | -30%
17. Legacy Media Stocks (e.g., News Corp) | Stock | Ad revenue slump | -40%
18. City-Centered Office REITs | REIT | Drops powered remote adoption | -60%
19. Commercial Mortgage-Backed Securities (CMBS) | Bond | Payment defaults | -50%
20. Junk Bonds | Bond | High credit fear | -30%
21. Restaurant Stocks (e.g. Denny's) | Stock | Social distancing impact | -50%
22. Concert/Event Stocks (Live Nation) | Stock | Gatherings banned | -60%
23. Music Venue REITs | REIT | Venues shut | -70%
24. Entertainment Companies (e.g. Live Nation) | Stock | No concerts | -60%
25. Fitness Center REITs (e.g. LA Fitness) | REIT | Gyms closed | -70%
26. Small Airline REITs | REIT | Airline property unused | -60%
27. Leisure Cruise REITs | REIT | Tourist absence | -80%
28. Comm/Cor. Tourism ETFs | ETF | Travel and events demand | -40%
29. Cinema Leases Firm (media) | Revenue stream | Ad revenue dropped | -60%
30. Shared Office Spaces (e.g. WeWork) | REIT | Occupancy plummeted | -70%
31. Parking REITs | REIT | Urban travel halted | -50%
32. Demand for Business Travel Stocks (e.g. Expedia) | Stock | Corporate travel cut | -60%
33. Major Sporting Event Stocks (e.g. WWE) | Stock/Fund | Events cancelled | -50%
34. Coin-Operated Laundry REITs | REIT | Apartment closures | -30%
35. Airline/Gas LNG utilities | Stock | Supply demand collapse | -40%
36. Industrial Landlords in CBDs | REIT | Revenue suffer | -50%
`;

const asianGood = `
1. U.S. Treasuries | Bond | Global flight to safety | +8-12%
2. Gold (XAU) | Commodity | Safe haven during crisis | +2%
3. Japanese Yen (JPY/USD) | Currency | Yen strengthened vs Asian FX | +10%
4. Swiss Franc (CHF/USD) | Currency | Safe haven flow | +9%
5. U.S. Dollar Index (DXY) | Currency basket | USD surged vs Asia FX | +15%
6. Short Asian Currencies | FX trade | Currency devaluation | +10-25%
7. U.S. Bank Stocks (e.g., BAC) | Stock | Relatively unaffected | +20%
8. German Bonds | Bond | Europe seen as stable | +7%
9. Commodity shorts (e.g., oil) | Derivative | Demand collapse | +20% short
10. Developed Market Stocks (U.S., EU) | Stocks | Lower impact areas | +5-10%
11. Export-oriented Chinese firms | Stock | Competitive devaluation advantage | +10%
12. IMF Bonds | Bond | Increased issuance + yield holds | +5%
13. Credit Default Swaps on Asia | Derivative | Huge payouts on default risk | +50%
14. Macro hedge funds (e.g., Soros fund) | Hedge fund | Profited from currency bets | +100%
15. U.S. Bank Stocks (early 1998) | Stock | Post-crash global rate cuts | +8%
16. U.S. Insurance Stocks | Stock | Benefited from interest rate stability | +5%
17. Short Thai Baht | FX | Major collapse | +50%
18. Short Indonesian Rupiah | FX | 80% collapse | +80%
19. Short Korean Won | FX | 50% collapse | +50%
20. U.S. Index Futures (put options) | Derivative | Protected against drops | +30%
21. Safe-haven REITs (U.S.) | REIT | Domestic shift | +5%
22. U.S. Exporters (post-1997) | Stock | Benefited from weak Asian rivals | +10%
23. S&P 500 Utilities | Stock | Defensive sector | +8%
24. Defensive ETFs (e.g., XLU) | ETF | Utilities/healthcare mix | +10%
25. Tobacco stocks (e.g., Philip Morris) | Stock | Low beta | +5%
26. Aviation stocks (e.g., Boeing) | Stock | Domestic is resilient | +7%
27. Defense companies | Stock | Low exposure to Asia | +5%
28. Discount retailers (e.g., Walmart) | Stock | Value shift | +6%
29. Sovereign Gold Bonds | Bond | Hedge against EM volatility | +10%
30. Long volatility trades (VIX, options) | Derivative | Volatility spike | +50%
31. Oil refiners (vs producers) | Stock | Lower input cost | +7%
32. High-grade municipal bonds (U.S.) | Bond | Stability & tax benefit | +5%
33. Agricultural ETFs | ETF | Food demand resilient | +6%
34. Safe-haven mutual funds | Fund | Capital preservation focus | +4%
35. Japan Export ETFs (post-crisis) | ETF | Yen rebound helped | +8%
36. Fiat-Family futures (non-usd pairs) | Derivative | Benefited from global reality | +5-8%
`;

const asianBad = `
1. Thai Baht | Currency | Collapsed from dollar peg | -40%
2. Indonesian Rupiah | Currency | Hyperinflation & crisis | -80%
3. Korean Won | Currency | Major devaluation | -50%
4. Philippine Peso | Currency | Peg pressure & outflows | -40%
5. Malaysian Ringgit | Currency | Peg dropped & capital flight | -45%
6. Thailand SET Index | Stock Index | Crash from bubble burst | -75%
7. Jakarta Composite Index | Stock Index | Recession & riots | -60%
8. KOSPI (Korea) | Stock Index | Liquidity crisis | -55%
9. KLSE Index (Malaysia) | Stock Index | Finance crisis | -50%
10. Asian Real Estate | Property | Massive overbuilding | -40%
11. Korean Chaebols (e.g., Daewoo) | Stock | Defaults & collapse | -90%
12. Southeast Asian Banks | Bank Stocks | Insolvency from bad loans | -50%
13. Thai Financial Institutions | Bank | Over-leveraged | -80%
14. Asian Mutual Funds | Fund | Value collapse | -50%
15. Asian Sovereign Bonds | Bond | Credit downgrade | -40%
16. Corporate Bonds (Asia) | Bond | Junked overnight | -60%
17. Asian Airlines | Stock | Demand plunge | -45%
18. Regional Airports & REITs | REIT | Traffic collapse | -40%
19. South Korean Won Bonds | Bond | FX risk & default fears | -50%
20. Consumer stocks in Asia | Stock | Recession in middle class | -40%
21. Industrial firms in Asia | Stock | Export cuts | -45%
22. Construction firms (Thailand, ID) | Stock | Bubble burst | -50%
23. Asian luxury retail | Stock | Discretionary pullback | -30%
24. Asian Tech Hardware | Stock | Capex halted | -40%
25. Commodity exports (e.g., palm oil) | Raw Commodity | Demand collapse | -35%
26. EM ETFs (Asia-heavy) | ETF | Exposure to crisis zone | -40%
27. Tourism stocks (e.g., Bali hotels) | Stock | Travel halted | -50%
28. Local pension funds | Fund | Domestic equity collapse | -30%
29. Credit Card Firms in Asia | Stock | Loan defaults surged | -55%
30. Asian Media & Telecom | Stock | Ad spend collapse | -40%
31. Commercial Real Estate (Seoul) | Property | Empty offices | -50%
32. Asian Infrastructure Funds | Fund | Projects halted | -45%
33. Regional Utilities (Asia) | Stock | Tariff caps & fx loans | -35%
34. Asian Auto Manufacturers | Stock | Sales collapsed | -60%
35. Heavy Machinery (Asia) | Stock | Construction stopped | -55%
36. Asian Conglomerates | Stock | Debt burdens | -60%
`;

const db = JSON.parse(fs.readFileSync('server/data/eras_db.json', 'utf8'));

db.push({
    id: "1997_asian_financial_crisis",
    name: "1997 Asian Financial Crisis",
    description: "Triggered by Thailand's currency collapse, spreading through Asia.",
    investments: extractCards(asianGood, asianBad)
});

db.push({
    id: "covid_19_pandemic_crash",
    name: "COVID-19 Pandemic Crash & Recovery (2020-2021)",
    description: "Historic market crash followed by rapid recovery.",
    investments: extractCards(covidGood, covidBad)
});

fs.writeFileSync('server/data/eras_db.json', JSON.stringify(db, null, 2));
console.log("eras_db.json successfully appended with 1997 and COVID-19 eras!");
