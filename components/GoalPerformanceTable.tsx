
import React, { useMemo } from 'react';
import { Campaign } from '../types';

interface GoalPerformanceTableProps {
    campaigns: Campaign[];
    translations: Record<string, string>;
}

interface GoalData {
    name: string;
    spend: number;
    purchases: number;
    roas: number;
    campaignCount: number;
}

export const GoalPerformanceTable: React.FC<GoalPerformanceTableProps> = ({ campaigns, translations: t }) => {
    const goalData = useMemo(() => {
        const goalMap = new Map<string, { spend: number; purchases: number; revenue: number; campaignCount: number }>();
        
        campaigns.forEach(c => {
            const goal = goalMap.get(c.goal) || { spend: 0, purchases: 0, revenue: 0, campaignCount: 0 };
            goal.spend += c.spend;
            goal.purchases += c.purchases;
            goal.revenue += c.spend * c.roas;
            goal.campaignCount += 1;
            goalMap.set(c.goal, goal);
        });
        
        const data: GoalData[] = Array.from(goalMap.entries()).map(([name, stats]) => ({
            name,
            spend: stats.spend,
            purchases: stats.purchases,
            roas: stats.spend > 0 ? stats.revenue / stats.spend : 0,
            campaignCount: stats.campaignCount,
        }));
        
        return data.sort((a, b) => b.spend - a.spend);

    }, [campaigns]);

    if (goalData.length === 0) return null;

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{t.goalPerformanceTitle}</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t.goalLabel}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t.campaignsLabel}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{`${t.spendLabel} (€)`}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t.tooltipPurchases}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t.roasLabel}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {goalData.map(goal => (
                            <tr key={goal.name} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-3 whitespace-nowrap text-sm font-bold text-gray-900">{goal.name}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-gray-600">{goal.campaignCount}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-gray-600">€{goal.spend.toFixed(2)}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-gray-600 font-bold">{goal.purchases.toLocaleString()}</td>
                                <td className={`p-3 whitespace-nowrap text-sm font-bold ${goal.roas > 2 ? 'text-green-600' : 'text-gray-900'}`}>{goal.roas.toFixed(2)}x</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
