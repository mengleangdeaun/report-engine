import React, { useState, useMemo, Fragment, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    IconUsers, IconEye, IconThumbUp, IconShare, IconChartBar, 
    IconTrophy, IconDownload, IconExternalLink, IconMessage, 
    IconClick, IconChevronRight, IconChevronDown, IconCheck,
    IconCalendar, IconSortAscending, IconFilter,
    IconInfoCircle, IconArrowUp, IconArrowDown,
    IconPlayerPlay, IconPhoto, IconVideo, IconBrandFacebook,
} from '@tabler/icons-react';
import { Listbox, Transition } from '@headlessui/react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    trend?: number;
}

const StatCard = ({ label, value, icon, color, trend }: StatCardProps) => (
    <div className="group bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-10 w-fit`}>
                <div className={color.includes('text-') ? color : 'text-blue-500'}>
                    {icon}
                </div>
            </div>
            {trend !== undefined && (
                <div className={`flex items-center text-xs font-semibold ${trend >= 0 ? 'text-green-500' : 'text-rose-500'}`}>
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

interface ChampionCardProps {
    title: string;
    post: any;
    icon: React.ReactNode;
    metricLabel: string;
    metricValue: string | number;
}

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
            className="group bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-900/10 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 flex gap-4 items-center transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
        >
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                    <IconTrophy className="w-3 h-3" />
                    {title}
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                </h4>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <IconCalendar className="w-3 h-3 mr-1" />
                    <span className="font-medium">{post.date}</span>
                    <span className="mx-2">•</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{metricLabel}: {metricValue}</span>
                </div>
            </div>
            <IconExternalLink className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
        </a>
    );
};

interface ListboxOption {
    value: string | number;
    label: string;
}

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
                <Listbox.Button className="relative w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all group hover:border-blue-400 dark:hover:border-blue-600">
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
                                        active ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                    }`
                                }
                            >
                                {({ selected }) => (
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium truncate">{option.label}</span>
                                        {selected && (
                                            <IconCheck className="w-4 h-4 text-blue-500" />
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

interface FacebookReportViewProps {
    report: any;
    pageName: string;
}

const FacebookReportView = ({ report, pageName }: FacebookReportViewProps) => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('date');
    const [showPostTypes, setShowPostTypes] = useState<string[]>(['Photos', 'Videos']);

    const kpi = report?.report_data?.kpi;
    const champions = report?.report_data?.champions;
    const rawPosts = report?.report_data?.posts || [];
    const period = report?.report_data?.period;
    const breakdown = report?.report_data?.breakdown || {};

    const sortOptions: ListboxOption[] = [
        { value: 'date', label: t('report.date') || 'Date (Newest)' },
        { value: 'reach', label: t('report.reach') || 'Reach (High to Low)' },
        { value: 'views', label: t('report.views') || 'Views (High to Low)' },
        { value: 'reactions', label: t('report.reactions') || 'Reactions (High to Low)' },
        { value: 'engagement_rate', label: t('report.engagement_rate') || 'Engagement Rate (High to Low)' },
    ];

    const rowsPerPageOptions: ListboxOption[] = [
        { value: 5, label: `5 ${t('report.per_page') || 'per page'}` },
        { value: 10, label: `10 ${t('report.per_page') || 'per page'}` },
        { value: 20, label: `20 ${t('report.per_page') || 'per page'}` },
        { value: 0, label: t('report.show_all') || 'Show All' },
    ];

    const postTypeOptions = [
        { value: 'Photos', label: 'Photos', icon: IconPhoto, count: breakdown.photos || 0 },
        { value: 'Videos', label: 'Videos', icon: IconVideo, count: breakdown.videos || 0 },
        { value: 'Reels', label: 'Reels', icon: IconPlayerPlay, count: breakdown.reels || 0 },
    ];

    const filteredPosts = useMemo(() => {
        if (showPostTypes.length === 0) return rawPosts;
        return rawPosts.filter((post: any) => showPostTypes.includes(post.type));
    }, [rawPosts, showPostTypes]);

    const sortedPosts = useMemo(() => {
        return [...filteredPosts].sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }
            return (b[sortBy] || 0) - (a[sortBy] || 0);
        });
    }, [filteredPosts, sortBy]);

    const isShowAll = rowsPerPage === 0;
    const totalPages = isShowAll ? 1 : Math.ceil(sortedPosts.length / rowsPerPage);
    const paginatedPosts = isShowAll ? sortedPosts : sortedPosts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const exportToCSV = () => {
        const headers = ["Date,Title,Type,Reach,Views,Reactions,Comments,Clicks,Shares,ER%"];
        const rows = paginatedPosts.map((p: any) => 
            `"${p.date}","${p.title.replace(/"/g, '""')}","${p.type}",${p.reach},${p.views},${p.reactions},${p.comments},${p.link_clicks},${p.shares},${p.engagement_rate}`
        );
        const blob = new Blob([[...headers, ...rows].join("\n")], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a'); 
        a.href = url; 
        a.download = `${pageName}_Facebook_Report_${new Date().toISOString().split('T')[0]}.csv`; 
        a.click();
    };

    const getEngagementColor = (rate: number) => {
        if (rate >= 5) return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
        if (rate >= 2) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    };

    const togglePostType = (type: string) => {
        setShowPostTypes(prev => 
            prev.includes(type) 
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
        setCurrentPage(1);
    };

        const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric' });
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [showPostTypes, sortBy]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-16 h-16 bg-[#1877F2] rounded-xl flex items-center justify-center">
                            <IconBrandFacebook className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{pageName}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                                    Facebook Insights
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={exportToCSV}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 active:scale-95"
                >
                    <IconDownload className="w-4 h-4" />
                    {t('report.export_report') || 'Export Report'}
                </button>
            </div>

            {/* Report Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-4">
                    <IconCalendar className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reporting Period</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Period Start</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(report.start_date) || 'N/A'}</div> 
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Period End</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(report.end_date) || 'N/A'}</div>
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

            {/* Champions Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Content</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        Best of {sortedPosts.length} posts
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    <ChampionCard 
                        title={t('report.highest_view') || 'Most Viewed'} 
                        post={champions?.highest_view} 
                        icon={<IconEye className="w-6 h-6" />} 
                        metricLabel="Views"
                        metricValue={champions?.highest_view?.views?.toLocaleString() || '0'}
                    />
                    <ChampionCard 
                        title={t('report.highest_engagement') || 'Highest Engagement'} 
                        post={champions?.highest_engagement} 
                        icon={<IconChartBar className="w-6 h-6" />} 
                        metricLabel="Engagement Rate"
                        metricValue={`${champions?.highest_engagement?.engagement_rate || 0}%`}
                    />
                    <ChampionCard 
                        title={t('report.highest_comment') || 'Most Comments'} 
                        post={champions?.highest_comments} 
                        icon={<IconMessage className="w-6 h-6" />} 
                        metricLabel="Comments"
                        metricValue={champions?.highest_comments?.comments?.toLocaleString() || '0'}
                    />
                    <ChampionCard 
                        title={t('report.highest_share') || 'Most Shared'} 
                        post={champions?.highest_shares} 
                        icon={<IconShare className="w-6 h-6" />} 
                        metricLabel="Shares"
                        metricValue={champions?.highest_shares?.shares?.toLocaleString() || '0'}
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Performance Indicators</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard 
                        label={t('report.reach') || 'Reach'} 
                        value={kpi?.reach || 0} 
                        icon={<IconUsers className="w-6 h-6" />} 
                        color="text-blue-500"
                    />
                    <StatCard 
                        label={t('report.views') || 'Views'} 
                        value={kpi?.views || 0} 
                        icon={<IconEye className="w-6 h-6" />} 
                        color="text-purple-500"
                    />
                    <StatCard 
                        label={t('report.reactions') || 'Reactions'} 
                        value={kpi?.reactions || 0} 
                        icon={<IconThumbUp className="w-6 h-6" />} 
                        color="text-rose-500"
                    />
                    <StatCard 
                        label={t('report.comments') || 'Comments'} 
                        value={kpi?.comments || 0} 
                        icon={<IconMessage className="w-6 h-6" />} 
                        color="text-sky-500"
                    />
                    <StatCard 
                        label={t('report.shares') || 'Shares'} 
                        value={kpi?.shares || 0} 
                        icon={<IconShare className="w-6 h-6" />} 
                        color="text-pink-500"
                    />
                    <StatCard 
                        label={t('report.clicks') || 'Link Clicks'} 
                        value={kpi?.link_clicks || 0} 
                        icon={<IconClick className="w-6 h-6" />} 
                        color="text-orange-500"
                    />

                </div>
            </div>

            {/* Content Filter & Stats */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {t('report.content_history') || 'Content History'}
                        </h3>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                {sortedPosts.length} {t('report.content') || 'posts found'} • 
                                Total Engagement: {kpi?.reactions + kpi?.comments + kpi?.shares || 0}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Post Type Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            {postTypeOptions.map(({ value, label, icon: Icon, count }) => (
                                <button
                                    key={value}
                                    onClick={() => togglePostType(value)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                        showPostTypes.includes(value)
                                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                >
                                    {Icon && <Icon className="w-4 h-4" />}
                                    {label}
                                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-inherit">
                                        {count}
                                    </span>
                                </button>
                            ))}
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
                                <th className="px-6 py-4 text-left font-medium">Content</th>
                                <th className="px-6 py-4 text-center font-medium">Type</th>
                                <th className="px-6 py-4 text-center font-medium">Reach</th>
                                <th className="px-6 py-4 text-center font-medium">Views</th>
                                <th className="px-6 py-4 text-center font-medium">Engagement</th>
                                <th className="px-6 py-4 text-center font-medium">ER%</th>
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
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {post.title}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <IconCalendar className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {post.date}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                            post.type === 'Videos' 
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                        }`}>
                                            {post.type === 'Videos' ? <IconVideo className="w-3 h-3" /> : <IconPhoto className="w-3 h-3" />}
                                            {post.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {post.reach?.toLocaleString() || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                                {post.views?.toLocaleString() || 0}
                                            </span>
                                            {post.views > post.reach && (
                                                <span className="text-xs text-green-500 mt-1 flex items-center gap-1">
                                                    <IconArrowUp className="w-3 h-3" />
                                                    {((post.views / post.reach) * 100).toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-sm flex items-center font-bold text-emerald-600 dark:text-emerald-400">
                                                <IconThumbUp className="w-4 h-4 mr-1" />
                                                <span>
                                                 {post.reactions?.toLocaleString() || 0}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                <IconMessage className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs text-gray-500">{post.comments || 0}</span>
                                                <IconShare className="w-3 h-3 text-gray-400 ml-2" />
                                                <span className="text-xs text-gray-500">{post.shares || 0}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getEngagementColor(post.engagement_rate)}`}>
                                                {post.engagement_rate || 0}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a
                                            href={post.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all group/btn"
                                        >
                                            <IconExternalLink className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                            View
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
                                Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, sortedPosts.length)} of {sortedPosts.length} posts
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
                                                        ? 'bg-blue-600 text-white'
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
                            <IconPhoto className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts found</h4>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Try adjusting your filters to see more content
                        </p>
                        <button
                            onClick={() => {
                                setShowPostTypes(['Photos', 'Videos']);
                                setSortBy('date');
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Performance Summary */}
            {/* <div className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-900 p-6 rounded-2xl border border-blue-200 dark:border-blue-800/30">
                <div className="flex items-center gap-3 mb-4">
                    <IconChartBar className="w-5 h-5 text-blue-500" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Performance Insights</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Best Content Type:</span>
                        <p className="mt-1">Videos perform 2.5x better than photos for engagement</p>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Peak Engagement:</span>
                        <p className="mt-1">Highest engagement occurs 6-9 PM weekdays</p>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Growth Tip:</span>
                        <p className="mt-1">Interactive posts with questions increase comments by 180%</p>
                    </div>
                </div>
            </div> */}
        </div>
    );
};

export default FacebookReportView;
