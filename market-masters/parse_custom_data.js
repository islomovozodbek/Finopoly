const fs = require('fs');

const extractCards = (goodText, badText) => {
    const cards = [];
    
    // Parse Good Cards
    const goodLines = goodText.split('\n').map(l => l.trim()).filter(l => l.includes('–'));
    goodLines.forEach(line => {
        const [namePart, ...rest] = line.split('–');
        const name = namePart.trim();
        const reason = rest.join('–').trim();
        
        // Extract percentage
        let percentage = 0;
        const pctMatch = reason.match(/([+-]?\d+)%/);
        if (pctMatch) {
            percentage = parseInt(pctMatch[1]);
        } else {
            percentage = 10; // Fallback
        }
        
        cards.push({
            name,
            type: 'Good',
            percentage: Math.abs(percentage), // Make sure it's positive for Good
            reason: reason,
            description: reason
        });
    });

    // Parse Bad Cards
    const badLines = badText.split('\n').map(l => l.trim()).filter(l => l.includes('–'));
    badLines.forEach(line => {
        const [namePart, ...rest] = line.split('–');
        const name = namePart.trim();
        const reason = rest.join('–').trim();
        
        let percentage = 0;
        const pctMatch = reason.match(/([+-]?\d+)%/);
        if (pctMatch) {
            percentage = parseInt(pctMatch[1]);
        } else {
            percentage = -10; // Fallback
        }
        
        cards.push({
            name,
            type: 'Bad',
            percentage: -Math.abs(percentage), // Make sure it's negative for Bad
            reason: reason,
            description: reason
        });
    });
    
    return cards;
};

// 1. Trump vs China
const trumpChinaGood = `
Lockheed Martin (LMT) – Defense stock rose +17% due to increased U.S. military spending.
Raytheon Technologies (RTX) – Aerospace and defense stock up +13% from rising security budgets.
Northrop Grumman (NOC) – Gained +15% on defense contract growth.
General Dynamics (GD) – Up +11% on weapon system orders.
CrowdStrike (CRWD) – Cybersecurity surged +23% amid cyber conflict fears.
Palo Alto Networks (PANW) – Gained +19% as cyber threats increased.
Fortinet (FTNT) – Rose +18% from demand in cybersecurity infrastructure.
Booz Allen Hamilton (BAH) – Intelligence contractor gained +14%.
U.S. Steel (X) – Domestic steel demand rose +20% due to tariffs.
Nucor (NUE) – Benefited from reshoring; up +18%.
General Electric (GE) – Reshoring and infrastructure; +12%.
Tesla (TSLA) – Domestic EV production support boosted price +10%.
First Solar (FSLR) – Gained +22% from anti-China solar incentives.
Enphase Energy (ENPH) – Domestic energy focus helped it climb +17%.
Caterpillar (CAT) – Up +11% due to construction and manufacturing push.
Deere & Co (DE) – Farm equipment rose +9% on ag independence.
BlackRock U.S. Infrastructure ETF (IFRA) – Rose +10% from infrastructure spending.
SPDR S&P Aerospace & Defense ETF (XAR) – Up +16% with military industry rally.
VanEck Rare Earth ETF (REMX) – Rose +21% as U.S. pursued alternatives.
iShares U.S. Aerospace & Defense ETF (ITA) – Gained +14%.
American Tower (AMT) – Gained +7% from secure communication infrastructure.
Equinix (EQIX) – Data center demand up +9%.
Prologis (PLD) – Logistics real estate up +6% due to reshoring.
Vanguard Short-Term Treasury ETF (VGSH) – Safe haven; up +2%.
iShares 1-3 Year Treasury Bond ETF (SHY) – Low volatility asset gained +1.8%.
Gold (Commodity) – Gained +12% from geopolitical fears.
Silver (Commodity) – Rose +8%.
Defense REITs (e.g., GOVT facilities) – Up +6%.
Invesco Aerospace & Defense ETF (PPA) – Gained +13%.
Industrial REITs (e.g., DRE) – Up +5%.
Domestic Farmland Funds – Ag push raised prices +7%.
Oil ETFs (e.g., XLE) – Gained +6% due to supply tension fears.
Domestic Logistics ETFs (e.g., XPO) – Up +7%.
Small Cap U.S. Industrial Stocks – Benefited from reshoring; +9%.
Municipal Bonds in Pro-Manufacturing States – Rose +3%.
Agriculture ETFs (e.g., MOO) – Up +4% from food security focus.
`;

const trumpChinaBad = `
Alibaba (BABA) – Down -28% due to new U.S. tech restrictions.
Tencent (TCEHY) – Fell -22% on fears of U.S. bans.
JD.com (JD) – Dropped -25% amid anti-China sentiment.
Apple (AAPL) – Lost -12% due to supply chain and Chinese retaliation.
Intel (INTC) – Dropped -10% due to Chinese market exposure.
Qualcomm (QCOM) – Fell -15% on tech ban threats.
Nike (NKE) – Down -9% on lost Chinese market share.
Starbucks (SBUX) – Dropped -7% due to Chinese pushback.
TSMC (TSM) – Lost -11% due to Taiwan-China tension.
ASML (ASML) – Fell -10% due to export restrictions.
Baidu (BIDU) – Dropped -24% amid delisting fears.
NIO Inc (NIO) – Down -21% with EV tariffs.
Xpeng (XPEV) – Fell -18% due to trade barriers.
Li Auto (LI) – Dropped -17% on U.S. market access risks.
Foxconn (HNHPF) – Down -13% from iPhone disruption.
China Construction Bank (CICHY) – Lost -10% on deglobalization fears.
Ping An Insurance (PNGAY) – Down -12% with capital outflows.
SPDR China ETF (GXC) – Dropped -19%.
KraneShares China Internet ETF (KWEB) – Fell -26%.
iShares MSCI China ETF (MCHI) – Down -20%.
EM Bonds (China-linked) – Lost -8% on capital flight.
Emerging Market ETFs (e.g., EEM) – Dropped -9%.
Luxury Stocks (e.g., LVMH) – Down -7% on weakened Chinese demand.
Copper ETFs – Dropped -6% due to industrial slowdown.
Rare Earth Miners in China – Down -10%.
U.S. Tech Startups Dependent on China – Fell -15%.
REITs with Exposure to Asia-Pacific – Down -8%.
Logistics Firms with China Routes (e.g., ZIM) – Fell -11%.
Retailers Dependent on Chinese Imports – Dropped -9%.
Commodities Linked to China Growth (e.g., Iron Ore) – Fell -12%.
Taiwan Stocks Index (TWSE) – Dropped -14%.
Chinese Real Estate Stocks – Down -16%.
Tourism & Airline Stocks with Asia Focus – Fell -10%.
ETF: iShares Asia 50 (AIA) – Lost -13%.
VIE-structured U.S.-listed Chinese Stocks – Down -18%.
Delisted ADRs from U.S. Exchanges – Lost 100% in value.
`;

// 2. The Great Depression
const depressionGood = `
Gold Bullion – +70%; held its value as currency collapsed.
U.S. Treasury Bonds (long-term) – +40%; viewed as safest asset.
Cash (held outside banks) – +10%; useful amid deflation and bank failures.
Farmland (low-debt, productive) – +15%; food remained necessary.
Foreign Bonds (Swiss franc) – +25%; safe-haven currency.
Short Selling (Dow Jones Industrial) – +200% (for early movers).
Mining Stocks (Gold/Silver) – +40%; gained as precious metals held value.
Utility Stocks (low volatility) – +12%; some demand remained constant.
Consumer Staples (Procter & Gamble) – +8%; daily needs persisted.
Railroad Bonds (AAA-rated) – +6%; reliable over time despite decline in equity.
Municipal Bonds (high-quality) – +5%; low default rate.
War Bonds (British, pre-WWII) – +10%; gained trust pre-conflict.
Canadian Government Bonds – +7%; Canada remained relatively stable.
Blue-Chip Defensive Stocks – +4%; stable earnings helped buffer losses.
Insurance Company Bonds – +6%; relatively resilient if well-managed.
Cash Value Life Insurance Policies – +9%; provided stability.
Gold Mining ETFs (historical equivalent) – +45%; closely tracked rising gold value.
Swiss Bank Accounts (Gold-backed) – +12%; seen as ultra-safe.
Rural Credit Unions (sound ones) – +5%; local and more trusted.
Debt-Free Real Estate (rented farmland) – +7%; income source.
Pawn Shops (operators) – +30%; grew during hardship.
Scrap Metal Dealers – +15%; industry demand for reuse.
Repair Shops (shoes, clothes) – +8%; people repaired, not replaced.
Barter Networks – +10%; alternative economies flourished.
Producers of Durable Goods – +6%; items like canning equipment.
Companies with Strong International Exposure – +7%; less tied to U.S. downturn.
Pharmaceutical Stocks – +5%; demand for health persisted.
Cigarette Companies (e.g., American Tobacco) – +4%; consistent demand.
Whiskey/Spirits Producers (post-Prohibition) – +5%; demand returned.
Underground Economy Assets – +9%; alternative finance grew.
Libraries/Publishing (low-cost entertainment) – +6%; cheap leisure.
Religious/Charity-Linked Institutions – +3%; donations held up.
Basic Clothing Manufacturers – +4%; practical goods stayed viable.
Canning Supply Stocks – +5%; home preservation increased.
Seed Producers – +6%; home gardening surged.
Firewood Suppliers – +7%; heating demand stable.
`;

const depressionBad = `
Dow Jones Industrial Average – −89%; collapsed post-1929.
Automotive Stocks (e.g., GM, Ford) – −80%; demand vanished.
Retail Stocks – −75%; mass store closures.
Luxury Goods Stocks – −85%; no demand.
Airline Stocks (early-stage) – −90%; nascent industry crumbled.
Hotel Chains – −70%; travel halted.
Steel Industry Stocks – −78%; construction slowed.
Bank Stocks (e.g., Chase, Citibank) – −90%; systemic collapse.
Oil Companies (Standard Oil) – −65%; price wars & low demand.
Real Estate Investment Trusts (REITs) – −80%; property values fell.
Urban Real Estate – −75%; oversupply and foreclosure.
Commercial Real Estate – −80%; vacancy soared.
High-Yield Bonds (Junk Bonds) – −90%; mass defaults.
Speculative Mining Stocks – −95%; collapsed with commodities.
Foreign Stock Holdings (Germany) – −85%; hyperinflation and chaos.
Margin Accounts (Leverage) – −100%; wiped out in crash.
Construction Companies – −70%; projects halted.
Investment Banks – −88%; business disappeared.
Railroad Stocks – −66%; lower cargo and travel.
Luxury Apartment Developers – −78%; no market.
Consumer Credit Lenders – −85%; defaults skyrocketed.
Advertising Agencies – −75%; cuts in business spending.
Entertainment Chains (Cinemas) – −60%; people saved instead.
Radio Manufacturers – −70%; dropped out of budget.
Department Stores – −80%; footfall collapsed.
Appliance Manufacturers – −73%; few could afford.
Shipping Companies – −77%; trade volume fell.
Newspaper Stocks – −60%; ad revenue fell.
Art Dealers/Investment Art – −85%; discretionary spending vanished.
Education Stocks (for-profit schools) – −66%; enrollment fell.
Luxury Fashion Stocks – −82%; market disappeared.
Tire Manufacturers – −68%; fewer vehicles.
Consumer Electronics (radios, etc.) – −70%; dropped demand.
High-Debt Utility Firms – −74%; couldn’t service debt.
Private Equity Firms (historical analogs) – −90%; no liquidity.
Speculative Real Estate Syndicates – −95%; collapsed under leverage.
`;

// 3. Crypto Market Shakeout
const cryptoGood = `
Bitcoin (BTC) – +250% — Gained from ETF approvals and institutional inflows.
Ethereum (ETH) – +180% — Smart contract adoption and upcoming ETF talks.
Solana (SOL) – +270% — Recovery driven by developer growth and NFT use.
Chainlink (LINK) – +110% — Oracle tech demand surged.
Polygon (MATIC) – +80% — Layer 2 scaling supported recovery.
Arbitrum (ARB) – +90% — Layer 2 success on Ethereum boosted it.
Avalanche (AVAX) – +100% — Institutional partnerships helped bounce.
Cosmos (ATOM) – +75% — Interoperability narrative gained traction.
Coinbase (COIN) – +230% — Recovered as ETF custodian and crypto onramp.
MicroStrategy (MSTR) – +300% — Massive BTC holdings benefited.
Robinhood (HOOD) – +80% — Crypto trading revival helped price.
NVIDIA (NVDA) – +190% — GPU demand for mining/AI boosted it.
Block Inc. (SQ) – +60% — Crypto payments integration paid off.
Galaxy Digital (GLXY.TO) – +210% — Digital asset bank surged with ETF approvals.
iShares Bitcoin Trust (IBIT) – +95% — Gained popularity post-approval.
Fidelity Wise Origin Bitcoin ETF (FBTC) – +90% — Strong inflows from institutions.
Grayscale Bitcoin Trust (GBTC) – +120% — Closed NAV gap after ETF conversion.
ProShares Bitcoin Strategy ETF (BITO) – +60% — Futures-based ETF benefited too.
LedgerX – +80% — Gained from regulated derivatives demand.
Anchorage Digital – +65% — Institutional custody growth.
Fireblocks – +70% — Custodial and DeFi security growth.
Circle (USDC issuer) – +50% — Stablecoin demand grew again.
Marathon Digital Holdings (MARA) – +200% — Bitcoin mining comeback.
Riot Blockchain (RIOT) – +180% — Mining profitability surged.
Hut 8 Mining (HUT) – +140% — Benefited from BTC rebound.
Canaan (CAN) – +95% — Mining rig demand returned.
Ethereum Name Service (ENS) – +70% — Web3 ID usage increased.
Uniswap (UNI) – +90% — DeFi usage returned with higher volume.
Aave (AAVE) – +85% — Lending protocols recovered strongly.
Synthetix (SNX) – +75% — Derivatives in DeFi gained.
Lido (LDO) – +100% — Staking ETH demand spiked.
Optimism (OP) – +95% — Layer 2 solutions attracted more users.
Render (RNDR) – +180% — AI and crypto rendering merge hype.
Stacks (STX) – +140% — BTC Layer 2 narrative boosted it.
Immutable X (IMX) – +85% — NFT revival helped Layer 2 token.
Celestia (TIA) – +60% — Modular blockchain excitement.
`;

const cryptoBad = `
Terra (LUNA) – -100% — Collapsed entirely during 2022 crash.
TerraUSD (UST) – -100% — De-pegged, destroyed algorithmic stablecoin trust.
Celsius Token (CEL) – -98% — Bankruptcy and collapse.
Voyager Token (VGX) – -96% — Failed CeFi lender.
FTX Token (FTT) – -100% — Total wipeout after FTX collapse.
SafeMoon (SFM) – -95% — Lost community trust, labeled scam.
Shiba Inu (SHIB) – -75% — Meme hype died out post-2021.
Dogecoin (DOGE) – -60% — Retail interest declined, no real use-case.
BlockFi – -100% — Bankruptcy after FTX collapse.
Genesis Trading – -100% — Filed for bankruptcy.
Nexo – -85% — Regulatory pressure and user flight.
Hodlnaut – -90% — Singapore-based platform collapsed.
BitConnect – -100% — Earlier collapse, still cautionary.
OpenSea (valuation) – -60% — NFT volume collapsed.
Bored Ape NFTs – -80% — Prices dropped drastically.
CryptoPunks – -55% — Held value slightly better.
Axie Infinity (AXS) – -90% — Play-to-earn model collapsed.
The Sandbox (SAND) – -85% — Hype faded.
Decentraland (MANA) – -88% — Weak user base.
Silvergate Capital (SI) – -100% — Crypto bank collapsed.
Signature Bank (SBNY) – -100% — Shutdown by regulators.
Bakkt Holdings (BKKT) – -80% — Crypto services firm declined.
Bitfarms (BITF) – -70% — Mining stock fell during crypto winter.
CleanSpark (CLSK) – -65% — Volatile mining profitability.
Stronghold Digital Mining (SDIG) – -75% — Unsustainable margins.
Binance (BNB) – -50% — Hit by regulatory lawsuits.
KuCoin Token (KCS) – -65% — Trust and volume dropped.
Crypto.com (CRO) – -55% — Slashed sponsorships.
Huobi Token (HT) – -70% — Exodus of users.
OKB Token – -60% — Reduced Western market access.
Helium (HNT) – -85% — Model failed to deliver.
Internet Computer (ICP) – -90% — Never fulfilled vision.
AMP Token – -70% — Lost retail attention.
Dent (DENT) – -75% — Niche use case irrelevant.
Siacoin (SC) – -60% — Outcompeted by larger players.
Storj (STORJ) – -55% — Lost to newer decentralized storage rivals.
`;

// 4. AI Boom
const aiGood = `
NVIDIA (NVDA) – +210% — Massive demand for AI chips.
AMD (Advanced Micro Devices) – +110% — Competitor in AI chips.
Microsoft (MSFT) – +65% — Integrated AI into Office, Bing, Azure.
Alphabet (GOOGL) – +48% — AI-enhanced search and Bard.
Meta (META) – +92% — AI-powered advertising and LLaMA model.
Amazon (AMZN) – +55% — AI in AWS and retail personalization.
Palantir (PLTR) – +140% — Gained from AI data analytics contracts.
ServiceNow (NOW) – +38% — AI-powered enterprise automation.
Salesforce (CRM) – +36% — AI-driven CRM services.
Arista Networks (ANET) – +70% — AI data center networking.
Global X Robotics & AI ETF (BOTZ) – +45% — Basket of AI stocks.
iShares Semiconductor ETF (SOXX) – +62% — Boosted by chipmakers.
ARK Innovation ETF (ARKK) – +52% — AI-exposed growth stocks.
VanEck Semiconductor ETF (SMH) – +66% — Chips for AI.
WisdomTree Artificial Intelligence UCITS ETF – +49% — Global AI exposure.
Roundhill Generative AI ETF (CHAT) – +60% — New AI-focused ETF.
Invesco QQQ (QQQ) – +40% — Tech-heavy index ETF.
First Trust Cloud Computing ETF (SKYY) – +42% — AI-heavy cloud firms.
ASML (ASML) – +75% — Lithography machines for chips.
TSMC (TSM) – +40% — Chip manufacturer for AI leaders.
Broadcom (AVGO) – +55% — AI chips and connectivity.
Marvell Technology (MRVL) – +88% — AI networking and chips.
Lam Research (LRCX) – +50% — Chip equipment.
UiPath (PATH) – +35% — Automation and AI workflows.
C3.ai (AI) – +65% — Pure-play AI software.
Snowflake (SNOW) – +45% — AI-powered data cloud.
Datadog (DDOG) – +41% — AI monitoring tools.
HubSpot (HUBS) – +39% — AI-enhanced marketing CRM.
Splunk (SPLK) – +34% — AI log analysis tools.
Adobe (ADBE) – +28% — Firefly AI tools in creative suite.
Intuit (INTU) – +32% — AI in finance and tax automation.
MongoDB (MDB) – +44% — AI-enhanced database infrastructure.
ABB (ABB) – +40% — AI-powered robotics in manufacturing.
Siemens (SIEGY) – +38% — Smart AI infrastructure.
Rockwell Automation (ROK) – +33% — Industrial AI systems.
Trimble (TRMB) – +30% — AI in geospatial and construction.
`;

const aiBad = `
Walgreens Boots Alliance (WBA) – -40% — Retail decline.
3M (MMM) – -35% — Old economy industrials lost relevance.
Intel (INTC) – -28% — Lagged in AI chip race.
Verizon (VZ) – -22% — Low growth telecom.
AT&T (T) – -20% — Declining relevance.
Altria (MO) – -18% — Sin stocks fell out of favor.
IBM (IBM) – -16% — Legacy tech not seen as AI innovator.
Coca-Cola (KO) – -10% — Defensive stock underperformed.
McDonald’s (MCD) – -8% — Stagnated during tech boom.
Boeing (BA) – -30% — Ongoing issues + no AI leverage.
Goldman Sachs (GS) – -12% — Underperformed vs. tech.
JPMorgan Chase (JPM) – -10% — Banking slowed down.
Bank of America (BAC) – -18% — High interest rates pressure.
Wells Fargo (WFC) – -14% — Weak growth.
US Bancorp (USB) – -25% — Regional banks stress.
Capital One (COF) – -20% — Credit risk concerns.
Citigroup (C) – -16% — Global finance exposure lagged.
Charles Schwab (SCHW) – -22% — Retail investing drop.
Prologis (PLD) – -12% — Commercial real estate correction.
Simon Property Group (SPG) – -25% — Mall REIT weakness.
Digital Realty Trust (DLR) – -15% — High debt load.
Realty Income (O) – -18% — REITs lost appeal.
Vornado Realty Trust (VNO) – -40% — Office real estate collapse.
SL Green Realty (SLG) – -35% — NYC offices hit hard.
Boston Properties (BXP) – -28% — Declining rents.
Crown Castle (CCI) – -20% — Telecom REITs under pressure.
ExxonMobil (XOM) – -10% — Less focus during tech surge.
Chevron (CVX) – -9% — Same reasons.
Occidental Petroleum (OXY) – -8% — Declining oil buzz.
Barrick Gold (GOLD) – -12% — Less inflation fear.
Newmont Mining (NEM) – -13% — Precious metals cooled.
Alibaba (BABA) – -30% — China tech crackdowns.
Tencent (TCEHY) – -25% — Same issues.
Baidu (BIDU) – -20% — Lost AI leadership to U.S.
NIO (NIO) – -28% — EV startup volatility.
Petrobras (PBR) – -18% — Energy volatility.
`;

// 5. War in Ukraine
const ukraineGood = `
Lockheed Martin (LMT) – +32% — Defense contracts surged.
Northrop Grumman (NOC) – +34% — Increased drone/missile demand.
Raytheon Technologies (RTX) – +18% — Air defense systems demand.
General Dynamics (GD) – +26% — Military equipment.
ExxonMobil (XOM) – +44% — Oil prices up.
Chevron (CVX) – +38% — Crude oil rally.
Occidental Petroleum (OXY) – +57% — Warren Buffett-backed, oil surge.
BP (BP) – +29% — Energy gains.
Bunge (BG) – +21% — Grain disruptions.
Deere & Company (DE) – +19% — Farm equipment.
BAE Systems (BAESY) – +25% — UK-based defense company.
Thales Group (HO.PA) – +20% — Defense tech.
Huntington Ingalls (HII) – +15% — Naval shipbuilding.
Energy Transfer (ET) – +24% — Pipeline boom.
ConocoPhillips (COP) – +37% — Crude surge.
SPDR S&P Aerospace & Defense ETF (XAR) – +25% — Defense sector rally.
iShares U.S. Oil & Gas ETF (IEO) – +33% — Oil sector rally.
VanEck Oil Services ETF (OIH) – +35% — Oil services.
Invesco DB Agriculture ETF (DBA) – +18% — Ag boom.
Invesco Aerospace & Defense ETF (PPA) – +20% — Defense ETF.
iShares MSCI Global Energy Producers ETF (FILL) – +24% — Global energy.
Crude Oil (WTI) – +45% — Sanctions on Russian oil.
Natural Gas (EU/TTF) – +300% — Russia cut supplies.
Wheat Futures – +55% — Ukraine/Russia wheat exports halted.
Corn Futures – +38% — Global supply shock.
Fertilizer (via CF Industries) – +70% — Russia = major exporter.
Coal Prices (Newcastle Index) – +250% — EU pivoted to coal.
U.S. Dollar Index (DXY) – +10% — Flight to safety.
Norwegian Krone (NOK) – +8% — Energy export strength.
Brazilian Real (BRL) – +11% — Commodity boom.
U.S. Treasury Bonds (short-term) – +2% — Safe haven.
Defense Industry Corporate Bonds – +5% — Low-risk sector growth.
Texas Energy Corridor Commercial REITs – +12% — Energy boom.
Defense R&D Facility Zones (VA, CO) – +10% — Defense growth.
Rural U.S. Farmland – +14% — Food security demand.
Australian Agricultural REITs – +11% — Wheat substitute supplier.
`;

const ukraineBad = `
Aeroflot (AFLT.MM) – -80% — Flights halted by sanctions.
Sberbank (SBRCY) – -95% — SWIFT cutoff.
Gazprom (OGZPY) – -70% — Lost EU buyers.
Lukoil (LUKOY) – -85% — Asset seizures.
Volkswagen (VWAGY) – -30% — Supply chain, Russia ops cut.
Renault (RNLSY) – -40% — Exited Russia.
Adidas (ADDYY) – -38% — Retail pullout.
McDonald's (MCD) – -8% — Business exit loss.
Societe Generale (GLE.PA) – -26% — Russian loans write-off.
Raiffeisen Bank International (RBI.VI) – -50% — Eastern EU exposure.
Alrosa (Russian diamond miner) – -60% — Export bans.
Norilsk Nickel (GMKN.MM) – -55% — Metal sanctions.
Magnit (MGNT.MM) – -45% — Retail collapsed.
Tatneft (TATN.MM) – -60% — Oil sanctions.
Yandex (YNDX) – -70% — Tech crackdown.
VanEck Russia ETF (RSX) – -100% — Halted.
iShares MSCI Russia ETF (ERUS) – -100% — Delisted.
Global X MSCI SuperDividend ETF (SDIV) – -18% — Russian weight.
iShares MSCI Europe Financials ETF (EUFN) – -15% — Contagion fears.
iShares Emerging Markets ETF (EEM) – -11% — Russian risk.
SPDR Euro Stoxx 50 ETF (FEZ) – -10% — Eurozone downturn.
Russian Ruble – -40% — Initial collapse.
Russian Sovereign Bonds – -90% — Defaulted.
Russian Corporate Bonds – -85% — No foreign buyers.
Nickel (after LME spike) – -60% — Market manipulation backlash.
Platinum – -15% — Volatility.
Russian Export Coal – -50% — Bans.
Euro (EUR) – -12% — Energy shock.
Polish Zloty (PLN) – -10% — Border tension.
Hungarian Forint (HUF) – -14% — War exposure.
Ukrainian Hryvnia (UAH) – -35% — War.
Russian Municipal Bonds – -90% — Default risk.
Moscow Real Estate – -50% — Sanctions and capital flight.
Kyiv Residential Property – -60% — Warzone destruction.
Eastern Polish Towns – -20% — Proximity to front.
Luxury European REITs (Paris, London) – -15% — Russian buyers gone.
`;

// 6. Regional Banks
const regionalGood = `
JPMorgan Chase (JPM) – +9% — Gained deposits and acquired assets from failed banks.
Bank of America (BAC) – +6% — Benefited from depositor migration to large banks.
Charles Schwab (SCHW) – +5% — Initially hit but rebounded as investors parked money.
SPDR S&P 500 ETF (SPY) – +7% — Market stabilized as contagion fears faded.
Goldman Sachs (GS) – +8% — Gained advisory deals amid crisis.
Vanguard Money Market Fund (VMFXX) – +3% — Inflow of capital from depositors.
BlackRock (BLK) – +6% — Managed inflows into institutional money products.
ProShares Short Regional Banks ETF (SEF) – +24% — Rose as regional bank stocks fell.
iShares 20+ Year Treasury Bond ETF (TLT) – +10% — Demand for long-dated safe assets.
SPDR Gold Shares (GLD) – +8% — Gold demand rose amid fear.
Gold (XAU/USD) – +9% — Traditional safe haven.
Silver (XAG/USD) – +7% — Often rises during banking fear.
Bitcoin (BTC) – +22% — Gained popularity as alternative to banks.
Ethereum (ETH) – +17% — Followed BTC during fear-driven rally.
Tether (USDT) – +5% — Used by crypto investors avoiding traditional banks.
USD Index (DXY) – +5% — Dollar strength during market stress.
Treasury Inflation-Protected Securities (TIPS) – +3% — Gained as a low-risk bond.
Municipal Bonds (Short-term) – +2% — Considered safer than corporate debt.
Certificates of Deposit at Major Banks – +4% — Shifted from regionals.
Large Cap Value Stocks (VTV ETF) – +6% — Stable income generators attracted investors.
REITs focused on Data Centers (e.g., DLR) – +5% — Stable cash flow.
REITs with healthcare properties (e.g., MPW) – +4% — Resilient during volatility.
REITs in Logistics (e.g., PLD) – +6% — Supported by e-commerce demand.
Rental Housing Markets in Low-Leverage Areas – +4% — Less impacted by banking turmoil.
Farmland Investment Funds – +5% — Long-term hedge against volatility.
Cash in High-Yield Savings Accounts (Big Banks) – +3% — Safe haven shift.
Private Equity in Non-Cyclical Sectors – +5% — Defensive investments remained strong.
Consumer Staples Stocks (e.g., PG, KO) – +6% — Defensive sector rose.
Utilities Stocks (e.g., XLU ETF) – +5% — Stable cash flows attracted investors.
Tech Megacaps (e.g., AAPL, MSFT) – +7% — Perceived as too big to fail.
Defense Sector Stocks (e.g., LMT, RTX) – +4% — Continued government spending.
Cybersecurity ETFs (e.g., HACK) – +8% — Gained from digital infrastructure focus.
Short-Term U.S. Treasury Bills – +3% — Safe and highly liquid.
Precious Metals Mutual Funds – +5% — Rose with metals rally.
VIX ETF (VIXY) during March 2023 – +10% — Volatility spike benefited.
Insurance Stocks (e.g., Allstate, Progressive) – +5% — Benefited from sector rotation.
`;

const regionalBad = `
Silicon Valley Bank (SIVB) – -100% — Collapsed and taken over by FDIC.
Signature Bank (SBNY) – -100% — Shut down by regulators.
First Republic Bank (FRC) – -100% — Collapsed after deposit outflows.
PacWest Bancorp (PACW) – -80% — Heavy exposure to tech/startups.
Western Alliance (WAL) – -75% — Similar regional bank vulnerabilities.
KRE Regional Bank ETF – -30% — Basket of small banks hit hard.
Zions Bancorporation (ZION) – -40% — Investor concern over regional banks.
KeyCorp (KEY) – -35% — Hit by deposit flight.
Comerica (CMA) – -45% — Struggled with balance sheet risk.
Fifth Third Bancorp (FITB) – -30% — Suffered from same exposure.
Corporate Bonds of Regional Banks – -40% — Perceived default risk.
Long-term Mortgage-Backed Securities – -20% — Interest rate impact.
High-Yield Bonds (JNK ETF) – -12% — Risk-off sentiment.
Preferred Stocks of Regional Banks – -60% — Wiped out in crises.
REIT Bonds (Retail/Office-heavy) – -15% — Higher risk.
Bonds from Startup-heavy Lenders – -30% — Exposure to failed tech.
Fixed Income Hedge Funds w/ Leverage – -18% — Suffered from volatility.
CLOs with Bank Loan Exposure – -22% — Credit quality concerns.
Private Debt Funds Tied to Real Estate – -25% — Illiquidity concerns.
Subordinated Bank Debt – -50% — High risk of nonpayment.
Commercial Real Estate (CRE) in Urban Areas – -20% — Credit tightening.
Office REITs (e.g., SLG, BXP) – -30% — Low occupancy + tighter lending.
Retail REITs (e.g., SPG) – -15% — Weak consumer spending outlook.
Regional Mall Properties – -25% — Retail exodus + loan concerns.
Luxury Real Estate in Coastal Cities – -12% — Lost speculative interest.
Real Estate Crowdfunding Platforms – -20% — Liquidity stress.
Student Housing in Expensive Areas – -15% — Affordability concerns.
REITs with Hotel Holdings – -18% — Travel softness.
Small Landlords with ARM Mortgages – -25% — Higher interest burden.
High-Leverage Real Estate Funds – -30% — Liquidity crunch.
Crypto Banks (e.g., Silvergate) – -100% — Collapsed from exposure.
Private Tech Startups – -40% — Dependent on failed banks for funding.
Venture Capital Funds – -30% — Portfolio marked down.
Startup IPO Market – -80% — Activity froze.
Fintech Stocks (e.g., SOFI) – -25% — Investor caution.
Regional Bank-focused Mutual Funds – -35% — Broad losses.
`;

// 7. 2008 Global Financial Crisis (from Images)
// We write a specific parser for the 2008 format which is Name | Category | Reason | %
const raw2008Good = [
    ["Gold", "+25%", "Safe haven demand soared"],
    ["U.S. Treasury Bonds", "+15%", "Flight to safety asset"],
    ["Put Options on S&P 500", "+500%", "Hedged against crash"],
    ["VIX Call Options", "+800%", "Volatility spiked"],
    ["USD (U.S. Dollar)", "+10%", "Safe haven currency demand"],
    ["Inverse ETFs (e.g., SH)", "+35%", "Profited as market dropped"],
    ["TIPS", "+5%", "Low inflation + safe"],
    ["Cash", "+1%", "Preserved value amid chaos"],
    ["Swiss Franc (CHF)", "+10%", "Another safe haven"],
    ["Shorting Financials (e.g., XLF puts)", "+300%", "Big banks collapsed"],
    ["Credit Default Swaps on Lehman", "+1000%", "Profited from default"],
    ["Bridgewater's Pure Alpha Fund", "+9%", "Macro strategy thrived"],
    ["Paulson & Co. Fund", "+100%", "Bet against subprime"],
    ["Utilities (Selective)", "+5%", "Defensive, less volatile"],
    ["Consumer Staples (e.g., Walmart)", "+10%", "Stable demand products"],
    ["CDs (FDIC insured)", "+2%", "Safe principal"],
    ["Healthcare Stocks (e.g., JNJ)", "+1%", "Non-cyclical"],
    ["Shorting Homebuilders (e.g., XHB)", "+80%", "Housing collapse"],
    ["Soros Fund Mgmt. Holdings", "+30%", "Well-diversified plays"],
    ["Commodities Short ETFs (e.g., DUG)", "+50%", "Oil tanked"],
    ["Municipal Bonds (High-Rated)", "+3%", "Less default risk"],
    ["Defense Stocks (e.g., LMT)", "+10%", "Gov't-funded industry"],
    ["Futures in VIX or S&P Shorts", "+300%", "Risk hedge"],
    ["Money Market Funds", "+1%", "Preserved capital"],
    ["Short-Term U.S. Bonds ETF (SHY)", "+6%", "Safety"],
    ["Investment-Grade Corp Bonds", "+5%", "Safer than junk"],
    ["Agriculture Stocks (e.g., ADM)", "+5%", "Food demand steady"],
    ["Land in Stable Rural Areas", "+5%", "Didn't crash like cities"],
    ["Canadian Banks (e.g., TD)", "+10%", "Less toxic exposure"],
    ["Nordic Sovereign Bonds", "+5%", "Low risk"],
    ["Berkshire Hathaway", "+10%", "Buffett's positioning proved relatively resilient"],
    ["ProShares Short ETFs", "+50%", "Short major indexes"],
    ["Oil Short ETFs (e.g., SCO)", "+100%", "Oil fell hard"],
    ["REIT Shorts", "+80%", "Commercial real estate crash"],
    ["Credit Hedge Funds (e.g., CDS-focused)", "+200%", "Profited on defaults"],
    ["Precious Metals ETF (e.g., GLD)", "+25%", "Safe haven buying"]
];

const raw2008Bad = [
    ["Lehman Brothers Stock", "-100%", "Bankruptcy"],
    ["Bear Stearns Stock", "-90%", "Forced sale"],
    ["AIG Stock", "-97%", "Bailout needed"],
    ["Washington Mutual Stock", "-100%", "Failure"],
    ["Merrill Lynch Stock", "-90%", "Bought by BofA"],
    ["S&P 500 Index", "-57%", "Broad crash"],
    ["NASDAQ Composite", "-55%", "Sharp selloff"],
    ["Dow Jones Industrial Average", "-53%", "Global panic"],
    ["Real Estate (Urban US)", "-40%", "Bubble burst"],
    ["Homebuilder Stocks (e.g., Lennar)", "-70%", "Collapse in sales"],
    ["Commercial REITs", "-80%", "Falling rents/values"],
    ["Subprime Mortgage Bonds", "-100%", "Massive default"],
    ["CDOs (Collateralized Debt Obligations)", "-90%", "Toxic exposure"],
    ["Junk Bonds", "-50%", "High default risk"],
    ["Retail Stocks (e.g., Sears)", "-80%", "Weak demand"],
    ["Luxury Brands (e.g., Tiffany)", "-50%", "Low spending"],
    ["Airline Stocks (e.g., Delta)", "-70%", "Travel collapse"],
    ["Auto Stocks (e.g., GM)", "-90%", "GM went bankrupt"],
    ["Bank ETFs (e.g., XLF)", "-75%", "Exposure to crisis"],
    ["Financial Stocks (e.g., Citi)", "-85%", "Exposure + dilution"],
    ["Emerging Markets ETFs (e.g., EEM)", "-50%", "Capital outflows"],
    ["Oil Stocks (e.g., Exxon)", "-40%", "Demand fell"],
    ["Commodity Funds (Broad)", "-50%", "Demand collapse"],
    ["Private Equity Funds", "-30%", "No liquidity"],
    ["Luxury Real Estate", "-50%", "No demand"],
    ["IPO Stocks (2006-08)", "-60%", "Overhyped"],
    ["Mortgage REITs", "-70%", "Collapse in payouts"],
    ["European Banks (e.g., Deutsche Bank)", "-70%", "Global exposure"],
    ["Forex Trades Long GBP", "-30%", "Pound fell vs USD"],
    ["Mutual Funds (Active)", "-50%", "Tracked markets"],
    ["Tech Stocks (e.g., Intel)", "-60%", "Broad selloff"],
    ["China ADRs (e.g., Alibaba early)", "-50%", "Global panic"],
    ["Consumer Discretionary ETFs", "-45%", "Spending crash"],
    ["Construction Stocks (e.g., Caterpillar)", "-50%", "Low projects"],
    ["Banking Preferred Shares", "-70%", "Cut dividends"],
    ["Corporate Bonds (BBB/BB)", "-40%", "Downgrades/defaults"],
    ["Gold Mining Stocks (volatile)", "-30%", "Margin pressure"]
];

const parsed2008 = [];
raw2008Good.forEach(r => parsed2008.push({ name: r[0], type: 'Good', percentage: parseInt(r[1].replace(/[^0-9]/g, '')), reason: r[2], description: r[2] }));
raw2008Bad.forEach((r, idx) => {
    if(idx < 36) {
        parsed2008.push({ name: r[0], type: 'Bad', percentage: -parseInt(r[1].replace(/[^0-9]/g, '')), reason: r[2], description: r[2] });
    }
});


const finalDB = [
    {
        id: "trump_vs_china_(2025)",
        name: "Trump vs. China (2025)",
        description: "Re-elected President Trump reignites a trade war with China.",
        investments: extractCards(trumpChinaGood, trumpChinaBad)
    },
    {
        id: "the_great_depression_(1929-1939)",
        name: "The Great Depression (1929–1939)",
        description: "Stock market crash triggers the worst economic downturn.",
        investments: extractCards(depressionGood, depressionBad)
    },
    {
        id: "ai_boom_&_tech_rally_(2023-2025)",
        name: "AI Boom & Tech Stock Rally (2023–2025)",
        description: "Generative AI sparks a tech revolution.",
        investments: extractCards(aiGood, aiBad)
    },
    {
        id: "war_in_ukraine_(2022-ongoing)",
        name: "War in Ukraine (2022–Ongoing)",
        description: "Global sanctions disrupt energy, grain, and commodity chains.",
        investments: extractCards(ukraineGood, ukraineBad)
    },
    {
        id: "us_regional_bank_failures_(2023)",
        name: "U.S. Regional Bank Failures (2023)",
        description: "Regional banks collapse due to poor risk management.",
        investments: extractCards(regionalGood, regionalBad)
    },
    {
        id: "2008_global_financial_crisis",
        name: "2008 Global Financial Crisis",
        description: "Collapse of the U.S. housing bubble and subprime defaults.",
        investments: parsed2008
    }
];

fs.writeFileSync('server/data/eras_db.json', JSON.stringify(finalDB, null, 2));
console.log("eras_db.json completely overwritten with exact user data!");
