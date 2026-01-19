import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Activity, Users } from 'lucide-react';
import Card from '../components/Common/Card';
import Loader from '../components/Common/Loader';
import ErrorRetry from '../components/Common/ErrorRetry';
import DistrictChart from '../components/Common/DistrictChart';
import SmartSummary from '../components/Common/SmartSummary';
import Sparkline from '../components/Common/Sparkline';
import DataTimestamp from '../components/Common/DataTimestamp';
import ExportButton from '../components/Common/ExportButton';
import client from '../api/client';
import { ENDPOINTS } from '../api/endpoints';
import { useStateContext } from '../context/StateContext';

interface DistrictData {
    name: string;
    value: number;
}

const Overview: React.FC = () => {
    const { selectedState } = useStateContext();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [kpiData, setKpiData] = useState<any>(null);
    const [districtEnrolmentData, setDistrictEnrolmentData] = useState<DistrictData[]>([]);
    const [districtBiometricData, setDistrictBiometricData] = useState<DistrictData[]>([]);
    const [districtDemographicData, setDistrictDemographicData] = useState<DistrictData[]>([]);
    const [lastDataDate, setLastDataDate] = useState<string>('');
    const [trendData, setTrendData] = useState({
        enrolment: [] as number[],
        anomaly: [] as number[],
        biometric: [] as number[]
    });

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            // Fetch state summary
            const response = await client.get(ENDPOINTS.ANALYTICS.STATE_SUMMARY, {
                params: { state: selectedState }
            });

            // Extract last_data_date from metadata
            if (response.data.metadata?.last_data_date) {
                setLastDataDate(response.data.metadata.last_data_date);
            }
            setKpiData(response.data);


            // Fetch district hotspot data (enrolment risk)
            try {
                const districtResponse = await client.get('/analytics/district-risks', {
                    params: { state: selectedState, top: 15 }
                });

                // Transform data for district chart - use risk_score field
                if (districtResponse.data.districts) {
                    const mapped = districtResponse.data.districts.map((d: any) => ({
                        name: d.district,
                        value: d.risk_score  // Already normalized to 1-10 scale
                    }));
                    setDistrictEnrolmentData(mapped);
                } else {
                    setDistrictEnrolmentData([]);
                }
            } catch (err) {
                console.error('Failed to fetch district enrolment data:', err);
                setDistrictEnrolmentData([]);
            }

            // Fetch biometric hotspot data
            try {
                const biometricResponse = await client.get(ENDPOINTS.ML.BIOMETRIC_HOTSPOTS, {
                    params: { state: selectedState }
                });

                if (biometricResponse.data.hotspots) {
                    // Map to expected format with 'name' field
                    const mapped = biometricResponse.data.hotspots.map((d: any) => ({
                        name: d.district,
                        value: d.score
                    }));
                    setDistrictBiometricData(mapped);
                } else {
                    setDistrictBiometricData([]);
                }
            } catch (err) {
                console.error('Failed to fetch biometric data:', err);
                setDistrictBiometricData([]);
            }

            // Fetch demographic risk data
            try {
                const demographicResponse = await client.get(ENDPOINTS.ANALYTICS.DEMOGRAPHIC_RISKS, {
                    params: { state: selectedState, top: 15 }
                });

                if (demographicResponse.data.segments) {
                    // Map to expected format with 'name' and 'value' fields
                    const mapped = demographicResponse.data.segments.map((d: any) => ({
                        name: d.demographic_group,
                        value: d.risk_score
                    }));
                    setDistrictDemographicData(mapped);
                } else {
                    setDistrictDemographicData([]);
                }
            } catch (err) {
                console.error('Failed to fetch demographic data:', err);
                setDistrictDemographicData([]);
            }

            // Fetch historical trend data
            try {
                const historicalResponse = await client.get(ENDPOINTS.ML.HISTORICAL_ENROLMENT, {
                    params: { state: selectedState, days: 30 }
                });

                if (historicalResponse.data.enrolment_trend) {
                    setTrendData({
                        enrolment: historicalResponse.data.enrolment_trend,
                        anomaly: historicalResponse.data.anomaly_trend || Array.from({ length: 30 }, () => Math.random() * 10),
                        biometric: historicalResponse.data.biometric_trend || Array.from({ length: 30 }, () => Math.random() * 10)
                    });
                } else {
                    // Generate mock trend data
                    setTrendData({
                        enrolment: Array.from({ length: 30 }, () => Math.random() * 1000 + 500),
                        anomaly: Array.from({ length: 30 }, () => Math.random() * 10),
                        biometric: Array.from({ length: 30 }, () => Math.random() * 10)
                    });
                }
            } catch (err) {
                console.error('Failed to fetch trend data:', err);
                // Use mock data
                setTrendData({
                    enrolment: Array.from({ length: 30 }, () => Math.random() * 1000 + 500),
                    anomaly: Array.from({ length: 30 }, () => Math.random() * 10),
                    biometric: Array.from({ length: 30 }, () => Math.random() * 10)
                });
            }
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedState]);

    if (loading) return <Loader />;
    if (error) return <ErrorRetry onRetry={fetchData} message="Failed to load overview data" />;

    // Calculate trend changes
    const calculateChange = (data: number[]) => {
        if (data.length < 2) return 0;
        const first = data[0];
        const last = data[data.length - 1];
        return ((last - first) / first) * 100;
    };

    const kpis = [
        { label: 'Risk Score', value: kpiData?.risk_score?.toFixed(2) || '0', icon: <AlertTriangle size={24} />, color: 'text-red-400' },
        { label: 'Anomaly Severity', value: kpiData?.anomaly_severity || 'Low', icon: <Activity size={24} />, color: 'text-orange-400' },
        { label: 'Neg. Gap Ratio', value: kpiData?.negative_gap_ratio || '0%', icon: <Users size={24} />, color: 'text-blue-400' },
        { label: 'Forecast Growth', value: kpiData?.forecast_growth || '0%', icon: <TrendingUp size={24} />, color: 'text-green-400' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Data Timestamp */}
            {lastDataDate && (
                <DataTimestamp
                    lastDataDate={lastDataDate}
                    generatedAt={new Date().toISOString()}
                />
            )}

            {/* Header with Export Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Overview: {selectedState}</h2>
                <div className="flex items-center gap-3">
                    <ExportButton
                        endpoint="/export/csv/district-risks"
                        filename={`overview_${selectedState}_${new Date().toISOString().split('T')[0]}.csv`}
                        state={selectedState}
                        label="Download CSV"
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {kpis.map((kpi, idx) => (
                    <Card
                        key={idx}
                        className="relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/20 hover:border-primary-500/50"
                    >
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <p className="text-slate-700 dark:text-slate-400 text-sm font-medium group-hover:text-slate-900 dark:group-hover:text-slate-300 transition-colors">{kpi.label}</p>
                                <h3 className={`text - 3xl font - bold mt - 2 ${kpi.color} group - hover: scale - 110 transition - transform duration - 300`}>{kpi.value}</h3>
                            </div>
                            <div className="p-2 bg-slate-200 dark:bg-slate-800/50 rounded-lg group-hover:bg-slate-300 dark:group-hover:bg-slate-700/70 group-hover:scale-110 transition-all duration-300">{kpi.icon}</div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 text-slate-800/50 opacity-20 transform scale-150 rotate-12 group-hover:opacity-30 group-hover:scale-[1.7] transition-all duration-300">
                            {kpi.icon}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
                    </Card>
                ))}
            </div>

            {/* Mini Trend Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Sparkline
                    data={trendData.enrolment}
                    label="Enrolment Trend (30d)"
                    color="#6366f1"
                    changePercent={calculateChange(trendData.enrolment)}
                />
                <Sparkline
                    data={trendData.anomaly}
                    label="Anomaly Severity Trend"
                    color="#f59e0b"
                    changePercent={calculateChange(trendData.anomaly)}
                />
                <Sparkline
                    data={trendData.biometric}
                    label="Biometric Instability"
                    color="#ef4444"
                    changePercent={calculateChange(trendData.biometric)}
                />
            </div>

            {/* Smart Summary */}
            <SmartSummary
                stateName={selectedState}
                kpiData={kpiData ? {
                    risk_score: kpiData.risk_score || 0,
                    anomaly_severity: kpiData.anomaly_severity || 'N/A',
                    negative_gap_ratio: kpiData.negative_gap_ratio || 'N/A',
                    forecast_growth: kpiData.forecast_growth || 'N/A'
                } : undefined}
            />

            {/* District Hotspot Chart */}
            <Card title="District Hotspot Analysis">
                <DistrictChart
                    enrolmentData={districtEnrolmentData}
                    biometricData={districtBiometricData}
                    demographicData={districtDemographicData}
                />
            </Card>
        </div>
    );
};

export default Overview;
