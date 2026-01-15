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
            className="min-w-[320px] bg-dark-card border border-slate-700 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/20 hover:border-primary-500/50 group"
        >
            {/* Header with state name and risk badge */}
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                    {stateName}
                </h3>
                <span className={clsx(
                    "px-3 py-1 rounded-full text-xs font-semibold text-white",
                    riskLevel.color
                )}>
                    {riskLevel.label}
                </span>
            </div>

            {/* Metrics grid */}
            <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Risk Score</span>
                    <span className={clsx("text-lg font-bold", riskLevel.textColor)}>
                        {riskScore.toFixed(1)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Anomaly Severity</span>
                    <span className="text-lg font-bold text-orange-400">
                        {anomalySeverity.toFixed(1)}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Neg. Gap Ratio</span>
                    <span className="text-lg font-bold text-blue-400">
                        {negativeGapRatio.toFixed(1)}%
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Forecast Growth</span>
                    <span className="text-lg font-bold text-emerald-400">
                        {forecastGrowth.toFixed(1)}%
                    </span>
                </div>
            </div>

            {/* Top district */}
            {topDistrict && (
                <div className="flex items-center gap-2 mb-4 text-sm text-slate-300 bg-slate-800/50 rounded-lg p-2">
                    <MapPin size={14} className="text-primary-400" />
                    <span>Top Hotspot: <span className="font-semibold">{topDistrict}</span></span>
                </div>
            )}

            {/* CTA button */}
            <button className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 group-hover:shadow-lg group-hover:shadow-primary-500/30">
                View State
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
    );
};

export default FlashCard;
