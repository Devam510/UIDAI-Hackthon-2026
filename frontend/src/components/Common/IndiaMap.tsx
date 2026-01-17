import React from 'react';
import India from '@svg-maps/india';
import { normalizeStateName } from '../../utils/state-name-mapper';

interface StateData {
    name: string;
    risk_score: number;
}

interface IndiaMapProps {
    statesData: StateData[];
    onStateClick: (stateName: string) => void;
}

const IndiaMap: React.FC<IndiaMapProps> = ({ statesData, onStateClick }) => {
    // Get risk color based on score
    const getRiskColor = (riskScore: number): string => {
        if (riskScore >= 7) return '#ef4444'; // Red - Severe
        if (riskScore >= 4) return '#f97316'; // Orange - Moderate
        return '#22c55e'; // Green - Low
    };

    // Find state data by name - EXACT MATCHING ONLY
    const getStateData = (mapStateName: string): StateData | undefined => {
        // Normalize map name to official CSV name
        const csvStateName = normalizeStateName(mapStateName);

        // Exact match only - no fuzzy matching to prevent errors
        return statesData.find(s => s.name === csvStateName);
    };

    // FINAL user-provided coordinates for perfect label positioning
    const labelPositions: Record<string, { x: number; y: number }> = {
        'an': { x: 530, y: 610 },          // Andaman and Nicobar Islands
        'ap': { x: 300, y: 505 },          // Andhra Pradesh
        'ar': { x: 580, y: 205 },          // Arunachal Pradesh
        'as': { x: 490, y: 265 },          // Assam
        'br': { x: 370, y: 280 },          // Bihar
        'ch': { x: 200, y: 155 },          // Chandigarh (moved slightly right)
        'ct': { x: 300, y: 380 },          // Chhattisgarh
        'dn': { x: 85, y: 410 },          // Dadra and Nagar Haveli and Daman and Diu
        'dd': { x: 10, y: 395 },          // Daman and Diu (same as Dadra - merged UT)
        'dl': { x: 205, y: 210 },          // Delhi (moved slightly right)
        'ga': { x: 110, y: 515 },          // Goa
        'gj': { x: 80, y: 330 },          // Gujarat
        'hr': { x: 165, y: 192 },          // Haryana (moved slightly right)
        'hp': { x: 220, y: 130 },          // Himachal Pradesh
        'jk': { x: 175, y: 70 },           // Jammu and Kashmir
        'jh': { x: 350, y: 330 },          // Jharkhand
        'ka': { x: 165, y: 540 },          // Karnataka
        'kl': { x: 150, y: 600 },          // Kerala
        'ld': { x: 95, y: 630 },           // Lakshadweep (moved left and up)
        'mh': { x: 150, y: 425 },          // Maharashtra
        'mn': { x: 545, y: 305 },          // Manipur
        'ml': { x: 475, y: 290 },          // Meghalaya
        'mz': { x: 525, y: 355 },          // Mizoram
        'mp': { x: 220, y: 340 },          // Madhya Pradesh
        'nl': { x: 565, y: 270 },          // Nagaland
        'or': { x: 350, y: 395 },          // Odisha
        'pb': { x: 150, y: 165 },          // Punjab
        'py': { x: 295, y: 590 },          // Puducherry (adjusted position)
        'rj': { x: 120, y: 250 },          // Rajasthan
        'sk': { x: 415, y: 235 },          // Sikkim
        'tn': { x: 220, y: 600 },          // Tamil Nadu
        'tg': { x: 230, y: 455 },          // Telangana
        'tr': { x: 480, y: 325 },          // Tripura
        'up': { x: 275, y: 250 },          // Uttar Pradesh
        'ut': { x: 240, y: 170 },          // Uttarakhand
        'wb': { x: 415, y: 340 },          // West Bengal
    };

    return (
        <div className="relative w-full h-full min-h-[500px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl border-2 border-slate-300 dark:border-slate-700 p-6 shadow-lg">
            {/* Title */}
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">India Risk Map</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Click a state to view details</p>
            </div>

            {/* Legend */}
            <div className="absolute top-4 right-4 z-10 bg-white/90 dark:bg-slate-800/90 border-2 border-slate-300 dark:border-slate-700 rounded-lg p-3 shadow-lg">
                <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">Risk Level</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
                        <span className="text-xs text-slate-700 dark:text-slate-300">Low (<4)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }}></div>
                        <span className="text-xs text-slate-700 dark:text-slate-300">Moderate (4-7)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                        <span className="text-xs text-slate-700 dark:text-slate-300">Severe (≥7)</span>
                    </div>
                </div>
            </div>

            {/* SVG Map - Using real India geographical data */}
            <svg
                viewBox={India.viewBox}
                className="w-full h-full"
                style={{ maxHeight: '700px' }}
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Render all states/locations from the India map */}
                {India.locations.map((location: { id: string; name: string; path: string }) => {
                    const stateData = getStateData(location.name);
                    const riskScore = stateData?.risk_score || 0;
                    const fillColor = getRiskColor(riskScore);
                    const labelPos = labelPositions[location.id] || { x: 0, y: 0 };

                    return (
                        <g key={location.id}>
                            {/* State shape - real geographical boundaries */}
                            <path
                                d={location.path}
                                fill={fillColor}
                                fillOpacity="0.8"
                                stroke="#1e293b"
                                strokeWidth="1"
                                strokeLinejoin="round"
                                className="cursor-pointer transition-all duration-200 hover:fill-opacity-95 hover:stroke-primary-400 hover:stroke-[2]"
                                onClick={() => onStateClick(location.name)}
                            >
                                <title>{`${location.name}\nRisk Score: ${riskScore.toFixed(1)}`}</title>
                            </path>

                            {/* State label - enhanced visibility */}
                            {labelPos.x > 0 && (
                                <>
                                    <text
                                        x={labelPos.x}
                                        y={labelPos.y}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        className="font-bold fill-white pointer-events-none select-none"
                                        style={{
                                            fontSize: '10px',
                                            textShadow: '2px 2px 4px rgba(0,0,0,1), -1px -1px 3px rgba(0,0,0,1), 1px -1px 3px rgba(0,0,0,1), -1px 1px 3px rgba(0,0,0,1)',
                                            letterSpacing: '0.3px'
                                        }}
                                    >
                                        {location.name.length > 18 ? location.id.toUpperCase() : location.name}
                                    </text>

                                    {/* Risk score badge - larger and more visible */}
                                    {stateData && (
                                        <text
                                            x={labelPos.x}
                                            y={labelPos.y + 13}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="font-extrabold fill-yellow-300 pointer-events-none select-none"
                                            style={{
                                                fontSize: '9px',
                                                textShadow: '2px 2px 4px rgba(0,0,0,1), -1px -1px 3px rgba(0,0,0,1)'
                                            }}
                                        >
                                            {riskScore.toFixed(1)}
                                        </text>
                                    )}
                                </>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Mobile hint */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-slate-600 dark:text-slate-500 text-center">
                Tap any state to view detailed analytics
            </div>
        </div>
    );
};

export default IndiaMap;
