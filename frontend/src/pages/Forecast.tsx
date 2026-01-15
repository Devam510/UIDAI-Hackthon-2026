import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Play, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../components/Common/Card';
import Loader from '../components/Common/Loader';
import ErrorRetry from '../components/Common/ErrorRetry';
import DataTimestamp from '../components/Common/DataTimestamp';
import ExportButton from '../components/Common/ExportButton';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { useStateContext } from '../context/StateContext';

const Forecast: React.FC = () => {
    const { selectedState } = useStateContext();

    // CRITICAL FIX: Use last available data date, NOT today()
    // Data ends at Dec 31, 2025 - never show dates beyond this
    // DEFAULT: Show ALL 2025 data (full year view as in sample photo)
    const LAST_AVAILABLE_DATE = '2025-12-31';
    const YEAR_START_2025 = '2025-01-01';

    const [fromDate, setFromDate] = useState(YEAR_START_2025);
    const [toDate, setToDate] = useState(LAST_AVAILABLE_DATE);
    const [days, setDays] = useState(30);
    // REMOVED: granularity state - forced to monthly only

    const [loading, setLoading] = useState(false);
    const [training, setTraining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [forecastData, setForecastData] = useState<any[]>([]);
    const [historicalData, setHistoricalData] = useState<any[]>([]);
    const [insights, setInsights] = useState<any>(null);
    const [modelStatus, setModelStatus] = useState<'ready' | 'needs_training'>('ready');
    const [showModelInfo, setShowModelInfo] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [lastAvailableDate, setLastAvailableDate] = useState<string>(LAST_AVAILABLE_DATE);
    const [trendSlope, setTrendSlope] = useState<number>(0);
    const [trendAnalysis, setTrendAnalysis] = useState<any>(null);
    const [dataQuality, setDataQuality] = useState<any>(null);

    // Calculate days from date range
    useEffect(() => {
        const from = new Date(fromDate);
        const to = new Date(toDate);
        const diffTime = Math.abs(to.getTime() - from.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDays(diffDays);
    }, [fromDate, toDate]);

    const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch forecast first (critical data)
            const forecastRes = await client.get(ENDPOINTS.ML.FORECAST, {
                params: { state: selectedState, days }
            });

            console.log('Forecast API Response:', forecastRes.data);

            // Extract data from the new response format
            const forecastData = forecastRes.data.forecast || [];
            const historicalData = forecastRes.data.historical || [];

            console.log('Raw forecast data:', forecastData.length, 'points');
            console.log('Raw historical data:', historicalData.length, 'points');

            // Transform historical data to match expected format
            const transformedHistorical = historicalData.map((d: any) => ({
                date: d.date,
                actual: d.value,
                type: 'historical'
            }));

            // Transform forecast data to match expected format
            const transformedForecast = forecastData.map((d: any) => ({
                date: d.date,
                value: d.value,
                lower: d.lower,
                upper: d.upper,
                type: 'forecast'
            }));

            console.log('Transformed forecast:', transformedForecast.length, 'points');
            console.log('Transformed historical:', transformedHistorical.length, 'points');

            setForecastData(transformedForecast);
            setHistoricalData(transformedHistorical);
            setModelStatus('ready');
            setLastUpdated(new Date());

            // Extract last available date and trend slope from forecast response
            if (forecastRes.data.last_available_date) {
                setLastAvailableDate(forecastRes.data.last_available_date);
            }
            if (forecastRes.data.trend_slope !== undefined) {
                setTrendSlope(forecastRes.data.trend_slope);
            }
            if (forecastRes.data.trend_analysis) {
                setTrendAnalysis(forecastRes.data.trend_analysis);
            }
            if (forecastRes.data.data_quality) {
                setDataQuality(forecastRes.data.data_quality);
            }

            // Fetch insights separately (non-critical)
            try {
                const insightsRes = await client.get(ENDPOINTS.ML.FORECAST_INSIGHTS, {
                    params: { state: selectedState, days }
                });
                setInsights(insightsRes.data);
            } catch (insightsErr) {
                console.warn('Failed to load insights (non-critical):', insightsErr);
            }
        } catch (err: any) {
            console.error('Forecast fetch error:', err);
            if (err.response?.status === 404 || err.response?.data?.message?.includes('not trained')) {
                setModelStatus('needs_training');
                setError("Model not trained for this state.");
            } else {
                setError("Failed to load forecast data.");
            }
        } finally {
            setLoading(false);
        }
    };

    const trainModel = async () => {
        setTraining(true);
        setError(null);
        try {
            await client.post(ENDPOINTS.ML.TRAIN_FORECAST, null, {
                params: { state: selectedState }
            });
            fetchAllData();
        } catch (err) {
            console.error(err);
            setError("Training failed. Please try again.");
        } finally {
            setTraining(false);
        }
    };

    const handleReset = () => {
        // Reset to full 2025 year view
        setFromDate(YEAR_START_2025);
        setToDate(LAST_AVAILABLE_DATE);
    };

    useEffect(() => {
        fetchAllData();
    }, [selectedState, days, fromDate, toDate]);

    // Clamp negative values to 0
    const clampedForecastData = forecastData.map(d => {
        const value = Math.max(0, d.value || 0);
        const lower = Math.max(0, d.lower || 0);
        const upper = Math.max(0, d.upper || 0);
        return {
            ...d,
            value,
            lower,
            upper
        };
    });

    const clampedHistoricalData = historicalData.map(d => ({
        ...d,
        actual: Math.max(0, d.actual || 0)
    }));

    // MONTHLY AGGREGATION ONLY (no daily/weekly)
    const aggregateMonthly = (data: any[], type: 'historical' | 'forecast') => {
        const grouped: { [key: string]: any[] } = {};

        data.forEach(d => {
            const date = new Date(d.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(d);
        });

        return Object.keys(grouped).sort().map(key => {
            const group = grouped[key];
            const avgData: any = { date: key };

            if (type === 'historical') {
                avgData.actual = Math.round(group.reduce((sum, d) => sum + (d.actual || 0), 0) / group.length);
            } else {
                avgData.value = Math.round(group.reduce((sum, d) => sum + (d.value || 0), 0) / group.length);
                avgData.lower = Math.round(group.reduce((sum, d) => sum + (d.lower || 0), 0) / group.length);
                avgData.upper = Math.round(group.reduce((sum, d) => sum + (d.upper || 0), 0) / group.length);
            }

            return avgData;
        });
    };

    const aggregatedHistorical = aggregateMonthly(clampedHistoricalData, 'historical');
    const aggregatedForecast = aggregateMonthly(clampedForecastData, 'forecast');

    // Combine historical and forecast data for the graph
    const combinedData = [
        ...aggregatedHistorical.map(d => ({ ...d, type: 'historical' })),
        ...aggregatedForecast.map(d => ({ ...d, type: 'forecast' }))
    ];

    // Calculate KPIs (MONTHLY DATA)
    // Last month's value (not last 7 days)
    const lastMonthValue = aggregatedHistorical.length > 0
        ? aggregatedHistorical[aggregatedHistorical.length - 1].actual
        : 0;

    // Average of forecast predictions
    const forecastAvg = aggregatedForecast.length > 0
        ? Math.round(aggregatedForecast.reduce((sum, d) => sum + (d.value || 0), 0) / aggregatedForecast.length)
        : 0;

    // Growth % = (avg forecast - last month) / last month
    const expectedGrowth = lastMonthValue > 0
        ? (((forecastAvg - lastMonthValue) / lastMonthValue) * 100).toFixed(1)
        : '0.0';

    // Use backend trend_slope for trend badge (more accurate)
    const trendBadge = trendSlope > 100 ? 'Increasing' : trendSlope < -100 ? 'Decreasing' : 'Stable';
    const trendColor = trendBadge === 'Increasing' ? 'text-green-500' : trendBadge === 'Decreasing' ? 'text-red-500' : 'text-yellow-500';

    // Find the separator point (first forecast date)
    const separatorDate = aggregatedForecast.length > 0 ? aggregatedForecast[0]?.date : null;

    // Calculate chart option with EXACT match to reference image
    const chartOption = useMemo(() => {
        // TREND-AWARE VISUAL DESIGN: Use trend_slope from backend
        const isAscending = trendSlope >= 0;

        // EXACT COLORS from reference image
        const historicalColor = '#5B8FF9'; // Blue for historical
        const forecastColor = '#FF6B9D'; // Pink for forecast (Prophet Forecast)
        const confidenceBandColor = 'rgba(139, 87, 66, 0.4)'; // Brown/reddish for confidence
        const forecastStartColor = '#F59E0B'; // Orange for forecast start marker

        // Trend-aware background (subtle overlay in forecast region)
        const bgOverlayColor = isAscending
            ? 'rgba(16, 185, 129, 0.03)' // Very subtle green for upward
            : 'rgba(139, 87, 66, 0.08)'; // Subtle reddish-brown for downward (as in image)

        // Prepare data arrays
        const dates = combinedData.map(d => d.date);

        // Historical values: only for historical data points
        const historicalValues = combinedData.map(d => d.actual ?? null);

        // Predicted values: for forecast data points
        // BUT we need to include the last historical value to connect the lines
        const predictedValues = combinedData.map((d, idx) => {
            if (d.type === 'forecast') {
                return d.value ?? null;
            }
            // For historical points, return null EXCEPT for the last one
            if (d.type === 'historical' && idx === aggregatedHistorical.length - 1) {
                // Last historical point - use it to connect forecast line
                return d.actual ?? null;
            }
            return null;
        });

        // Confidence bounds: only for forecast data points
        const lowerBounds = combinedData.map(d => d.lower ?? null);
        const upperBounds = combinedData.map(d => d.upper ?? null);

        console.log('Chart data prepared:', {
            totalDates: dates.length,
            historicalPoints: historicalValues.filter(v => v !== null).length,
            forecastPoints: predictedValues.filter(v => v !== null).length,
            lowerBounds: lowerBounds.filter(v => v !== null).length
        });

        // Find separator index for forecast start marker
        const separatorIndex = separatorDate ? dates.indexOf(separatorDate) : -1;

        return {
            backgroundColor: bgOverlayColor, // Trend-aware subtle background
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '10%',
                containLabel: true
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                textStyle: { color: '#fff' },
                formatter: (params: any) => {
                    const date = params[0].axisValue;
                    let tooltip = `<strong>${date}</strong><br/>`;
                    params.forEach((param: any) => {
                        if (param.value != null && param.seriesName !== 'Upper Bound') {
                            tooltip += `${param.marker} ${param.seriesName}: <strong>${Math.round(param.value).toLocaleString()}</strong><br/>`;
                        }
                    });
                    // Add bounds info
                    const idx = dates.indexOf(date);
                    if (idx >= 0 && lowerBounds[idx] != null && upperBounds[idx] != null) {
                        tooltip += `<span style="color: #94a3b8;">Range: ${Math.round(lowerBounds[idx]).toLocaleString()} - ${Math.round(upperBounds[idx]).toLocaleString()}</span><br/>`;
                    }
                    return tooltip;
                }
            },
            // LEGEND ORDER: Exactly as in reference image
            legend: {
                data: ['95% Confidence Interval', 'Prophet Forecast', 'Historical Data'],
                bottom: 0,
                textStyle: { color: '#94a3b8', fontSize: 11 },
                itemGap: 20
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: {
                    color: '#94a3b8',
                    fontSize: 11,
                    formatter: (value: string) => {
                        const [year, month] = value.split('-');
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        return `${monthNames[parseInt(month) - 1]} ${year}`;
                    }
                },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                axisLine: { lineStyle: { color: '#334155' } },
                axisLabel: {
                    color: '#94a3b8',
                    fontSize: 11,
                    formatter: (value: number) => {
                        if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                        return value.toString();
                    }
                },
                splitLine: { lineStyle: { color: '#334155', type: 'dashed', opacity: 0.3 } }
            },
            dataZoom: [
                {
                    type: 'slider',
                    start: 0,
                    end: 100,
                    height: 20,
                    bottom: 35,
                    textStyle: { color: '#94a3b8' },
                    borderColor: '#334155',
                    fillerColor: 'rgba(99, 102, 241, 0.2)',
                    handleStyle: { color: '#6366f1' }
                },
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                }
            ],
            series: [
                // 1. CONFIDENCE BAND (drawn first, appears in background)
                {
                    name: 'Upper Bound',
                    type: 'line',
                    data: upperBounds,
                    lineStyle: { opacity: 0 },
                    stack: 'confidence',
                    areaStyle: { color: 'transparent' },
                    smooth: true,
                    showSymbol: false,
                    silent: true,
                    tooltip: { show: false },
                    z: 1
                },
                {
                    name: '95% Confidence Interval',
                    type: 'line',
                    data: lowerBounds,
                    lineStyle: { opacity: 0 },
                    stack: 'confidence',
                    areaStyle: {
                        color: 'rgba(139, 87, 66, 0.5)',  // Increased opacity for better visibility
                        opacity: 1
                    },
                    smooth: true,
                    showSymbol: false,
                    tooltip: { show: false },
                    z: 1
                },
                // 2. HISTORICAL DATA LINE (blue solid with points)
                {
                    name: 'Historical Data',
                    type: 'line',
                    data: historicalValues,
                    lineStyle: {
                        color: historicalColor,
                        width: 3,
                        type: 'solid'
                    },
                    itemStyle: {
                        color: historicalColor,
                        borderWidth: 2,
                        borderColor: '#1e293b'
                    },
                    smooth: false, // Allow zig-zag as in reference image
                    showSymbol: true,
                    symbol: 'circle',
                    symbolSize: 8,
                    connectNulls: false,
                    z: 3,
                    emphasis: {
                        focus: 'series',
                        itemStyle: {
                            borderWidth: 3,
                            shadowBlur: 10,
                            shadowColor: historicalColor
                        }
                    }
                },
                // 3. PROPHET FORECAST LINE (pink dashed)
                {
                    name: 'Prophet Forecast',
                    type: 'line',
                    data: predictedValues,
                    lineStyle: {
                        color: forecastColor,
                        width: 3,
                        type: 'dashed',
                        dashOffset: 0
                    },
                    itemStyle: {
                        color: forecastColor,
                        borderWidth: 2,
                        borderColor: '#1e293b'
                    },
                    smooth: true, // Smooth forecast trend
                    showSymbol: true,
                    symbol: 'circle',
                    symbolSize: 6,
                    connectNulls: false,
                    z: 2,
                    emphasis: {
                        focus: 'series',
                        itemStyle: {
                            borderWidth: 3,
                            shadowBlur: 10,
                            shadowColor: forecastColor
                        }
                    },
                    // FORECAST START MARKER (vertical dashed line with label)
                    markLine: separatorIndex >= 0 ? {
                        symbol: ['none', 'none'],
                        silent: true,
                        data: [{
                            xAxis: separatorDate,
                            label: {
                                formatter: '⚡ Forecast Start',
                                position: 'insideEndTop',
                                color: forecastStartColor,
                                fontSize: 11,
                                fontWeight: 'bold',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                padding: [4, 8],
                                borderRadius: 4
                            },
                            lineStyle: {
                                color: forecastStartColor,
                                type: 'dashed',
                                width: 2,
                                opacity: 0.8
                            }
                        }],
                        z: 4
                    } : undefined
                }
            ]
        };
    }, [combinedData, aggregatedForecast, separatorDate, trendSlope]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Data Timestamp */}
            <DataTimestamp
                lastDataDate={lastAvailableDate}
                generatedAt={new Date().toISOString()}
            />

            {/* Header with Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white">Forecast: {selectedState}</h2>
                <ExportButton
                    endpoint="/export/csv/forecast"
                    filename={`forecast_${selectedState}_${new Date().toISOString().split('T')[0]}.csv`}
                    state={selectedState}
                    label="Export Forecast"
                />
            </div>

            {/* Trend Analysis Warning */}
            <Card className="border-blue-500/50 bg-blue-900/10">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-blue-400 mt-1 flex-shrink-0" size={20} />
                    <div className="text-sm text-blue-200">
                        <strong>⚠️ Trend Direction Analysis Only:</strong> This page shows trend direction (upward/downward), NOT future predictions.
                        {dataQuality && (
                            <div className="mt-1">
                                Data quality: <strong>{dataQuality.quality_level}</strong> •
                                Confidence: <strong>{dataQuality.confidence}</strong> •
                                Last data: <strong>{lastAvailableDate}</strong>
                            </div>
                        )}
                        <div className="mt-1 text-xs opacity-80">
                            {dataQuality?.warning || 'Limited 2025 data - trend direction only, not predictions'}
                        </div>
                    </div>
                </div>
            </Card>

            {modelStatus === 'needs_training' && (
                <Card className="border-orange-500/50 bg-orange-900/10">
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <h3 className="text-xl font-semibold text-orange-200">Model Not Trained</h3>
                        <p className="text-orange-200/70 text-center max-w-md">
                            The forecast model for {selectedState} has not been trained yet or is outdated.
                        </p>
                        <button
                            onClick={trainModel}
                            disabled={training}
                            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {training ? <Loader /> : <Play size={18} fill="currentColor" />}
                            {training ? 'Training Model...' : 'Train Forecast Model'}
                        </button>
                    </div>
                </Card>
            )}

            {modelStatus === 'ready' && (
                <>
                    {error && <ErrorRetry message={error} onRetry={fetchAllData} />}

                    {loading ? (
                        <div className="h-96 flex items-center justify-center">
                            <Loader />
                        </div>
                    ) : (
                        <>
                            {/* KPI Summary Cards - TREND ANALYSIS FOCUS */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="group hover:scale-105 transition-transform duration-300 hover:shadow-xl hover:shadow-primary-500/20">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-slate-400 text-xs font-medium uppercase">Last Month Value</p>
                                            <h3 className="text-2xl font-bold text-white mt-1">{lastMonthValue.toLocaleString()}</h3>
                                        </div>
                                        <TrendingUp className="text-blue-500" size={20} />
                                    </div>
                                </Card>

                                <Card className={`group hover:scale-105 transition-transform duration-300 hover:shadow-xl border`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-slate-400 text-xs font-medium uppercase">Trend Direction</p>
                                            <h3 className={`text-2xl font-bold mt-1 ${trendColor}`}>
                                                {trendBadge} {trendBadge === 'Increasing' ? '📈' : trendBadge === 'Decreasing' ? '📉' : '➡️'}
                                            </h3>
                                            {trendAnalysis && (
                                                <p className="text-xs text-slate-400 mt-1">{trendAnalysis.strength} strength</p>
                                            )}
                                        </div>
                                        <CheckCircle2 className={trendColor} size={20} />
                                    </div>
                                </Card>

                                <Card className="group hover:scale-105 transition-transform duration-300 hover:shadow-xl">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-slate-400 text-xs font-medium uppercase">Data Confidence</p>
                                            <h3 className="text-2xl font-bold text-white mt-1 capitalize">
                                                {dataQuality?.confidence || 'Medium'}
                                            </h3>
                                            {dataQuality && (
                                                <p className="text-xs text-slate-400 mt-1">{dataQuality.training_months} months</p>
                                            )}
                                        </div>
                                        <Sparkles className="text-purple-500" size={20} />
                                    </div>
                                </Card>
                            </div>

                            {/* Trend Analysis Insight */}
                            {trendAnalysis && (
                                <Card className="border-primary-500/30 bg-gradient-to-br from-primary-500/5 to-transparent">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="text-primary-500 mt-1 flex-shrink-0" size={24} />
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-2">📊 Trend Analysis</h3>
                                            <div className="space-y-1 text-slate-300">
                                                <p>• <strong>Direction:</strong> {trendAnalysis.interpretation}</p>
                                                <p>• <strong>Slope:</strong> {trendAnalysis.slope > 0 ? '+' : ''}{Math.round(trendAnalysis.slope)} updates/month</p>
                                                <p>• <strong>Confidence:</strong> {trendAnalysis.confidence} (based on {dataQuality?.training_months || 'limited'} months of data)</p>
                                                <p className="text-xs text-yellow-300 mt-2">⚠️ This shows trend direction only, not future predictions</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Main Trend Analysis Graph */}
                            <Card title="Trend Direction Analysis (Historical + Short-term Projection)">
                                <div className="h-[450px] w-full">
                                    <ReactECharts
                                        option={chartOption}
                                        style={{ height: '100%', width: '100%' }}
                                        opts={{ renderer: 'canvas' }}
                                    />
                                </div>
                                <div className="mt-2 text-xs text-slate-400 text-center">
                                    ⚠️ Projection shows trend direction only (3-6 months) - not a prediction of future values
                                </div>
                            </Card>

                            {/* Model Info Collapsible */}
                            <Card className="border-slate-700">
                                <button
                                    onClick={() => setShowModelInfo(!showModelInfo)}
                                    className="w-full flex items-center justify-between text-left"
                                >
                                    <h3 className="text-lg font-bold text-white">📊 Model Information</h3>
                                    {showModelInfo ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                                </button>

                                {showModelInfo && (
                                    <div className="mt-4 space-y-3 text-sm border-t border-slate-700 pt-4">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Date Range:</span>
                                            <span className="text-white font-medium">{fromDate} to {toDate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Horizon Days:</span>
                                            <span className="text-white font-medium">{days} days</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Forecast Points Returned:</span>
                                            <span className="text-white font-medium">{forecastData.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Historical Points:</span>
                                            <span className="text-white font-medium">{historicalData.length}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Aggregation:</span>
                                            <span className="text-white font-medium">Monthly (Trend-Based)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Last Available Data:</span>
                                            <span className="text-white font-medium">{lastAvailableDate}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Last Updated:</span>
                                            <span className="text-white font-medium">
                                                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </Card>

                            {/* Model Health & Recommendations */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Model Health */}
                                {insights?.model_health && (
                                    <Card title="⚙️ Model Health" className="border-slate-700">
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Model Type:</span>
                                                <span className="text-white font-medium">{insights.model_health.model_type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Training Date:</span>
                                                <span className="text-white font-medium">{insights.model_health.training_date}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Data Points:</span>
                                                <span className="text-white font-medium">{insights.model_health.data_points} days</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Last Retrain:</span>
                                                <span className="text-green-400 font-medium flex items-center gap-1">
                                                    <CheckCircle2 size={14} /> {insights.model_health.last_retrain}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">Error (MAPE):</span>
                                                <span className="text-white font-medium">{insights.model_health.error_mape}%</span>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* Action Recommendations */}
                                {insights?.recommendations && (
                                    <Card title="✅ Recommended Actions" className="border-slate-700">
                                        <div className="space-y-2">
                                            {insights.recommendations.map((rec: string, idx: number) => (
                                                <div key={idx} className="flex items-start gap-2 text-sm">
                                                    <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                                                    <span className="text-slate-300">{rec}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={trainModel}
                                    disabled={training}
                                    className="text-xs text-slate-500 hover:text-primary-400 underline flex items-center gap-1"
                                >
                                    {training ? 'Retraining...' : 'Retrain Model manually'}
                                </button>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default Forecast;
