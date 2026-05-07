
import React, { useMemo } from 'react';
import { CreativeAnglePerformance } from '../types';

interface CreativeAngleTableProps {
    creativeAngles: CreativeAnglePerformance[];
    translations: Record<string, string>;
}

export const CreativeAngleTable: React.FC<CreativeAngleTableProps> = ({ creativeAngles, translations: t }) => {

    if (creativeAngles.length === 0) return null;

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 h-full">
            <h3 className="text-xl font-bold text-gray-900 mb-6">{t.creativeAngleTitle}</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t.creativeAngleLabel}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t.campaignsLabel}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{`${t.spendLabel} (€)`}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t.purchasesLabel}</th>
                            <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t.roasLabel}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {creativeAngles.map(angle => (
                            <tr key={angle.angle} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-3 whitespace-nowrap text-sm font-bold text-gray-900">{angle.angle}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-gray-600">{angle.campaignCount}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-gray-600">€{angle.spend.toFixed(2)}</td>
                                <td className="p-3 whitespace-nowrap text-sm text-gray-600 font-bold">{angle.purchases.toLocaleString()}</td>
                                <td className={`p-3 whitespace-nowrap text-sm font-bold ${angle.roas > 2 ? 'text-green-600' : 'text-gray-900'}`}>{angle.roas.toFixed(2)}x</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
