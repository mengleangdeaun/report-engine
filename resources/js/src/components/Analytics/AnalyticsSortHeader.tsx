import React from 'react';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';

interface AnalyticsSortHeaderProps {
    label: string;
    sortKey: string;
    currentSort: string;
    sortDirection: 'asc' | 'desc';
    onSort: (key: string) => void;
    align?: 'left' | 'center' | 'right';
    className?: string;
}

const AnalyticsSortHeader = ({
    label,
    sortKey,
    currentSort,
    sortDirection,
    onSort,
    align = 'left',
    className = ""
}: AnalyticsSortHeaderProps) => {
    const isActive = currentSort === sortKey;

    const alignmentClasses = {
        left: 'justify-start text-left',
        center: 'justify-center text-center',
        right: 'justify-end text-right'
    };

    return (
        <th className={`px-4 py-3 sm:px-6 sm:py-4 transition-colors ${className}`}>
            <button
                onClick={() => onSort(sortKey)}
                className={`group flex items-center gap-1.5 w-full font-black text-[10px] uppercase tracking-[0.15em] transition-all hover:text-primary ${alignmentClasses[align]} ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
            >
                {label}
                <div className="relative w-3 h-3 flex items-center justify-center">
                    {isActive ? (
                        sortDirection === 'desc' ? (
                            <IconChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <IconChevronUp className="w-3.5 h-3.5" />
                        )
                    ) : (
                        <IconSelector className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                    )}
                </div>
            </button>
        </th>
    );
};

export default AnalyticsSortHeader;
