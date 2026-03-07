import React, { useState, useMemo, useEffect } from 'react';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
    IconEye, IconThumbUp, IconBookmark, IconShare, IconMessage,
    IconChartBar, IconTrophy, IconDownload, IconChevronRight,
    IconExternalLink, IconChevronDown, IconCheck, IconCalendar,
    IconSortAscending, IconFilter, IconTrendingUp, IconSparkles,
    IconInfoCircle, IconArrowUp, IconArrowDown,
    IconPlayerPlay, IconVideo, IconMusic, IconHeart,
    IconBrandTiktok,
    IconSearch, IconX
} from '@tabler/icons-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import AnalyticsStatCard from '../../../components/Analytics/AnalyticsStatCard';
import AnalyticsChampionCard from '../../../components/Analytics/AnalyticsChampionCard';
import AnalyticsListbox from '../../../components/Analytics/AnalyticsListbox';
import AnalyticsPagination from '../../../components/Analytics/AnalyticsPagination';
import AnalyticsSortHeader from '../../../components/Analytics/AnalyticsSortHeader';

// --- Engagement Rate Indicator ---
const EngagementIndicator = ({ rate }: { rate: number }) => {
    let colorClass = '';
    let label = '';
    let icon = null;

    if (rate >= 15) {
        colorClass = 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
        label = 'Viral';
        icon = <IconSparkles className="w-3 h-3" />;
    } else if (rate >= 8) {
        colorClass = 'bg-blue-50 dark:bg-blue-900/20 text-blue-600';
        label = 'High';
        icon = <IconTrendingUp className="w-3 h-3" />;
    } else if (rate >= 4) {
        colorClass = 'bg-amber-50 dark:bg-amber-900/20 text-amber-600';
        label = 'Average';
        icon = <IconChartBar className="w-3 h-3" />;
    } else {
        colorClass = 'bg-gray-50 dark:bg-gray-800 text-gray-500';
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
                <div className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-xl border min-w-[220px]">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-50 dark:border-gray-800">
                        <div className="p-1.5 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-[#FE2C55]">
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
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">15% +</span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">High Engagement</span>
                            </div>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">8% - 15%</span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">Average Reach</span>
                            </div>
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">4% - 8%</span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]" />
                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">Low Interaction</span>
                            </div>
                            <span className="text-[10px] font-black text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Below 4%</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 mb-1.5">Calculation Formula</p>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 font-mono text-[9px] text-gray-600 dark:text-gray-400 leading-relaxed">
                            (Likes + Comments + Shares + Saves) ÷ Views
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

// --- Main TikTok Component ---
const TikTokReportView = ({ report, pageName }: any) => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [searchQuery, setSearchQuery] = useState('');

    // TikTok-specific KPI data
    const kpi = report?.report_data?.kpi;
    const champions = report?.report_data?.champions;
    const rawPosts = report?.report_data?.posts || [];
    const period = report?.report_data?.period;

    // Sort options for TikTok
    const sortOptions = [
        { value: 'date', label: 'Date' },
        { value: 'views', label: 'Views' },
        { value: 'likes', label: 'Likes' },
        { value: 'comments', label: 'Comments' },
        { value: 'shares', label: 'Shares' },
        { value: 'saves', label: 'Saves' },
        { value: 'engagement_rate', label: 'Engagement Rate' },
    ];

    const rowsPerPageOptions = [
        { value: 5, label: `5 ${t('report.per_page') || 'per page'}` },
        { value: 10, label: `10 ${t('report.per_page') || 'per page'}` },
        { value: 20, label: `20 ${t('report.per_page') || 'per page'}` },
        { value: 50, label: `50 ${t('report.per_page') || 'per page'}` },
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

    // Filter and Sort posts
    const filteredPosts = useMemo(() => {
        let posts = rawPosts;

        // Filter by Search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            posts = posts.filter((post: any) =>
                (post.title || '').toLowerCase().includes(query) ||
                (post.type || 'Video').toLowerCase().includes(query)
            );
        }

        return posts;
    }, [rawPosts, searchQuery]);

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

    const avgEngagementRate = kpi?.engagement_rate || 0;

    const exportToCSV = () => {
        const headers = ["Date,Title,Type,Views,Likes,Saves,Shares,Comments,ER%"];
        const rows = sortedPosts.map((p: any) =>
            `"${p.date}","${(p.title || '').replace(/"/g, '""')}","${p.type || 'Video'}",${p.views || 0},${p.likes || 0},${p.saves || 0},${p.shares || 0},${p.comments || 0},${p.engagement_rate || 0}`
        );
        const blob = new Blob([[...headers, ...rows].join("\n")], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pageName}_TikTok_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#FE2C55] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <IconBrandTiktok className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{pageName}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-900/30 text-[#FE2C55] dark:text-rose-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-100 dark:border-rose-800">
                                TikTok Performance Platform
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={exportToCSV}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#FE2C55] dark:hover:bg-[#FE2C55] hover:text-white transition-all duration-300 active:scale-95 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50"
                >
                    <IconDownload className="w-4 h-4" />
                    {t('report.export_report') || 'Export Dataset'}
                </button>
            </div>

            {/* Reporting Period */}
            <div className="bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-5 sm:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <IconCalendar size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-[#FE2C55]">
                            <IconCalendar className="w-5 h-5" />
                        </div>
                        <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Reporting Performance Window</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                        <div>
                            <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Window Start</div>
                            <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white">{period?.start ? dayjs(period.start).format('DD MMM YYYY') : 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Window End</div>
                            <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white">{period?.end ? dayjs(period.end).format('DD MMM YYYY') : 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Duration</div>
                            <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white">{period?.duration || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Dataset</div>
                            <div className="text-sm sm:text-base font-black text-gray-900 dark:text-white">{rawPosts.length} <span className="text-[10px] opacity-60">Videos</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Performance Cards */}
            <div>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 px-1">Performance Champions</h3>
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800 mx-4 sm:mx-6 hidden sm:block"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnalyticsChampionCard
                        title="Most Viewed Content"
                        post={champions?.highest_view}
                        icon={<IconEye className="w-7 h-7" />}
                        metricLabel="Views"
                        metricValue={(champions?.highest_view?.views || 0).toLocaleString()}
                        platformColor="rose"
                    />
                    <AnalyticsChampionCard
                        title="Highest Engagement"
                        post={champions?.highest_engagement}
                        icon={<IconSparkles className="w-7 h-7" />}
                        metricLabel="ER%"
                        metricValue={`${champions?.highest_engagement?.engagement_rate || 0}%`}
                        platformColor="emerald"
                    />
                    <AnalyticsChampionCard
                        title="Audience Favorite (Likes)"
                        post={champions?.highest_likes}
                        icon={<IconHeart className="w-7 h-7" />}
                        metricLabel="Likes"
                        metricValue={(champions?.highest_likes?.likes || 0).toLocaleString()}
                        platformColor="pink"
                    />
                    <AnalyticsChampionCard
                        title="High Intent (Saves)"
                        post={champions?.highest_saves}
                        icon={<IconBookmark className="w-7 h-7" />}
                        metricLabel="Saves"
                        metricValue={(champions?.highest_saves?.saves || 0).toLocaleString()}
                        platformColor="amber"
                    />
                </div>
            </div>

            {/* TikTok Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <AnalyticsStatCard label="Views" value={kpi?.views} icon={<IconEye className="w-5 h-5" />} color="text-sky-500" trend={kpi?.views_trend} />
                <AnalyticsStatCard label="Likes" value={kpi?.likes} icon={<IconThumbUp className="w-5 h-5" />} color="text-rose-500" trend={kpi?.likes_trend} />
                <AnalyticsStatCard label="Saves" value={kpi?.saves} icon={<IconBookmark className="w-5 h-5" />} color="text-amber-500" trend={kpi?.saves_trend} />
                <AnalyticsStatCard label="Shares" value={kpi?.shares} icon={<IconShare className="w-5 h-5" />} color="text-emerald-500" trend={kpi?.shares_trend} />
                <AnalyticsStatCard label="Comments" value={kpi?.comments} icon={<IconMessage className="w-5 h-5" />} color="text-indigo-500" trend={kpi?.comments_trend} />
                <AnalyticsStatCard label="Avg ER" value={`${avgEngagementRate}%`} icon={<IconChartBar className="w-5 h-5" />} color="text-purple-500" />
            </div>

            {/* Content Performance Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sm:p-8 shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="flex-1 shrink-0">
                        <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center text-[#FE2C55]">
                                <IconSearch size={14} className="sm:w-4 sm:h-4" />
                            </div>
                            Dataset Explorer
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">
                            Analyzing <span className="text-gray-900 dark:text-white font-bold">{filteredPosts.length}</span> results
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                        {/* Search Input - TikTok Rose Focus */}
                        <div className="relative group w-full sm:flex-1 xl:w-64">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-[#FE2C55] transition-colors" />
                            <input
                                type="text"
                                placeholder="Search videos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-lg text-[11px] sm:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#FE2C55]/10 focus:border-[#FE2C55] transition-all shadow-sm"
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

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <AnalyticsListbox value={sortBy} onChange={setSortBy} options={sortOptions} icon={IconSortAscending} className="flex-1 sm:w-44" />
                            <AnalyticsListbox value={rowsPerPage} onChange={setRowsPerPage} options={rowsPerPageOptions} className="flex-1 sm:w-40" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-2">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-gray-800">
                                <AnalyticsSortHeader label="Video Content" sortKey="title" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                                <th className="px-4 py-3 sm:px-6 sm:py-4 font-black text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 text-center">Format</th>
                                <AnalyticsSortHeader label="Views" sortKey="views" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Likes" sortKey="likes" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Comment" sortKey="comments" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Share" sortKey="shares" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Saves" sortKey="saves" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
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
                                            className="text-sm font-black text-gray-900 dark:text-white truncate block hover:text-[#FE2C55] hover:underline transition-all"
                                        >
                                            {post.title || "(No Caption)"}
                                        </a>
                                        <div className="flex items-center gap-2 mt-1">
                                            <IconCalendar className="w-3 h-3 text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{dayjs(post.date).format('DD MMM YYYY')}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-center">
                                        <span className={`px-3 py-1 text-[9px] font-black uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg tracking-wider`}>
                                            {post.type || 'Video'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.views || 0).toLocaleString()}</td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.likes || 0).toLocaleString()}</td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.comments || 0).toLocaleString()}</td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.shares || 0).toLocaleString()}</td>
                                    <td className="px-4 py-4 sm:px-6 sm:py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.saves || 0).toLocaleString()}</td>
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
                    totalItems={filteredPosts.length}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};

export default TikTokReportView;