const fs = require('fs');

const randomOffset = (base) => {
    // Add a random offset between -5 and +5 to make percentages unique
    const offset = Math.floor(Math.random() * 11) - 5;
    return base + offset;
};

const generate2008 = () => {
    const cards = [];
    const banks = ['Lehman Brothers', 'Bear Stearns', 'Washington Mutual', 'Wachovia', 'Countrywide Financial', 'Northern Rock', 'IndyMac Bank'];
    banks.forEach((b, i) => cards.push({ name: b, type: 'Bad', percentage: randomOffset(-90), reason: `${b} went bankrupt or was seized due to massive toxic subprime mortgage exposure.`, description: `A major financial institution heavily invested in the housing market.` }));

    const survivedBanks = ['Citigroup', 'Bank of America', 'AIG', 'Morgan Stanley', 'Goldman Sachs', 'Wells Fargo', 'Barclays', 'Royal Bank of Scotland', 'UBS', 'Credit Suisse'];
    survivedBanks.forEach((b, i) => cards.push({ name: b, type: 'Bad', percentage: randomOffset(-65), reason: `${b} suffered massive losses from mortgage-backed securities and required bailouts.`, description: `A global banking giant with significant exposure to Wall Street derivatives.` }));

    const safeHavens = ['Physical Gold', 'U.S. Treasury Bonds', 'Swiss Franc', 'Japanese Yen', 'Vanguard Total Bond Market ETF', 'Physical Silver', 'Cash (USD)', 'German Bunds'];
    safeHavens.forEach((b, i) => cards.push({ name: b, type: 'Good', percentage: randomOffset(25), reason: `Investors fled the collapsing stock market and bought ${b} as a guaranteed safe haven.`, description: `A traditional 'safe haven' asset that investors buy during global panic.` }));

    const discountRetailers = ['Walmart', 'McDonald\'s', 'Dollar Tree', 'Family Dollar', 'Ross Stores', 'TJX Companies', 'AutoZone', 'O\'Reilly Auto Parts'];
    discountRetailers.forEach((b, i) => cards.push({ name: b, type: 'Good', percentage: randomOffset(15), reason: `Consumers tightened budgets, causing a surge in sales at ${b}.`, description: `A highly recognizable discount retailer or fast-food chain.` }));

    const luxuryBrands = ['Tiffany & Co.', 'LVMH (Louis Vuitton)', 'Porsche', 'Nordstrom', 'Sotheby\'s', 'Wynn Resorts', 'Las Vegas Sands', 'Coach', 'Ralph Lauren', 'BMW'];
    luxuryBrands.forEach((b, i) => cards.push({ name: b, type: 'Bad', percentage: randomOffset(-55), reason: `Wealthy consumers completely halted discretionary spending, crashing ${b}'s revenue.`, description: `A high-end luxury brand or premium leisure company.` }));

    const realEstate = ['Toll Brothers', 'Lennar', 'D.R. Horton', 'PulteGroup', 'Simon Property Group', 'Zillow (Housing Index)', 'Fannie Mae', 'Freddie Mac', 'Home Depot', 'Lowe\'s'];
    realEstate.forEach((b, i) => cards.push({ name: b, type: 'Bad', percentage: randomOffset(-80), reason: `The housing bubble burst, sending ${b}'s valuation plummeting.`, description: `A company directly tied to homebuilding, mortgages, or real estate.` }));

    const autoIndustry = ['General Motors', 'Chrysler', 'Ford Motor Company', 'Toyota', 'Honda', 'Harley-Davidson'];
    autoIndustry.forEach((b, i) => cards.push({ name: b, type: 'Bad', percentage: randomOffset(-80), reason: `Credit froze, meaning nobody could get car loans, leading to bailouts for ${b}.`, description: `A major global automobile manufacturer.` }));

    const techAndMedia = ['Apple', 'Google', 'Microsoft', 'Cisco', 'Intel', 'Sony', 'Panasonic'];
    techAndMedia.forEach((b, i) => cards.push({ name: b, type: 'Bad', percentage: randomOffset(-35), reason: `${b} was swept up in the broader market panic despite relatively strong balance sheets.`, description: `A highly recognizable global technology company.` }));
    
    // Netflix is a special case
    cards.push({ name: 'Netflix', type: 'Good', percentage: 45, reason: "Gained subscribers as people canceled expensive cable and stayed home for cheap entertainment.", description: "An emerging digital entertainment and DVD-by-mail company." });

    const energy = ['ExxonMobil', 'Chevron', 'BP', 'Shell', 'ConocoPhillips'];
    energy.forEach((b, i) => cards.push({ name: b, type: 'Bad', percentage: randomOffset(-45), reason: `Oil prices crashed as global manufacturing halted, tanking ${b}'s stock.`, description: `A massive global oil and gas conglomerate.` }));

    return cards;
};

const generate1997 = () => {
    const cards = [];
    const currencies = ['Thai Baht', 'Indonesian Rupiah', 'South Korean Won', 'Malaysian Ringgit', 'Philippine Peso'];
    currencies.forEach((c, i) => cards.push({ name: c, type: 'Bad', percentage: randomOffset(-60), reason: `Foreign reserves dried up, forcing the ${c} to unpeg from the dollar and collapse.`, description: `The national currency of an emerging Asian "Tiger" economy.` }));

    const bankruptChaebols = ['Daewoo Group', 'Hanbo Steel', 'Kia Motors (Pre-merger)', 'Sammi Steel', 'Jinro Group'];
    bankruptChaebols.forEach((c, i) => cards.push({ name: c, type: 'Bad', percentage: randomOffset(-95), reason: `Massively over-leveraged with foreign debt, ${c} went bankrupt.`, description: `A massive South Korean conglomerate heavily reliant on cheap foreign debt.` }));

    const safeHavens = ['U.S. Dollar (USD)', 'U.S. Treasury Bonds', 'Physical Gold', 'Swiss Franc', 'German Mark'];
    safeHavens.forEach((c, i) => cards.push({ name: c, type: 'Good', percentage: randomOffset(20), reason: `Investors pulled their money out of Asia, parking it in the ${c}.`, description: `A globally recognized, stable Western currency or asset.` }));

    const imf = ['IMF Bailout Loans', 'World Bank Emergency Funds', 'Asian Development Bank Bonds'];
    imf.forEach((c, i) => cards.push({ name: c, type: 'Good', percentage: randomOffset(10), reason: `${c} issued emergency multi-billion dollar rescue packages with high interest.`, description: `An international financial institution that provides emergency bailouts.` }));

    const globalBanks = ['JPMorgan Chase', 'Citibank', 'HSBC', 'Standard Chartered', 'Deutsche Bank'];
    globalBanks.forEach((c, i) => cards.push({ name: c, type: 'Bad', percentage: randomOffset(-15), reason: `${c} took moderate losses on defaulted loans they had issued to Asian businesses.`, description: `A major Western bank that had expanded heavily into lending to Asian markets.` }));

    const asianTech = ['Samsung Electronics', 'LG Electronics', 'SK Hynix', 'Sony', 'Nintendo', 'Panasonic', 'Toshiba'];
    asianTech.forEach((c, i) => cards.push({ name: c, type: 'Bad', percentage: randomOffset(-35), reason: `${c}'s stock plummeted during the panic, though their export goods became cheaper.`, description: `A famous, well-established Asian consumer electronics manufacturer.` }));

    const asianAirlines = ['Thai Airways', 'Korean Air', 'Garuda Indonesia', 'Malaysia Airlines', 'Cathay Pacific'];
    asianAirlines.forEach((c, i) => cards.push({ name: c, type: 'Bad', percentage: randomOffset(-65), reason: `Travel demand collapsed, and ${c}'s airplane leasing debts in USD caused massive losses.`, description: `A flagship national airline for an Asian country.` }));

    const realEstate = ['Bangkok Real Estate Index', 'Jakarta Commercial Property', 'Seoul Housing Market', 'Kuala Lumpur Office Space'];
    realEstate.forEach((c, i) => cards.push({ name: c, type: 'Bad', percentage: randomOffset(-75), reason: `The massive property bubble in ${c} popped instantly as foreign capital fled.`, description: `The commercial and residential real estate market in a booming Asian capital.` }));

    const westernImports = ['Ford Exports to Asia', 'Nike Sales in Asia', 'McDonald\'s Asian Expansion', 'Boeing Orders from Asia'];
    westernImports.forEach((c, i) => cards.push({ name: c, type: 'Bad', percentage: randomOffset(-25), reason: `Asian consumers could no longer afford ${c} due to collapsed currencies.`, description: `A highly recognizable Western brand trying to sell products to Asian consumers.` }));

    const exporters = ['Taiwan Semiconductor (TSMC)', 'Toyota Exports', 'Honda', 'Foxconn'];
    exporters.forEach((c, i) => cards.push({ name: c, type: 'Good', percentage: randomOffset(10), reason: `While stock dipped briefly, ${c}'s exports actually became massively cheaper and competitive.`, description: `An Asian manufacturing giant that exports almost all its products to the USA/Europe.` }));

    return cards;
};

const generate1945 = () => {
    const cards = [];
    
    const housing = ['Levitt & Sons', 'U.S. Steel', 'Georgia-Pacific (Lumber)', 'Sherwin-Williams', 'Owens Corning', 'Whirlpool', 'General Electric (Appliances)'];
    housing.forEach((c, i) => cards.push({ name: c, type: 'Good', percentage: randomOffset(75), reason: `Returning veterans bought homes in the suburbs, causing a massive boom for ${c}.`, description: `A company focused on suburban homebuilding, construction materials, or appliances.` }));

    const auto = ['Ford Motor Company', 'General Motors', 'Chrysler', 'Studebaker', 'Goodyear Tire', 'Firestone', 'Standard Oil'];
    auto.forEach((c, i) => cards.push({ name: c, type: 'Good', percentage: randomOffset(85), reason: `${c} transitioned from building tanks back to cars to meet exploding consumer demand.`, description: `A major American automobile or tire manufacturer.` }));

    const consumer = ['Coca-Cola', 'Procter & Gamble', 'Johnson & Johnson', 'Colgate-Palmolive', 'Kraft Foods', 'Kellogg\'s', 'Tupperware', 'Mattel'];
    consumer.forEach((c, i) => cards.push({ name: c, type: 'Good', percentage: randomOffset(60), reason: `Rationing ended, and the new middle class had massive savings to spend on ${c}.`, description: `A highly recognizable, everyday consumer brand for food, hygiene, or toys.` }));

    const entertainment = ['The Walt Disney Company', 'CBS (Columbia Broadcasting System)', 'NBC', 'RCA (Radio Corporation of America)', 'Warner Bros.', 'Paramount Pictures'];
    entertainment.forEach((c, i) => cards.push({ name: c, type: 'Good', percentage: randomOffset(65), reason: `The invention of television and post-war leisure boom led to a golden age for ${c}.`, description: `A major American entertainment, radio, or early television network.` }));

    const aerospace = ['Boeing', 'Pan Am Airlines', 'Douglas Aircraft', 'Lockheed Corporation', 'American Airlines', 'TWA'];
    aerospace.forEach((c, i) => cards.push({ name: c, type: 'Good', percentage: randomOffset(80), reason: `${c} transitioned wartime aviation technology into a booming era of commercial air travel.`, description: `A pioneer in commercial aviation and passenger airlines.` }));

    const warLosers = ['Ammunition Factories', 'Wartime Rationing Black Markets', 'Tank Assembly Lines', 'Military Scrap Metal Dealers'];
    warLosers.forEach((c, i) => cards.push({ name: c, type: 'Bad', percentage: randomOffset(-85), reason: `The war ended, instantly canceling military contracts and wiping out ${c}.`, description: `A business whose entire existence depended on active global warfare and rationing.` }));

    const bonds = ['U.S. War Bonds (Series E)', 'British Consols (Bonds)'];
    bonds.forEach((c, i) => cards.push({ name: c, type: 'Bad', percentage: randomOffset(-10), reason: `Inflation from the economic boom eroded the fixed returns of ${c}.`, description: `Government debt issued specifically to fund the military during World War II.` }));

    const pharma = ['Pfizer', 'Merck & Co.', 'Eli Lilly', 'Abbott Laboratories'];
    pharma.forEach((c, i) => cards.push({ name: c, type: 'Good', percentage: randomOffset(65), reason: `The commercialization of Penicillin created a massive healthcare boom for ${c}.`, description: `A major pharmaceutical company pioneering modern medicines.` }));

    const intl = ['Marshall Plan Contractors', 'Caterpillar', 'Deere & Company', 'IBM'];
    intl.forEach((c, i) => cards.push({ name: c, type: 'Good', percentage: randomOffset(55), reason: `${c} received massive government contracts to help rebuild a devastated Europe.`, description: `A major American industrial or technology company providing heavy equipment.` }));

    return cards;
};

const db = JSON.parse(fs.readFileSync('server/data/eras_db.json', 'utf8'));

db.forEach(era => {
    if (era.id === '2008_global_financial_crisis') {
        era.investments = generate2008();
    } else if (era.id === '1997_asian_financial_crisis') {
        era.investments = generate1997();
    } else if (era.id === '🌍_post-wwii_recovery_&_boom_(1945') {
        era.investments = generate1945();
    }
});

fs.writeFileSync('server/data/eras_db.json', JSON.stringify(db, null, 2));
console.log("eras_db.json updated with un-padded, unique card text!");
