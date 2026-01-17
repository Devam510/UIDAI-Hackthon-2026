import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface AlertCardProps {
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    icon?: ReactNode;
    action?: () => void;
    actionLabel?: string;
}

const AlertCard: React.FC<AlertCardProps> = ({
    severity,
    title,
    description,
    icon,
    action,
    actionLabel = 'View Details'
}) => {
    const severityConfig = {
        high: {
            bgColor: 'bg-red-500/10',
            borderColor: 'border-red-500/30',
            textColor: 'text-red-400',
            iconColor: 'text-red-500',
            defaultIcon: <AlertTriangle size={20} />
        },
        medium: {
            bgColor: 'bg-orange-500/10',
            borderColor: 'border-orange-500/30',
            textColor: 'text-orange-400',
            iconColor: 'text-orange-500',
            defaultIcon: <AlertCircle size={20} />
        },
        low: {
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/30',
            textColor: 'text-blue-400',
            iconColor: 'text-blue-500',
            defaultIcon: <Info size={20} />
        }
    };

    const config = severityConfig[severity];
    const displayIcon = icon || config.defaultIcon;

    return (
        <div className={clsx(
            "border rounded-lg p-4 transition-all duration-300 hover:shadow-lg",
            config.bgColor,
            config.borderColor
        )}>
            <div className="flex items-start gap-3">
                <div className={clsx("flex-shrink-0", config.iconColor)}>
                    {displayIcon}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={clsx("font-semibold text-sm mb-1", config.textColor)}>
                        {title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {description}
                    </p>
                    {action && (
                        <button
                            onClick={action}
                            className={clsx(
                                "mt-2 text-xs font-medium hover:underline transition-colors",
                                config.textColor
                            )}
                        >
                            {actionLabel} →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertCard;
