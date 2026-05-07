
export interface Anomaly {
    metric: 'spend' | 'roas' | 'cpp';
    type: 'positive' | 'negative' | 'notice';
    descriptionKey: string;
}

export interface Campaign {
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    purchases: number;
    roas: number;
    ctr: number;
    cpc: number;
    cpm: number;
    cpp: number;
    goal: string;
    audience: string;
    date: string; // Added for temporal analysis
    adName: string; // Added for creative analysis
    anomalies?: Anomaly[];
}

export interface AutoRule {
    id: string;
    name: string;
    condition: string;
    action: string;
    status: 'suggested' | 'active';
    impact: 'high' | 'medium' | 'low';
}

export interface AnalysisSummary {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalPurchases: number;
    overallROAS: number;
    avgCTR: number;
    avgCPC: number;
    avgCPM: number;
    avgCPP: number;
    currency: string;
}

// New type for temporal trend chart
export interface DailyDataPoint {
    date: string;
    spend: number;
    roas: number;
    purchases: number;
}

// New type for creative angle analysis
export interface CreativeAnglePerformance {
    angle: string;
    spend: number;
    purchases: number;
    roas: number;
    campaignCount: number;
}

export interface BlueprintCompliance {
    score: number; // 0-100
    checks: {
        label: string;
        passed: boolean;
        recommendation: string;
    }[];
}

// Type for the comprehensive result from data processor
export interface ProcessedData {
    campaigns: Campaign[];
    summary: AnalysisSummary;
    dailyData: DailyDataPoint[];
    creativeAngles: CreativeAnglePerformance[];
    autoRules: AutoRule[];
    blueprint: BlueprintCompliance;
}
