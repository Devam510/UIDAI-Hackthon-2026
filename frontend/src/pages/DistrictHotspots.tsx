import React, { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { MapPin, Search, Download, TrendingUp, AlertTriangle, Award, Sparkles } from 'lucide-react';
import Card from '../components/Common/Card';
import Loader from '../components/Common/Loader';
import ErrorRetry from '../components/Common/ErrorRetry';
import Sparkline from '../components/Common/Sparkline';
import DataTimestamp from '../components/Common/DataTimestamp';
import ExportButton from '../components/Common/ExportButton';
import client from '../api/client';
import { useStateContext } from '../context/StateContext';
import { useTheme } from '../hooks/useTheme';

interface DistrictRisk {
    district: string;
    risk_score: number;
    gap_abs_mean: number;
    negative_gap_ratio: number;
    severity_level: 'Low' | 'Moderate' | 'Severe';
    trend_data: number[];
    total_enrolment: number;
}

const DistrictHotspots: React.FC = () => {
    const { selectedState } = useStateContext();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [timeWindow, setTimeWindow] = useState(30);
    const [selectedDistrict, setSelectedDistrict] = useState<DistrictRisk | null>(null);
    const [aiInsights, setAiInsights] = useState<any>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [visibleCount, setVisibleCount] = useState(20);

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await client.get('/analytics/district-risks', {
                params: { state: selectedState, window: timeWindow, top: 20 }
            });
            setData(response.data);
            // Auto-select first district
            if (response.data.districts && response.data.districts.length > 0) {
                setSelectedDistrict(response.data.districts[0]);
            }
        } catch (err) {
            console.error('Failed to fetch district risks:', err);
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
    }, [selectedState, timeWindow]);

    const fetchAIInsights = async () => {
        setLoadingInsights(true);
        try {
            const response = await client.get('/ai/insights/district-risks', {
                params: { state: selectedState }
            });
            setAiInsights(response.data.insights);
        } catch (err) {
            console.error('Failed to fetch AI insights:', err);
            // Fallback to generated insights
            const insights = {
                summary: [
                    `District risk analysis for ${selectedState} shows ${data?.count || 0} districts analyzed`,
                    `${data?.critical_count || 0} districts require immediate attention for enrollment gaps`,
                    `Average risk score of ${data?.avg_risk_score?.toFixed(1) || 'N/A'} indicates ${(data?.avg_risk_score || 0) > 7 ? 'high' : 'moderate'} state-level concern`
                ],
                actions: [
                    `Deploy additional enrollment centers in ${data?.highest_risk_district?.name || 'high-risk districts'}`,
                    `Conduct targeted outreach programs in critical districts`,
                    `Implement real-time monitoring systems for enrollment tracking`
                ]
            };
            setAiInsights(insights);
        } finally {
            setLoadingInsights(false);
        }
    };

    const filteredDistricts = useMemo(() => {
        if (!data?.districts) return [];
        return data.districts.filter((d: DistrictRisk) =>
            d.district.toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'Severe': return '#ef4444';
            case 'Moderate': return '#f59e0b';
            case 'Low': return '#22c55e';
            default: return '#6366f1';
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
                const district = filteredDistricts[data.dataIndex];
                return `<strong>${district.district}</strong><br/>Risk Score: <strong>${district.risk_score}</strong><br/>Severity: <strong>${district.severity_level}</strong>`;
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
            data: filteredDistricts.map((d: DistrictRisk) => d.district),
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
            data: filteredDistricts.map((d: DistrictRisk) => ({
                value: d.risk_score,
                itemStyle: {
                    color: getSeverityColor(d.severity_level),
                    borderRadius: [0, 4, 4, 0]
                }
            })),
            barMaxWidth: 30
        }]
    }), [filteredDistricts]);

    const handleChartClick = (params: any) => {
        const district = filteredDistricts[params.dataIndex];
        setSelectedDistrict(district);
    };

    const exportCSV = () => {
        if (!data?.districts) return;

        const headers = ['District', 'Risk Score', 'Gap Mean', 'Negative Gap %', 'Severity'];
        const rows = data.districts.map((d: DistrictRisk) => [
            d.district,
            d.risk_score,
            d.gap_abs_mean,
            d.negative_gap_ratio,
            d.severity_level
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `district-risks-${selectedState}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <Loader />;
    if (error) return <ErrorRetry onRetry={fetchData} message="Failed to load district risk data." />;
    if (!data) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Data Timestamp */}
            <DataTimestamp
                lastDataDate={data.last_data_date || new Date().toISOString().split('T')[0]}
                generatedAt={new Date().toISOString()}
            />

            {/* Header with Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">District Risk Analysis: {selectedState}</h2>

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

                    {/* Time Window Toggle */}
                    <div className="flex bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1">
                        {[7, 30, 90].map(days => (
                            <button
                                key={days}
                                onClick={() => setTimeWindow(days)}
                                className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${timeWindow === days
                                    ? 'bg-primary-600 text-white'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {days}d
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Districts</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{data.count}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <MapPin className="text-blue-400" size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-slate-50 dark:from-red-900/20 dark:to-slate-900 border-red-200 dark:border-red-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Critical Districts</p>
                            <p className="text-3xl font-bold text-red-400">{data.critical_count}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="text-red-400" size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-slate-50 dark:from-orange-900/20 dark:to-slate-900 border-orange-200 dark:border-orange-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Highest Risk</p>
                            <p className="text-lg font-bold text-orange-400 truncate">
                                {data.highest_risk_district?.name || 'N/A'}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-500">
                                Score: {data.highest_risk_district?.score || 0}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <Award className="text-orange-400" size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-slate-50 dark:from-green-900/20 dark:to-slate-900 border-green-200 dark:border-green-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avg Risk Score</p>
                            <p className="text-3xl font-bold text-green-400">{data.avg_risk_score.toFixed(1)}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="text-green-400" size={24} />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content: Chart + Details Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Chart */}
                <Card title={`Top ${filteredDistricts.length} Critical Districts`} className="lg:col-span-3">
                    <div className="h-[500px] w-full">
                        {filteredDistricts.length > 0 ? (
                            <ReactECharts
                                option={chartOption}
                                style={{ height: '100%', width: '100%' }}
                                opts={{ renderer: 'canvas' }}
                                onEvents={{ click: handleChartClick }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                No districts found matching your search.
                            </div>
                        )}
                    </div>
                </Card>

                {/* District Details Panel */}
                <Card title="District Details" className="lg:col-span-2">
                    {selectedDistrict ? (
                        <div className="space-y-4">
                            {/* District Header */}
                            <div className="pb-4 border-b border-slate-300 dark:border-slate-700">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedDistrict.district}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-700 dark:text-slate-400">Risk Score:</span>
                                    <span className="text-2xl font-bold" style={{ color: getSeverityColor(selectedDistrict.severity_level) }}>
                                        {selectedDistrict.risk_score}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedDistrict.severity_level === 'Severe' ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900' :
                                        selectedDistrict.severity_level === 'Moderate' ? 'bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900' :
                                            'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900'
                                        }`}>
                                        {selectedDistrict.severity_level}
                                    </span>
                                </div>
                            </div>

                            {/* Impact Context */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-3">
                                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5">💡 Impact Context</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {selectedDistrict.risk_score >= 7 ? (
                                        <>A risk score of <strong>{selectedDistrict.risk_score}</strong> means this district is in the <strong>top 10% of high-risk areas</strong>. Without intervention, enrollment gaps may widen by an estimated <strong>15% over the next 3 months</strong>, affecting approximately <strong>{Math.floor(selectedDistrict.total_enrolment * 0.15).toLocaleString()}</strong> residents.</>
                                    ) : selectedDistrict.risk_score >= 4 ? (
                                        <>A risk score of <strong>{selectedDistrict.risk_score}</strong> indicates <strong>moderate risk</strong>. This district requires monitoring to prevent escalation. Proactive measures could stabilize enrollment trends and avoid affecting an estimated <strong>{Math.floor(selectedDistrict.total_enrolment * 0.08).toLocaleString()}</strong> residents.</>
                                    ) : (
                                        <>A risk score of <strong>{selectedDistrict.risk_score}</strong> indicates <strong>low risk</strong>. This district shows stable enrollment patterns. Maintaining current operations will continue to serve <strong>{selectedDistrict.total_enrolment.toLocaleString()}</strong> residents effectively.</>
                                    )}
                                </p>
                            </div>

                            {/* Metrics */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700 dark:text-slate-400">Gap Mean:</span>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{selectedDistrict.gap_abs_mean}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700 dark:text-slate-400">Negative Gap Ratio:</span>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{selectedDistrict.negative_gap_ratio}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-700 dark:text-slate-400">Total Enrolment:</span>
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{selectedDistrict.total_enrolment.toLocaleString()}</span>
                                </div>
                            </div>


                            {/* Trend Sparkline */}
                            <div className="pt-4 border-t border-slate-700">
                                <p className="text-sm text-slate-700 dark:text-slate-400 mb-2">30-Day Gap Trend</p>
                                <Sparkline
                                    data={selectedDistrict.trend_data}
                                    label=""
                                    color={getSeverityColor(selectedDistrict.severity_level)}
                                    changePercent={
                                        selectedDistrict.trend_data && selectedDistrict.trend_data.length > 1
                                            ? ((selectedDistrict.trend_data[selectedDistrict.trend_data.length - 1] - selectedDistrict.trend_data[0]) / selectedDistrict.trend_data[0]) * 100
                                            : 0
                                    }
                                />
                            </div>


                            {/* vs State Average */}
                            <div className="pt-4 border-t border-slate-300 dark:border-slate-700">
                                <p className="text-sm text-slate-700 dark:text-slate-400 mb-1">vs State Average</p>
                                <p className={`text-2xl font-bold ${(selectedDistrict.risk_score - (data?.avg_risk_score || 0)) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {(selectedDistrict.risk_score - (data?.avg_risk_score || 0)) > 0 ? '+' : ''}{(selectedDistrict.risk_score - (data?.avg_risk_score || 0)).toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {(selectedDistrict.risk_score - (data?.avg_risk_score || 0)) > 0 ? 'Above' : 'Below'} state average
                                </p>
                            </div>

                            {/* Recommended Actions - NEW STRUCTURE */}
                            <div className="pt-4 border-t border-slate-300 dark:border-slate-700">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-400 mb-3">📋 Recommended Action Plan</p>

                                <div className={`p-3 rounded-lg border ${selectedDistrict.risk_score >= 7
                                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30'
                                    : selectedDistrict.risk_score >= 4
                                        ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30'
                                        : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                                    }`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${selectedDistrict.risk_score >= 7 ? 'text-red-700 dark:text-red-400' :
                                            selectedDistrict.risk_score >= 4 ? 'text-orange-700 dark:text-orange-400' :
                                                'text-green-700 dark:text-green-400'
                                            }`}>
                                            {selectedDistrict.risk_score >= 7 ? 'Emergency Response' :
                                                selectedDistrict.risk_score >= 4 ? 'Corrective Action' :
                                                    'Maintenance'}
                                        </span>
                                        <span className="text-xs font-medium text-slate-500">
                                            {selectedDistrict.risk_score >= 7 ? 'Immediate (24-48h)' :
                                                selectedDistrict.risk_score >= 4 ? 'High Priority (1 week)' :
                                                    'Routine'}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-start gap-2">
                                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400" />
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                {selectedDistrict.risk_score >= 7
                                                    ? 'Deploy 2 Mobile Enrollment Units to high-gap blocks'
                                                    : selectedDistrict.risk_score >= 4
                                                        ? 'Conduct operator refresher training on document update guidelines'
                                                        : 'continue regular daily performance monitoring'}
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400" />
                                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                                {selectedDistrict.risk_score >= 7
                                                    ? 'Initiate district-wide awareness camp for mandatory updates'
                                                    : selectedDistrict.risk_score >= 4
                                                        ? 'Audit center infrastructure for connectivity issues'
                                                        : 'Share best practices with nearby high-risk districts'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/50">
                                        <div className="text-xs text-slate-500">
                                            Est. Budget: <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {selectedDistrict.risk_score >= 7 ? '₹2.5 Lakhs' :
                                                    selectedDistrict.risk_score >= 4 ? '₹50,000' :
                                                        '₹0 (OpEx)'}
                                            </span>
                                        </div>
                                        <button className="text-xs font-medium text-primary-600 hover:text-primary-500 hover:underline">
                                            Generate Proposal →
                                        </button>
                                    </div>
                                </div>
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
            <Card title="🤖 AI District Insight" className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-slate-900 border-purple-200 dark:border-purple-900/30">
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
            <Card title="All Districts" className="overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-400">
                        Showing {Math.min(visibleCount, filteredDistricts.length)} of {filteredDistricts.length} districts
                    </p>
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
                                <th className="px-4 py-3 text-center">Gap Mean</th>
                                <th className="px-4 py-3 text-center">Neg. Gap %</th>
                                <th className="px-4 py-3 text-center">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredDistricts.slice(0, visibleCount).map((d: DistrictRisk, idx: number) => (
                                <tr
                                    key={idx}
                                    onClick={() => setSelectedDistrict(d)}
                                    className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{d.district}</td>
                                    <td className="px-4 py-3 text-center font-bold" style={{ color: getSeverityColor(d.severity_level) }}>
                                        {d.risk_score}
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">{d.gap_abs_mean}</td>
                                    <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">{d.negative_gap_ratio}%</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${d.severity_level === 'Severe' ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900' :
                                            d.severity_level === 'Moderate' ? 'bg-orange-100 text-orange-700 border border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900' :
                                                'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900'
                                            }`}>
                                            {d.severity_level}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredDistricts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-600 dark:text-slate-500">
                                        No districts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Load More Button */}
                {visibleCount < filteredDistricts.length && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 20)}
                            className="px-6 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                            Load More Districts ({filteredDistricts.length - visibleCount} remaining)
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
};


export default DistrictHotspots;
