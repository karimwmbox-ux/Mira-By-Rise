
import React from 'react';
import { motion } from 'framer-motion';
import { BlueprintCompliance } from '../types';
import { translations } from '../i18n/translations';
import { CheckCircleIcon, AlertCircleIcon } from './icons';

interface BlueprintCardProps {
    blueprint: BlueprintCompliance;
    language: 'en' | 'fr' | 'ar';
}

export const BlueprintCard: React.FC<BlueprintCardProps> = ({ blueprint, language }) => {
    const t = translations[language];

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
        >
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-[#0064E0]">💎</span> {t.blueprintTitle}
                </h2>
                <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">{t.blueprintScore}:</span>
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="transparent"
                                className="text-gray-100"
                            />
                            <motion.circle
                                initial={{ strokeDashoffset: 175.9 }}
                                animate={{ strokeDashoffset: 175.9 - (175.9 * blueprint.score) / 100 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="transparent"
                                strokeDasharray={175.9}
                                strokeLinecap="round"
                                className={`${blueprint.score > 70 ? 'text-green-500' : blueprint.score > 40 ? 'text-yellow-500' : 'text-red-500'}`}
                            />
                        </svg>
                        <span className="absolute text-sm font-extrabold text-gray-900">{blueprint.score}%</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {blueprint.checks.map((check, index) => (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-100 transition-colors"
                    >
                        <div className="mt-1">
                            {check.passed ? (
                                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                            ) : (
                                <AlertCircleIcon className="w-6 h-6 text-yellow-500" />
                            )}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">{(t as any)[check.label] || check.label}</h4>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{check.recommendation}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-[#0064E0] font-medium leading-relaxed">
                    {language === 'ar' 
                        ? "تعتمد هذه المعايير على منهجية Meta Power5 لتحقيق أقصى قدر من النتائج في السوق الجزائري."
                        : "Ces critères sont basés sur la méthodologie Meta Power5 pour maximiser les résultats sur le marché algérien."}
                </p>
            </div>
        </motion.div>
    );
};
