
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, ArrowUpRight, Pause, Play, RefreshCw, ListChecks } from 'lucide-react';
import { Campaign, AutoRule } from '../types';
import { translations } from '../i18n/translations';

interface StrategicPlanProps {
    campaigns: Campaign[];
    autoRules: AutoRule[];
    language: 'en' | 'fr' | 'ar';
}

export const StrategicPlan: React.FC<StrategicPlanProps> = ({ campaigns, autoRules, language }) => {
    const t = translations[language];

    // Generate specific actions based on campaign data
    const topPerformers = [...campaigns].sort((a, b) => b.roas - a.roas).slice(0, 2).filter(c => c.roas > 2);
    const underPerformers = [...campaigns].sort((a, b) => a.roas - b.roas).slice(0, 2).filter(c => c.roas < 1.5 && c.spend > 10);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
            <div className="p-6 border-bottom border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <ListChecks size={20} />
                    </div>
                    <h3 className="font-semibold text-slate-900">{t.strategicPlanTitle}</h3>
                </div>
                <p className="text-xs text-slate-500 ml-11">{t.strategicPlanSubtitle}</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Scale Actions */}
                {topPerformers.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                            <ArrowUpRight size={12} />
                            Scale Opportunities
                        </h4>
                        {topPerformers.map((c, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm">
                                        <Play size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                                        <p className="text-xs text-emerald-700">Increase budget by 20% (ROAS: {c.roas.toFixed(2)}x)</p>
                                    </div>
                                </div>
                                <button className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight hover:underline">
                                    Apply
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pause Actions */}
                {underPerformers.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                            <Pause size={12} />
                            Risk Mitigation
                        </h4>
                        {underPerformers.map((c, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-red-50/30 rounded-xl border border-red-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg text-red-600 shadow-sm">
                                        <Pause size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                                        <p className="text-xs text-red-700">Pause or reduce budget (ROAS: {c.roas.toFixed(2)}x)</p>
                                    </div>
                                </div>
                                <button className="text-[10px] font-bold text-red-700 uppercase tracking-tight hover:underline">
                                    Apply
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Suggested Rules */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                        <RefreshCw size={12} />
                        Automation Rules
                    </h4>
                    {autoRules.slice(0, 2).map((rule, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
                                    <CheckCircle2 size={16} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                                    <p className="text-xs text-indigo-700">{rule.action} if {rule.condition}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <AlertCircle size={12} className="text-indigo-400" />
                                <span className="text-[10px] font-bold text-indigo-400 uppercase">{rule.impact}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
