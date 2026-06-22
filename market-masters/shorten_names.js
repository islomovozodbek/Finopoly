const fs = require('fs');

const db = JSON.parse(fs.readFileSync('server/data/eras_db.json', 'utf8'));

const shorten = (name) => {
  // Strip "(e.g., ...)" suffixes entirely
  name = name.replace(/\s*\(e\.g\.,?[^)]*\)/gi, '').trim();
  // Strip "(historical equivalent)" etc
  name = name.replace(/\s*\(historical[^)]*\)/gi, '').trim();
  // Strip "(low-debt, productive)" type qualifiers  
  name = name.replace(/\s*\(low-[^)]*\)/gi, '').trim();
  // Strip "(high-quality)" etc
  name = name.replace(/\s*\(high-[^)]*\)/gi, '').trim();
  // Strip "(for-profit schools)" etc
  name = name.replace(/\s*\(for-[^)]*\)/gi, '').trim();
  // Strip "(sound ones)" etc
  name = name.replace(/\s*\(sound ones\)/gi, '').trim();
  // Strip "(radios, etc.)" etc
  name = name.replace(/\s*\(radios[^)]*\)/gi, '').trim();
  // Strip "(pre-WWII)" etc
  name = name.replace(/\s*\(pre-[^)]*\)/gi, '').trim();
  // Strip "(post-Prohibition)" etc
  name = name.replace(/\s*\(post-[^)]*\)/gi, '').trim();
  // Strip "during March 2023" type suffixes
  name = name.replace(/\s*during\s+\w+\s+\d{4}/gi, '').trim();
  // Strip "(Big Banks)" type qualifiers
  name = name.replace(/\s*\(Big Banks\)/gi, '').trim();
  // Strip " (Dow Jones Industrial)" type
  name = name.replace(/\s*\(Dow Jones Industrial\)/gi, '').trim();
  // Strip "(GOVT facilities)" etc
  name = name.replace(/\s*\(GOVT facilities\)/gi, '').trim();
  // Strip "in Low-Leverage Areas" type long suffixes
  name = name.replace(/\s+in Low-Leverage Areas/gi, '').trim();

  // Specific renames for still-long names
  const remaps = {
    'Short-Term Treasury ETF (VGSH)': 'Short-Term Treasuries (VGSH)',
    '1-3 Year Treasury Bond ETF (SHY)': '1-3yr Treasury ETF (SHY)',
    'KraneShares China Internet ETF (KWEB)': 'China Internet ETF (KWEB)',
    'First Trust Cloud Computing ETF (SKYY)': 'Cloud Computing ETF (SKYY)',
    'Walgreens Boots Alliance (WBA)': 'Walgreens (WBA)',
    'Fertilizer (via CF Industries)': 'Fertilizer (CF Industries)',
    'Coal Prices (Newcastle Index)': 'Coal (Newcastle Index)',
    'U.S. Treasury Bonds (short-term)': 'Short-Term US Treasuries',
    'U.S. Treasury Bonds (long-term)': 'Long-Term US Treasuries',
    'Defense Industry Corporate Bonds': 'Defense Corp. Bonds',
    'Texas Energy Corridor Commercial REITs': 'TX Energy Corridor REITs',
    'Defense R&D Facility Zones (VA, CO)': 'Defense R&D Zone REITs',
    'Australian Agricultural REITs': 'AU Agricultural REITs',
    'Raiffeisen Bank International (RBI.VI)': 'Raiffeisen Bank (RBI)',
    'Alrosa (Russian diamond miner)': 'Alrosa (Diamonds)',
    'Luxury European REITs (Paris, London)': 'EU Luxury REITs',
    'Treasury Inflation-Protected Securities (TIPS)': 'TIPS (Inflation-Protected)',
    'Certificates of Deposit at Major Banks': 'Certificates of Deposit',
    'Large Cap Value Stocks (VTV ETF)': 'Large Cap Value Stocks',
    'REITs focused on Data Centers': 'Data Center REITs',
    'REITs with healthcare properties': 'Healthcare REITs',
    'REITs in Logistics': 'Logistics REITs',
    'Rental Housing Markets': 'Rental Housing Markets',
    'Cash in High-Yield Savings Accounts': 'High-Yield Savings',
    'Private Equity in Non-Cyclical Sectors': 'Defensive Private Equity',
    'Consumer Staples Stocks': 'Consumer Staples Stocks',
    'Tech Megacaps': 'Tech Megacaps',
    'Defense Sector Stocks': 'Defense Sector Stocks',
    'Cybersecurity ETFs': 'Cybersecurity ETFs',
    'Short-Term U.S. Treasury Bills': 'Short-Term T-Bills',
    'VIX ETF (VIXY)': 'VIX ETF (VIXY)',
    'Insurance Stocks': 'Insurance Stocks',
    'Corporate Bonds of Regional Banks': 'Regional Bank Bonds',
    'Long-term Mortgage-Backed Securities': 'Mortgage-Backed Securities',
    'Preferred Stocks of Regional Banks': 'Bank Preferred Shares',
    'REIT Bonds (Retail/Office-heavy)': 'Office/Retail REIT Bonds',
    'Bonds from Startup-heavy Lenders': 'Startup Lender Bonds',
    'Fixed Income Hedge Funds w/ Leverage': 'Leveraged Bond Hedge Funds',
    'Private Debt Funds Tied to Real Estate': 'RE Private Debt Funds',
    'Commercial Real Estate (CRE) in Urban Areas': 'Urban Commercial RE',
    'Luxury Real Estate in Coastal Cities': 'Coastal Luxury Real Estate',
    'Real Estate Crowdfunding Platforms': 'RE Crowdfunding',
    'Student Housing in Expensive Areas': 'Student Housing REITs',
    'Small Landlords with ARM Mortgages': 'ARM Mortgage Landlords',
    'High-Leverage Real Estate Funds': 'Leveraged RE Funds',
    'Regional Bank-focused Mutual Funds': 'Regional Bank Funds',
    'Shorting Financials': 'Short Financials',
    'Credit Default Swaps on Lehman': 'Lehman CDS',
    "Bridgewater's Pure Alpha Fund": 'Bridgewater Alpha Fund',
    'Shorting Homebuilders': 'Short Homebuilders',
    'Commodities Short ETFs': 'Commodities Short ETFs',
    'Short-Term U.S. Bonds ETF (SHY)': 'Short-Term Bond ETF (SHY)',
    'Agriculture Stocks': 'Agriculture Stocks',
    'Credit Hedge Funds': 'Credit Hedge Funds',
    'Precious Metals ETF': 'Precious Metals ETF',
    'Homebuilder Stocks': 'Homebuilder Stocks',
    'CDOs (Collateralized Debt Obligations)': 'CDOs',
    'Financial Stocks': 'Financial Stocks',
    'Emerging Markets ETFs': 'Emerging Markets ETFs',
    'European Banks': 'European Banks',
    'China ADRs': 'China ADRs',
    'Construction Stocks': 'Construction Stocks',
    'U.S. Tech Startups Dependent on China': 'US Tech with China Exposure',
    'REITs with Exposure to Asia-Pacific': 'Asia-Pacific REITs',
    'Logistics Firms with China Routes': 'China Logistics Firms',
    'Retailers Dependent on Chinese Imports': 'Chinese Import Retailers',
    'Commodities Linked to China Growth': 'China-Linked Commodities',
    'Tourism & Airline Stocks with Asia Focus': 'Asia Tourism & Airlines',
    'VIE-structured U.S.-listed Chinese Stocks': 'US-listed China VIE Stocks',
    'Delisted ADRs from U.S. Exchanges': 'Delisted China ADRs',
    'Farmland (low-debt, productive)': 'Productive Farmland',
    'Short Selling (Dow Jones Industrial)': 'Short Selling (DJI)',
    'Utility Stocks (low volatility)': 'Utility Stocks',
    'Consumer Staples (Procter & Gamble)': 'Consumer Staples',
    'Municipal Bonds (high-quality)': 'Municipal Bonds',
    'Cash Value Life Insurance Policies': 'Life Insurance Policies',
    'Gold Mining ETFs (historical equivalent)': 'Gold Mining Stocks',
    'Swiss Bank Accounts (Gold-backed)': 'Gold-Backed Swiss Accounts',
    'Rural Credit Unions (sound ones)': 'Rural Credit Unions',
    'Debt-Free Real Estate (rented farmland)': 'Debt-Free Farmland',
    'Companies with Strong International Exposure': 'Intl. Exposure Companies',
    'Cigarette Companies (e.g., American Tobacco)': 'Tobacco Companies',
    'Whiskey/Spirits Producers (post-Prohibition)': 'Spirits Producers',
    'Libraries/Publishing (low-cost entertainment)': 'Publishing & Libraries',
    'Religious/Charity-Linked Institutions': 'Charity-Linked Institutions',
    'Automotive Stocks (e.g., GM, Ford)': 'Automotive Stocks',
    'Bank Stocks (e.g., Chase, Citibank)': 'Bank Stocks',
    'Real Estate Investment Trusts (REITs)': 'REITs',
    'High-Yield Bonds (Junk Bonds)': 'High-Yield / Junk Bonds',
    'Foreign Stock Holdings (Germany)': 'German Stock Holdings',
    'Entertainment Chains (Cinemas)': 'Cinema Chains',
    'Education Stocks (for-profit schools)': 'For-Profit Education Stocks',
    'Consumer Electronics (radios, etc.)': 'Consumer Electronics',
    'Private Equity Firms (historical analogs)': 'Early Private Equity Firms',
    'Speculative Real Estate Syndicates': 'Speculative RE Syndicates',
    'Municipal Bonds in Pro-Manufacturing States': 'Pro-Manufacturing Muni Bonds',
    'China Construction Bank (CICHY)': 'China Construction Bank',
    'Emerging Market ETFs': 'Emerging Market ETFs',
    'Aerospace & Defense ETF (PPA)': 'Aerospace & Defense ETF',
    'Domestic Logistics ETFs': 'Domestic Logistics ETFs',
    'Small Cap U.S. Industrial Stocks': 'Small Cap Industrials',
    'Defense REITs': 'Defense REITs',
    'Luxury Brands': 'Luxury Brands',
    'Auto Stocks': 'Auto Stocks',
    'Bank ETFs': 'Bank ETFs',
    'Crypto Banks': 'Crypto Banks',
    'Private Tech Startups': 'Private Tech Startups',
    'Venture Capital Funds': 'Venture Capital Funds',
    'Startup IPO Market': 'Startup IPO Market',
    'Fintech Stocks': 'Fintech Stocks',
  };

  return remaps[name] || name;
};

let changed = 0;
db.forEach(era => {
  era.investments.forEach(card => {
    const shortened = shorten(card.name);
    if (shortened !== card.name) {
      card.name = shortened;
      changed++;
    }
  });
});

fs.writeFileSync('server/data/eras_db.json', JSON.stringify(db, null, 2));
console.log(`Done. Shortened ${changed} more names.`);

const stillLong = [];
db.forEach(era => era.investments.forEach(c => {
  if (c.name.length > 28) stillLong.push(c.name);
}));
console.log(`Still long (>28 chars): ${[...new Set(stillLong)].length}`);
[...new Set(stillLong)].slice(0, 20).forEach(n => console.log(' -', n));
