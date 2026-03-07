import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { formatUserDate } from '../../../utils/userDate';
import { useTranslation } from 'react-i18next';
import {
    IconUsers, IconEye, IconThumbUp, IconShare, IconChartBar,
    IconTrophy, IconDownload, IconExternalLink, IconMessage,
    IconClick, IconChevronRight, IconChevronDown, IconCheck,
    IconCalendar, IconSortAscending, IconFilter,
    IconInfoCircle, IconArrowUp, IconArrowDown,
    IconPlayerPlay, IconPhoto, IconVideo, IconBrandFacebook, IconSparkles,
    IconSearch, IconX, IconTrendingUp
} from '@tabler/icons-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import AnalyticsStatCard from '../../../components/Analytics/AnalyticsStatCard';
import AnalyticsChampionCard from '../../../components/Analytics/AnalyticsChampionCard';
import AnalyticsListbox from '../../../components/Analytics/AnalyticsListbox';
import AnalyticsPagination from '../../../components/Analytics/AnalyticsPagination';
import AnalyticsSortHeader from '../../../components/Analytics/AnalyticsSortHeader';
import { Input } from '../../../components/ui/input';

// --- Engagement Rate Indicator ---
const EngagementIndicator = ({ rate }: { rate: number }) => {
    let colorClass = '';
    let label = '';
    let icon = null;

    if (rate >= 5) {
        colorClass = 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
        label = 'Viral';
        icon = <IconSparkles className="w-3 h-3" />;
    } else if (rate >= 2) {
        colorClass = 'bg-blue-50 dark:bg-blue-900/20 text-blue-600';
        label = 'High';
        icon = <IconTrendingUp className="w-3 h-3" />;
    } else if (rate >= 1) {
        colorClass = 'bg-amber-50 dark:bg-amber-900/20 text-amber-600';
        label = 'Average';
        icon = <IconChartBar className="w-3 h-3" />;
    } else {
        colorClass = 'bg-rose-50 dark:bg-rose-900/20 text-rose-600';
        label = 'Low';
        icon = <IconInfoCircle className="w-3 h-3" />;
    }

    return (
        <Tippy
            theme="light"
            animation="scale"
            interactive={true}
            className="!bg-transparent !p-0"
            content={
                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 min-w-[220px]">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50 dark:border-gray-800">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                            <IconChartBar size={14} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">Engagement Tiers</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4 group">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">Viral Performance</span>
                            </div>
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">5% +</span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">High Engagement</span>
                            </div>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">2% - 5%</span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">Average Reach</span>
                            </div>
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">1% - 2%</span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">Low Interaction</span>
                            </div>
                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded">Below 1%</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 mb-1.5">Calculation Formula</p>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 font-mono text-[9px] text-gray-600 dark:text-gray-400 leading-relaxed">
                            (Reactions + Comments + Shares) ÷ Reach
                        </div>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col items-center cursor-help">
                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${colorClass}`}>
                    {icon}
                    {rate}%
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1 opacity-50">{label}</span>
            </div>
        </Tippy>
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
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [showPostTypes, setShowPostTypes] = useState<string[]>(['Photos', 'Videos', 'Reels']);
    const [searchQuery, setSearchQuery] = useState('');

    const kpi = report?.report_data?.kpi || {};
    const champions = report?.report_data?.champions || {};
    const rawPosts = report?.report_data?.posts || [];
    const period = report?.report_data?.period || {};
    const breakdown = report?.report_data?.breakdown || {};

    const sortOptions = [
        { value: 'date', label: t('report.date') || 'Date (Newest)' },
        { value: 'reach', label: t('report.reach') || 'Reach (High to Low)' },
        { value: 'views', label: t('report.views') || 'Views (High to Low)' },
        { value: 'reactions', label: t('report.reactions') || 'Reactions' },
        { value: 'comments', label: t('report.comments') || 'Comments' },
        { value: 'shares', label: t('report.shares') || 'Shares' },
        { value: 'link_clicks', label: t('report.clicks') || 'Clicks' },
        { value: 'engagement_rate', label: t('report.engagement_rate') || 'Engagement Rate' },
    ];

    const rowsPerPageOptions = [
        { value: 5, label: `5 ${t('report.per_page') || 'per page'}` },
        { value: 10, label: `10 ${t('report.per_page') || 'per page'}` },
        { value: 20, label: `20 ${t('report.per_page') || 'per page'}` },
        { value: 50, label: `50 ${t('report.per_page') || 'per page'}` },
    ];

    const postTypeOptions = [
        { value: 'Photos', label: 'Photos', icon: IconPhoto, count: breakdown.photos || 0 },
        { value: 'Videos', label: 'Videos', icon: IconVideo, count: breakdown.videos || 0 },
        { value: 'Reels', label: 'Reels', icon: IconPlayerPlay, count: breakdown.reels || 0 },
    ];

    const handleSort = (key: string) => {
        if (sortBy === key) {
            setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(key);
            setSortDirection('desc');
        }
        setCurrentPage(1);
    };

    const filteredPosts = useMemo(() => {
        let posts = rawPosts;

        // Filter by Type
        if (showPostTypes.length > 0) {
            posts = posts.filter((post: any) => showPostTypes.includes(post.type));
        }

        // Filter by Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            posts = posts.filter((post: any) =>
                (post.title || '').toLowerCase().includes(query) ||
                (post.type || '').toLowerCase().includes(query)
            );
        }

        return posts;
    }, [rawPosts, showPostTypes, searchQuery]);

    const sortedPosts = useMemo(() => {
        return [...filteredPosts].sort((a, b) => {
            let valA = a[sortBy] || 0;
            let valB = b[sortBy] || 0;
            if (sortBy === 'date') {
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
            }
            if (valA < valB) return sortDirection === 'desc' ? 1 : -1;
            if (valA > valB) return sortDirection === 'desc' ? -1 : 1;
            return 0;
        });
    }, [filteredPosts, sortBy, sortDirection]);

    const totalPages = Math.ceil(sortedPosts.length / rowsPerPage);
    const paginatedPosts = sortedPosts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const exportToCSV = () => {
        const headers = ["Date,Title,Type,Reach,Views,Reactions,Comments,Clicks,Shares,ER%"];
        const rows = sortedPosts.map((p: any) =>
            `"${p.date}","${(p.title || '').replace(/"/g, '""')}","${p.type}",${p.reach || 0},${p.views || 0},${p.reactions || 0},${p.comments || 0},${p.link_clicks || 0},${p.shares || 0},${p.engagement_rate || 0}`
        );
        const blob = new Blob([[...headers, ...rows].join("\n")], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pageName}_Facebook_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const togglePostType = (type: string) => {
        setShowPostTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
        setCurrentPage(1);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#1877F2] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <IconBrandFacebook className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{pageName}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-3 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-[#1877F2] dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-100 dark:border-blue-800">
                                Facebook Analytics Platform
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={exportToCSV}
                    className="inline-flex items-center gap-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary dark:hover:bg-primary hover:text-white transition-all duration-300 active:scale-95 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50"
                >
                    <IconDownload className="w-4 h-4" />
                    {t('report.export_report') || 'Export Dataset'}
                </button>
            </div>

            {/* Range & Period Info */}
            <div className="bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-5 sm:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <IconCalendar size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                            <IconCalendar className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black uppercase text-gray-400 dark:text-gray-500">Content Performance Report</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Start Date</div>
                            <div className="text-base font-black text-gray-900 dark:text-white">{dayjs(report.start_date).format('DD MMM YYYY')}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase text-gray-400 mb-1">End Date</div>
                            <div className="text-base font-black text-gray-900 dark:text-white">{dayjs(report.end_date).format('DD MMM YYYY')}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Active Duration</div>
                            <div className="text-base font-black text-gray-900 dark:text-white">{period?.duration || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Dataset</div>
                            <div className="text-base font-black text-gray-900 dark:text-white">{rawPosts.length} Items</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <AnalyticsStatCard label="Reach" value={kpi?.reach} icon={<IconUsers className="w-5 h-5" />} color="text-blue-500" trend={kpi?.reach_trend} />
                <AnalyticsStatCard label="Views" value={kpi?.views} icon={<IconEye className="w-5 h-5" />} color="text-purple-500" trend={kpi?.views_trend} />
                <AnalyticsStatCard label="Reactions" value={kpi?.reactions} icon={<IconThumbUp className="w-5 h-5" />} color="text-rose-500" trend={kpi?.reactions_trend} />
                <AnalyticsStatCard label="Comments" value={kpi?.comments} icon={<IconMessage className="w-5 h-5" />} color="text-sky-500" trend={kpi?.comments_trend} />
                <AnalyticsStatCard label="Shares" value={kpi?.shares} icon={<IconShare className="w-5 h-5" />} color="text-pink-500" trend={kpi?.shares_trend} />
                <AnalyticsStatCard label="Link Clicks" value={kpi?.link_clicks} icon={<IconClick className="w-5 h-5" />} color="text-orange-500" trend={kpi?.clicks_trend} />
            </div>

            {/* Champions Section */}
            <div>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-[10px] sm:text-xs md:text-sm font-black uppercase text-gray-400 dark:text-gray-500 px-1 tracking-[0.2em]">Performance Champions</h3>
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800 ml-4 hidden sm:block"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <AnalyticsChampionCard title="Most Viewed Content" post={champions?.highest_view} icon={<IconEye className="w-7 h-7" />} metricLabel="Views" metricValue={(champions?.highest_view?.views || 0).toLocaleString()} platformColor="blue" />
                    <AnalyticsChampionCard title="Highest Engagement" post={champions?.highest_engagement} icon={<IconSparkles className="w-7 h-7" />} metricLabel="ER%" metricValue={`${champions?.highest_engagement?.engagement_rate || 0}%`} platformColor="emerald" />
                    <AnalyticsChampionCard title="Conversation Driver" post={champions?.highest_comments} icon={<IconMessage className="w-7 h-7" />} metricLabel="Comments" metricValue={(champions?.highest_comments?.comments || 0).toLocaleString()} platformColor="pink" />
                    <AnalyticsChampionCard title="Viral Catalyst (Shares)" post={champions?.highest_shares} icon={<IconShare className="w-7 h-7" />} metricLabel="Shares" metricValue={(champions?.highest_shares?.shares || 0).toLocaleString()} platformColor="emerald" />
                </div>
            </div>

            {/* Content Explorer */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-8 shadow-sm">
                <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="flex-1 shrink-0">
                            <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600">
                                    <IconSearch size={14} className="sm:w-4 sm:h-4" />
                                </div>
                                Dataset Explorer
                            </h3>
                            <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">
                                Analyzing <span className="text-gray-900 dark:text-white font-bold">{filteredPosts.length}</span> results
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                            {/* Search Input - Premium Focus */}
                            <div className="relative group w-full sm:flex-1 xl:w-64">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <Input
                                    type="text"
                                    placeholder="Search content..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-8 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-lg text-[11px] sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <IconX size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Type Toggles */}
                            <div className="flex items-center gap-1 p-1 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg border border-gray-100 dark:border-gray-800 w-full sm:w-auto overflow-x-auto scrollbar-none">
                                {postTypeOptions.map(({ value, label, icon: Icon, count }) => {
                                    const isActive = showPostTypes.includes(value);
                                    return (
                                        <button
                                            key={value}
                                            onClick={() => togglePostType(value)}
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${isActive
                                                ? 'bg-white dark:bg-gray-700 text-primary shadow-sm border border-gray-100 dark:border-gray-600'
                                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                                }`}
                                        >
                                            <Icon size={12} />
                                            {label}
                                            <span className={`text-[8px] px-1 py-0.5 rounded ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-primary' : 'bg-gray-200 dark:bg-gray-800 text-gray-500 opacity-50'} transition-colors ml-0.5`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex xl:justify-end">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <AnalyticsListbox value={sortBy} onChange={setSortBy} options={sortOptions} icon={IconSortAscending} className="flex-1 sm:w-40" />
                            <AnalyticsListbox value={rowsPerPage} onChange={setRowsPerPage} options={rowsPerPageOptions} className="flex-1 sm:w-40" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-2">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-gray-800">
                                <AnalyticsSortHeader label="Content Body" sortKey="title" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                                <th className="px-4 py-3 sm:px-6 sm:py-4 font-black text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 text-center">Format</th>
                                <AnalyticsSortHeader label="Published" sortKey="date" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Reach" sortKey="reach" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Views" sortKey="views" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Reaction" sortKey="reactions" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Comment" sortKey="comments" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Share" sortKey="shares" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Click" sortKey="link_clicks" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="ER%" sortKey="engagement_rate" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {paginatedPosts.map((post: any, i: number) => (
                                <tr key={i} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-300">
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 max-w-sm">
                                        <a
                                            href={post.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-black text-gray-900 dark:text-white truncate block hover:text-primary hover:underline transition-all"
                                        >
                                            {post.title || "(No Caption)"}
                                        </a>
                                    </td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-center">
                                        <span className={`px-3 py-1 text-[9px] font-black uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg tracking-wider`}>
                                            {post.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right font-bold text-xs text-gray-400 dark:text-gray-500 uppercase">{dayjs(post.date).format('DD MMM YYYY')}</td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.reach || 0).toLocaleString()}</td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-blue-600 dark:text-blue-400">{(post.views || 0).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.reactions || 0).toLocaleString()}</td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.comments || 0).toLocaleString()}</td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.shares || 0).toLocaleString()}</td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.link_clicks || 0).toLocaleString()}</td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right">
                                        <EngagementIndicator rate={post.engagement_rate || 0} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <AnalyticsPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    rowsPerPage={rowsPerPage}
                    totalItems={sortedPosts.length}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};

export default FacebookReportView;
