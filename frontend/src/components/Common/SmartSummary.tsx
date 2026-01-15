import React, { useEffect, useState } from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';

interface SmartSummaryProps {
    stateName: string;
}

const SmartSummary: React.FC<SmartSummaryProps> = ({ stateName }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [summary, setSummary] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const fetchSummary = async () => {
        setLoading(true);
        setError(false);
        setIsTyping(true);

        try {
            const question = `Summarize the current situation for ${stateName} and explain why risk is high/low. Provide 3 recommended actions.`;
            const response = await client.post(ENDPOINTS.CHAT, {
                message: question,
                history: []
            });

            // Simulate typing effect (fast)
            const text = response.data.response || 'No summary available.';
            setSummary('');

            let currentIndex = 0;
            const typingInterval = setInterval(() => {
                if (currentIndex < text.length) {
                    setSummary(text.substring(0, currentIndex + 1));
                    currentIndex++;
                } else {
                    clearInterval(typingInterval);
                    setIsTyping(false);
                }
            }, 5);  // Changed from 20ms to 5ms - 4x faster!

            return () => clearInterval(typingInterval);
        } catch (err) {
            console.error('Failed to fetch summary:', err);
            setError(true);
            setIsTyping(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Defer loading by 500ms to allow page to render first
        const timer = setTimeout(() => {
            fetchSummary();
        }, 500);

        return () => clearTimeout(timer);
    }, [stateName]);

    return (
        <div className="bg-gradient-to-br from-primary-900/20 to-purple-900/20 border border-primary-500/30 rounded-xl p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl"></div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-primary-400" size={20} />
                    <h3 className="text-lg font-semibold text-white">AI Smart Summary</h3>
                </div>
                <button
                    onClick={fetchSummary}
                    disabled={loading}
                    className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Refresh summary"
                >
                    <RefreshCw
                        size={16}
                        className={`text-primary-400 ${loading ? 'animate-spin' : ''}`}
                    />
                </button>
            </div>

            {/* Content */}
            <div className="relative z-10">
                {loading && !summary ? (
                    <div className="space-y-3">
                        <div className="h-4 bg-slate-700/50 rounded animate-pulse w-full"></div>
                        <div className="h-4 bg-slate-700/50 rounded animate-pulse w-5/6"></div>
                        <div className="h-4 bg-slate-700/50 rounded animate-pulse w-4/6"></div>
                        <div className="flex items-center gap-2 mt-4 text-sm text-slate-400">
                            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                            <span>AI is analyzing data...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-start gap-3 text-red-400">
                        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium mb-1">Failed to load summary</p>
                            <p className="text-sm text-slate-400">
                                Unable to generate AI summary. Please try again.
                            </p>
                            <button
                                onClick={fetchSummary}
                                className="mt-2 text-sm text-primary-400 hover:text-primary-300 font-medium"
                            >
                                Retry →
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {summary}
                            {isTyping && <span className="inline-block w-1 h-4 bg-primary-400 ml-1 animate-pulse"></span>}
                        </p>
                    </div>
                )}
            </div>

            {/* Footer note */}
            {!loading && !error && (
                <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-500 relative z-10">
                    Generated by AI • Click refresh to regenerate
                </div>
            )}
        </div>
    );
};

export default SmartSummary;
