import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
    width?: string | number;
    height?: string | number;
}

const SkeletonLoader: React.FC<SkeletonProps> = ({
    className = "",
    variant = "rectangular",
    width,
    height
}) => {
    const baseClasses = "animate-pulse bg-slate-200 dark:bg-slate-700 rounded";

    const variantClasses = {
        text: "h-4 w-full rounded",
        rectangular: "h-full w-full rounded-md",
        circular: "rounded-full"
    };

    const style = {
        width: width,
        height: height
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export default SkeletonLoader;
