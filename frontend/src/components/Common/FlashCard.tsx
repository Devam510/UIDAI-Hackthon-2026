import React from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import clsx from 'clsx';

interface FlashCardProps {
    stateName: string;
    riskScore: number;
    anomalySeverity: number;
    negativeGapRatio: number;
    forecastGrowth: number;
    topDistrict?: string;
    onClick: () => void;
}

const FlashCard: React.FC<FlashCardProps> = ({
    stateName,
    riskScore,
    anomalySeverity,
    negativeGapRatio,
    forecastGrowth,
    topDistrict,
    onClick
}) => {
    // Determine risk level and color
    const getRiskLevel = (score: number) => {
        if (score >= 7) return { label: 'High', color: 'bg-red-500', textColor: 'text-red-500' };
        if (score >= 4) return { label: 'Medium', color: 'bg-orange-500', textColor: 'text-orange-500' };
        return { label: 'Low', color: 'bg-green-500', textColor: 'text-green-500' };
    };

    const riskLevel = getRiskLevel(riskScore);

    return (
        <div
            onClick={onClick}
            className="
                flex-shrink-0 w-64 min-h-[340px]
                bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900
                rounded-xl border border-slate-200 dark:border-slate-700
                shadow-lg dark:shadow-none
                cursor-pointer transition-all duration-300
                hover:scale-105 hover:shadow-xl hover:shadow-primary-500/20
                relative overflow-hidden
                flex flex-col
            "
        >
            {/* Risk Score Badge */}
            <div className="absolute top-3 right-3 z-10">
                <div className={`
                    px-3 py-1 rounded-full text-xs font-bold shadow-md
                    ${riskScore >= 7 ? 'bg-red-500 text-white' : riskScore >= 4 ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}
                `}>
                    {riskLevel.label}
                </div>
            </div>

            {/* State Name - Fixed height with truncation */}
            <div className="p-4 flex-shrink-0 border-b border-slate-100 dark:border-slate-700/50 mb-2">
                <h3
                    className="text-xl font-bold text-slate-900 dark:text-white line-clamp-2 min-h-[56px]"
                    title={stateName}
                >
                    {stateName}
                </h3>
            </div>

            {/* Metrics grid */}
            <div className="px-4 space-y-3 mb-4 flex-1">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Risk Score</span>
                    <span className={clsx("text-lg font-bold", riskLevel.textColor)}>
                        {riskScore.toFixed(1)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Anomaly Severity</span>
                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                        {anomalySeverity.toFixed(1)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Neg. Gap Ratio</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {negativeGapRatio.toFixed(1)}%
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Forecast Growth</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {forecastGrowth.toFixed(1)}%
                    </span>
                </div>
            </div>

            {/* Top district */}
            {topDistrict && (
                <div className="mx-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-lg p-2.5">
                        <MapPin size={14} className="text-primary-500 dark:text-primary-400 flex-shrink-0" />
                        <span className="truncate">Top: <span className="font-semibold">{topDistrict}</span></span>
                    </div>
                </div>
            )}

            {/* CTA button */}
            <div className="p-4 pt-0 mt-auto">
                <button className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-primary-600 hover:bg-slate-800 dark:hover:bg-primary-500 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 group-hover:shadow-lg">
                    View State
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default FlashCard;
