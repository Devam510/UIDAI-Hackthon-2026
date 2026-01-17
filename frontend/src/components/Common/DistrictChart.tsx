import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search } from 'lucide-react';
import clsx from 'clsx';

interface DistrictData {
    name: string;
    value: number;
}

interface DistrictChartProps {
    enrolmentData: DistrictData[];
    biometricData: DistrictData[];
    demographicData?: DistrictData[];
    onModeChange?: (mode: 'enrolment' | 'biometric' | 'demographic') => void;
}

const DistrictChart: React.FC<DistrictChartProps> = ({
    enrolmentData,
    biometricData,
    demographicData = [],
    onModeChange
}) => {
    const [mode, setMode] = useState<'enrolment' | 'biometric' | 'demographic'>('enrolment');
    const [searchTerm, setSearchTerm] = useState('');

    const currentData = mode === 'enrolment' ? enrolmentData : mode === 'biometric' ? biometricData : demographicData;

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return currentData;
        return currentData.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [currentData, searchTerm]);

    const handleModeChange = (newMode: 'enrolment' | 'biometric' | 'demographic') => {
        setMode(newMode);
        onModeChange?.(newMode);
    };

    const option = useMemo(() => ({
        backgroundColor: 'transparent',
        grid: {
            left: '15%',
            right: '5%',
            top: '3%',
            bottom: '3%',
            containLabel: true
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            backgroundColor: '#1e293b',
            borderColor: '#334155',
            borderRadius: 8,
            textStyle: { color: '#fff' },
            formatter: (params: any) => {
                const data = params[0];
                return `<strong>${data.name}</strong><br/>Risk Score: <strong>${data.value.toFixed(1)}</strong>`;
            }
        },
        xAxis: {
            type: 'value',
            max: 10,
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
        },
        yAxis: {
            type: 'category',
            data: filteredData.map(d => d.name),
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: {
                color: '#94a3b8',
                fontSize: 12,
                width: 100,
                overflow: 'truncate'
            },
            splitLine: { show: false }
        },
        series: [{
            type: 'bar',
            data: filteredData.map((d, index) => ({
                value: d.value,
                itemStyle: {
                    color: index < 3 ? '#ef4444' : index < 7 ? '#f59e0b' : '#6366f1',
                    borderRadius: [0, 4, 4, 0]
                }
            })),
            barMaxWidth: 30,
            label: {
                show: false
            }
        }]
    }), [filteredData]);

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Toggle Switch */}
                <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800/50 rounded-lg p-1">
                    <button
                        onClick={() => handleModeChange('enrolment')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                            mode === 'enrolment'
                                ? "bg-primary-600 text-white shadow-lg"
                                : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        Enrolment Risk
                    </button>
                    <button
                        onClick={() => handleModeChange('biometric')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                            mode === 'biometric'
                                ? "bg-primary-600 text-white shadow-lg"
                                : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        Biometric Risk
                    </button>
                    <button
                        onClick={() => handleModeChange('demographic')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                            mode === 'demographic'
                                ? "bg-primary-600 text-white shadow-lg"
                                : "text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                    >
                        Demographic Risk
                    </button>
                </div>

                {/* Search Input */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search districts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                    />
                </div>
            </div>

            {/* Chart */}
            <div className="h-[400px] w-full">
                {filteredData.length > 0 ? (
                    <ReactECharts
                        option={option}
                        style={{ height: '100%', width: '100%' }}
                        opts={{ renderer: 'canvas' }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        No districts found matching "{searchTerm}"
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>High Risk (Top 3)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span>Medium Risk (4-7)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-primary-500"></div>
                    <span>Lower Risk</span>
                </div>
            </div>
        </div>
    );
};

export default DistrictChart;
