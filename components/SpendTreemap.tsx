
import React from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { Campaign } from '../types';

interface SpendTreemapProps {
    data: Campaign[];
    translations: Record<string, string>;
}

const getHexColor = (roas: number, hasRoasData: boolean) => {
    if (!hasRoasData) {
        return '#4A5568'; // gray-600
    }
    if (roas > 4) return '#2F855A'; // green-700 (Excellent)
    if (roas > 2.5) return '#38A169'; // green-600 (Good)
    if (roas > 1) return '#D69E2E'; // yellow-600 (Okay)
    return '#C53030'; // red-700 (Bad)
};

const CustomizedContent: React.FC<any> = ({ root, depth, x, y, width, height, index, name, roas }) => {
    const hasRoasData = roas > 0.01;
    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: getHexColor(roas, hasRoasData),
                    stroke: '#fff',
                    strokeWidth: 2,
                    strokeOpacity: 1,
                }}
            />
            {width > 80 && height > 40 && (
                <text x={x + width / 2} y={y + height / 2 + 7} textAnchor="middle" fill="#fff" fontSize={12} fontWeight="bold">
                    {name}
                </text>
            )}
        </g>
    );
};

const CustomTooltip: React.FC<any> = ({ active, payload, translations: t }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xl">
                <p className="font-bold text-gray-900 mb-2">{data.name}</p>
                <div className="space-y-1">
                    <p className="text-sm text-gray-600 flex justify-between gap-4">
                        <span>{t.spendLabel}:</span>
                        <span className="font-bold text-gray-900">€{data.spend.toFixed(2)}</span>
                    </p>
                    {data.roas > 0.01 ? (
                       <p className="text-sm text-gray-600 flex justify-between gap-4">
                           <span>{t.roasLabel}:</span>
                           <span className="font-bold text-green-600">{data.roas.toFixed(2)}x</span>
                       </p>
                    ) : (
                       <p className="text-sm text-gray-600 flex justify-between gap-4">
                           <span>{t.cppLabel}:</span>
                           <span className="font-bold text-blue-600">€{data.cpp.toFixed(2)}</span>
                       </p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};


export const SpendTreemap: React.FC<SpendTreemapProps> = ({ data, translations }) => {
    const hasRoasData = data.some(c => c.roas > 0.01);
    
    const treemapData = data
        .filter(d => d.spend > 0)
        .map(d => ({
            name: d.name,
            spend: d.spend,
            roas: d.roas,
            cpp: d.cpp
        }));
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
            <h3 className="text-xl font-bold mb-6 text-gray-900">{translations.spendDistributionTitle}</h3>
            <ResponsiveContainer width="100%" height={400}>
                <Treemap
                    data={treemapData}
                    dataKey="spend"
                    stroke="#fff"
                    fill="#0064E0"
                    content={<CustomizedContent />}
                    isAnimationActive={true}
                >
                    <Tooltip content={<CustomTooltip translations={translations}/>} />
                </Treemap>
            </ResponsiveContainer>
        </div>
    );
};
