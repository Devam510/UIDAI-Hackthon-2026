import { useTheme } from '../hooks/useTheme';

/**
 * ECharts theme configuration that adapts to light/dark mode
 * @param isDark - Whether dark mode is active
 * @returns ECharts theme configuration object
 */
export const getEChartsTheme = (isDark: boolean) => ({
    backgroundColor: 'transparent',

    textStyle: {
        color: isDark ? '#f1f5f9' : '#0f172a', // slate-100 / slate-900
        fontFamily: 'Inter, sans-serif'
    },

    title: {
        textStyle: {
            color: isDark ? '#f1f5f9' : '#0f172a',
            fontWeight: 'bold'
        },
        subtextStyle: {
            color: isDark ? '#94a3b8' : '#64748b' // slate-400 / slate-500
        }
    },

    legend: {
        textStyle: {
            color: isDark ? '#cbd5e1' : '#475569' // slate-300 / slate-600
        }
    },

    grid: {
        borderColor: isDark ? '#334155' : '#e2e8f0' // slate-700 / slate-200
    },

    categoryAxis: {
        axisLine: {
            lineStyle: {
                color: isDark ? '#475569' : '#cbd5e1' // slate-600 / slate-300
            }
        },
        axisTick: {
            lineStyle: {
                color: isDark ? '#475569' : '#cbd5e1'
            }
        },
        axisLabel: {
            color: isDark ? '#94a3b8' : '#64748b' // slate-400 / slate-500
        },
        splitLine: {
            lineStyle: {
                color: isDark ? '#334155' : '#e2e8f0' // slate-700 / slate-200
            }
        }
    },

    valueAxis: {
        axisLine: {
            lineStyle: {
                color: isDark ? '#475569' : '#cbd5e1'
            }
        },
        axisTick: {
            lineStyle: {
                color: isDark ? '#475569' : '#cbd5e1'
            }
        },
        axisLabel: {
            color: isDark ? '#94a3b8' : '#64748b'
        },
        splitLine: {
            lineStyle: {
                color: isDark ? '#334155' : '#e2e8f0',
                type: 'dashed'
            }
        }
    },

    tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff', // slate-800 / white
        borderColor: isDark ? '#334155' : '#e2e8f0', // slate-700 / slate-200
        borderWidth: 1,
        textStyle: {
            color: isDark ? '#f1f5f9' : '#0f172a'
        }
    },

    line: {
        itemStyle: {
            borderWidth: 2
        },
        lineStyle: {
            width: 2
        },
        symbolSize: 6,
        symbol: 'circle',
        smooth: false
    },

    candlestick: {
        itemStyle: {
            color: '#10b981', // green-500
            color0: '#ef4444', // red-500
            borderColor: '#10b981',
            borderColor0: '#ef4444'
        }
    }
});

/**
 * Custom hook to get ECharts theme based on current theme
 * @returns ECharts theme configuration
 */
export const useEChartsTheme = () => {
    const { theme } = useTheme();
    return getEChartsTheme(theme === 'dark');
};
