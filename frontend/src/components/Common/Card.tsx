import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
    children: ReactNode;
    className?: string;
    title?: string;
    action?: ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className, title, action }) => {
    return (
        <div className={twMerge(clsx("bg-slate-50 dark:bg-dark-card rounded-xl border border-slate-200 dark:border-slate-700 shadow-md p-6 transition-colors duration-200", className))}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-4">
                    {title && <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>}
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
