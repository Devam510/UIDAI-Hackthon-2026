import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorRetryProps {
    message?: string;
    onRetry?: () => void;
}

const ErrorRetry: React.FC<ErrorRetryProps> = ({ message = "Something went wrong.", onRetry }) => {
    return (
        <div className="bg-red-900/20 border border-red-800 text-red-200 rounded-lg p-4 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-2 text-red-300">
                <AlertCircle size={24} />
                <span className="font-medium">{message}</span>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
                >
                    <RefreshCw size={16} />
                    Retry
                </button>
            )}
        </div>
    );
};

export default ErrorRetry;
