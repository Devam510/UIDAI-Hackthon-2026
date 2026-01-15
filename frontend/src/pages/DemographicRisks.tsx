import React, { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, Download, TrendingUp, AlertTriangle, Award, MapPin, Sparkles } from 'lucide-react';
import Card from '../components/Common/Card';
import Loader from '../components/Common/Loader';
import ErrorRetry from '../components/Common/ErrorRetry';
import Sparkline from '../components/Common/Sparkline';
import client from '../api/client';
import { useStateContext } from '../context/StateContext';

interface DemographicSegment {
    demographic_group: string;
    risk_score: number;
    enrolment_trend: 'improving' | 'stable' | 'declining';
    deviation_from_state_avg: number;
    severity_level: 'Low' | 'Moderate' | 'Severe';
    trend_data: { month: string; value: number }[];
    recommendations: string[];
}

const DemographicRisks: React.FC = () => {
    const { selectedState } = useStateContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [selectedSegment, setSelectedSegment] = useState<DemographicSegment | null>(null);
    const [aiInsights, setAiInsights] = useState<any>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await client.get('/analytics/demographic-risks', {
                params: { state: selectedState, window: 90, top: 20 }
            });
            setData(response.data);
            // Auto-select first segment
            if (response.data.segments && response.data.segments.length > 0) {
                setSelectedSegment(response.data.segments[0]);
            }
        } catch (err) {
            console.error('Failed to fetch demographic risks:', err);
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

    const fetchAIInsights = async () => {
        setLoadingInsights(true);
        try {
            // Fallback to generated insights (chatbot integration can be added later)
            const insights = {
                summary: [
                    `Demographic risk analysis for ${selectedState} shows ${data.total_segments} segments analyzed`,
                    `${data.critical_segments} segments require immediate attention for demographic engagement`,
                    `Average risk score of ${data.avg_risk_score.toFixed(1)} indicates ${data.avg_risk_score > 7 ? 'high' : 'moderate'} state-level concern`
                ],
                actions: [
                    `Deploy targeted biometric update campaigns in ${data.highest_risk_segment || 'high-risk segments'}`,
                    `Conduct demographic-specific outreach programs`,
                    `Implement monitoring systems for demographic engagement tracking`
                ]
            };
            setAiInsights(insights);
        } catch (err) {
            console.error('Failed to fetch AI insights:', err);
        } finally {
            setLoadingInsights(false);
        }
    };

    const filteredSegments = useMemo(() => {
        if (!data?.segments) return [];
        return data.segments.filter((seg: DemographicSegment) =>
            seg.demographic_group.toLowerCase().includes(search.toLowerCase())
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
                const segment = filteredSegments[data.dataIndex];
                return `<strong>${segment.demographic_group}</strong><br/>Risk Score: <strong>${segment.risk_score}</strong><br/>Severity: <strong>${segment.severity_level}</strong>`;
            }
        },
        xAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#94a3b8' },
            splitLine: { lineStyle: { color: '#334155', type: 'dashed' } }
        },
        yAxis: {
            type: 'category',
            data: filteredSegments.map((s: DemographicSegment) => s.demographic_group),
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: {
                color: '#94a3b8',
                fontSize: 12,
                width: 100,
                overflow: 'truncate'
            },
            splitLine: { show: false },
            inverse: true
        },
        series: [{
            type: 'bar',
            data: filteredSegments.map((s: DemographicSegment) => ({
                value: s.risk_score,
                itemStyle: {
                    color: getSeverityColor(s.severity_level),
                    borderRadius: [0, 4, 4, 0]
                }
            })),
            barMaxWidth: 30
        }]
    }), [filteredSegments]);

    const handleChartClick = (params: any) => {
        const segment = filteredSegments[params.dataIndex];
        setSelectedSegment(segment);
    };

    const exportCSV = () => {
        if (!data?.segments) return;

        const headers = ['Segment', 'Risk Score', 'Deviation %', 'Trend', 'Severity'];
        const rows = filteredSegments.map((s: DemographicSegment) => [
            s.demographic_group,
            s.risk_score,
            s.deviation_from_state_avg,
            s.enrolment_trend,
            s.severity_level
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `demographic-risks-${selectedState}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <Loader />;
    if (error || !data) return <ErrorRetry onRetry={fetchData} message="Failed to load demographic risk data." />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header with Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white">Demographic Risk Analysis: {selectedState}</h2>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    {/* Search */}
                    <div className="relative group w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search segment..."
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 w-full focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Total Segments</p>
                            <p className="text-3xl font-bold text-white">{data.total_segments}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                            <MapPin className="text-blue-400" size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-red-900/20 to-slate-900 border-red-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Critical Segments</p>
                            <p className="text-3xl font-bold text-red-400">{data.critical_segments}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="text-red-400" size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-orange-900/20 to-slate-900 border-orange-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Highest Risk</p>
                            <p className="text-lg font-bold text-orange-400 truncate">
                                {data.highest_risk_segment || 'N/A'}
                            </p>
                            <p className="text-sm text-slate-500">
                                Score: {data.segments && data.segments.length > 0 ? data.segments[0].risk_score.toFixed(1) : '0'}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                            <Award className="text-orange-400" size={24} />
                        </div>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/20 to-slate-900 border-green-900/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Avg Risk Score</p>
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
                <Card title="Top 20 Demographic Risk Segments" className="lg:col-span-3">
                    <div className="h-[500px] w-full">
                        {filteredSegments.length > 0 ? (
                            <ReactECharts
                                option={chartOption}
                                style={{ height: '100%', width: '100%' }}
                                opts={{ renderer: 'canvas' }}
                                onEvents={{ click: handleChartClick }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-500">
                                No segments found matching your search.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Segment Details Panel */}
                <Card title="Segment Details" className="lg:col-span-2">
                    {selectedSegment ? (
                        <div className="space-y-4">
                            {/* Segment Header */}
                            <div className="pb-4 border-b border-slate-700">
                                <h3 className="text-xl font-bold text-white mb-2">{selectedSegment.demographic_group}</h3>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedSegment.severity_level === 'Severe' ? 'bg-red-900/30 text-red-400 border border-red-900' :
                                        selectedSegment.severity_level === 'Moderate' ? 'bg-orange-900/30 text-orange-400 border border-orange-900' :
                                            'bg-green-900/30 text-green-400 border border-green-900'
                                        }`}>
                                        {selectedSegment.severity_level}
                                    </span>
                                </div>
                                <div className="text-4xl font-bold" style={{ color: getSeverityColor(selectedSegment.severity_level) }}>
                                    {selectedSegment.risk_score.toFixed(1)}
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">Trend:</span>
                                    <span className="text-sm font-semibold text-white capitalize">{selectedSegment.enrolment_trend}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-400">Deviation:</span>
                                    <span className="text-sm font-semibold text-white">{selectedSegment.deviation_from_state_avg}%</span>
                                </div>
                            </div>

                            {/* Trend Sparkline */}
                            <div className="pt-4 border-t border-slate-700">
                                <p className="text-sm text-slate-400 mb-2">Engagement Trend</p>
                                {selectedSegment.trend_data && selectedSegment.trend_data.length > 0 ? (
                                    <Sparkline
                                        data={selectedSegment.trend_data.map(d => d.value)}
                                        label=""
                                        color={getSeverityColor(selectedSegment.severity_level)}
                                        changePercent={
                                            selectedSegment.trend_data.length > 1
                                                ? ((selectedSegment.trend_data[selectedSegment.trend_data.length - 1].value - selectedSegment.trend_data[0].value) / (selectedSegment.trend_data[0].value || 1)) * 100
                                                : 0
                                        }
                                    />
                                ) : (
                                    <p className="text-sm text-slate-500">No trend data available</p>
                                )}
                            </div>

                            {/* Recommendations */}
                            <div className="pt-4 border-t border-slate-700">
                                <p className="text-sm font-semibold text-white mb-3">Recommended Actions</p>
                                {selectedSegment.recommendations && selectedSegment.recommendations.length > 0 ? (
                                    <ul className="space-y-2">
                                        {selectedSegment.recommendations.map((rec, idx) => (
                                            <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                                <span className="text-primary-400 mt-1">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-500">No recommendations available</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">
                            Click on a segment to view details
                        </div>
                    )}
                </Card>
            </div>

            {/* AI Insights Panel */}
            <Card title="🤖 AI Demographic Insight" className="bg-gradient-to-br from-purple-900/10 to-slate-900 border-purple-900/30">
                {loadingInsights ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader />
                    </div>
                ) : aiInsights ? (
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-purple-300 mb-2">Key Insights:</h4>
                            <ul className="space-y-2">
                                {aiInsights.summary.map((insight: string, idx: number) => (
                                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                        <span className="text-purple-400 mt-1">•</span>
                                        <span>{insight}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-700">
                            <h4 className="text-sm font-semibold text-purple-300 mb-2">Recommended Actions:</h4>
                            <ul className="space-y-2">
                                {aiInsights.actions.map((action: string, idx: number) => (
                                    <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
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
                        <p className="text-slate-400 mb-4">Get AI-powered insights for {selectedState}</p>
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
            <Card title="All Segments" className="overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-slate-400">Showing {filteredSegments.length} segments</p>
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
                        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm">
                            <tr>
                                <th className="px-4 py-3">Segment</th>
                                <th className="px-4 py-3 text-center">Risk Score</th>
                                <th className="px-4 py-3 text-center">Deviation %</th>
                                <th className="px-4 py-3 text-center">Trend</th>
                                <th className="px-4 py-3 text-center">Severity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {filteredSegments.map((s: DemographicSegment, idx: number) => (
                                <tr
                                    key={idx}
                                    onClick={() => setSelectedSegment(s)}
                                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                                >
                                    <td className="px-4 py-3 font-medium text-slate-200">{s.demographic_group}</td>
                                    <td className="px-4 py-3 text-center font-bold" style={{ color: getSeverityColor(s.severity_level) }}>
                                        {s.risk_score.toFixed(1)}
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-300">{s.deviation_from_state_avg}%</td>
                                    <td className="px-4 py-3 text-center text-slate-300 capitalize">{s.enrolment_trend}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.severity_level === 'Severe' ? 'bg-red-900/30 text-red-400 border border-red-900' :
                                            s.severity_level === 'Moderate' ? 'bg-orange-900/30 text-orange-400 border border-orange-900' :
                                                'bg-green-900/30 text-green-400 border border-green-900'
                                            }`}>
                                            {s.severity_level}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {filteredSegments.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        No segments found.
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

export default DemographicRisks;
