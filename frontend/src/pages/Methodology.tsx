import React from 'react';
import { BookOpen, Calculator, Database, GitBranch, AlertCircle } from 'lucide-react';
import Card from '../components/Common/Card';

const Methodology: React.FC = () => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <BookOpen className="text-blue-600 dark:text-blue-400" size={32} />
                    Methodology & Documentation
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                    Transparent breakdown of how insights, risk scores, and forecasts are generated.
                </p>
            </div>

            {/* Metric Calculations */}
            <Card title="1. Risk Score Calculation" icon={<Calculator size={20} className="text-blue-500" />}>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                    The <strong>Composite Risk Score (0-10)</strong> is a weighted average of three key performance indicators.
                    It is calculated dynamically for each district and aggregated for states.
                </p>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border border-slate-200 dark:border-slate-800 mb-6 font-mono text-sm md:text-base">
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                            <span className="text-slate-500">Formula</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                                Risk Score = (0.4 × Gap) + (0.3 × Anomaly) + (0.3 × Biometric)
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm text-slate-600 dark:text-slate-400">
                            <div>
                                <strong className="text-slate-900 dark:text-white block mb-1">Gap Component (40%)</strong>
                                Normalized score of the negative gap between projected and actual enrollment.
                            </div>
                            <div>
                                <strong className="text-slate-900 dark:text-white block mb-1">Anomaly Component (30%)</strong>
                                Based on the frequency and severity of statistical anomalies detected.
                            </div>
                            <div>
                                <strong className="text-slate-900 dark:text-white block mb-1">Biometric Component (30%)</strong>
                                Inverse score based on biometric failure rates (higher failures = higher risk).
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Models */}
            <Card title="2. Machine Learning Models" icon={<GitBranch size={20} className="text-purple-500" />}>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Forecasting Engine</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-3 text-sm">
                            We use <strong>Facebook Prophet</strong> for time-series forecasting of enrollment trends.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <li><strong>Model:</strong> Additive Regression Model</li>
                            <li><strong>Seasonality:</strong> Yearly (Auto-detected), Weekly (Disabled)</li>
                            <li><strong>Changepoint Prior Scale:</strong> <code>0.05</code> (To handle trend shifts without overfitting)</li>
                            <li><strong>Horizon:</strong> 2026 (12-month projection)</li>
                        </ul>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Anomaly Detection</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-3 text-sm">
                            We use <strong>Isolation Forest</strong> to detect outliers in enrollment data distribution.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                            <li><strong>Algorithm:</strong> Isolation Forest (Unsupervised)</li>
                            <li><strong>Contamination:</strong> <code>0.1</code> (Assumes ~10% of data points are potential anomalies)</li>
                            <li><strong>Features Used:</strong> Enrollment Count, Success Rate, Operator Efficiency</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Data Sources */}
            <Card title="3. Data Sources & Limitations" icon={<Database size={20} className="text-green-500" />}>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-lg p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                        <strong>Hackathon Constraint:</strong> The insights are generated based on a provided static dataset covering 9 months of enrollment activity (missing January, February, and August).
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Primary Dataset</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            <code>aadhaar_master_monthly.csv</code>: Aggregated monthly performance metrics for all states.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Granularity</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">
                            Data is aggregated at the <strong>State Level</strong> (monthly). District-level insights are simulated based on statistical distribution of state totals for demonstration purposes.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-400">
                    Doc Version 1.0 • Last Updated: Jan 18, 2026
                </p>
            </div>
        </div>
    );
};

export default Methodology;
