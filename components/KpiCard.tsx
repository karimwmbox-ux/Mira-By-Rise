
import React from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';

interface KpiCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    subValue?: string;
    tooltipText?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, subValue, tooltipText }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group relative"
        >
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-5 transition-all duration-300 hover:shadow-md hover:border-blue-200">
                <div className="p-4 bg-blue-50 rounded-xl text-[#0064E0] flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{title}</p>
                        {tooltipText && (
                            <div className="group/tooltip relative">
                                <Info className="w-3 h-3 text-gray-300 cursor-help hover:text-gray-400 transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl text-center">
                                    {tooltipText}
                                </div>
                            </div>
                        )}
                    </div>
                    <p className="text-2xl font-black text-gray-900 tracking-tight truncate" title={value}>{value}</p>
                    {subValue && (
                        <p className="text-xs font-black text-[#0064E0] mt-1 bg-blue-50 inline-block px-1.5 py-0.5 rounded">
                            {subValue}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
