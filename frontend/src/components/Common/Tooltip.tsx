import React, { useState } from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'right' }) => {
    const [show, setShow] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                onFocus={() => setShow(true)}
                onBlur={() => setShow(false)}
            >
                {children}
            </div>
            {show && (
                <div
                    className={`absolute z-50 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}
                    role="tooltip"
                >
                    {content}
                    <div className={`absolute w-2 h-2 bg-slate-900 transform rotate-45 ${position === 'right' ? '-left-1 top-1/2 -translate-y-1/2' :
                            position === 'left' ? '-right-1 top-1/2 -translate-y-1/2' :
                                position === 'top' ? 'left-1/2 -translate-x-1/2 -bottom-1' :
                                    'left-1/2 -translate-x-1/2 -top-1'
                        }`}></div>
                </div>
            )}
        </div>
    );
};

export default Tooltip;
