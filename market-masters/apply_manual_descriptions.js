const fs = require('fs');

const OVERRIDES = {
  // Final 10 remaining
  "McDonald's (MCD)": "McDonald's is the world's largest fast food chain with over 40,000 locations worldwide, serving billions of customers every day.",
  "Bitcoin (BTC)": "Bitcoin (BTC) is the world's first and largest cryptocurrency, a decentralized digital currency operating on the blockchain.",
  "Ethereum (ETH)": "Ethereum (ETH) is a decentralized blockchain platform and the world's second-largest cryptocurrency, enabling smart contracts and DeFi apps.",
  "Tether (USDT)": "Tether (USDT) is the most widely used stablecoin, a cryptocurrency pegged 1:1 to the US Dollar used to move money between exchanges.",
  "Office REITs (e.g., SLG, BXP)": "Real estate investment trusts specializing in commercial office buildings, facing structural headwinds from remote work trends.",
  "Retail REITs (e.g., SPG)": "Real estate investment trusts owning shopping centers and malls, led by Simon Property Group, navigating the e-commerce shift.",
  "Utilities (Selective)": "Regulated public utility companies providing electricity, gas, and water — defensive investments known for steady dividends.",
  "CDs (FDIC insured)": "Certificates of Deposit (CDs) are time-deposit savings products at banks offering fixed interest, insured by the US government up to $250,000.",
  "Healthcare Stocks (e.g., JNJ)": "Stocks in healthcare companies like Johnson & Johnson, producing pharmaceuticals, medical devices, and consumer health products.",
  "Forex Trades Long GBP": "Currency trades betting that the British Pound (GBP) will appreciate in value against other major currencies.",

  // ETFs & Funds
  'VanEck Rare Earth ETF': 'An ETF tracking companies involved in mining and producing rare earth elements used in tech and defense.',
  'WisdomTree Artificial Intelligence UCITS ETF': 'An ETF tracking global companies leading the development and deployment of artificial intelligence.',
  'Roundhill Generative AI ETF': 'An ETF focused on companies building and monetizing generative AI technology like ChatGPT and image generation.',
  'iShares U.S. Oil & Gas ETF': 'An ETF tracking US oil and gas exploration and production companies.',
  'VanEck Oil Services ETF': 'An ETF tracking companies that provide equipment and services to the global oil and gas drilling industry.',
  'Invesco DB Agriculture ETF': 'An ETF tracking the performance of a basket of agricultural commodities like corn, wheat, and soybeans.',
  'iShares MSCI Global Energy Producers ETF': 'An ETF giving exposure to global oil, gas, and coal producers across multiple countries.',
  'SPDR S&P 500 ETF': 'The most widely traded ETF in the world, tracking the S&P 500 index of 500 large US companies.',
  'Vanguard Money Market Fund': 'A low-risk Vanguard fund investing in short-term government securities and cash equivalents.',
  'ProShares Short Regional Banks ETF': 'An inverse ETF designed to profit when regional bank stocks fall in value.',
  'iShares 20+ Year Treasury Bond ETF': 'An ETF tracking long-term US government bonds, used by investors seeking safety and income.',
  'SPDR Gold Shares': 'The world\'s largest gold-backed ETF, tracking the price of physical gold bullion.',
  'Large Cap Value Stocks': 'A category of ETF investing in large, established US companies trading below their intrinsic value.',
  'Consumer Staples Stocks': 'Stocks in companies that produce essential everyday goods like food, beverages, and household products (e.g., P&G, Coca-Cola).',
  'Utilities Stocks': 'Stocks in regulated electric, gas, and water utility companies known for stable dividends.',
  'Tech Megacaps': 'Shares of the largest technology companies by market cap (e.g., Apple, Microsoft, Nvidia, Google).',
  'Defense Sector Stocks': 'Stocks in aerospace and defense contractors that supply military equipment and technology (e.g., Lockheed Martin, Raytheon).',
  'Cybersecurity ETFs': 'ETFs tracking companies that provide cybersecurity software, threat detection, and network protection.',
  'Precious Metals Mutual Funds': 'Mutual funds investing in gold, silver, and other precious metals and mining companies.',
  'VanEck Russia ETF': 'An ETF that tracked Russian equities, suspended and closed after Western sanctions following the 2022 Ukraine invasion.',
  'iShares MSCI Russia ETF': 'An iShares ETF tracking Russian stocks, shut down due to sanctions after the Ukraine war.',
  'Global X MSCI SuperDividend ETF': 'An ETF targeting 100 of the highest dividend-yielding equities from around the world.',
  'iShares MSCI Europe Financials ETF': 'An ETF tracking European banking and financial sector companies.',
  'iShares Emerging Markets ETF': 'One of the most popular ETFs for gaining exposure to stocks across emerging market economies like China, India, and Brazil.',
  'SPDR Euro Stoxx 50 ETF': 'An ETF tracking the 50 largest blue-chip companies in the Eurozone.',
  'KRE Regional Bank ETF': 'An ETF tracking US regional and community banking stocks.',
  'ProShares Short ETFs': 'Inverse ETFs designed to profit from a decline in the underlying index or asset.',
  'Oil Short ETFs': 'Inverse ETFs designed to profit when crude oil prices decline.',
  'Precious Metals ETF': 'An ETF holding gold, silver, or related mining company stocks.',
  'VIX ETF': 'An ETF tracking the CBOE Volatility Index (VIX), which measures expected market turbulence. Rises sharply during market crashes.',
  'Inverse ETFs': 'Funds designed to return the opposite performance of a given index — they rise when the market falls.',

  // Stocks
  'Intuit': 'Intuit is an American financial software company making TurboTax, QuickBooks, and Credit Karma.',
  'MongoDB': 'MongoDB is a leading US technology company providing a popular open-source NoSQL document database used by developers worldwide.',
  'ABB': 'ABB is a Swedish-Swiss multinational corporation specializing in robotics, power, and automation technology.',
  'Siemens': 'Siemens is a German multinational conglomerate focused on industrial automation, smart infrastructure, and healthcare technology.',
  'Rockwell Automation': 'Rockwell Automation is a US industrial automation company providing software and hardware to factories and manufacturers.',
  'Trimble': 'Trimble is a US technology company providing positioning and workflow software for construction, agriculture, and geospatial industries.',
  'Walgreens Boots Alliance': 'Walgreens Boots Alliance is the second-largest pharmacy chain in the US, operating thousands of retail drug stores.',
  '3M': '3M (Minnesota Mining and Manufacturing) is a US conglomerate making over 60,000 products from Post-it notes to medical devices and industrial tape.',
  'Verizon': 'Verizon is one of the largest US telecommunications companies, providing wireless, broadband, and fiber internet services.',
  'AT&T': 'AT&T is a major American telecommunications giant offering wireless, internet, and TV services to millions of customers.',
  'Altria': 'Altria Group is the US parent company of Philip Morris, the maker of Marlboro cigarettes — the world\'s best-selling tobacco brand.',
  'Goldman Sachs': 'Goldman Sachs is a premier American investment bank providing financial services, trading, and asset management globally.',
  'Bank of America': 'Bank of America is one of the largest US banks, serving millions of individual and business customers with loans, credit cards, and investments.',
  'Wells Fargo': 'Wells Fargo is a major US bank and financial services company offering consumer banking, mortgages, and wealth management.',
  'US Bancorp': 'U.S. Bancorp is the parent company of U.S. Bank, the fifth-largest commercial bank in the United States.',
  'Capital One': 'Capital One is a major US bank and credit card company known for its consumer banking and digital-first financial products.',
  'Citigroup': 'Citigroup (Citi) is one of the world\'s largest banks, with operations in over 160 countries providing banking and financial services.',
  'Charles Schwab': 'Charles Schwab is a major American brokerage and investment firm providing trading, banking, and wealth management services.',
  'BlackRock': 'BlackRock is the world\'s largest asset management firm, overseeing over $10 trillion in assets including the iShares ETF family.',
  'Simon Property Group': 'Simon Property Group is the largest US retail real estate investment trust (REIT), owning and operating premium shopping malls.',
  'Digital Realty Trust': 'Digital Realty Trust is a REIT that owns and operates data centers around the world, leased to major tech and cloud companies.',
  'Realty Income': 'Realty Income is a REIT known as "The Monthly Dividend Company," owning thousands of commercial retail properties.',
  'Vornado Realty Trust': 'Vornado Realty Trust is a major REIT focused on office and retail properties in New York City and other major markets.',
  'SL Green Realty': 'SL Green Realty is Manhattan\'s largest office landlord, owning and operating commercial real estate across New York City.',
  'Boston Properties': 'Boston Properties is a REIT that owns premier Class-A office space in Boston, New York, San Francisco, and Washington DC.',
  'Crown Castle': 'Crown Castle is a US REIT that owns and leases wireless cell towers and fiber networks to major telecom carriers.',
  'ExxonMobil': 'ExxonMobil is one of the world\'s largest publicly traded oil and gas companies, with operations in exploration, refining, and petrochemicals.',
  'Chevron': 'Chevron is a major American multinational energy company involved in oil and gas exploration, production, and refining worldwide.',
  'Barrick Gold': 'Barrick Gold is one of the world\'s largest gold mining companies, with mines in North America, Africa, and Latin America.',
  'Newmont Mining': 'Newmont Corporation is the world\'s largest gold mining company, with operations across the Americas, Africa, and Australia.',
  'BP': 'BP (British Petroleum) is a major British multinational oil and gas company operating in upstream exploration and downstream refining.',
  'Bunge': 'Bunge Limited is a global agribusiness and food company specializing in grain trading, oilseed processing, and food products.',
  'Deere & Company': 'Deere & Company (John Deere) is the world\'s leading manufacturer of agricultural equipment including tractors, harvesters, and planters.',
  'BAE Systems': 'BAE Systems is a British multinational defense, aerospace, and security company and one of the world\'s largest defense contractors.',
  'Thales Group': 'Thales Group is a French multinational defense and technology company specializing in aerospace, defense electronics, and security systems.',
  'Huntington Ingalls': 'Huntington Ingalls Industries is America\'s largest military shipbuilder, constructing aircraft carriers and submarines for the US Navy.',
  'Energy Transfer': 'Energy Transfer is a US midstream energy company operating one of the largest natural gas and crude oil pipeline networks.',
  'ConocoPhillips': 'ConocoPhillips is one of the world\'s largest independent oil and gas exploration and production companies.',
  'PacWest Bancorp': 'PacWest Bancorp was a California-based regional bank focused on small business lending that nearly collapsed in 2023.',
  'Western Alliance': 'Western Alliance Bancorporation is a regional US bank providing commercial banking services, caught in the 2023 banking crisis.',
  'Zions Bancorporation': 'Zions Bancorporation is a US regional bank holding company operating across the western United States.',
  'KeyCorp': 'KeyCorp is a major US regional bank holding company operating KeyBank with branches across the northeastern United States.',
  'Comerica': 'Comerica is a Texas-based US financial services company offering commercial banking and wealth management services.',
  'Fifth Third Bancorp': 'Fifth Third Bancorp is a major US regional bank serving millions of customers across the Midwest and Southeast.',
  'Volkswagen': 'Volkswagen (VW) is a German multinational automotive manufacturer and one of the world\'s largest automakers, making brands like Audi, Porsche, and VW.',
  'Renault': 'Renault is a major French automobile manufacturer producing a range of passenger cars and electric vehicles.',
  'Adidas': 'Adidas is a German multinational sportswear company and the second-largest sportswear manufacturer in the world after Nike.',
  'Societe Generale': 'Société Générale is one of the largest French multinational banking and financial services corporations.',
  'Raiffeisen Bank International': 'Raiffeisen Bank International (RBI) is an Austrian bank that operates heavily in Central and Eastern Europe, including Russia.',
  'Washington Mutual Stock': 'Washington Mutual (WaMu) was the largest US savings and loan association, seized by the FDIC and sold to JPMorgan in 2008.',
  'Merrill Lynch Stock': 'Merrill Lynch was a major US investment bank and brokerage, sold to Bank of America in 2008 during the financial crisis.',

  // Currencies
  'Russian Ruble': 'The Russian Ruble (RUB) is the official currency of Russia, which collapsed in value after the Ukraine war and Western sanctions.',
  'Norwegian Krone': 'The Norwegian Krone (NOK) is the currency of Norway, a major oil-exporting nation with a sovereign wealth fund.',
  'Brazilian Real': 'The Brazilian Real (BRL) is the currency of Brazil, Latin America\'s largest economy driven by agriculture, oil, and industry.',
  'Euro': 'The Euro (EUR) is the shared currency of 20 European Union countries, the second most traded currency in the world.',
  'Polish Zloty': 'The Polish Zloty (PLN) is the currency of Poland, one of the fastest-growing economies in Central Europe.',
  'Hungarian Forint': 'The Hungarian Forint (HUF) is the currency of Hungary, a Central European country and EU member state.',
  'Ukrainian Hryvnia': 'The Ukrainian Hryvnia (UAH) is the national currency of Ukraine, which plummeted in value after Russia\'s 2022 invasion.',
  'Swiss Franc': 'The Swiss Franc (CHF) is the currency of Switzerland, considered one of the world\'s safest currencies and a classic safe haven.',
  'USD': 'The US Dollar (USD) is the world\'s dominant reserve currency used in most global trade and financial transactions.',
  'U.S. Dollar Index': 'The US Dollar Index (DXY) measures the strength of the USD against a basket of six major world currencies.',
  'USD Index': 'The USD Index (DXY) tracks the relative value of the US Dollar against a weighted basket of major global currencies.',

  // Commodities & Bonds
  'Crude Oil': 'Crude oil (WTI) is a benchmark for global oil prices, driven by OPEC production decisions, economic demand, and geopolitics.',
  'Natural Gas': 'Natural gas is a key global energy commodity used for heating and electricity, traded on European TTF and US Henry Hub markets.',
  'Wheat Futures': 'Wheat futures are contracts for the future delivery of wheat, a staple food crop whose price is highly sensitive to weather and conflict.',
  'Corn Futures': 'Corn futures are financial contracts representing the future price of corn, heavily influenced by US farm output and ethanol demand.',
  'Fertilizer': 'CF Industries is a leading US manufacturer of nitrogen fertilizers, essential for modern large-scale crop production.',
  'Coal Prices': 'The Newcastle Coal Index tracks the global price of thermal coal, the most widely used fuel for electricity generation worldwide.',
  'Nickel': 'Nickel is a metal traded on the London Metal Exchange (LME), critical for stainless steel and electric vehicle batteries.',
  'Platinum': 'Platinum is a rare precious metal used in catalytic converters, jewelry, and industrial processes, mined mainly in South Africa.',
  'Russian Sovereign Bonds': 'Russian government bonds (OFZs), essentially loans to the Russian state, defaulted on by international investors after 2022 sanctions.',
  'Russian Corporate Bonds': 'Bonds issued by major Russian corporations like Gazprom and Rosneft, frozen or defaulted due to Western sanctions.',
  'Russian Municipal Bonds': 'Bonds issued by Russian regional governments, frozen and non-tradable for Western investors after the Ukraine war.',
  'Russian Export Coal': 'Russian thermal coal exports, redirected from Europe to Asia after Western countries imposed energy sanctions in 2022.',
  'Subprime Mortgage Bonds': 'Bonds backed by high-risk home loans given to borrowers with poor credit. Their collapse in 2008 triggered the global financial crisis.',
  'CDOs': 'Collateralized Debt Obligations (CDOs) are complex financial products bundling loans together and sold to investors. They caused the 2008 crash.',
  'Junk Bonds': 'High-yield (junk) bonds are corporate bonds rated below investment grade, offering higher returns but much higher risk of default.',
  'Investment-Grade Corp Bonds': 'Corporate bonds from financially stable, highly-rated companies, offering safe fixed income returns.',
  'Treasury Inflation-Protected Securities': 'TIPS are US government bonds whose principal adjusts with inflation, protecting investors from rising price levels.',
  'TIPS': 'Treasury Inflation-Protected Securities (TIPS) are US government bonds indexed to inflation, used as a hedge against rising prices.',
  'Short-Term U.S. Treasury Bills': 'US T-Bills are short-term government debt maturing in weeks to months, considered the world\'s safest investment.',
  'Nordic Sovereign Bonds': 'Government bonds from Norway, Sweden, Denmark, and Finland — considered among the most creditworthy debt in Europe.',

  // Real Estate
  'Moscow Real Estate': 'Moscow real estate refers to commercial and residential property in Russia\'s capital city, severely impacted by the 2022 sanctions.',
  'Kyiv Residential Property': 'Residential property in Kyiv, Ukraine\'s capital, which saw catastrophic devaluation following Russia\'s 2022 invasion.',
  'Eastern Polish Towns': 'Real estate and businesses in eastern Polish cities near the Ukrainian border that saw significant refugee-driven economic activity.',
  'Luxury European REITs': 'Real estate investment trusts holding premium commercial property in Paris, London, and other European capitals.',
  'Texas Energy Corridor Commercial REITs': 'REITs owning office and industrial properties in Houston\'s Energy Corridor, home to major oil and gas company headquarters.',
  'Defense R&D Facility Zones': 'Commercial real estate and industrial zones near major US defense R&D facilities in Virginia and Colorado.',
  'Rural U.S. Farmland': 'Agricultural land in the US heartland, valued for food production, rising in price due to commodity demand and limited supply.',
  'Australian Agricultural REITs': 'Real estate investment trusts owning Australian farmland and agri-infrastructure, benefiting from global food demand.',
  'Regional Mall Properties': 'Shopping mall real estate in suburban US markets, facing long-term structural decline from e-commerce competition.',
  'Luxury Real Estate in Coastal Cities': 'High-end residential property in cities like New York, Miami, and Los Angeles, often used as a store of value by the wealthy.',
  'Real Estate Crowdfunding Platforms': 'Online platforms that allow retail investors to pool money and invest in commercial or residential real estate projects.',
  'Student Housing in Expensive Areas': 'Purpose-built student accommodation near top universities in high-cost cities, a niche real estate investment sector.',
  'REITs with Hotel Holdings': 'REITs that own hotel and hospitality properties, extremely sensitive to travel demand and economic cycles.',
  'Small Landlords with ARM Mortgages': 'Individual property owners with adjustable-rate mortgages, highly exposed to rising interest rates squeezing their cash flow.',
  'High-Leverage Real Estate Funds': 'Real estate investment funds using large amounts of borrowed money (leverage) to amplify returns, also amplifying risk.',
  'REITs focused on Data Centers': 'REITs that own and operate data center facilities, benefiting from cloud computing and AI infrastructure demand.',
  'REITs with healthcare properties': 'REITs owning medical office buildings, senior housing, and hospitals, leased to healthcare providers.',
  'REITs in Logistics': 'REITs owning warehouses and distribution centers, driven by e-commerce demand (e.g., Prologis).',

  // Complex Financial Instruments
  'Put Options on S&P 500': 'Derivatives contracts that give the holder the right to sell the S&P 500 at a set price — a bet that the market will fall.',
  'VIX Call Options': 'Options on the Volatility Index (VIX) that pay out when market fear spikes, typically during crashes.',
  'Shorting Financials': 'A trading strategy that profits when bank and financial sector stocks (like XLF) decline in value.',
  'Credit Default Swaps on Lehman': 'Derivatives that pay out when a company defaults — used to profit from Lehman Brothers\' 2008 collapse.',
  'Shorting Homebuilders': 'A bet against homebuilder stocks (like XHB ETF), profiting from a housing market decline.',
  'REIT Shorts': 'Short-selling positions against real estate investment trusts, betting on a decline in commercial or residential property values.',
  'Credit Hedge Funds': 'Hedge funds specializing in credit markets and credit default swaps, often profiting from corporate or government bond defaults.',
  'Corporate Bonds of Regional Banks': 'Debt issued by regional US banks, whose value collapses if the bank faces a run or is shut down by regulators.',
  'Long-term Mortgage-Backed Securities': 'Bonds backed by home loans with long maturities, extremely sensitive to rising interest rates.',
  'Preferred Stocks of Regional Banks': 'Hybrid securities issued by regional banks that combine features of stocks and bonds, wiped out in a bank failure.',
  'Bonds from Startup-heavy Lenders': 'Debt issued by lenders like SVB that concentrated on startup clients, extremely risky in a tech downturn.',
  'Fixed Income Hedge Funds w/ Leverage': 'Hedge funds using borrowed money to amplify bond market bets, prone to catastrophic losses when rates move sharply.',
  'CLOs with Bank Loan Exposure': 'Collateralized Loan Obligations backed by corporate loans — complex financial instruments that can cascade in a credit crisis.',
  'Private Debt Funds Tied to Real Estate': 'Private investment funds providing debt to real estate developers, illiquid and risky when property values fall.',
  'Subordinated Bank Debt': 'Junior bonds issued by banks that are last in line to be repaid if the bank fails, often completely wiped out in a collapse.',
  'Crypto Banks': 'Banks like Silvergate and Signature that specialized in serving crypto companies, shut down during the 2023 banking crisis.',
  'Private Tech Startups': 'Privately held technology companies (not yet public), funded by venture capital at high valuations with no guaranteed exit.',
  'Venture Capital Funds': 'Funds that invest in early-stage startups in exchange for equity, hoping for a big return when the company goes public or is sold.',
  'Startup IPO Market': 'The market for newly public technology and startup companies, which collapsed in 2022 after a surge of expensive 2020-21 IPOs.',
  'Fintech Stocks': 'Stocks in financial technology companies (e.g., SoFi, Affirm) that disrupt traditional banking with digital-first products.',
  'Regional Bank-focused Mutual Funds': 'Mutual funds concentrating investment in regional US banking stocks, heavily exposed to the 2023 banking crisis.',

  // Generic but common categories
  'S&P 500 Index': 'The S&P 500 is the most followed US stock index, tracking the 500 largest publicly listed American companies.',
  'NASDAQ Composite': 'The NASDAQ Composite is a US stock index heavily weighted toward technology companies like Apple, Microsoft, and Amazon.',
  'Real Estate': 'US urban real estate encompasses commercial and residential property in major American cities.',
  'Homebuilder Stocks': 'Stocks in companies like Lennar, DR Horton, and Pulte that build and sell new residential homes.',
  'Commercial REITs': 'Real estate investment trusts owning commercial properties like office buildings, shopping centers, and warehouses.',
  'Luxury Brands': 'Companies selling high-end products like jewelry, fashion, and luxury goods (e.g., LVMH, Tiffany, Hermès).',
  'Auto Stocks': 'Stocks in automobile manufacturers like General Motors, Ford, and Toyota.',
  'Bank ETFs': 'Exchange-traded funds tracking a basket of banking and financial sector stocks (e.g., XLF, KBE).',
  'Financial Stocks': 'A broad category of stocks including banks, insurance companies, and investment firms like Citigroup and JPMorgan.',
  'Emerging Markets ETFs': 'ETFs providing exposure to stock markets in developing countries like China, India, Brazil, and South Korea.',
  'Oil Stocks': 'Shares in major oil and gas exploration and production companies like ExxonMobil, Chevron, and BP.',
  'Commodity Funds': 'Broad funds investing across multiple raw material commodities including oil, gold, agricultural products, and metals.',
  'Private Equity Funds': 'Investment funds that buy, improve, and sell private companies, typically accessible only to institutional and wealthy investors.',
  'Luxury Real Estate': 'High-end residential and commercial property in prime global locations, sought by ultra-high-net-worth individuals.',
  'IPO Stocks': 'Shares in companies newly listed on public stock exchanges, often volatile and speculative in early trading.',
  'Mortgage REITs': 'REITs that invest in mortgage-backed securities rather than physical property, highly sensitive to interest rate changes.',
  'European Banks': 'Major banking institutions headquartered in Europe like Deutsche Bank, BNP Paribas, and HSBC.',
  'Mutual Funds': 'Pooled investment vehicles managed by professionals, offering diversified exposure to stocks, bonds, or other assets.',
  'Tech Stocks': 'Shares in technology companies ranging from semiconductors to software and internet platforms.',
  'China ADRs': 'American Depositary Receipts of Chinese companies like Alibaba and JD.com, listed on US stock exchanges.',
  'Consumer Discretionary ETFs': 'ETFs tracking companies selling non-essential goods and services like retail, restaurants, and entertainment.',
  'Construction Stocks': 'Stocks in companies involved in construction equipment and materials like Caterpillar and Deere & Company.',
  'Banking Preferred Shares': 'Hybrid securities issued by banks that pay fixed dividends but can be wiped out if the bank collapses.',
  'Corporate Bonds': 'Debt instruments issued by corporations to raise capital, rated from investment-grade (safe) to junk (risky).',
  'Certificates of Deposit at Major Banks': 'FDIC-insured savings products offered by banks with a fixed interest rate for a fixed term, like a guaranteed savings account.',
  'Rental Housing Markets in Low-Leverage Areas': 'Residential rental properties in markets where landlords carry low mortgage debt, more resilient to rising interest rates.',
  'Farmland Investment Funds': 'Funds that pool investor money to purchase and lease agricultural land, offering stable inflation-resistant returns.',
  'Cash in High-Yield Savings Accounts': 'Cash held in savings accounts at banks offering higher-than-average interest rates, often federally insured.',
  'Private Equity in Non-Cyclical Sectors': 'Private equity investments in industries with stable demand regardless of the economy, like healthcare and utilities.',
  'Money Market Funds': 'Ultra-low-risk mutual funds investing in short-term government and corporate debt, almost like a savings account.',
  'Agriculture Stocks': 'Stocks in agribusiness companies like Archer-Daniels-Midland (ADM) involved in food processing and commodity trading.',
  'Land in Stable Rural Areas': 'Agricultural or undeveloped land in rural regions, a tangible asset that holds value during economic uncertainty.',
  'Canadian Banks': 'Major Canadian financial institutions like TD Bank, RBC, and BMO, known for stability and conservative lending.',
  'Futures in VIX or S&P Shorts': 'Derivative contracts that pay out when market volatility spikes or the S&P 500 index falls in value.',
  'Short-Term U.S. Bonds ETF': 'ETFs like SHY tracking short-duration US Treasury bonds, low-risk and useful when interest rates are rising.',
  'Commodities Short ETFs': 'Inverse ETFs like DUG that profit when oil and commodity prices fall.',
  'Defense Stocks': 'Stocks in defense contractors like Lockheed Martin (LMT) and Raytheon that supply weapons and military technology.',
  'Soros Fund Mgmt. Holdings': 'Positions held by George Soros\'s hedge fund, known for large macro bets like famously shorting the British Pound in 1992.',
  'Oil Short ETFs': 'Inverse ETFs like SCO designed to profit when crude oil prices drop significantly.',
  'Insurance Stocks': 'Stocks in insurance companies like Allstate and Progressive that collect premiums and pay out claims.',
  'REIT Bonds': 'Bonds issued by real estate investment trusts to finance property acquisitions and development.',
  'Defense Industry Corporate Bonds': 'Bonds issued by defense companies like Lockheed Martin or Boeing, backed by long-term US government contracts.',
};

const dbPath = 'server/data/eras_db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

let fixedCount = 0;
let stillBad = 0;

db.forEach(era => {
  era.investments.forEach(card => {
    // Strip ticker to get base name: "ExxonMobil (XOM)" -> "ExxonMobil"
    let baseName = card.name;
    if (card.name.includes(' (')) {
      baseName = card.name.split(' (')[0].trim();
    }

    if (!card.description || card.description.includes('An investment opportunity representing')) {
      if (OVERRIDES[baseName]) {
        card.description = OVERRIDES[baseName];
        fixedCount++;
      } else if (OVERRIDES[card.name]) {
        card.description = OVERRIDES[card.name];
        fixedCount++;
      } else {
        stillBad++;
        // console.log('Still bad:', card.name);
      }
    }
  });
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`Fixed: ${fixedCount}, Still generic: ${stillBad}`);
