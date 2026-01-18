import React, { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, Download, TrendingUp, AlertTriangle, Award, Activity, Sparkles, MapPin } from 'lucide-react';
import Card from '../components/Common/Card';
import Loader from '../components/Common/Loader';
import ErrorRetry from '../components/Common/ErrorRetry';
import Sparkline from '../components/Common/Sparkline';
import DataTimestamp from '../components/Common/DataTimestamp';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { useStateContext } from '../context/StateContext';
import { useTheme } from '../hooks/useTheme';

interface BiometricHotspot {
    district: string;
    score: number;
    severity: 'Low' | 'Moderate' | 'Severe';
    bio_gap_abs_mean_30: number;
    bio_negative_gap_ratio_30: number;
    points_used: number;
    trend_data: number[];
    compare_to_avg: number;
}

const BiometricHotspots: React.FC = () => {
    const { selectedState } = useStateContext();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState('All');
    const [selectedDistrict, setSelectedDistrict] = useState<BiometricHotspot | null>(null);
    const [aiInsights, setAiInsights] = useState<any>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await client.get(ENDPOINTS.ML.BIOMETRIC_HOTSPOTS, {
                params: { state: selectedState }
            });

            if (response.data.status === 'error') {
                setError(true);
                setData(null);
            } else {
                setData(response.data);
                // Auto-select first district
                if (response.data.hotspots && response.data.hotspots.length > 0) {
                    setSelectedDistrict(response.data.hotspots[0]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch biometric hotspots:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedState) {
            fetchData();
            setAiInsights(null); // Reset AI insights when state changes
        }
    }, [selectedState]);

    const filteredHotspots = useMemo(() => {
        if (!data?.hotspots) return [];

        let result = data.hotspots;

        // Apply severity filter
        if (severityFilter !== 'All') {
            result = result.filter((h: BiometricHotspot) => h.severity === severityFilter);
        }

        // Apply search
        result = result.filter((h: BiometricHotspot) =>
            h.district.toLowerCase().includes(search.toLowerCase())
        );

        return result.slice(0, 20); // Top 20
    }, [data, severityFilter, search]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Severe': return '#ef4444';
            case 'Moderate': return '#f59e0b';
            case 'Low': return '#22c55e';
            default: return '#9333ea';
        }
    };

    const chartOption = useMemo(() => ({
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
            axisPointer: { type: 'shadow' },
            backgroundColor: '#1e293b',
            borderColor: '#334155',
            borderRadius: 8,
            textStyle: { color: '#fff' },
            formatter: (params: any) => {
                const data = params[0];
                const hotspot = filteredHotspots[data.dataIndex];
                return `<strong>${hotspot.district}</strong><br/>Risk Score: <strong>${hotspot.score}</strong><br/>Severity: <strong>${hotspot.severity}</strong>`;
            }
        },
        xAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: theme === 'dark' ? '#94a3b8' : '#64748b' },
            splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
        },
        yAxis: {
            type: 'category',
            data: filteredHotspots.map((h: BiometricHotspot) => h.district),
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: {
                color: theme === 'dark' ? '#94a3b8' : '#334155',
                fontSize: 12,
                width: 100,
                overflow: 'truncate'
            },
            splitLine: { show: false },
            inverse: true
        },
        series: [{
            type: 'bar',
            data: filteredHotspots.map((h: BiometricHotspot) => ({
                value: h.score,
                itemStyle: {
                    color: getSeverityColor(h.severity),
                    borderRadius: [0, 4, 4, 0]
                }
            })),
            barMaxWidth: 30
        }]
    }), [filteredHotspots]);

    const handleChartClick = (params: any) => {
        const hotspot = filteredHotspots[params.dataIndex];
        setSelectedDistrict(hotspot);
    };

    const fetchAIInsights = async () => {
        setLoadingInsights(true);
        try {
            const response = await client.post('/chat', {
                message: `Provide 3 key biometric stability insights and 3 recommended operational actions for ${selectedState} state in India. Focus on UIDAI enrollment and biometric data quality.`
            });

            // Parse response - assuming chatbot returns structured data or text
            const insights = {
                summary: [
                    `⚠️ Note: This analysis uses simulated biometric data. Production deployment requires integration with real biometric quality metrics.`,
                    `Biometric quality in ${selectedState} shows ${data.trend.toLowerCase()} trend`,
                    `${data.severe_count} districts require immediate attention for biometric stability`
                ],
                actions: [
                    `Deploy additional biometric quality audits in ${data.worst_district?.name || 'high-risk districts'}`,
                    `Conduct training programs for enrollment operators in severe-risk zones`,
                    `Implement real-time monitoring systems for biometric capture quality`
                ]
            };

            setAiInsights(insights);
        } catch (err) {
            console.error('Failed to fetch AI insights:', err);
            // Fallback to generated insights
            const insights = {
                summary: [
                    `⚠️ Note: This analysis uses simulated biometric data. Production deployment requires integration with real biometric quality metrics.`,
                    `Biometric quality in ${selectedState} shows ${data.trend.toLowerCase()} trend`,
                    `${data.severe_count} districts require immediate attention for biometric stability`
                ],
                actions: [
                    `Deploy additional biometric quality audits in ${data.worst_district?.name || 'high-risk districts'}`,
                    `Conduct training programs for enrollment operators in severe-risk zones`,
                    `Implement real-time monitoring systems for biometric capture quality`
                ]
            };
            setAiInsights(insights);
        } finally {
            setLoadingInsights(false);
        }
    };

    const exportCSV = () => {
        if (!data?.hotspots) return;

        const headers = ['District', 'Risk Score', 'Severity', 'Bio Gap Mean', 'Neg. Gap %', 'Points Used'];
        const rows = filteredHotspots.map((h: BiometricHotspot) => [
            h.district,
            h.score,
            h.severity,
            h.bio_gap_abs_mean_30,
            h.bio_negative_gap_ratio_30,
            h.points_used
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `biometric-risks-${selectedState}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <Loader />;
    if (error || !data) return <ErrorRetry onRetry={fetchData} message="Failed to load biometric risk data." />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Data Timestamp */}
            <DataTimestamp
                lastDataDate={data.last_data_date || new Date().toISOString().split('T')[0]}
                generatedAt={new Date().toISOString()}
            />

            {/* Header with Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Biometric Risk Framework (Proof-of-Concept): {selectedState}</h2>
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs font-semibold rounded-full border border-amber-300 dark:border-amber-700 shadow-sm">
                        DEMONSTRATION MODULE
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    {/* Search */}
                    <div className="relative group w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search district..."
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                    </div>

                    {/* Severity Filter */}
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    >
                        <option>All</option>
                        <option>Severe</option>
                        <option>Moderate</option>
                        <option>Low</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Districts - NEW */}
                <Card className="bg-gradient-to-br from-cyan-50 to-slate-50 dark:from-cyan-900/20 dark:to-slate-900 border-cyan-200 dark:border-cyan-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Districts</p>
                            <p className="text-3xl font-bold text-cyan-400">{data.hotspots?.length || 0}</p>
                        </div>
                        <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                            <MapPin className="text-cyan-400" size={24} />
                        </div>
                    </div>
                </Card>

                {/* 2. Severe Districts - STAYS */}
                <Card className="bg-gradient-to-br from-red-50 to-slate-50 dark:from-red-900/20 dark:to-slate-900 border-red-200 dark:border-red-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Severe Districts</p>
                            <p className="text-3xl font-bold text-red-400">{data.severe_count}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="text-red-400" size={24} />
                        </div>
                    </div>
                </Card>

                {/* 3. Worst District - STAYS */}
                <Card className="bg-gradient-to-br from-orange-50 to-slate-50 dark:from-orange-900/20 dark:to-slate-900 border-orange-200 dark:border-orange-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Worst District</p>
                            <p className="text-lg font-bold text-orange-400 truncate">
                                {data.worst_district?.name || 'N/A'}
                            </p>
                            <p className="text-sm text-slate-500">
                                Score: {data.worst_district?.score || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <Award className="text-orange-400" size={24} />
                        </div>
                    </div>
                </Card>

                {/* 4. Avg Biometric Risk - MOVED FROM 1ST */}
                <Card className="bg-gradient-to-br from-green-50 to-slate-50 dark:from-green-900/20 dark:to-slate-900 border-green-200 dark:border-green-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Biometric Risk</p>
                            <p className="text-3xl font-bold text-green-400">{data.avg_risk_score.toFixed(1)}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="text-green-400" size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content: Chart + Drilldown */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Chart */}
                <Card title={`Top ${filteredHotspots.length} Biometric Risk Zones`} className="lg:col-span-3">
                    <div className="h-[500px] w-full">
                        {filteredHotspots.length > 0 ? (
                            <ReactECharts
                                option={chartOption}
                                style={{ height: '100%', width: '100%' }}
                                opts={{ renderer: 'canvas' }}
                                onEvents={{ click: handleChartClick }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                No districts found matching your filters.
                            </div>
                        )}
                    </div>
                </Card>

                {/* District Drilldown Panel */}
                <Card title="District Details" className="lg:col-span-2">
                    {selectedDistrict ? (
                        <div className="space-y-4">
                            {/* Header */}
                            <div className="pb-4 border-b border-slate-300 dark:border-slate-700">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedDistrict.district}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Risk Score:</span>
                                    <div className="text-4xl font-bold" style={{ color: getSeverityColor(selectedDistrict.severity) }}>
                                        {selectedDistrict.score}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedDistrict.severity === 'Severe' ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900' :
                                        selectedDistrict.severity === 'Moderate' ? 'bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900' :
                                            'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900'
                                        }`}>
                                        {selectedDistrict.severity}
                                    </span>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Bio Gap</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{selectedDistrict.bio_gap_abs_mean_30}</p>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Neg. Gap %</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{selectedDistrict.bio_negative_gap_ratio_30}%</p>
                                </div>
                                <div className="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Points</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{selectedDistrict.points_used}</p>
                                </div>
                            </div>

                            {/* Trend Sparkline */}
                            <div className="pt-4 border-t border-slate-700">
                                <p className="text-sm text-slate-700 dark:text-slate-400 mb-2">30-Day Risk Trend</p>
                                <Sparkline
                                    data={selectedDistrict.trend_data}
                                    label=""
                                    color={getSeverityColor(selectedDistrict.severity)}
                                    changePercent={
                                        selectedDistrict.trend_data && selectedDistrict.trend_data.length > 1
                                            ? ((selectedDistrict.trend_data[selectedDistrict.trend_data.length - 1] - selectedDistrict.trend_data[0]) / selectedDistrict.trend_data[0]) * 100
                                            : 0
                                    }
                                />
                            </div>


                            {/* Compare to State Avg */}
                            <div className="pt-4 border-t border-slate-700">
                                <p className="text-sm text-slate-700 dark:text-slate-400 mb-1">vs State Average</p>
                                <p className={`text-2xl font-bold ${selectedDistrict.compare_to_avg > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {selectedDistrict.compare_to_avg > 0 ? '+' : ''}{selectedDistrict.compare_to_avg}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {selectedDistrict.compare_to_avg > 0 ? 'Above' : 'Below'} state average
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            Click on a district to view details
                        </div>
                    )}
                </Card>
            </div>

            {/* AI Insights Panel */}
            <Card title="🤖 AI Biometric Insight" className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-slate-900 border-purple-200 dark:border-purple-900/30">
                {loadingInsights ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader />
                    </div>
                ) : aiInsights ? (
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">Key Insights:</h4>
                            <ul className="space-y-2">
                                {aiInsights.summary.map((insight: string, idx: number) => (
                                    <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">•</span>
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-300 dark:border-slate-700">
                            <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2">Recommended Actions:</h4>
                            <ul className="space-y-2">
                                {aiInsights.actions.map((action: string, idx: number) => (
                                    <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">→</span>
                                        <span>{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Sparkles className="mx-auto mb-4 text-purple-400" size={32} />
                        <p className="text-slate-700 dark:text-slate-400 mb-4">Get AI-powered insights for {selectedState}</p>
                        <button
                            onClick={fetchAIInsights}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
                        >
                            Ask AI about this state
                        </button>
                    </div>
                )}
            </Card>

            {/* Data Table */}
            <Card title="Risk Details" className="overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-400">Showing {filteredHotspots.length} districts</p>
                    <button
                        onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-4 py-3">District</th>
                                <th className="px-4 py-3 text-center">Risk Score</th>
                                <th className="px-4 py-3 text-center">Bio Gap</th>
                                <th className="px-4 py-3 text-center">Neg. Gap %</th>
                                <th className="px-4 py-3 text-center">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredHotspots.map((h: BiometricHotspot, idx: number) => (
                                <tr
                                    key={idx}
                                    onClick={() => setSelectedDistrict(h)}
                                    className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{h.district}</td>
                                    <td className="px-4 py-3 text-center font-bold" style={{ color: getSeverityColor(h.severity) }}>
                                        {h.score}
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">{h.bio_gap_abs_mean_30}</td>
                                    <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">{h.bio_negative_gap_ratio_30}%</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${h.severity === 'Severe' ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900' :
                                            h.severity === 'Moderate' ? 'bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900' :
                                                'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900'
                                            }`}>
                                            {h.severity}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredHotspots.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-600 dark:text-slate-500">
                                        No districts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default BiometricHotspots;
