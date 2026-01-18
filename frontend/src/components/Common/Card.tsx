import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    action?: ReactNode;
    icon?: ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, title, action, icon }) => {
    return (
        <div className={twMerge(clsx("bg-slate-50 dark:bg-dark-card rounded-xl border border-slate-200 dark:border-slate-700 shadow-md p-6 transition-colors duration-200", className))}>
            {(title || action || icon) && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {icon && <div className="flex-shrink-0">{icon}</div>}
                        {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="text-slate-700 dark:text-dark-text">
                {children}
            </div>
        </div>
    );
};

export default Card;
