import React, { useState, useMemo, Fragment, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    IconEye, IconThumbUp, IconBookmark, IconShare, IconMessage, 
    IconChartBar, IconTrophy, IconDownload, IconChevronRight, 
    IconExternalLink, IconChevronDown, IconCheck, IconCalendar,
    IconSortAscending, IconFilter, IconTrendingUp, IconSparkles,
    IconInfoCircle, IconArrowUp, IconArrowDown,
    IconPlayerPlay, IconVideo, IconMusic, IconHeart,
    IconBrandTiktok
} from '@tabler/icons-react';
import { Listbox, Transition } from '@headlessui/react';

// --- Interfaces ---
interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: number;
}

interface ChampionCardProps {
    title: string;
    post: any;
    icon: React.ReactNode;
    metricLabel: string;
    metricValue: string | number;
}

interface ListboxOption {
    value: string | number;
    label: string;
}

// --- Custom Listbox Component ---
const CustomListbox = ({ 
    value, 
    onChange, 
    options, 
    icon: Icon,
    className = ""
}: { 
    value: string | number;
    onChange: (value: string | number) => void;
    options: ListboxOption[];
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
}) => {
    const selectedOption = options.find(opt => opt.value === value);
    
    return (
        <Listbox value={value} onChange={onChange}>
            <div className={`relative ${className}`}>
                <Listbox.Button className="relative w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all group hover:border-pink-400 dark:hover:border-pink-600">
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {selectedOption?.label}
                        </span>
                    </div>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <IconChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                    </span>
                </Listbox.Button>
                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto focus:outline-none">
                        {options.map((option) => (
                            <Listbox.Option
                                key={option.value}
                                value={option.value}
                                className={({ active }) =>
                                    `cursor-pointer select-none relative px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                                        active ? 'bg-pink-50 dark:bg-gray-700 text-pink-600 dark:text-pink-400' : 'text-gray-900 dark:text-white'
                                    }`
                                }
                            >
                                {({ selected }) => (
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium truncate">{option.label}</span>
                                        {selected && (
                                            <IconCheck className="w-4 h-4 text-pink-500" />
                                        )}
                                    </div>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
    );
};

// --- Stat Card Component ---
const StatCard = ({ label, value, icon, color, trend }: StatCardProps) => (
    <div className="group bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-10 w-fit`}>
                <div className={color.includes('text-') ? color : 'text-emerald-500'}>
                    {icon}
                </div>
            </div>
            {trend !== undefined && (
                <div className={`flex items-center text-xs font-semibold ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend >= 0 ? <IconArrowUp className="w-3 h-3" /> : <IconArrowDown className="w-3 h-3" />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{label}</div>
        <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
    </div>
);

// --- Champion Card Component ---
const ChampionCard = ({ title, post, icon, metricLabel, metricValue }: ChampionCardProps) => {
    if (!post) return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 flex gap-4 items-center opacity-70">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-xl flex items-center justify-center">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    <IconTrophy className="w-3 h-3" />
                    {title}
                </div>
                <h4 className="text-sm font-semibold text-gray-400 dark:text-gray-500 truncate mb-2">
                    No data available
                </h4>
                <div className="text-xs text-gray-400 dark:text-gray-600">
                    {metricLabel}: {metricValue}
                </div>
            </div>
            <IconExternalLink className="w-5 h-5 text-gray-300 dark:text-gray-700" />
        </div>
    );
    
    return (
        <a 
            href={post.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group bg-gradient-to-br from-white to-pink-50 dark:from-gray-900 dark:to-pink-900/10 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-pink-300 dark:hover:border-pink-700 flex gap-4 items-center transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
        >
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400 mb-1">
                    <IconTrophy className="w-3 h-3" />
                    {title}
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                    {post.title}
                </h4>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <IconCalendar className="w-3 h-3 mr-1" />
                    <span className="font-medium">{post.date}</span>
                    <span className="mx-2">•</span>
                    <span className="font-bold text-pink-600 dark:text-pink-400">{metricLabel}: {metricValue}</span>
                </div>
            </div>
            <IconExternalLink className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-pink-500 transition-colors" />
        </a>
    );
};

// --- Engagement Rate Indicator ---
const EngagementIndicator = ({ rate }: { rate: number }) => {
    let colorClass = '';
    let label = '';
    let icon = null;
    
    if (rate >= 15) {
        colorClass = 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
        label = 'Viral';
        icon = <IconSparkles className="w-3 h-3" />;
    } else if (rate >= 8) {
        colorClass = 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
        label = 'High';
        icon = <IconTrendingUp className="w-3 h-3" />;
    } else if (rate >= 4) {
        colorClass = 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
        label = 'Average';
        icon = <IconChartBar className="w-3 h-3" />;
    } else {
        colorClass = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
        label = 'Low';
        icon = <IconInfoCircle className="w-3 h-3" />;
    }
    
    return (
        <div className="flex flex-col items-center">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 ${colorClass}`}>
                {icon}
                {rate}%
            </div>
            <span className="text-[10px] font-medium text-gray-400 mt-1">{label}</span>
        </div>
    );
};

// --- Main TikTok Component ---
const TikTokReportView = ({ report, pageName }: any) => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('date');
    
    // TikTok-specific KPI data
    const kpi = report?.report_data?.kpi;
    const champions = report?.report_data?.champions;
    const rawPosts = report?.report_data?.posts || [];
    const period = report?.report_data?.period;

    // Sort options for TikTok
    const sortOptions: ListboxOption[] = [
        { value: 'date', label: 'Date (Newest)' },
        { value: 'views', label: 'Views (High to Low)' },
        { value: 'likes', label: 'Likes (High to Low)' },
        { value: 'saves', label: 'Saves (High to Low)' },
        { value: 'engagement_rate', label: 'Engagement Rate (High to Low)' },
    ];

    const rowsPerPageOptions: ListboxOption[] = [
        { value: 5, label: '5 per page' },
        { value: 10, label: '10 per page' },
        { value: 20, label: '20 per page' },
        { value: 0, label: 'Show All' },
    ];

    // Sort posts
    const sortedPosts = useMemo(() => {
        return [...rawPosts].sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            return (b[sortBy] || 0) - (a[sortBy] || 0);
        });
    }, [rawPosts, sortBy]);

    const isShowAll = rowsPerPage === 0;
    const totalPages = isShowAll ? 1 : Math.ceil(sortedPosts.length / rowsPerPage);
    const paginatedPosts = isShowAll ? sortedPosts : sortedPosts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    // Calculate average engagement rate
    const avgEngagementRate = kpi?.engagement_rate || 0;

    const exportToCSV = () => {
        const headers = ["Date,Title,Type,Views,Likes,Saves,Shares,Comments,ER%"];
        const rows = paginatedPosts.map((p: any) => 
            `"${p.date}","${p.title.replace(/"/g, '""')}","${p.type}",${p.views},${p.likes},${p.saves},${p.shares},${p.comments},${p.engagement_rate}`
        );
        const blob = new Blob([[...headers, ...rows].join("\n")], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `${pageName}_TikTok_Report_${new Date().toISOString().split('T')[0]}.csv`; 
        a.click();
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [sortBy]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold">
                                <IconBrandTiktok size={32} />
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{pageName}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-rose-400/10 to-rose-400/5 border border-rose-400/20 rounded-full">
                                    <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                                    <span className="text-xs font-bold text-rose-500 dark:text-rose-400">
                                        TikTok Performance
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={exportToCSV}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-400 to-rose-500 hover:from-rose-600 hover:to-rose-700 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-rose-400/20 hover:shadow-xl hover:shadow-rose-400/30 transition-all duration-300 active:scale-95"
                >
                    <IconDownload className="w-4 h-4" />
                    Export Report
                </button>
            </div>

            {/* Report Summary */}
            <div className="bg-gradient-to-r from-rose-200/10 to-rose-300/20 dark:from-emerald-900/10 dark:to-green-900/10 p-6 rounded-2xl border border-[#FE2C55]/20 dark:border-[#FE2C55]/30">
                <div className="flex items-center gap-3 mb-4">
                    <IconCalendar className="w-5 h-5 text-[#FE2C55]" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reporting Period</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Period Start</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{period?.start || 'N/A'}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Period End</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{period?.end || 'N/A'}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Duration</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{period?.duration || 'N/A'}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Contents</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{sortedPosts.length || 'N/A'}</div>
                    </div>
                </div>
            </div>

            {/* Top Performance Cards */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Videos</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        Best of {sortedPosts.length} videos
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ChampionCard 
                        title="Most Viewed Video" 
                        post={champions?.highest_view} 
                        icon={<IconEye className="w-6 h-6" />} 
                        metricLabel="Views"
                        metricValue={champions?.highest_view?.views?.toLocaleString() || '0'}
                    />
                    <ChampionCard 
                        title="Highest Engagement" 
                        post={champions?.highest_engagement} 
                        icon={<IconChartBar className="w-6 h-6" />} 
                        metricLabel="Engagement Rate"
                        metricValue={`${champions?.highest_engagement?.engagement_rate || 0}%`}
                    />
                    <ChampionCard 
                        title="Highest Like" 
                        post={champions?.highest_likes} 
                        icon={<IconHeart className="w-6 h-6" />} 
                        metricLabel="Total Likes"
                        metricValue={champions?.highest_likes?.likes ?.toLocaleString() || '0'}
                    />
                    <ChampionCard 
                        title="Highest Save" 
                        post={champions?.highest_saves} 
                        icon={<IconBookmark className="w-6 h-6" />} 
                        metricLabel="Saves"
                        metricValue={champions?.highest_saves?.saves ?.toLocaleString() || '0'}
                    />
                </div>
            </div>

            {/* TikTok Metrics Grid */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard 
                        label="Total Views" 
                        value={kpi?.views || 0} 
                        icon={<IconEye className="w-6 h-6" />} 
                        color="text-sky-500"
                    />
                    <StatCard 
                        label="Total Likes" 
                        value={kpi?.likes || 0} 
                        icon={<IconThumbUp className="w-6 h-6" />} 
                        color="text-rose-500"
                    />
                    <StatCard 
                        label="Total Saves" 
                        value={kpi?.saves || 0} 
                        icon={<IconBookmark className="w-6 h-6" />} 
                        color="text-amber-500"
                    />
                    <StatCard 
                        label="Total Shares" 
                        value={kpi?.shares || 0} 
                        icon={<IconShare className="w-6 h-6" />} 
                        color="text-emerald-500"
                    />
                    <StatCard 
                        label="Comments" 
                        value={kpi?.comments || 0} 
                        icon={<IconMessage className="w-6 h-6" />} 
                        color="text-indigo-500"
                    />
                    <StatCard 
                        label="Avg ER" 
                        value={`${avgEngagementRate}%`} 
                        icon={<IconChartBar className="w-6 h-6" />} 
                        color="text-purple-500"
                    />
                </div>
            </div>

            {/* Content Performance Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                {/* Table Header */}
                <div className=" border-gray-100 dark:border-gray-800 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <IconSparkles className="w-5 h-5 text-emerald-500" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Video Performance
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {sortedPosts.length} videos • Avg. {avgEngagementRate}% engagement rate
                                </p>
                            </div>
                        </div>
                    </div>
                </div>


                                {/* Table Controls */}
                                <div className="flex flex-col gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                
                                    {/* Controls */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                
                                        {/* Left Controls */}
                                        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                
                                            {/* Sort */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                                                <div className="flex items-center gap-2">
                                                    <IconSortAscending className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        {t('report.sort_by') || 'Sort by'}:
                                                    </span>
                                                </div>
                
                                                <CustomListbox
                                                    value={sortBy}
                                                    onChange={setSortBy}
                                                    options={sortOptions}
                                                    icon={IconFilter}
                                                    className="w-full sm:w-48"
                                                />
                                            </div>
                
                                            <div className="border-l border-gray-300 h-10 mx-3 hidden lg:block"></div>
                
                                            {/* Show */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                                                <div className="flex items-center gap-2">
                                                    <IconEye className="w-4 h-4 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        {t('report.show') || 'Show'}:
                                                    </span>
                                                </div>
                
                                                <CustomListbox
                                                    value={rowsPerPage}
                                                    onChange={(value) => {
                                                        setRowsPerPage(Number(value));
                                                        setCurrentPage(1);
                                                    }}
                                                    options={rowsPerPageOptions}
                                                    className="w-full sm:w-40"
                                                />
                                            </div>
                
                                        </div>
                
                                        {/* Pagination Info */}
                                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-right">
                                            Page {currentPage} of {totalPages}
                                        </div>
                                    </div>
                                </div>

                {/* Table */}
                 <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4 text-left font-medium">Video Content</th>
                                <th className="px-6 py-4 text-center font-medium">Views</th>
                                <th className="px-6 py-4 text-center font-medium">Likes</th>
                                <th className="px-6 py-4 text-center font-medium">Saves</th>
                                <th className="px-6 py-4 text-center font-medium">Shares</th>
                                <th className="px-6 py-4 text-center font-medium">Engagement</th>
                                <th className="px-6 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedPosts.map((post: any, idx: number) => (
                                <tr 
                                    key={idx} 
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs">
                                            <div className="flex items-start gap-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                                        {post.title}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <IconCalendar className="w-3 h-3 text-gray-400" />
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {post.date}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full font-medium">
                                                            {post.type || 'Video'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {post.views?.toLocaleString() || 0}
                                            </span>
            
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {post.likes?.toLocaleString() || 0}
                                            </span>
                    
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {post.saves?.toLocaleString() || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {post.shares?.toLocaleString() || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <EngagementIndicator rate={post.engagement_rate || 0} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a
                                            href={post.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-all group/btn"
                                        >
                                            <IconExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                            Watch
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isShowAll && totalPages > 1 && (
                    <div className="px-0 py-4 ">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, sortedPosts.length)} of {sortedPosts.length} videos
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <IconChevronRight className="w-4 h-4 rotate-180" />
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                    currentPage === pageNum
                                                        ? 'bg-pink-600 text-white'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <IconChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {sortedPosts.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IconVideo className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No videos found</h4>
                        <p className="text-gray-500 dark:text-gray-400">
                            No video data available for this period
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default TikTokReportView;