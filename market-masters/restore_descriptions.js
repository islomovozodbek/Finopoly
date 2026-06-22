const fs = require('fs');

const db = JSON.parse(fs.readFileSync('server/data/eras_db.json', 'utf8'));

const getDescription = (name, reason) => {
    const text = (name + " " + reason).toLowerCase();
    
    // Financial
    if (text.match(/bank|financial|insurance|credit|mortgage|loan|capital|investment bank|wealth/)) {
        return "A financial sector asset dealing with banking, insurance, or credit.";
    }
    // Cybersecurity
    if (text.match(/cyber|intelligence|security|firewall/)) {
        return "A cybersecurity and intelligence sector asset.";
    }
    // Tech & Software
    if (text.match(/tech|cloud|software|ai |apple|nvidia|netflix|amazon|semiconductor|internet|data|computer|digital|platform|app |streaming/)) {
        return "A technology sector asset focused on hardware, software, or digital services.";
    }
    // Crypto
    if (text.match(/crypto|bitcoin|ethereum|defi|token|coin|exchange/)) {
        return "A cryptocurrency or blockchain-related digital asset.";
    }
    // Defense
    if (text.match(/defense|aerospace|weapon|military|contractor/)) {
        return "An aerospace and defense sector asset.";
    }
    // Real Estate
    if (text.match(/real estate|reit|property|housing|apartment|office|mall|landlord|homebuilder/)) {
        return "A real estate or property investment asset.";
    }
    // Clean Energy
    if (text.match(/solar|wind|clean energy|green|renewable|ev |electric vehicle|battery/)) {
        return "A clean energy, renewables, or electric vehicle asset.";
    }
    // Commodities & Traditional Energy
    if (text.match(/commodity|gold|silver|oil|energy|gas|petroleum|drilling|pipeline/)) {
        return "A commodity or traditional energy sector investment.";
    }
    // Industrials & Materials
    if (text.match(/steel|manufacturing|industrial|construction|infrastructure|machinery|equipment|builder|mining|materials|copper|iron|lumber/)) {
        return "An industrial manufacturing, construction, or materials asset.";
    }
    // Agriculture & Food
    if (text.match(/agriculture|wheat|corn|food|beverage|restaurant|dining|fast food|grocery|farm/)) {
        return "A food, beverage, or agricultural sector asset.";
    }
    // Telecom & Media
    if (text.match(/telecom|media|broadcasting|cable|network|television|cinema|movie|entertainment|music/)) {
        return "A telecommunications, media, or entertainment asset.";
    }
    // Transportation
    if (text.match(/airline|cruise|travel|hotel|tourism|leisure|transportation|logistics|shipping|freight|railway|railroad|transit|airport/)) {
        return "A transportation, hospitality, or logistics asset.";
    }
    // Consumer Retail
    if (text.match(/retail|consumer|store|ecommerce|e-commerce|apparel|luxury|clothing|brand|department/)) {
        return "A consumer discretionary, retail, or e-commerce asset.";
    }
    // Bonds & Fixed Income
    if (text.match(/bond|treasury|tips|sovereign|municipal|debt/)) {
        return "A fixed-income government or corporate debt asset.";
    }
    // Currencies
    if (text.match(/currency|baht|yen|franc|dollar|fx|rupiah|won|peso|ringgit/)) {
        return "A foreign exchange or currency asset.";
    }
    // Funds & Indexes
    if (text.match(/etf|fund|index|mutual fund|portfolio/)) {
        return "A diversified exchange-traded fund or market index.";
    }
    // Healthcare
    if (text.match(/healthcare|pharma|vaccine|biotech|medical|hospital|drug|clinic/)) {
        return "A healthcare, biotechnology, or pharmaceutical asset.";
    }
    // Autos
    if (text.match(/auto|vehicle|car|truck/)) {
        return "An automotive or vehicle manufacturing asset.";
    }
    // Utilities
    if (text.match(/utility|utilities|water|power grid/)) {
        return "A public utility or infrastructure asset.";
    }
    
    // Fallback based on Company Name only
    if (name.includes('ETF') || name.includes('Index')) return "A diversified market fund or index.";
    if (name.includes('Inc.') || name.includes('Corp') || name.includes('Co.')) return "A publicly traded corporate stock.";
    
    return "A specific publicly traded market opportunity.";
};

db.forEach(era => {
    era.investments.forEach(card => {
        card.description = getDescription(card.name, card.reason);
    });
});

fs.writeFileSync('server/data/eras_db.json', JSON.stringify(db, null, 2));

// Count fallbacks
let count = 0;
db.forEach(era => {
    era.investments.forEach(card => {
        if (card.description === "A specific publicly traded market opportunity.") count++;
    });
});
console.log("Remaining fallbacks:", count);
