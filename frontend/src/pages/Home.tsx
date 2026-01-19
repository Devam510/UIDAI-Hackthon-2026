import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ArrowRight, MessageSquare, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import Card from '../components/Common/Card';
import FlashCard from '../components/Common/FlashCard';
import AlertCard from '../components/Common/AlertCard';
import Loader from '../components/Common/Loader';
import SkeletonLoader from '../components/Common/SkeletonLoader';
import ErrorRetry from '../components/Common/ErrorRetry';
import IndiaMap from '../components/Common/IndiaMap';
import DataTimestamp from '../components/Common/DataTimestamp';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { useStateContext } from '../context/StateContext';
import { useChatContext } from '../context/ChatContext';
import { validateStateMapping } from '../utils/state-name-mapper';
import { auditService } from '../services/auditService';

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
    const { setSelectedState, availableStates } = useStateContext();
    const { sendMessage } = useChatContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [lastDataDate, setLastDataDate] = useState<string>('');
    const [statesData, setStatesData] = useState<StateData[]>([]);
    const [selectedStateLocal, setSelectedStateLocal] = useState('Uttar Pradesh');

    // Use availableStates from context, fallback to a default list if not loaded yet
    const states = availableStates.length > 0 ? availableStates : [
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
            // PERFORMANCE OPTIMIZATION: Use bulk endpoint instead of 35+ individual calls
            const response = await client.get(ENDPOINTS.ANALYTICS.ALL_STATES_SUMMARY);

            // Extract last_data_date from metadata
            if (response.data.metadata?.last_data_date) {
                setLastDataDate(response.data.metadata.last_data_date);
            }

            // Parse data for all states
            const parsedStates = response.data.states.map((stateData: any) => {
                // Parse anomaly_severity - backend returns string like "High", "Medium", "Low"
                let anomalySeverityNum = 0;
                const anomalySev = stateData.anomaly_severity;
                if (typeof anomalySev === 'string') {
                    if (anomalySev.toLowerCase() === 'high') anomalySeverityNum = 8;
                    else if (anomalySev.toLowerCase() === 'medium') anomalySeverityNum = 5;
                    else if (anomalySev.toLowerCase() === 'low') anomalySeverityNum = 2;
                } else {
                    anomalySeverityNum = toNumber(anomalySev);
                }

                // Parse forecast_growth - backend returns string like "+0.00" or "-0.05"
                let forecastGrowthNum = 0;
                const forecastGrowth = stateData.forecast_growth;
                if (typeof forecastGrowth === 'string') {
                    forecastGrowthNum = parseFloat(forecastGrowth.replace('+', '')) * 100;
                } else {
                    forecastGrowthNum = toNumber(forecastGrowth);
                }

                // Parse negative_gap_ratio - backend returns string like "12.5%"
                let negativeGapRatioNum = 0;
                const negGapRatio = stateData.negative_gap_ratio;
                if (typeof negGapRatio === 'string') {
                    negativeGapRatioNum = parseFloat(negGapRatio.replace('%', ''));
                } else {
                    negativeGapRatioNum = toNumber(negGapRatio) * 100;
                }

                return {
                    name: stateData.name,
                    risk_score: toNumber(stateData.risk_score),
                    anomaly_severity: anomalySeverityNum,
                    negative_gap_ratio: negativeGapRatioNum,
                    forecast_growth: forecastGrowthNum,
                    top_district: stateData.top_district || undefined
                };
            });

            // Already sorted by risk_score from backend, but ensure it
            setStatesData(parsedStates.sort((a: StateData, b: StateData) => b.risk_score - a.risk_score));
        } catch (err) {
            console.error('Failed to fetch states data:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Log access to dashboard
        auditService.logAction('VIEW_DASHBOARD', 'Home', 'User accessed main dashboard');
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


    // ... lines 32-53 ...

    // Update state type in useState definition line 31 roughly if needed or just use 'any' for now as shown above
    // Actually the tool replaces specific blocks. I need to be careful.
    // Let's look at the specific line "if (error) return <ErrorRetry ..."

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <SkeletonLoader className="h-8 w-64 mb-2" />
                        <SkeletonLoader className="h-4 w-96" />
                    </div>
                    <SkeletonLoader className="h-10 w-32" />
                </div>

                {/* Skeleton Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 h-32 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <SkeletonLoader className="h-4 w-24 mb-4" />
                            <SkeletonLoader className="h-8 w-16" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[400px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <SkeletonLoader className="h-full w-full" />
                    </div>
                    <div className="h-[400px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <div className="space-y-4">
                            <SkeletonLoader className="h-6 w-32" />
                            {[1, 2, 3, 4, 5].map(i => (
                                <SkeletonLoader key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    if (error) return <ErrorRetry onRetry={fetchData} message={error?.message || "Failed to load dashboard data"} error={error} />;

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

            {/* Hero Header Section - Enhanced UI */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-primary-900/30 dark:via-purple-900/20 dark:to-dark-card border-2 border-blue-200 dark:border-primary-500/20 rounded-2xl p-8 md:p-12 shadow-xl">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/20 to-purple-400/20 dark:from-primary-500/10 dark:to-purple-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 dark:from-purple-500/10 dark:to-primary-500/10 rounded-full blur-3xl"></div>

                {/* Top Badge */}
                <div className="relative z-10 mb-6">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-primary-600 dark:to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Government Analytics Platform
                    </div>
                </div>

                <div className="relative z-10">
                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400">
                            UIDAI Insight
                        </span>
                        <br />
                        <span className="text-slate-800 dark:text-white">Platform</span>
                    </h1>

                    {/* Subtitle with Icons */}
                    <div className="flex items-start gap-3 mb-8 max-w-3xl">
                        <div className="flex-shrink-0 mt-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 dark:from-primary-500 dark:to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                        </div>
                        <div>
                            <p className="text-xl text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                AI-powered insights for <span className="text-blue-700 dark:text-blue-400 font-semibold">Aadhaar enrolment</span>,
                                <span className="text-indigo-700 dark:text-indigo-400 font-semibold"> anomalies</span>, and
                                <span className="text-purple-700 dark:text-purple-400 font-semibold"> biometric stability</span>
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>Real-time Analytics</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Secure & Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controls Section */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-lg">
                        <div className="flex items-center gap-3 flex-1">
                            <label className="text-sm text-slate-700 dark:text-slate-400 font-semibold whitespace-nowrap">
                                📍 Select State:
                            </label>
                            <div className="relative flex-1 max-w-xs">
                                <select
                                    value={selectedStateLocal}
                                    onChange={(e) => setSelectedStateLocal(e.target.value)}
                                    className="appearance-none w-full bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pl-4 pr-10 py-3 rounded-lg text-sm font-semibold focus:outline-none focus:border-blue-500 dark:focus:border-primary-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-primary-500/20 cursor-pointer transition-all"
                                >
                                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>

                        <button
                            onClick={handleOpenDashboard}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 dark:from-primary-600 dark:to-purple-600 dark:hover:from-primary-500 dark:hover:to-purple-500 text-white font-bold px-8 py-3 rounded-lg transition-all duration-300 shadow-lg shadow-blue-900/30 dark:shadow-primary-900/30 hover:shadow-blue-900/50 dark:hover:shadow-primary-900/50 hover:scale-105 group"
                        >
                            Open Dashboard
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
                    <span className="text-sm text-slate-700 dark:text-slate-400">Sorted by Risk Score</span>
                </div>

                <div className="relative">
                    {/* Horizontal scroll container with better padding */}
                    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
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

                    {/* Gradient fade on edges - refined to not block content */}
                    <div className="absolute top-0 left-0 bottom-6 w-8 bg-gradient-to-r from-white/90 dark:from-slate-900/90 to-transparent pointer-events-none md:block hidden"></div>
                    <div className="absolute top-0 right-0 bottom-6 w-8 bg-gradient-to-l from-white/90 dark:from-slate-900/90 to-transparent pointer-events-none md:block hidden"></div>
                </div>
            </div>

            {/* Top Priority Actions - Executive Summary */}
            <Card
                title="🎯 Top Priority Actions"
                className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-900/30"
            >
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">Prioritized actions for immediate impact</p>
                <div className="space-y-3">
                    {sortedStates.slice(0, 3).map((state, idx) => {
                        // Generate dynamic quick win recommendation based on state data
                        let action = '';
                        let impact = '';

                        if (state.risk_score >= 7) {
                            action = `${state.name}: Deploy mobile enrollment units in ${state.top_district || 'high-risk districts'}`;
                            impact = `Reduces risk from ${state.risk_score.toFixed(1)} to ~${(state.risk_score - 1.6).toFixed(1)}`;
                        } else if (state.negative_gap_ratio >= 40) {
                            action = `${state.name}: Conduct biometric recapture campaign in ${state.top_district || 'critical areas'}`;
                            impact = `Failure rate: ${state.negative_gap_ratio.toFixed(0)}% - target reduction to 25%`;
                        } else if (state.anomaly_severity >= 6) {
                            action = `${state.name}: Investigate enrollment anomaly in ${state.top_district || 'affected regions'}`;
                            impact = `Anomaly severity: ${state.anomaly_severity.toFixed(1)} - validate data integrity`;
                        } else if (state.forecast_growth < 0) {
                            action = `${state.name}: Launch awareness campaign to reverse declining trend`;
                            impact = `Forecast growth: ${state.forecast_growth.toFixed(1)}% - target +3% growth`;
                        } else {
                            action = `${state.name}: Maintain monitoring for ${state.top_district || 'all districts'}`;
                            impact = `Current performance: Stable (Risk: ${state.risk_score.toFixed(1)})`;
                        }

                        return (
                            <div
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-amber-200 dark:border-amber-900/30 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleViewState(state.name)}
                            >
                                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                                        {action}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        📊 {impact}
                                    </p>
                                </div>
                                <ArrowRight className="flex-shrink-0 text-amber-500 dark:text-amber-400" size={18} />
                            </div>
                        );
                    })}
                </div>
                <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-900/30">
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                        💡 Click any item to view detailed analytics and implement targeted interventions
                    </p>
                </div>
            </Card>

            {/* National Benchmarks Section - NEW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                {/* National Average Risk */}
                <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">National Avg Risk</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                                {(statesData.reduce((acc, curr) => acc + curr.risk_score, 0) / (statesData.length || 1)).toFixed(2)}
                            </h3>
                        </div>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </Card>
                {/* National Avg Anomaly */}
                <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Avg Anomaly Score</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                                {(statesData.reduce((acc, curr) => acc + curr.anomaly_severity, 0) / (statesData.length || 1)).toFixed(1)}
                            </h3>
                        </div>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <AlertTriangle size={20} className="text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </Card>
                {/* National Growth Trend */}
                <Card className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Avg Growth Trend</p>
                            <h3 className={`text-2xl font-bold mt-1 ${(statesData.reduce((acc, curr) => acc + curr.forecast_growth, 0) / (statesData.length || 1)) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {(statesData.reduce((acc, curr) => acc + curr.forecast_growth, 0) / (statesData.length || 1)) >= 0 ? '+' : ''}
                                {(statesData.reduce((acc, curr) => acc + curr.forecast_growth, 0) / (statesData.length || 1)).toFixed(2)}%
                            </h3>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Activity size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Priority Details Table and Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Priority Details Table - UPDATED WITH BENCHMARKING */}
                <Card title="Priority Leaderboard (Benchmarked)" className="lg:col-span-2">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-600 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-center">Rank</th>
                                    <th className="px-4 py-3">State</th>
                                    <th className="px-4 py-3 text-center">Risk Score</th>
                                    <th className="px-4 py-3 text-center">vs Nat. Avg</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {sortedStates.slice(0, 10).map((state, index) => {
                                    const nationalAvgRisk = statesData.reduce((acc, curr) => acc + curr.risk_score, 0) / (statesData.length || 1);
                                    const diff = state.risk_score - nationalAvgRisk;

                                    return (
                                        <tr
                                            key={state.name}
                                            onClick={() => handleStateRowClick(state.name)}
                                            className="hover:bg-slate-100 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                                        >
                                            <td className="px-4 py-3 text-center font-bold text-slate-500">#{index + 1}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-200">{state.name}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${state.risk_score >= 7 ? 'text-red-400' :
                                                    state.risk_score >= 4 ? 'text-orange-400' :
                                                        'text-green-400'
                                                    }`}>
                                                    {state.risk_score.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${diff > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                    {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
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
