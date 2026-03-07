import React, { useState, useMemo } from 'react';
import {
    IconEye, IconHeart, IconShare, IconMessageDots,
    IconBookmark, IconTrophy, IconSparkles, IconTrendingUp,
    IconChartBar, IconInfoCircle, IconSortAscending, IconExternalLink,
    IconPlayerPlay, IconMusic, IconVideo
} from '@tabler/icons-react';
import AnalyticsStatCard from '../../../components/Analytics/AnalyticsStatCard';
import AnalyticsChampionCard from '../../../components/Analytics/AnalyticsChampionCard';
import AnalyticsListbox from '../../../components/Analytics/AnalyticsListbox';
import AnalyticsPagination from '../../../components/Analytics/AnalyticsPagination';
import AnalyticsSortHeader from '../../../components/Analytics/AnalyticsSortHeader';

// Engagement Rate Indicator
const EngagementIndicator = ({ rate }: { rate: number }) => {
    let colorClass = '';
    let label = '';
    let icon = null;

    if (rate >= 15) {
        colorClass = 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400';
        label = 'Viral';
        icon = <IconSparkles className="w-3 h-3" />;
    } else if (rate >= 8) {
        colorClass = 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
        label = 'High';
        icon = <IconTrendingUp className="w-3 h-3" />;
    } else if (rate >= 4) {
        colorClass = 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400';
        label = 'Average';
        icon = <IconChartBar className="w-3 h-3" />;
    } else {
        colorClass = 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
        label = 'Low';
        icon = <IconInfoCircle className="w-3 h-3" />;
    }

    return (
        <div className="flex flex-col items-center">
            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 ${colorClass}`}>
                {icon}
                {rate}%
            </div>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mt-1">{label}</span>
        </div>
    );
};

const TikTokPublicView = ({ data }: { data: any }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const kpi = data.kpi || {};
    const champions = data.champions || {};
    const rawPosts = data.posts || [];

    const sortOptions = [
        { value: 'date', label: 'Date (Newest)' },
        { value: 'views', label: 'Views (High to Low)' },
        { value: 'likes', label: 'Likes (High to Low)' },
        { value: 'saves', label: 'Saves (High to Low)' },
        { value: 'engagement_rate', label: 'Engagement Rate' },
    ];

    const rowsPerPageOptions = [
        { value: 5, label: '5 per page' },
        { value: 10, label: '10 per page' },
        { value: 20, label: '20 per page' },
        { value: 50, label: '50 per page' },
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

    const sortedPosts = useMemo(() => {
        return [...rawPosts].sort((a, b) => {
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
    }, [rawPosts, sortBy, sortDirection]);

    const totalPages = Math.ceil(sortedPosts.length / rowsPerPage);
    const paginatedPosts = sortedPosts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* --- SECTION 1: KEY METRICS --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <AnalyticsStatCard
                    label="Views"
                    value={kpi.views || data.total_views}
                    icon={<IconPlayerPlay className="w-5 h-5" />}
                    color="text-black dark:text-white"
                    trend={kpi.views_trend}
                />
                <AnalyticsStatCard
                    label="Likes"
                    value={kpi.likes || data.total_likes}
                    icon={<IconHeart className="w-5 h-5" />}
                    color="text-pink-500"
                    trend={kpi.likes_trend}
                />
                <AnalyticsStatCard
                    label="Comments"
                    value={kpi.comments || data.total_comments}
                    icon={<IconMessageDots className="w-5 h-5" />}
                    color="text-teal-500"
                    trend={kpi.comments_trend}
                />
                <AnalyticsStatCard
                    label="Shares"
                    value={kpi.shares || data.total_shares}
                    icon={<IconShare className="w-5 h-5" />}
                    color="text-blue-500"
                    trend={kpi.shares_trend}
                />
                <AnalyticsStatCard
                    label="Saves"
                    value={kpi.saves || data.total_saves}
                    icon={<IconBookmark className="w-5 h-5" />}
                    color="text-amber-500"
                    trend={kpi.saves_trend}
                />
            </div>

            {/* --- SECTION 2: HIGHLIGHTS (CHAMPIONS) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <AnalyticsChampionCard
                    title="Most Viewed Video"
                    post={champions.highest_view}
                    icon={<IconEye className="w-6 h-6 sm:w-7 sm:h-7" />}
                    metricLabel="Total Views"
                    metricValue={(champions.highest_view?.views || 0).toLocaleString()}
                    platformColor="blue"
                />
                <AnalyticsChampionCard
                    title="Viral Potential (High ER)"
                    post={champions.highest_engagement}
                    icon={<IconSparkles className="w-6 h-6 sm:w-7 sm:h-7" />}
                    metricLabel="Engagement"
                    metricValue={`${champions.highest_engagement?.engagement_rate || 0}%`}
                    platformColor="pink"
                />
            </div>

            {/* --- SECTION 3: VIDEO PERFORMANCE TABLE --- */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-[2rem] border border-gray-100 dark:border-gray-800 p-4 sm:p-8 shadow-sm">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="flex-1 shrink-0">
                        <h3 className="text-base sm:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            Video Intelligence
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-pink-50 dark:bg-pink-900/20 text-pink-600 px-2 py-0.5 rounded-full border border-pink-100 dark:border-pink-800">
                                Fresh Data
                            </span>
                        </h3>
                        <p className="text-[11px] sm:text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">
                            Tracking {rawPosts.length} videos from the latest reporting cycle.
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
                                    label="Video Caption"
                                    sortKey="title"
                                    currentSort={sortBy}
                                    sortDirection={sortDirection}
                                    onSort={handleSort}
                                />
                                <AnalyticsSortHeader
                                    label="Published"
                                    sortKey="date"
                                    currentSort={sortBy}
                                    sortDirection={sortDirection}
                                    onSort={handleSort}
                                    align="right"
                                />
                                <AnalyticsSortHeader
                                    label="Views"
                                    sortKey="views"
                                    currentSort={sortBy}
                                    sortDirection={sortDirection}
                                    onSort={handleSort}
                                    align="right"
                                />
                                <AnalyticsSortHeader
                                    label="Likes"
                                    sortKey="likes"
                                    currentSort={sortBy}
                                    sortDirection={sortDirection}
                                    onSort={handleSort}
                                    align="right"
                                />
                                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 text-center">Engagement</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {paginatedPosts.map((post: any, i: number) => (
                                <tr key={i} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-300">
                                    <td className="px-6 py-5 max-w-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                                <IconVideo className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div className="text-sm font-black text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                                {post.title || "(No Title)"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-bold text-xs text-gray-400 dark:text-gray-500 uppercase">
                                        {new Date(post.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-sm text-gray-900 dark:text-white">
                                        {(post.views || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5 text-right font-bold text-sm text-gray-700 dark:text-gray-300">
                                        {(post.likes || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-5">
                                        <EngagementIndicator rate={post.engagement_rate || 0} />
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <a
                                            href={post.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-10 h-10 inline-flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl transition-all shadow-sm hover:shadow-md"
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
                    label="videos"
                />
            </div>
        </div>
    );
};

export default TikTokPublicView;
