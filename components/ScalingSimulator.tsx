
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, DollarSign, ShoppingCart, ArrowRight } from 'lucide-react';
import { AnalysisSummary } from '../types';
import { translations } from '../i18n/translations';

interface ScalingSimulatorProps {
    summary: AnalysisSummary;
    language: 'en' | 'fr' | 'ar';
}

export const ScalingSimulator: React.FC<ScalingSimulatorProps> = ({ summary, language }) => {
    const t = translations[language];
    const [increase, setIncrease] = useState(20);

    const simulation = useMemo(() => {
        const newSpend = summary.totalSpend * (1 + increase / 100);
        
        // Diminishing returns logic: ROAS usually drops as you scale
        // Simple model: for every 100% increase in budget, ROAS drops by 15%
        const roasDropFactor = 1 - (increase / 100) * 0.15;
        const estimatedRoas = Math.max(summary.overallROAS * roasDropFactor, 1.0);
        
        const estimatedRevenue = newSpend * estimatedRoas;
        const currentRevenue = summary.totalSpend * summary.overallROAS;
        const additionalRevenue = estimatedRevenue - currentRevenue;
        
        const estimatedPurchases = summary.totalPurchases * (1 + (increase / 100) * roasDropFactor);
        
        return {
            newSpend,
            estimatedRoas,
            estimatedRevenue,
            additionalRevenue,
            estimatedPurchases
        };
    }, [summary, increase]);

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
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                    <Zap size={20} />
                </div>
                <h3 className="font-semibold text-slate-900">{t.scalingSimulatorTitle}</h3>
            </div>

            <div className="space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-medium text-slate-700">{t.scalingBudgetIncrease}</label>
                        <span className="text-lg font-bold text-indigo-600">+{increase}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="200" 
                        step="5"
                        value={increase}
                        onChange={(e) => setIncrease(parseInt(e.target.value))}
                        className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium uppercase tracking-wider">
                        <span>Conservative</span>
                        <span>Aggressive Scaling</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <DollarSign size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t.scalingEstimatedRevenue}</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(simulation.estimatedRevenue)}</p>
                        <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                            <TrendingUp size={10} />
                            +{formatCurrency(simulation.additionalRevenue)}
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <Zap size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t.scalingEstimatedRoas}</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900">{simulation.estimatedRoas.toFixed(2)}x</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                            Current: {summary.overallROAS.toFixed(2)}x
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 mb-1">
                            <ShoppingCart size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t.scalingEstimatedPurchases}</span>
                        </div>
                        <p className="text-xl font-bold text-slate-900">{Math.round(simulation.estimatedPurchases)}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                            +{Math.round(simulation.estimatedPurchases - summary.totalPurchases)} units
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-indigo-900 uppercase tracking-tight">{t.scalingProfitImpact}</p>
                            <p className="text-sm text-indigo-700">Estimated ROAS efficiency: <span className="font-bold">{(100 - (increase * 0.15)).toFixed(0)}%</span></p>
                        </div>
                    </div>
                    <ArrowRight className="text-indigo-400" />
                </div>
            </div>
        </motion.div>
    );
};
