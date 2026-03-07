import React from 'react';
import dayjs from 'dayjs';
import { IconTrophy, IconExternalLink, IconCalendar } from '@tabler/icons-react';

interface AnalyticsChampionCardProps {
    title: string;
    post: any;
    icon: React.ReactNode;
    metricLabel: string;
    metricValue: string | number;
    platformColor?: 'blue' | 'pink' | 'emerald' | 'rose' | 'amber';
    className?: string;
}

const AnalyticsChampionCard = ({
    title,
    post,
    icon,
    metricLabel,
    metricValue,
    platformColor = 'blue',
    className = ""
}: AnalyticsChampionCardProps) => {
    const colors = {
        blue: {
            bg: 'from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'hover:border-blue-300 dark:hover:border-blue-700'
        },
        pink: {
            bg: 'from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10',
            iconBg: 'bg-rose-100 dark:bg-rose-900/30',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'hover:border-pink-300 dark:hover:border-pink-700'
        },
        emerald: {
            bg: 'from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'hover:border-emerald-300 dark:hover:border-emerald-700'
        },
        rose: {
            bg: 'from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10',
            iconBg: 'bg-rose-100 dark:bg-rose-900/30',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'hover:border-rose-300 dark:hover:border-rose-700'
        },
        amber: {
            bg: 'from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10',
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'hover:border-amber-300 dark:hover:border-amber-700'
        }
    };

    const colorSet = colors[platformColor];

    if (!post) {
        return (
            <div className={`bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-800 flex gap-4 items-center opacity-60 ${className}`}>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 text-gray-400 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                        {title}
                    </div>
                    <div className="text-sm font-bold text-gray-400 italic">No historical data found</div>
                </div>
            </div>
        );
    }

    return (
        <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`group bg-gradient-to-br ${colorSet.bg} p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 ${colorSet.border} flex flex-col sm:flex-row gap-3 sm:gap-5 items-start sm:items-center transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 active:scale-[0.99] ${className}`}
        >
            <div className="flex items-center justify-between w-full sm:w-auto">
                <div className={`w-11 h-11 sm:w-14 sm:h-14 shrink-0 ${colorSet.iconBg} ${colorSet.text} rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                    {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5 sm:w-7 sm:h-7' })}
                </div>
                <div className="sm:hidden flex-1 px-3">
                    <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] ${colorSet.text}`}>
                        <IconTrophy className="w-3 h-3" />
                        {title}
                    </div>
                </div>
                <div className="sm:hidden w-8 h-8 shrink-0 bg-white/60 dark:bg-white/5 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-primary transition-all">
                    <IconExternalLink size={14} />
                </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
                <div className={`hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${colorSet.text} mb-1.5`}>
                    <IconTrophy className="w-3.5 h-3.5" />
                    {title}
                </div>

                <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white truncate mb-1 sm:mb-2 leading-tight group-hover:translate-x-1 transition-transform">
                    {post.title || "No Title Provided"}
                </h4>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] font-bold">
                    <div className="flex items-center text-gray-400">
                        <IconCalendar className="w-3 h-3 mr-1" />
                        {dayjs(post.date).format('DD MMM YYYY')}
                    </div>
                    <div className="hidden sm:block w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                    <div className={colorSet.text}>
                        {metricLabel}: <span className="text-xs sm:text-[13px]">{metricValue}</span>
                    </div>
                </div>
            </div>

            <div className="hidden sm:flex w-10 h-10 shrink-0 bg-white/60 dark:bg-white/5 rounded-xl items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-white dark:group-hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0">
                <IconExternalLink size={20} />
            </div>
        </a>
    );
};

export default AnalyticsChampionCard;
