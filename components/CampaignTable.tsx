
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Campaign, Anomaly } from '../types';
import { AlertTriangleIcon, TrendingUpIcon, InfoIcon } from './icons';
import { Search, Filter, ArrowUpDown, ExternalLink } from 'lucide-react';

type SortConfig = {
    key: keyof Campaign;
    direction: 'ascending' | 'descending';
} | null;

interface CampaignTableProps {
    campaigns: Campaign[];
    translations: Record<string, string>;
}

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
    <div className="group relative flex items-center">
        {children}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-gray-900 text-white text-[10px] font-bold rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-xl z-50">
            {text}
        </div>
    </div>
);

const AnomalyIndicator: React.FC<{ anomaly: Anomaly, translations: Record<string, string> }> = ({ anomaly, translations }) => {
    const iconMap = {
        positive: <div className="bg-green-100 p-1 rounded-full"><TrendingUpIcon className="w-3 h-3 text-green-600" /></div>,
        negative: <div className="bg-red-100 p-1 rounded-full"><AlertTriangleIcon className="w-3 h-3 text-red-600" /></div>,
        notice: <div className="bg-blue-100 p-1 rounded-full"><InfoIcon className="w-3 h-3 text-blue-600" /></div>,
    };

    return (
        <Tooltip text={translations[anomaly.descriptionKey] || 'Anomaly detected'}>
            <span className="ml-2 cursor-help">{iconMap[anomaly.type]}</span>
        </Tooltip>
    );
};


const SortableHeader: React.FC<{
    title: string;
    tooltipText: string;
    sortKey: keyof Campaign;
    sortConfig: SortConfig;
    requestSort: (key: keyof Campaign) => void;
}> = ({ title, tooltipText, sortKey, sortConfig, requestSort }) => {
    const isSorted = sortConfig?.key === sortKey;
    
    return (
        <th
            className="p-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-50 transition-colors group"
            onClick={() => requestSort(sortKey)}
        >
            <Tooltip text={tooltipText}>
                <div className="flex items-center gap-1.5">
                    {title} 
                    <ArrowUpDown className={`w-3 h-3 transition-colors ${isSorted ? 'text-[#0064E0]' : 'text-gray-300 group-hover:text-gray-400'}`} />
                </div>
            </Tooltip>
        </th>
    );
};


export const CampaignTable: React.FC<CampaignTableProps> = ({ campaigns, translations: t }) => {
    const [filterText, setFilterText] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'spend', direction: 'descending' });

    const filteredCampaigns = useMemo(() => {
        return campaigns.filter(c => c.name.toLowerCase().includes(filterText.toLowerCase()));
    }, [campaigns, filterText]);

    const sortedCampaigns = useMemo(() => {
        let sortableItems = [...filteredCampaigns];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
                }
                if ((aValue as any) < (bValue as any)) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if ((aValue as any) > (bValue as any)) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [filteredCampaigns, sortConfig]);

    const requestSort = (key: keyof Campaign) => {
        let direction: 'ascending' | 'descending' = 'descending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const headers: { key: keyof Campaign; title: string; tooltip: string; }[] = [
        { key: 'spend', title: t.spendLabel, tooltip: t.tooltipSpend },
        { key: 'impressions', title: 'IMPR', tooltip: t.tooltipImpressions },
        { key: 'clicks', title: 'CLICKS', tooltip: t.tooltipClicks },
        { key: 'ctr', title: 'CTR', tooltip: t.tooltipCTR },
        { key: 'cpc', title: 'CPC', tooltip: t.tooltipCPC },
        { key: 'purchases', title: 'PURCH', tooltip: t.tooltipPurchases },
        { key: 'roas', title: 'ROAS', tooltip: t.tooltipROAS },
        { key: 'cpp', title: 'CPP', tooltip: t.tooltipCPP },
    ];


    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Filter className="w-5 h-5 text-[#0064E0]" />
                    </div>
                    {t.chartCampaignTitle}
                </h3>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t.filterPlaceholder}
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="w-full p-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0064E0] focus:bg-white transition-all text-sm font-medium"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="p-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Campaign</th>
                            {headers.map(header => (
                               <SortableHeader
                                   key={header.key}
                                   title={header.title}
                                   tooltipText={header.tooltip}
                                   sortKey={header.key}
                                   sortConfig={sortConfig}
                                   requestSort={requestSort}
                                />
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {sortedCampaigns.map((campaign, idx) => (
                            <motion.tr 
                                key={campaign.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="hover:bg-blue-50/30 transition-colors group"
                            >
                                <td className="p-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 truncate max-w-[240px]" title={campaign.name}>{campaign.name}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${campaign.roas > 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {campaign.roas > 2 ? 'Scaling' : 'Monitoring'}
                                                </span>
                                                {campaign.anomalies?.map((anomaly, index) => (
                                                    <AnomalyIndicator key={index} anomaly={anomaly} translations={t} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 whitespace-nowrap text-sm text-gray-600 font-bold">€{campaign.spend.toLocaleString()}</td>
                                <td className="p-4 whitespace-nowrap text-sm text-gray-500 font-medium">{campaign.impressions.toLocaleString()}</td>
                                <td className="p-4 whitespace-nowrap text-sm text-gray-500 font-medium">{campaign.clicks.toLocaleString()}</td>
                                <td className="p-4 whitespace-nowrap text-sm text-gray-600 font-bold">{campaign.ctr.toFixed(2)}%</td>
                                <td className="p-4 whitespace-nowrap text-sm text-gray-500 font-medium">€{campaign.cpc.toFixed(2)}</td>
                                <td className="p-4 whitespace-nowrap text-sm text-gray-900 font-black">{campaign.purchases.toLocaleString()}</td>
                                <td className="p-4 whitespace-nowrap">
                                    <span className={`text-sm font-black px-2 py-1 rounded-lg ${campaign.roas > 2 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-900'}`}>
                                        {campaign.roas.toFixed(2)}x
                                    </span>
                                </td>
                                <td className="p-4 whitespace-nowrap text-sm text-gray-500 font-medium">€{campaign.cpp.toFixed(2)}</td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {sortedCampaigns.length === 0 && (
                <div className="p-20 text-center">
                    <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">No campaigns found matching your filter.</p>
                </div>
            )}
        </motion.div>
    );
};
