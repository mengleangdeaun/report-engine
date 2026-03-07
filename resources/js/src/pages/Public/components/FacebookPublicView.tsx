import React, { useState, useMemo } from 'react';
import {
    IconThumbUp, IconMessage, IconShare, IconEye,
    IconClick, IconTrophy, IconChartBar, IconSparkles,
    IconCalendar, IconFilter, IconSortAscending, IconExternalLink
} from '@tabler/icons-react';
import AnalyticsStatCard from '../../../components/Analytics/AnalyticsStatCard';
import AnalyticsChampionCard from '../../../components/Analytics/AnalyticsChampionCard';
import AnalyticsListbox from '../../../components/Analytics/AnalyticsListbox';
import AnalyticsPagination from '../../../components/Analytics/AnalyticsPagination';
import AnalyticsSortHeader from '../../../components/Analytics/AnalyticsSortHeader';

const FacebookPublicView = ({ data }: { data: any }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Data Extraction
    const kpi = data.kpi || {};
    const champions = data.champions || {};
    const rawPosts = data.posts || [];

    // Options
    const sortOptions = [
        { value: 'date', label: 'Date (Newest)' },
        { value: 'reach', label: 'Reach (High to Low)' },
        { value: 'views', label: 'Views (High to Low)' },
        { value: 'engagement_rate', label: 'Engagement Rate' },
        { value: 'reactions', label: 'Reactions' },
    ];

    const rowsPerPageOptions = [
        { value: 5, label: '5 per page' },
        { value: 10, label: '10 per page' },
        { value: 20, label: '20 per page' },
        { value: 50, label: '50 per page' },
    ];

    // Sorting & Pagination Logic
    const handleSort = (key: string) => {
        if (sortBy === key) {
            setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
        } else {
            setSortBy(key);
            setSortDirection('desc');
        }
        setCurrentPage(1);
    };

    const sortedPosts = useMemo(() => {
        return [...rawPosts].sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            if (sortBy === 'date') {
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
            }

            if (valA < valB) return sortDirection === 'desc' ? 1 : -1;
            if (valA > valB) return sortDirection === 'desc' ? -1 : 1;
            return 0;
        });
    }, [rawPosts, sortBy, sortDirection]);

    const totalPages = Math.ceil(sortedPosts.length / rowsPerPage);
    const paginatedPosts = sortedPosts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* --- SECTION 1: KEY METRICS --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <AnalyticsStatCard
                    label="Reach"
                    value={kpi.reach || data.total_reach}
                    icon={<IconChartBar className="w-5 h-5" />}
                    color="text-blue-500"
                    trend={kpi.reach_trend}
                />
                <AnalyticsStatCard
                    label="Views"
                    value={kpi.views || data.total_views}
                    icon={<IconEye className="w-5 h-5" />}
                    color="text-indigo-500"
                    trend={kpi.views_trend}
                />
                <AnalyticsStatCard
                    label="Reactions"
                    value={kpi.reactions || data.total_reactions}
                    icon={<IconThumbUp className="w-5 h-5" />}
                    color="text-sky-500"
                    trend={kpi.reactions_trend}
                />
                <AnalyticsStatCard
                    label="Shares"
                    value={kpi.shares || data.total_shares}
                    icon={<IconShare className="w-5 h-5" />}
                    color="text-gray-500"
                    trend={kpi.shares_trend}
                />
                <AnalyticsStatCard
                    label="Link Clicks"
                    value={kpi.link_clicks || data.total_clicks}
                    icon={<IconClick className="w-5 h-5" />}
                    color="text-orange-500"
                    trend={kpi.clicks_trend}
                />
            </div>

            {/* --- SECTION 2: CHAMPIONS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <AnalyticsChampionCard
                    title="Highest Engagement"
                    post={champions.highest_engagement}
                    icon={<IconSparkles className="w-6 h-6 sm:w-7 sm:h-7" />}
                    metricLabel="Engagement Rate"
                    metricValue={`${champions.highest_engagement?.engagement_rate || 0}%`}
                    platformColor="blue"
                />
                <AnalyticsChampionCard
                    title="Peak Awareness (Reach)"
                    post={champions.highest_reach}
                    icon={<IconChartBar className="w-6 h-6 sm:w-7 sm:h-7" />}
                    metricLabel="Reach"
                    metricValue={(champions.highest_reach?.reach || 0).toLocaleString()}
                    platformColor="emerald"
                />
            </div>

            {/* --- SECTION 3: CONTENT HISTORY TABLE --- */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-[2rem] border border-gray-100 dark:border-gray-800 p-4 sm:p-8 shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="flex-1 shrink-0">
                        <h3 className="text-base sm:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            Content Performance
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                                Live Analysis
                            </span>
                        </h3>
                        <p className="text-[11px] sm:text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">
                            Analyzed performance for {rawPosts.length} posts in this period.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full xl:w-auto">
                        <AnalyticsListbox
                            value={sortBy}
                            onChange={(val) => { setSortBy(val); setCurrentPage(1); }}
                            options={sortOptions}
                            icon={IconSortAscending}
                            className="w-full sm:w-48"
                        />
                        <AnalyticsListbox
                            value={rowsPerPage}
                            onChange={(val) => { setRowsPerPage(val); setCurrentPage(1); }}
                            options={rowsPerPageOptions}
                            className="w-full sm:w-36"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto -mx-2">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-50 dark:border-gray-800">
                                <AnalyticsSortHeader
                                    label="Post Content"
                                    sortKey="title"
                                    currentSort={sortBy}
                                    sortDirection={sortDirection}
                                    onSort={handleSort}
                                />
                                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 text-center">Type</th>
                                <AnalyticsSortHeader
                                    label="Date"
                                    sortKey="date"
                                    currentSort={sortBy}
                                    sortDirection={sortDirection}
                                    onSort={handleSort}
                                    align="right"
                                />
                                <AnalyticsSortHeader
                                    label="Reach"
                                    sortKey="reach"
                                    currentSort={sortBy}
                                    sortDirection={sortDirection}
                                    onSort={handleSort}
                                    align="right"
                                />
                                <AnalyticsSortHeader
                                    label="Eng. Rate"
                                    sortKey="engagement_rate"
                                    currentSort={sortBy}
                                    sortDirection={sortDirection}
                                    onSort={handleSort}
                                    align="right"
                                />
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {paginatedPosts.map((post: any, i: number) => (
                                <tr key={i} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-300">
                                    <td className="px-6 py-5 max-w-sm">
                                        <div className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                            {post.title || "(No Caption)"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase text-gray-500 dark:text-gray-400 rounded-lg tracking-wider">
                                            {post.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-bold text-xs text-gray-400 dark:text-gray-500 uppercase">
                                        {post.date}
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-sm text-gray-900 dark:text-white">
                                        {(post.reach || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-lg">
                                            <IconSparkles className="w-3 h-3" />
                                            {post.engagement_rate}%
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <a
                                            href={post.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-10 h-10 inline-flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm hover:shadow-md"
                                        >
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
                    totalItems={sortedPosts.length}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};

export default FacebookPublicView;
