import React, { useState, useMemo, useEffect } from 'react';
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
        <div className="flex flex-col items-center">
            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${colorClass}`}>
                {icon}
                {rate}%
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1 opacity-50">{label}</span>
        </div>
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
        { value: 'date', label: 'Date (Newest)' },
        { value: 'views', label: 'Views (High to Low)' },
        { value: 'likes', label: 'Likes (High to Low)' },
        { value: 'saves', label: 'Saves (High to Low)' },
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
                    <div className="w-16 h-16 bg-[#FE2C55] rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <IconBrandTiktok className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">{pageName}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-3 py-0.5 bg-rose-50 dark:bg-rose-900/30 text-[#FE2C55] dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-100 dark:border-rose-800">
                                TikTok Performance Platform
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={exportToCSV}
                    className="inline-flex items-center gap-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#FE2C55] dark:hover:bg-[#FE2C55] hover:text-white transition-all duration-300 active:scale-95 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50"
                >
                    <IconDownload className="w-4 h-4" />
                    {t('report.export_report') || 'Export Dataset'}
                </button>
            </div>

            {/* Reporting Period */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    <IconCalendar size={120} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg text-[#FE2C55]">
                            <IconCalendar className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Reporting Performance Window</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Window Start</div>
                            <div className="text-base font-black text-gray-900 dark:text-white">{period?.start || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Window End</div>
                            <div className="text-base font-black text-gray-900 dark:text-white">{period?.end || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Active Duration</div>
                            <div className="text-base font-black text-gray-900 dark:text-white">{period?.duration || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Dataset</div>
                            <div className="text-base font-black text-gray-900 dark:text-white">{rawPosts.length} Videos</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Performance Cards */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 px-1">Performance Champions</h3>
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800 mx-6 hidden md:block"></div>
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <AnalyticsStatCard label="Views" value={kpi?.views} icon={<IconEye className="w-5 h-5" />} color="text-sky-500" trend={kpi?.views_trend} />
                <AnalyticsStatCard label="Likes" value={kpi?.likes} icon={<IconThumbUp className="w-5 h-5" />} color="text-rose-500" trend={kpi?.likes_trend} />
                <AnalyticsStatCard label="Saves" value={kpi?.saves} icon={<IconBookmark className="w-5 h-5" />} color="text-amber-500" trend={kpi?.saves_trend} />
                <AnalyticsStatCard label="Shares" value={kpi?.shares} icon={<IconShare className="w-5 h-5" />} color="text-emerald-500" trend={kpi?.shares_trend} />
                <AnalyticsStatCard label="Comments" value={kpi?.comments} icon={<IconMessage className="w-5 h-5" />} color="text-indigo-500" trend={kpi?.comments_trend} />
                <AnalyticsStatCard label="Avg ER" value={`${avgEngagementRate}%`} icon={<IconChartBar className="w-5 h-5" />} color="text-purple-500" />
            </div>

            {/* Content Performance Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10">
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-[#FE2C55]">
                                <IconSearch size={20} />
                            </div>
                            Dataset Explorer
                        </h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">
                            Analyzing <span className="text-gray-900 dark:text-white font-bold">{filteredPosts.length}</span> results
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search Input - TikTok Rose Focus */}
                        <div className="relative group w-full md:w-72">
                            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#FE2C55] transition-colors" />
                            <input
                                type="text"
                                placeholder="Search videos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-10 py-3 bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#FE2C55]/10 focus:border-[#FE2C55] transition-all shadow-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <IconX size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-right">
                            <AnalyticsListbox value={sortBy} onChange={setSortBy} options={sortOptions} icon={IconSortAscending} className="w-48" />
                            <AnalyticsListbox value={rowsPerPage} onChange={setRowsPerPage} options={rowsPerPageOptions} className="w-36" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto -mx-2">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-gray-800">
                                <AnalyticsSortHeader label="Video Content" sortKey="title" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} />
                                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 text-center">Format</th>
                                <AnalyticsSortHeader label="Views" sortKey="views" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Likes" sortKey="likes" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="Saves" sortKey="saves" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <AnalyticsSortHeader label="ER%" sortKey="engagement_rate" currentSort={sortBy} sortDirection={sortDirection} onSort={handleSort} align="right" />
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {paginatedPosts.map((post: any, i: number) => (
                                <tr key={i} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-300">
                                    <td className="px-6 py-6 max-w-sm">
                                        <div className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-[#FE2C55] transition-colors">{post.title || "(No Caption)"}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <IconCalendar className="w-3 h-3 text-gray-400" />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{post.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className={`px-3 py-1 text-[9px] font-black uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg tracking-wider`}>
                                            {post.type || 'Video'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.views || 0).toLocaleString()}</td>
                                    <td className="px-6 py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.likes || 0).toLocaleString()}</td>
                                    <td className="px-6 py-6 text-right font-black text-sm text-gray-900 dark:text-white">{(post.saves || 0).toLocaleString()}</td>
                                    <td className="px-6 py-6 text-right">
                                        <EngagementIndicator rate={post.engagement_rate || 0} />
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                        <a href={post.link} target="_blank" rel="noreferrer" className="w-10 h-10 inline-flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-[#FE2C55] hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm hover:shadow-md">
                                            <IconExternalLink size={18} />
                                        </a>
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