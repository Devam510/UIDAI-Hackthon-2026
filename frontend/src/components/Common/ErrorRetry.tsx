import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorRetryProps {
    message?: string;
    onRetry?: () => void;
    error?: any;
}

const ErrorRetry: React.FC<ErrorRetryProps> = ({ message = "Something went wrong.", onRetry, error }) => {
    const [showDetails, setShowDetails] = React.useState(false);

    const handleCopyError = () => {
        const errorText = JSON.stringify(error || message, null, 2);
        navigator.clipboard.writeText(errorText);
    };

    return (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl mx-auto my-4 text-center">
            <div className="flex justify-center mb-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
                </div>
            </div>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                {message}
            </h3>

            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">
                We encountered an issue while loading this data. This might be temporary.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium shadow-lg shadow-red-500/20"
                    >
                        <RefreshCw size={18} />
                        Try Again
                    </button>
                )}

                {error && (
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium px-4 py-2"
                    >
                        {showDetails ? 'Hide Details' : 'Show Technical Details'}
                    </button>
                )}
            </div>

            {showDetails && error && (
                <div className="mt-6 text-left">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Error Logs</span>
                        <button
                            onClick={handleCopyError}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Copy to clipboard
                        </button>
                    </div>
                    <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs overflow-x-auto font-mono text-left">
                        {JSON.stringify(error, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ErrorRetry;
