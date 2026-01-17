import React from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import clsx from 'clsx';

interface SparklineProps {
    data: number[];
    label: string;
    color?: string;
    changePercent?: number;
}

const Sparkline: React.FC<SparklineProps> = ({
    data,
    label,
    color = '#6366f1',
    changePercent
}) => {
    const isPositive = changePercent !== undefined && changePercent >= 0;
    const hasChange = changePercent !== undefined;

    const option = {
        backgroundColor: 'transparent',
        grid: {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        },
        xAxis: {
            type: 'category',
            show: false,
            data: data.map((_, i) => i)
        },
        yAxis: {
            type: 'value',
            show: false
        },
        series: [{
            type: 'line',
            data: data,
            smooth: true,
            showSymbol: false,
            lineStyle: {
                color: color,
                width: 2
            },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                        offset: 0,
                        color: color + '40'
                    }, {
                        offset: 1,
                        color: color + '00'
                    }]
                }
            }
        }]
    };

    return (
        <div className="bg-white dark:bg-dark-card border border-slate-300 dark:border-slate-700 rounded-xl p-4 hover:border-primary-500/50 transition-all duration-300">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-sm text-slate-700 dark:text-slate-400 font-medium">{label}</p>
                    {hasChange && (
                        <div className={clsx(
                            "flex items-center gap-1 mt-1",
                            isPositive ? "text-emerald-400" : "text-red-400"
                        )}>
                            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span className="text-xs font-semibold">
                                {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
                            </span>
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {data[data.length - 1]?.toFixed(1) || '0'}
                    </p>
                </div>
            </div>

            <div className="h-16 w-full">
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                />
            </div>
        </div>
    );
};

export default Sparkline;
