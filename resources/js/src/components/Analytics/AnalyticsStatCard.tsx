import React from 'react';
import { IconArrowUp, IconArrowDown } from '@tabler/icons-react';

interface AnalyticsStatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color?: string; // e.g., 'text-blue-500' or 'bg-blue-50'
    trend?: number;
    className?: string;
}

const AnalyticsStatCard = ({
    label,
    value,
    icon,
    color = 'text-primary',
    trend,
    className = ""
}: AnalyticsStatCardProps) => {
    const isPositive = trend !== undefined && trend >= 0;

    return (
        <div className={`group bg-white dark:bg-gray-900 p-3.5 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${className}`}>
            <div className="flex items-start justify-between mb-2.5 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-800 group-hover:bg-primary/5 transition-colors w-fit ${color}`}>
                    {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5 sm:w-6 sm:h-6' })}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center text-[10px] sm:text-xs font-black tracking-tight ${isPositive ? 'text-emerald-500' : 'text-rose-500'} bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded-md`}>
                        {isPositive ? <IconArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" /> : <IconArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />}
                        <span className="ml-0.5">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>

            <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1 truncate">
                {label}
            </div>

            <div className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
        </div>
    );
};

export default AnalyticsStatCard;
