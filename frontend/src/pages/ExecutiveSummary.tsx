import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    FileText,
    CheckCircle,
    ArrowRight,
    BrainCircuit,
    Banknote,
    Clock
} from 'lucide-react';
import Card from '../components/Common/Card';
import Loader from '../components/Common/Loader';
import ErrorRetry from '../components/Common/ErrorRetry';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { useStateContext } from '../context/StateContext';

interface StateData {
    name: string;
    risk_score: number;
    anomaly_severity: number;
    negative_gap_ratio: number;
    forecast_growth: number;
    top_district?: string;
}

const ExecutiveSummary: React.FC = () => {
    const navigate = useNavigate();
    const { setSelectedState } = useStateContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [statesData, setStatesData] = useState<StateData[]>([]);

    const states = [
        "Uttar Pradesh", "Maharashtra", "Bihar", "West Bengal", "Madhya Pradesh",
        "Tamil Nadu", "Rajasthan", "Karnataka", "Gujarat", "Andhra Pradesh"
    ];

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const statePromises = states.map(async (state) => {
                try {
                    const response = await client.get(ENDPOINTS.ANALYTICS.STATE_SUMMARY, {
                        params: { state }
                    });

                    // Helper to safely parse numbers
                    const toNumber = (val: any) => typeof val === 'number' ? val : parseFloat(val) || 0;

                    let anomalySeverityNum = 0;
                    const anomalySev = response.data.anomaly_severity;
                    if (typeof anomalySev === 'string') {
                        if (anomalySev.toLowerCase() === 'high') anomalySeverityNum = 8;
                        else if (anomalySev.toLowerCase() === 'medium') anomalySeverityNum = 5;
                        else anomalySeverityNum = 2;
                    } else {
                        anomalySeverityNum = toNumber(anomalySev);
                    }

                    return {
                        name: state,
                        risk_score: toNumber(response.data.risk_score),
                        anomaly_severity: anomalySeverityNum,
                        negative_gap_ratio: toNumber(response.data.negative_gap_ratio),
                        forecast_growth: toNumber(response.data.forecast_growth),
                        top_district: response.data.top_district
                    };
                } catch (err) {
                    console.error(`Failed to fetch data for ${state}`, err);
                    return {
                        name: state,
                        risk_score: 0,
                        anomaly_severity: 0,
                        negative_gap_ratio: 0,
                        forecast_growth: 0
                    };
                }
            });

            const results = await Promise.all(statePromises);
            setStatesData(results.sort((a, b) => b.risk_score - a.risk_score));
        } catch (err) {
            console.error('Failed to fetch summary data:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleViewState = (stateName: string) => {
        setSelectedState(stateName);
        navigate('/overview');
    };

    if (loading) return <Loader />;
    if (error) return <ErrorRetry onRetry={fetchData} message="Failed to load executive summary" />;

    // Calculate aggregated metrics
    const avgRisk = statesData.reduce((acc, s) => acc + s.risk_score, 0) / statesData.length;
    const avgGrowth = statesData.reduce((acc, s) => acc + s.forecast_growth, 0) / statesData.length;
    const criticalStates = statesData.filter(s => s.risk_score >= 7).length;

    // Top 3 Priorities
    const priorities = statesData.slice(0, 3);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            Daily Briefing
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Executive Summary</h1>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <FileText size={18} />
                    <span>Export Report</span>
                </button>
            </div>

            {/* AI Insight Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex gap-4">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm self-start">
                        <BrainCircuit size={32} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold mb-2">System Intelligence Summary</h3>
                        <p className="text-indigo-100 leading-relaxed text-lg">
                            The national enrollment ecosystem is currently <span className="font-bold text-white">Stable</span>, though <span className="font-bold text-white">{criticalStates} states</span> are showing elevated risk levels.
                            Projected growth is <span className="font-bold text-white">{avgGrowth >= 0 ? 'positive' : 'contracting'} at {Math.abs(avgGrowth).toFixed(1)}%</span>.
                            Immediate intervention is recommended for <span className="font-bold text-white border-b border-white/40">{priorities[0]?.name}</span> to mitigate emerging enrollment gaps.
                        </p>
                    </div>
                </div>
            </div>

            {/* National Health Card (KPI Matrix) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase">National Avg Risk</p>
                    <div className="flex items-end gap-2 mt-1">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{avgRisk.toFixed(1)}</h3>
                        <span className={`text-sm font-medium mb-1 ${avgRisk > 5 ? 'text-orange-500' : 'text-green-500'}`}>
                            / 10
                        </span>
                    </div>
                </Card>
                <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase">Critical States</p>
                    <div className="flex items-end gap-2 mt-1">
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{criticalStates}</h3>
                        <span className="text-sm font-medium text-slate-400 mb-1">
                            Flagged
                        </span>
                    </div>
                </Card>
                <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase">Growth Outlook</p>
                    <div className="flex items-end gap-2 mt-1">
                        <h3 className={`text-3xl font-bold ${avgGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {avgGrowth >= 0 ? '+' : ''}{avgGrowth.toFixed(1)}%
                        </h3>
                        {avgGrowth >= 0 ? <TrendingUp size={20} className="text-green-500 mb-1" /> : <TrendingDown size={20} className="text-red-500 mb-1" />}
                    </div>
                </Card>
                <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase">System Status</p>
                    <div className="flex items-end gap-2 mt-1">
                        <h3 className="text-xl font-bold text-green-600 flex items-center gap-2">
                            <CheckCircle size={24} />
                            Operational
                        </h3>
                    </div>
                </Card>
            </div>

            {/* Strategic Action Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Priority Action Matrix</h2>
                        <span className="text-sm text-slate-500">Sorted by Impact Potential</span>
                    </div>

                    <div className="space-y-4">
                        {priorities.map((state, idx) => {
                            const isSevere = state.risk_score >= 7;
                            const budget = isSevere ? "₹2.5 - 5.0 Lakhs" : "₹50k - 1.0 Lakhs";
                            const timeline = isSevere ? "Immediate (48h)" : "Next 7 Days";

                            return (
                                <div key={state.name} className={`bg-white dark:bg-slate-800 rounded-xl border-l-4 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group ${isSevere ? 'border-l-red-500' : 'border-l-orange-500'
                                    }`} onClick={() => handleViewState(state.name)}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{state.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isSevere ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                    }`}>
                                                    Risk: {state.risk_score.toFixed(1)}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-3">
                                                {isSevere
                                                    ? `Critical enrollment gaps in ${state.top_district || 'key districts'} require mobile unit deployment.`
                                                    : `Biometric anomalies detected in ${state.top_district || 'specific centers'}. Audit recommended.`}
                                            </p>

                                            <div className="flex items-center gap-6 text-xs text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Banknote size={14} className="text-slate-400" />
                                                    <span>Budget: <span className="font-semibold text-slate-700 dark:text-slate-300">{budget}</span></span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock size={14} className="text-slate-400" />
                                                    <span>Timeline: <span className="font-semibold text-slate-700 dark:text-slate-300">{timeline}</span></span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex md:flex-col items-center gap-2 md:border-l md:pl-6 md:border-slate-100 dark:md:border-slate-700/50">
                                            <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap group-hover:bg-blue-600 dark:group-hover:bg-blue-400 dark:group-hover:text-white transition-colors">
                                                Approve Action
                                            </button>
                                            <span className="text-xs text-slate-400">or view details</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar Widget: Upcoming Reviews */}
                <div className="space-y-6">
                    <Card title="Scheduled Reviews">
                        <div className="space-y-4">
                            {[
                                { title: "Monthly Performance Review", time: "Tomorrow, 10:00 AM", type: "Zoom" },
                                { title: "Bihar Field Audit Report", time: "Jan 24, 2:00 PM", type: "In-Person" },
                                { title: "Q1 Budget Allocation", time: "Jan 28, 11:30 AM", type: "Hybrid" },
                            ].map((meeting, i) => (
                                <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-xs p-2 rounded-lg text-center min-w-[3.5rem]">
                                        {meeting.time.split(',')[0]}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{meeting.title}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{meeting.time.split(',')[1]} • {meeting.type}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                            View Full Calendar
                        </button>
                    </Card>

                    <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-5 text-white">
                        <h3 className="font-bold mb-2">Need a deeper dive?</h3>
                        <p className="text-sm text-slate-300 mb-4">
                            Ask specific questions about regional performance to the AI Assistant.
                        </p>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="e.g. Why is UP risk high?"
                                className="w-full bg-slate-800 dark:bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-blue-600 rounded-md cursor-pointer">
                                <ArrowRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveSummary;
