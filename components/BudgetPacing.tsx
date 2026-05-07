
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { AnalysisSummary, DailyDataPoint } from '../types';
import { translations } from '../i18n/translations';

interface BudgetPacingProps {
    summary: AnalysisSummary;
    dailyData: DailyDataPoint[];
    language: 'en' | 'fr' | 'ar';
}

export const BudgetPacing: React.FC<BudgetPacingProps> = ({ summary, dailyData, language }) => {
    const t = translations[language];
    
    // Calculate pacing
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();
    
    // If we have daily data, we can calculate the average spend per day in the reporting period
    const avgDailySpend = summary.totalSpend / (dailyData.length || 1);
    const projectedSpend = avgDailySpend * daysInMonth;
    
    // Status logic (simplified)
    const pacingStatus = projectedSpend > summary.totalSpend * 1.2 ? 'over' : projectedSpend < summary.totalSpend * 0.8 ? 'under' : 'on-track';
    
    const getStatusColor = () => {
        if (pacingStatus === 'over') return 'text-red-600 bg-red-50 border-red-100';
        if (pacingStatus === 'under') return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    };

    const getStatusLabel = () => {
        if (pacingStatus === 'over') return t.pacingOverspending;
        if (pacingStatus === 'under') return t.pacingUnderspending;
        return t.pacingOnTrack;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', {
            style: 'currency',
            currency: summary.currency,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Target size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-900">{t.pacingTitle}</h3>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
                    {getStatusLabel()}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-slate-500 mb-1">{t.pacingCurrentSpend}</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary.totalSpend)}</p>
                    </div>
                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((currentDay / daysInMonth) * 100, 100)}%` }}
                            className="absolute top-0 left-0 h-full bg-slate-300 z-0"
                        />
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((summary.totalSpend / projectedSpend) * 100, 100)}%` }}
                            className={`absolute top-0 left-0 h-full z-10 ${pacingStatus === 'over' ? 'bg-red-500' : pacingStatus === 'under' ? 'bg-amber-500' : 'bg-indigo-500'}`}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                        <span>Day 1</span>
                        <span>Today (Day {currentDay})</span>
                        <span>Day {daysInMonth}</span>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Calendar size={14} />
                        <span className="text-xs font-medium uppercase tracking-wider">{t.pacingProjectedSpend}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(projectedSpend)}</p>
                        {pacingStatus === 'over' ? (
                            <TrendingUp size={18} className="text-red-500" />
                        ) : (
                            <TrendingDown size={18} className="text-emerald-500" />
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Based on current daily average of <span className="font-semibold">{formatCurrency(avgDailySpend)}</span>
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
