import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowRight, MessageSquare } from 'lucide-react';
import Card from '../components/Common/Card';
import FlashCard from '../components/Common/FlashCard';
import AlertCard from '../components/Common/AlertCard';
import Loader from '../components/Common/Loader';
import ErrorRetry from '../components/Common/ErrorRetry';
import IndiaMap from '../components/Common/IndiaMap';
import DataTimestamp from '../components/Common/DataTimestamp';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { useStateContext } from '../context/StateContext';
import { useChatContext } from '../context/ChatContext';
import { validateStateMapping } from '../utils/state-name-mapper';

interface StateData {
    name: string;
    risk_score: number;
    anomaly_severity: number;
    negative_gap_ratio: number;
    forecast_growth: number;
    top_district?: string;
}

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { setSelectedState } = useStateContext();
    const { sendMessage } = useChatContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [lastDataDate, setLastDataDate] = useState<string>('');
    const [statesData, setStatesData] = useState<StateData[]>([]);
    const [selectedStateLocal, setSelectedStateLocal] = useState('Uttar Pradesh');

    const states = [
        "Uttar Pradesh", "Maharashtra", "Bihar", "West Bengal", "Madhya Pradesh",
        "Tamil Nadu", "Rajasthan", "Karnataka", "Gujarat", "Andhra Pradesh"
    ];

    // Helper function to safely convert values to numbers
    const toNumber = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            // Try to parse string to number
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            // Since backend requires state parameter, fetch data for all states individually
            const statePromises = states.map(async (state) => {
                try {
                    const response = await client.get(ENDPOINTS.ANALYTICS.STATE_SUMMARY, {
                        params: { state }
                    });

                    // Extract last_data_date from first successful response
                    if (!lastDataDate && response.data.metadata?.last_data_date) {
                        setLastDataDate(response.data.metadata.last_data_date);
                    }

                    // Parse anomaly_severity - backend returns string like "High", "Medium", "Low"
                    // Convert to numeric scale: High=8, Medium=5, Low=2
                    let anomalySeverityNum = 0;
                    const anomalySev = response.data.anomaly_severity;
                    if (typeof anomalySev === 'string') {
                        if (anomalySev.toLowerCase() === 'high') anomalySeverityNum = 8;
                        else if (anomalySev.toLowerCase() === 'medium') anomalySeverityNum = 5;
                        else if (anomalySev.toLowerCase() === 'low') anomalySeverityNum = 2;
                    } else {
                        anomalySeverityNum = toNumber(anomalySev);
                    }

                    // Parse forecast_growth - backend returns string like "+0.00" or "-0.05"
                    let forecastGrowthNum = 0;
                    const forecastGrowth = response.data.forecast_growth;
                    if (typeof forecastGrowth === 'string') {
                        // Remove + sign and parse as float, then multiply by 100 for percentage
                        forecastGrowthNum = parseFloat(forecastGrowth.replace('+', '')) * 100;
                    } else {
                        forecastGrowthNum = toNumber(forecastGrowth);
                    }

                    // Parse negative_gap_ratio - backend returns string like "12.5%"
                    let negativeGapRatioNum = 0;
                    const negGapRatio = response.data.negative_gap_ratio;
                    if (typeof negGapRatio === 'string') {
                        negativeGapRatioNum = parseFloat(negGapRatio.replace('%', ''));
                    } else {
                        negativeGapRatioNum = toNumber(negGapRatio) * 100;
                    }

                    return {
                        name: state,
                        risk_score: toNumber(response.data.risk_score),
                        anomaly_severity: anomalySeverityNum,
                        negative_gap_ratio: negativeGapRatioNum,
                        forecast_growth: forecastGrowthNum,
                        top_district: response.data.top_district || undefined
                    };
                } catch (err) {
                    console.error(`Failed to fetch data for ${state}:`, err);
                    // Return default data for failed state
                    return {
                        name: state,
                        risk_score: 0,
                        anomaly_severity: 0,
                        negative_gap_ratio: 0,
                        forecast_growth: 0,
                        top_district: undefined
                    };
                }
            });

            const results = await Promise.all(statePromises);
            setStatesData(results.sort((a, b) => b.risk_score - a.risk_score));
        } catch (err) {
            console.error('Failed to fetch states data:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Validate state name mapping after data is loaded
    useEffect(() => {
        if (statesData.length > 0) {
            const validation = validateStateMapping(statesData);

            if (validation.unmatched.length > 0) {
                console.warn(
                    '⚠️ States without map representation:',
                    validation.unmatched,
                    '\nThese states exist in CSV but not in @svg-maps/india library.'
                );
            }
        }
    }, [statesData]);

    const handleOpenDashboard = () => {
        setSelectedState(selectedStateLocal);
        navigate('/overview');
    };

    const handleViewState = (stateName: string) => {
        setSelectedState(stateName);
        navigate('/overview');
    };

    const handleStateRowClick = (stateName: string) => {
        setSelectedState(stateName);
        navigate('/overview');
    };

    // Sort states by risk score for priority
    const sortedStates = [...statesData].sort((a, b) => b.risk_score - a.risk_score);
    const topPriorityStates = sortedStates.slice(0, 8);

    // Generate alerts based on data
    const generateAlerts = () => {
        const alerts = [];

        if (sortedStates.length > 0) {
            const highRiskStates = sortedStates.filter(s => s.risk_score >= 7);
            if (highRiskStates.length > 0) {
                alerts.push({
                    severity: 'high' as const,
                    title: 'High Risk States Detected',
                    description: `${highRiskStates.length} state(s) showing critical risk levels. Immediate attention required for ${highRiskStates[0].name}.`
                });
            }

            const highAnomalyStates = sortedStates.filter(s => s.anomaly_severity >= 7);
            if (highAnomalyStates.length > 0) {
                alerts.push({
                    severity: 'high' as const,
                    title: 'Anomaly Spike Alert',
                    description: `Unusual patterns detected in ${highAnomalyStates.length} state(s). ${highAnomalyStates[0].name} requires investigation.`
                });
            }

            const highNegGapStates = sortedStates.filter(s => s.negative_gap_ratio >= 50);
            if (highNegGapStates.length > 0) {
                alerts.push({
                    severity: 'medium' as const,
                    title: 'High Negative Gap Ratio',
                    description: `${highNegGapStates.length} state(s) showing significant negative gaps. Review enrolment processes in ${highNegGapStates[0].name}.`
                });
            }

            const negativeGrowthStates = sortedStates.filter(s => s.forecast_growth < 0);
            if (negativeGrowthStates.length > 0) {
                alerts.push({
                    severity: 'medium' as const,
                    title: 'Negative Growth Forecast',
                    description: `${negativeGrowthStates.length} state(s) projected to have declining enrolment. Strategic intervention needed.`
                });
            }

            alerts.push({
                severity: 'low' as const,
                title: 'Biometric Stability Check',
                description: 'Regular biometric quality assessment recommended across all regions to maintain data integrity.'
            });
        }

        return alerts.slice(0, 5);
    };

    const alerts = generateAlerts();

    if (loading) return <Loader />;
    if (error) return <ErrorRetry onRetry={fetchData} message="Failed to load dashboard data" />;

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
            {/* Data Timestamp */}
            {lastDataDate && (
                <DataTimestamp
                    lastDataDate={lastDataDate}
                    generatedAt={new Date().toISOString()}
                    className="mb-4"
                />
            )}

            {/* Hero Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary-900/30 via-purple-900/20 to-dark-card border border-primary-500/20 rounded-2xl p-8 md:p-12">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400">
                        UIDAI Insight Platform
                    </h1>
                    <p className="text-lg text-slate-700 dark:text-slate-300 mb-8 max-w-2xl">
                        AI-powered insights for Aadhaar enrolment, anomalies, and biometric stability
                    </p>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-slate-700 dark:text-slate-400 font-medium">Select State:</label>
                            <div className="relative">
                                <select
                                    value={selectedStateLocal}
                                    onChange={(e) => setSelectedStateLocal(e.target.value)}
                                    className="appearance-none bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pl-4 pr-10 py-2.5 rounded-lg text-sm font-medium focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer min-w-[200px]"
                                >
                                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <button
                            onClick={handleOpenDashboard}
                            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 shadow-lg shadow-primary-900/30 hover:shadow-primary-900/50 hover:scale-105"
                        >
                            Open Dashboard
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Interactive India Map */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">National Risk Overview</h2>
                <IndiaMap
                    statesData={statesData}
                    onStateClick={(stateName) => {
                        setSelectedState(stateName);
                        setSelectedStateLocal(stateName);
                        navigate('/overview');
                    }}
                />
            </div>

            {/* Priority Flashcards Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Top Priority States</h2>
                    <span className="text-sm text-slate-400">Sorted by Risk Score</span>
                </div>

                <div className="relative">
                    {/* Horizontal scroll container */}
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                        {topPriorityStates.map((state) => (
                            <FlashCard
                                key={state.name}
                                stateName={state.name}
                                riskScore={state.risk_score}
                                anomalySeverity={state.anomaly_severity}
                                negativeGapRatio={state.negative_gap_ratio}
                                forecastGrowth={state.forecast_growth}
                                topDistrict={state.top_district}
                                onClick={() => handleViewState(state.name)}
                            />
                        ))}
                    </div>

                    {/* Gradient fade on edges */}
                    <div className="absolute top-0 left-0 bottom-4 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent pointer-events-none"></div>
                    <div className="absolute top-0 right-0 bottom-4 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none"></div>
                </div>
            </div>

            {/* Priority Details Table and Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Priority Details Table */}
                <Card title="Priority Details" className="lg:col-span-2">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-600 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3">State</th>
                                    <th className="px-4 py-3 text-center">Risk Score</th>
                                    <th className="px-4 py-3 text-center">Anomaly</th>
                                    <th className="px-4 py-3 text-center">Growth</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {sortedStates.slice(0, 10).map((state) => (
                                    <tr
                                        key={state.name}
                                        onClick={() => handleStateRowClick(state.name)}
                                        className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                                    >
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{state.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-bold ${state.risk_score >= 7 ? 'text-red-400' :
                                                state.risk_score >= 4 ? 'text-orange-400' :
                                                    'text-green-400'
                                                }`}>
                                                {state.risk_score.toFixed(1)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-orange-400 font-semibold">
                                            {typeof state.anomaly_severity === 'number' ? state.anomaly_severity.toFixed(1) : state.anomaly_severity}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-semibold ${state.forecast_growth >= 0 ? 'text-emerald-400' : 'text-red-400'
                                                }`}>
                                                {state.forecast_growth >= 0 ? '+' : ''}{typeof state.forecast_growth === 'number' ? state.forecast_growth.toFixed(1) : state.forecast_growth}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Alerts / Highlights Panel */}
                <Card title="Alerts & Highlights">
                    <div className="space-y-3">
                        {alerts.map((alert, idx) => (
                            <AlertCard
                                key={idx}
                                severity={alert.severity}
                                title={alert.title}
                                description={alert.description}
                            />
                        ))}

                        {/* Ask AI Button */}
                        <button
                            onClick={() => {
                                // Generate a summary of alerts for AI
                                const alertSummary = alerts.map((a, i) => `${i + 1}. ${a.title}: ${a.description}`).join('\n');
                                const message = `I have the following alerts on my dashboard:\n\n${alertSummary}\n\nCan you help me understand these alerts and suggest what actions I should take?`;
                                sendMessage(message);
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl mt-4"
                        >
                            <MessageSquare size={18} />
                            Ask AI About Alerts
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Home;
