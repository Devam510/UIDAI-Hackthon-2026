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
        <div className={twMerge(clsx("bg-dark-card rounded-xl border border-slate-700 shadow-md p-6", className))}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-4">
                    {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="text-dark-text">
                {children}
            </div>
        </div>
    );
};

export default Card;
