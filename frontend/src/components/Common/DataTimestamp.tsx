import React from 'react';
import { Clock, Database } from 'lucide-react';

interface DataTimestampProps {
    lastDataDate?: string;
    generatedAt?: string;
    className?: string;
}

const DataTimestamp: React.FC<DataTimestampProps> = ({
    lastDataDate,
    generatedAt,
    className = ''
}) => {
    // Calculate "X minutes ago" from generatedAt
    const getTimeAgo = (timestamp: string): string => {
        if (!timestamp) return 'Just now';

        try {
            const now = new Date();
            const generated = new Date(timestamp);
            const diffMs = now.getTime() - generated.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) return 'Just now';
            if (diffMins === 1) return '1 minute ago';
            if (diffMins < 60) return `${diffMins} minutes ago`;

            const diffHours = Math.floor(diffMins / 60);
            if (diffHours === 1) return '1 hour ago';
            if (diffHours < 24) return `${diffHours} hours ago`;

            const diffDays = Math.floor(diffHours / 24);
            if (diffDays === 1) return '1 day ago';
            return `${diffDays} days ago`;
        } catch {
            return 'Recently';
        }
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className={`flex items-center gap-4 text-sm ${className}`}>
            {lastDataDate && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400">
                    <Database size={16} />
                    <span>
                        Data as of: <span className="text-slate-300 font-medium">{formatDate(lastDataDate)}</span>
                    </span>
                </div>
            )}

            {generatedAt && (
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-400">
                    <Clock size={16} />
                    <span>
                        Updated: <span className="text-slate-300 font-medium">{getTimeAgo(generatedAt)}</span>
                    </span>
                </div>
            )}
        </div>
    );
};

export default DataTimestamp;
