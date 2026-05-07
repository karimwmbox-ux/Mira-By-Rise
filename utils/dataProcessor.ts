
import { Campaign, AnalysisSummary, Anomaly, ProcessedData, DailyDataPoint, CreativeAnglePerformance, AutoRule, BlueprintCompliance } from '../types';

// This is the raw data row structure before aggregation.
type CampaignDataRow = Omit<Campaign, 'ctr' | 'cpc' | 'cpm' | 'cpp' | 'goal' | 'anomalies'>;

const getCampaignGoal = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.match(/conv|conversion|purchase|achat|sales|vente|acq|acquisition/)) return 'Conversion';
    if (lowerName.match(/cons|consideration|traffic|trafic|engagement|lead|prospect|add to cart|ajout panier/)) return 'Consideration';
    if (lowerName.match(/awa|awareness|reach|portée|notoriété|brand/)) return 'Awareness';
    return 'Uncategorized';
};

const getCreativeAngle = (name: string, adName: string): string => {
    const combinedName = `${name} ${adName}`.toLowerCase();
    if (combinedName.match(/video|vidéo|vid|reel|story/)) return 'Video';
    if (combinedName.match(/ugc|user generated content|témoignage/)) return 'UGC';
    if (combinedName.match(/image|img|static|visuel/)) return 'Image';
    if (combinedName.match(/carousel|carrousel/)) return 'Carousel';
    if (combinedName.match(/daba|dynamic|catalogue|catalog/)) return 'Dynamic/Catalog';
    if (combinedName.match(/collection/)) return 'Collection';
    if (combinedName.match(/lead|formulaire/)) return 'Lead Form';
    return 'Other';
};

const getHeaderIndex = (headers: string[], possibleNames: string[]): number => {
    for (const name of possibleNames) {
        const index = headers.findIndex(h => {
            const cleanH = h.trim().toLowerCase().replace(/^"|"$/g, '');
            return cleanH === name.toLowerCase();
        });
        if (index !== -1) return index;
    }
    return -1;
};

const generateAutoRules = (campaigns: Campaign[], summary: AnalysisSummary): AutoRule[] => {
    const rules: AutoRule[] = [];
    const targetRoas = summary.overallROAS > 0 ? summary.overallROAS * 0.8 : 2.0;
    const targetCpp = summary.avgCPP > 0 ? summary.avgCPP * 1.2 : 15.0;

    // Rule 1: Stop Underperforming Ad Sets
    rules.push({
        id: 'rule_stop_loss',
        name: 'Stop Underperforming Ad Sets',
        condition: `ROAS < ${targetRoas.toFixed(1)} AND Spend > ${targetCpp.toFixed(1)}`,
        action: 'Pause Ad Set',
        status: 'suggested',
        impact: 'high'
    });

    // Rule 2: Scale Winners
    rules.push({
        id: 'rule_scale_winners',
        name: 'Scale Winning Campaigns',
        condition: `ROAS > ${(targetRoas * 1.5).toFixed(1)} AND Purchases > 3`,
        action: 'Increase Daily Budget by 20%',
        status: 'suggested',
        impact: 'high'
    });

    // Rule 3: Anti-Fatigue
    rules.push({
        id: 'rule_frequency_cap',
        name: 'Anti-Creative Fatigue',
        condition: 'Frequency > 3.0 AND CTR Drop > 20%',
        action: 'Notify Media Buyer',
        status: 'suggested',
        impact: 'medium'
    });

    return rules;
};

const calculateBlueprintCompliance = (campaigns: Campaign[], creativeAngles: CreativeAnglePerformance[]): BlueprintCompliance => {
    const checks = [];
    let score = 0;

    // Check 1: Broad Targeting (Blueprint recommends broad for liquidity)
    const broadCount = campaigns.filter(c => c.audience.toLowerCase().includes('broad') || c.audience.toLowerCase().includes('large')).length;
    const broadPassed = broadCount > 0;
    checks.push({
        label: 'blueprintCheckBroad',
        passed: broadPassed,
        recommendation: broadPassed ? 'Excellent usage of broad targeting.' : 'Test broad targeting (no interests) to improve Meta liquidity.'
    });
    if (broadPassed) score += 35;

    // Check 2: Advantage+ Usage
    const advantageCount = campaigns.filter(c => c.name.toLowerCase().includes('advantage') || c.name.toLowerCase().includes('asc') || c.name.toLowerCase().includes('adv+')).length;
    const advantagePassed = advantageCount > 0;
    checks.push({
        label: 'blueprintCheckAdvantage',
        passed: advantagePassed,
        recommendation: advantagePassed ? 'Advantage+ features are active.' : 'Adopt Advantage+ Shopping Campaigns for better automation.'
    });
    if (advantagePassed) score += 35;

    // Check 3: Creative Diversity
    const uniqueAngles = creativeAngles.filter(a => a.angle !== 'Other').length;
    const creativePassed = uniqueAngles >= 3;
    checks.push({
        label: 'blueprintCheckCreative',
        passed: creativePassed,
        recommendation: creativePassed ? 'Good creative format diversity.' : 'Test more formats (Video, Carousel, Static) to reach more audiences.'
    });
    if (creativePassed) score += 30;

    return { score, checks };
};

const calculateStats = (data: number[]): { mean: number; stddev: number } => {
    const filteredData = data.filter(d => d > 0 && isFinite(d));
    if (filteredData.length === 0) return { mean: 0, stddev: 0 };
    const mean = filteredData.reduce((acc, val) => acc + val, 0) / filteredData.length;
    const stddev = Math.sqrt(filteredData.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / filteredData.length);
    return { mean, stddev };
};

const detectAnomalies = (campaigns: Campaign[]): Campaign[] => {
    if (campaigns.length < 3) return campaigns;
    const spends = campaigns.map(c => c.spend);
    const roases = campaigns.map(c => c.roas);
    const cpps = campaigns.map(c => c.cpp);
    const spendStats = calculateStats(spends);
    const roasStats = calculateStats(roases);
    const cppStats = calculateStats(cpps);
    const ANOMALY_THRESHOLD = 1.5;

    return campaigns.map(campaign => {
        const anomalies: Anomaly[] = [];
        if (spendStats.stddev > 0 && campaign.spend > spendStats.mean + ANOMALY_THRESHOLD * spendStats.stddev) {
            anomalies.push({ metric: 'spend', type: 'notice', descriptionKey: 'anomalySpendHigh' });
        }
        if (roasStats.mean > 0 && roasStats.stddev > 0) {
            if (campaign.roas > roasStats.mean + ANOMALY_THRESHOLD * roasStats.stddev) {
                anomalies.push({ metric: 'roas', type: 'positive', descriptionKey: 'anomalyRoasPositive' });
            } else if (campaign.roas > 0 && campaign.roas < roasStats.mean - ANOMALY_THRESHOLD * roasStats.stddev) {
                anomalies.push({ metric: 'roas', type: 'negative', descriptionKey: 'anomalyRoasNegative' });
            }
        }
        if (cppStats.mean > 0 && cppStats.stddev > 0) {
            if (campaign.cpp < cppStats.mean - ANOMALY_THRESHOLD * cppStats.stddev && campaign.cpp > 0) {
                anomalies.push({ metric: 'cpp', type: 'positive', descriptionKey: 'anomalyCppPositive' });
            } else if (campaign.cpp > cppStats.mean + ANOMALY_THRESHOLD * cppStats.stddev) {
                anomalies.push({ metric: 'cpp', type: 'negative', descriptionKey: 'anomalyCppNegative' });
            }
        }
        return { ...campaign, anomalies };
    });
};

const detectDelimiter = (header: string): string => {
    const commaCount = (header.match(/,/g) || []).length;
    const tabCount = (header.match(/\t/g) || []).length;
    return tabCount > commaCount ? '\t' : ',';
};

export const parseAndProcessData = (csvData: string): ProcessedData => {
    if (csvData.charCodeAt(0) === 0xFEFF) csvData = csvData.substring(1);
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV data must have at least one header row and one data row.');

    const headerLine = lines[0].trim();
    const delimiter = detectDelimiter(headerLine);
    const rawHeaders = headerLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
    const dataRows = lines.slice(1);

    // Flexible mapping for campaign/ad set name
    let nameIndex = getHeaderIndex(rawHeaders, ['campaign name', 'campaign', 'nom de la campagne']);
    let audienceIndex = getHeaderIndex(rawHeaders, ['ad set name', 'audience', 'audience name', "nom de l'audience", 'nom de l’ensemble de publicités']);

    if (nameIndex === -1 && audienceIndex !== -1) {
        // Report is likely at the Ad Set level, use Ad Set Name as the primary identifier
        nameIndex = audienceIndex;
        audienceIndex = -1; // No deeper audience level to report on
    }

    const headerMap = {
        name: nameIndex,
        adName: getHeaderIndex(rawHeaders, ['ad name', 'nom de la publicité']),
        audience: audienceIndex,
        date: getHeaderIndex(rawHeaders, ['day', 'date', 'reporting starts', 'début des rapports']),
        spend: getHeaderIndex(rawHeaders, ['amount spent (eur)', 'amount spent (usd)', 'amount spent (dzd)', 'spend', 'amount spent', 'budget dépensé', 'montant dépensé (eur)', 'montant dépensé (usd)', 'montant dépensé (dzd)', 'cost', 'coût', 'daily budget']),
        impressions: getHeaderIndex(rawHeaders, ['impressions', 'vues']),
        clicks: getHeaderIndex(rawHeaders, ['clicks', 'link clicks', 'clicks (all)', 'clics', 'clics sur un lien', 'clics (tous)']),
        purchases: getHeaderIndex(rawHeaders, ['purchases', 'conversions', 'achats', 'résultats', 'results']),
        results: getHeaderIndex(rawHeaders, ['résultats', 'results', 'total results']),
        resultType: getHeaderIndex(rawHeaders, ['type de résultat', 'result type', 'indicateur de résultats']),
        roas: getHeaderIndex(rawHeaders, ['purchase roas (return on ad spend)', 'roas', 'roas (purchase)', 'roas (achats)', 'roas sur les dépenses publicitaires des achats', 'roas (retour sur les dépenses publicitaires) des achats', 'retour sur les dépenses publicitaires (roas) des achats']),
    };

    // Detect currency from headers
    let currency = 'EUR';
    if (headerLine.toLowerCase().includes('dzd')) currency = 'DZD';
    else if (headerLine.toLowerCase().includes('usd')) currency = 'USD';

    const requiredMetrics: { key: keyof typeof headerMap; names: string[] }[] = [
        { key: 'name', names: ['Campaign Name or Ad Set Name'] },
        { key: 'spend', names: ['Amount Spent'] },
        { key: 'impressions', names: ['Impressions'] },
        { key: 'date', names: ['Date or Day'] },
    ];
    
    for (const metric of requiredMetrics) {
        if (headerMap[metric.key] === -1) {
            throw new Error(`Missing required CSV column: ${metric.names[0]}. Please check your data. Found headers: [${rawHeaders.join(', ')}]`);
        }
    }

    const valueSplitRegex = new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`);
    const rawData: CampaignDataRow[] = dataRows.map(row => {
        if (!row.trim() || row.startsWith(delimiter.repeat(5))) return null;
        const values = row.split(valueSplitRegex).map(v => v.trim().replace(/^"|"$/g, ''));
        
        let purchases = 0;
        if (headerMap.purchases > -1) {
            purchases = parseInt(values[headerMap.purchases], 10) || 0;
        } else if (headerMap.results > -1 && headerMap.resultType > -1 && values[headerMap.resultType]) {
            const resultType = values[headerMap.resultType].toLowerCase();
            if (resultType.includes('purchase') || resultType.includes('achat')) {
                purchases = parseInt(values[headerMap.results], 10) || 0;
            }
        }
        
        const spend = parseFloat(values[headerMap.spend]?.replace(',', '.')) || 0;
        const roasValue = headerMap.roas > -1 ? parseFloat(values[headerMap.roas]?.replace(',', '.')) || 0 : 0;

        return {
            name: values[headerMap.name]?.trim() || 'N/A',
            adName: headerMap.adName > -1 ? (values[headerMap.adName]?.trim() || 'N/A') : 'N/A',
            audience: headerMap.audience > -1 ? (values[headerMap.audience]?.trim() || 'N/A') : 'N/A',
            date: values[headerMap.date] || 'N/A',
            spend,
            impressions: parseInt(values[headerMap.impressions], 10) || 0,
            clicks: parseInt(values[headerMap.clicks], 10) || 0,
            purchases,
            roas: roasValue,
        };
    }).filter((r): r is CampaignDataRow => r !== null && r.name !== 'N/A' && r.spend > 0);

    if (rawData.length === 0) {
        throw new Error("No valid data rows could be processed. Please check if the file is empty or if the columns match the required format.");
    }

    // --- AGGREGATIONS ---

    // 1. Aggregate by Name (Campaign or Ad Set)
    const campaignMap = new Map<string, Omit<Campaign, 'ctr'|'cpc'|'cpm'|'cpp'|'roas'|'goal'|'anomalies'> & { revenue: number, audiences: Set<string> }>();
    rawData.forEach(row => {
        const c = campaignMap.get(row.name) || { name: row.name, spend: 0, impressions: 0, clicks: 0, purchases: 0, revenue: 0, audiences: new Set(), date: '', adName: '', audience: '' };
        c.spend += row.spend;
        c.impressions += row.impressions;
        c.clicks += row.clicks;
        c.purchases += row.purchases;
        c.revenue += row.spend * row.roas;
        if (row.audience !== 'N/A') c.audiences.add(row.audience);
        campaignMap.set(row.name, c);
    });
    
    let campaigns: Campaign[] = Array.from(campaignMap.values()).map(c => ({
        ...c,
        audience: c.audiences.size > 1 ? 'Multiple' : (c.audiences.values().next().value || 'N/A'),
        goal: getCampaignGoal(c.name),
        ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
        cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
        cpm: c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0,
        cpp: c.purchases > 0 ? c.spend / c.purchases : 0,
        roas: c.spend > 0 ? c.revenue / c.spend : 0,
    }));
    campaigns = detectAnomalies(campaigns);

    // 2. Aggregate by Day
    const dailyMap = new Map<string, Omit<DailyDataPoint, 'roas'> & { revenue: number }>();
    rawData.forEach(row => {
        const d = dailyMap.get(row.date) || { date: row.date, spend: 0, purchases: 0, revenue: 0 };
        d.spend += row.spend;
        d.purchases += row.purchases;
        d.revenue += row.spend * row.roas;
        dailyMap.set(row.date, d);
    });
    const dailyData: DailyDataPoint[] = Array.from(dailyMap.values())
        .map(d => ({ ...d, roas: d.spend > 0 ? d.revenue / d.spend : 0 }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 3. Aggregate by Creative Angle
    const angleMap = new Map<string, Omit<CreativeAnglePerformance, 'roas'> & { revenue: number, campaignSet: Set<string> }>();
    rawData.forEach(row => {
        const angle = getCreativeAngle(row.name, row.adName);
        const a = angleMap.get(angle) || { angle, spend: 0, purchases: 0, revenue: 0, campaignCount: 0, campaignSet: new Set() };
        a.spend += row.spend;
        a.purchases += row.purchases;
        a.revenue += row.spend * row.roas;
        a.campaignSet.add(row.name);
        angleMap.set(angle, a);
    });
    const creativeAngles: CreativeAnglePerformance[] = Array.from(angleMap.values())
        .map(a => ({ angle: a.angle, spend: a.spend, purchases: a.purchases, roas: a.spend > 0 ? a.revenue / a.spend : 0, campaignCount: a.campaignSet.size }))
        .sort((a,b) => b.spend - a.spend);

    // 4. Create Final Summary
    const summary = campaigns.reduce((acc, c) => {
        acc.totalSpend += c.spend;
        acc.totalImpressions += c.impressions;
        acc.totalClicks += c.clicks;
        acc.totalPurchases += c.purchases;
        acc.totalRevenue += c.spend * c.roas;
        return acc;
    }, { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalPurchases: 0, totalRevenue: 0 });

    const finalSummary: AnalysisSummary = {
        totalSpend: summary.totalSpend,
        totalImpressions: summary.totalImpressions,
        totalClicks: summary.totalClicks,
        totalPurchases: summary.totalPurchases,
        overallROAS: summary.totalSpend > 0 ? summary.totalRevenue / summary.totalSpend : 0,
        avgCTR: summary.totalImpressions > 0 ? (summary.totalClicks / summary.totalImpressions) * 100 : 0,
        avgCPC: summary.totalClicks > 0 ? summary.totalSpend / summary.totalClicks : 0,
        avgCPM: summary.totalImpressions > 0 ? (summary.totalSpend / summary.totalImpressions) * 1000 : 0,
        avgCPP: summary.totalPurchases > 0 ? summary.totalSpend / summary.totalPurchases : 0,
        currency,
    };
    
    const autoRules = generateAutoRules(campaigns, finalSummary);
    const blueprint = calculateBlueprintCompliance(campaigns, creativeAngles);
    
    return { campaigns, summary: finalSummary, dailyData, creativeAngles, autoRules, blueprint };
};
