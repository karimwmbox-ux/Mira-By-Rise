
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyDataPoint } from '../types';

interface TrendChartProps {
    data: DailyDataPoint[];
    translations: Record<string, string>;
    language: 'en' | 'fr' | 'ar';
}

type KpiKey = 'spend' | 'roas' | 'purchases';

export const TrendChart: React.FC<TrendChartProps> = ({ data, translations: t, language }) => {
    const [visibleKpi, setVisibleKpi] = useState<KpiKey>('spend');

    const kpiConfig = {
        spend: { color: "#0064E0", name: `${t.spendLabel} (€)` },
        roas: { color: "#48BB78", name: t.roasLabel },
        purchases: { color: "#F6E05E", name: t.purchasesLabel },
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
             // Using numeric for day and month, and 2-digit for year provides a concise, locale-aware format.
            return new Intl.DateTimeFormat(language, {
                year: '2-digit',
                month: 'numeric',
                day: 'numeric',
            }).format(date);
        } catch (e) {
            return dateString; // Fallback to the original string if parsing fails
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 sm:mb-0">{t.temporalAnalysisTitle}</h3>
                <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
                    {(Object.keys(kpiConfig) as KpiKey[]).map(key => (
                        <button 
                            key={key} 
                            onClick={() => setVisibleKpi(key)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${visibleKpi === key ? 'bg-white text-[#0064E0] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {kpiConfig[key].name}
                        </button>
                    ))}
                </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F5" vertical={false} />
                    <XAxis dataKey="date" stroke="#94A3B8" tickFormatter={formatDate} fontSize={11} tickMargin={10} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickMargin={10} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        labelFormatter={formatDate}
                        formatter={(value: number) => {
                             if (visibleKpi === 'roas') return `${value.toFixed(2)}x`;
                             if (visibleKpi === 'spend') return `€${value.toFixed(2)}`;
                             return value.toLocaleString();
                        }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line 
                        type="monotone" 
                        dataKey={visibleKpi} 
                        stroke={kpiConfig[visibleKpi].color} 
                        strokeWidth={3}
                        name={kpiConfig[visibleKpi].name}
                        dot={{ r: 4, fill: kpiConfig[visibleKpi].color, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
