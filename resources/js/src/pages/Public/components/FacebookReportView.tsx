import React, { useState, useMemo, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    IconUsers, IconEye, IconThumbUp, IconShare, IconChartBar, 
    IconTrophy, IconDownload, IconExternalLink, IconMessage, 
    IconClick, IconChevronRight, IconChevronDown, IconCheck,
    IconCalendar, IconSortAscending, IconFilter
} from '@tabler/icons-react';
import { Listbox, Transition } from '@headlessui/react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
}

const StatCard = ({ label, value, icon, color }: StatCardProps) => (
    <div className="group bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-10 w-fit`}>
                <div className={color.includes('text-') ? color : 'text-blue-500'}>
                    {icon}
                </div>
            </div>
            <IconChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-blue-500 transition-colors" />
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">{label}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
    </div>
);

interface ChampionCardProps {
    title: string;
    post: any;
    icon: React.ReactNode;
    metricLabel: string;
}

const ChampionCard = ({ title, post, icon, metricLabel }: ChampionCardProps) => {
    if (!post) return null;
    
    return (
        <a 
            href={post.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 flex gap-4 items-center transition-all duration-300 hover:shadow-lg"
        >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-shadow">
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
                    <span className="font-bold">{metricLabel}</span>
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
                <Listbox.Button className="relative w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl pl-4 pr-10 py-2.5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all group">
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
                    <Listbox.Options className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-auto focus:outline-none">
                        {options.map((option) => (
                            <Listbox.Option
                                key={option.value}
                                value={option.value}
                                className={({ active }) =>
                                    `cursor-pointer select-none relative px-4 py-3 text-sm border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                                        active ? 'bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
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

    const kpi = report?.report_data?.kpi;
    const champions = report?.report_data?.champions;
    const rawPosts = report?.report_data?.posts || [];

    const sortOptions: ListboxOption[] = [
        { value: 'date', label: t('report.date') || 'Date' },
        { value: 'reach', label: t('report.reach') || 'Reach' },
        { value: 'views', label: t('report.views') || 'Views' },
        { value: 'reactions', label: t('report.reactions') || 'Reactions' },
        { value: 'engagement_rate', label: t('report.engagement_rate') || 'Engagement Rate' },
    ];

    const rowsPerPageOptions: ListboxOption[] = [
        { value: 10, label: `10 ${t('report.per_page') || 'per page'}` },
        { value: 20, label: `20 ${t('report.per_page') || 'per page'}` },
        { value: 0, label: t('report.show_all') || 'Show All' },
    ];

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

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{pageName}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                            Facebook
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                            {t('report.audience_insights') || 'Audience Insights'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={exportToCSV}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300"
                >
                    <IconDownload className="w-4 h-4" />
                    {t('report.export_report') || 'Export Report'}
                </button>
            </div>

            <div>
                {/* Report Summary */}
                Start Date - End Date
            </div>

            {/* Champions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                <ChampionCard 
                    title={t('report.highest_view')} 
                    post={champions?.highest_view} 
                    icon={<IconEye className="w-6 h-6" />} 
                    metricLabel={`${champions?.highest_view?.views?.toLocaleString()} ${t('report.views')}`} 
                />
                <ChampionCard 
                    title={t('report.highest_engagement')} 
                    post={champions?.highest_engagement} 
                    icon={<IconChartBar className="w-6 h-6" />} 
                    metricLabel={`${champions?.highest_engagement?.engagement_rate}% ${t('report.engagement')}`} 
                />
                <ChampionCard 
                    title={t('report.highest_comment')} 
                    post={champions?.highest_comments} 
                    icon={<IconMessage className="w-6 h-6" />} 
                    metricLabel={`${champions?.highest_comments?.comments?.toLocaleString()} ${t('report.comments')}`} 
                />
                <ChampionCard 
                    title={t('report.highest_share')} 
                    post={champions?.highest_shares} 
                    icon={<IconShare className="w-6 h-6" />} 
                    metricLabel={`${champions?.highest_shares?.shares?.toLocaleString()} ${t('report.shares')}`} 
                />
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    label={t('report.reach')} 
                    value={kpi?.reach || 0} 
                    icon={<IconUsers className="w-6 h-6" />} 
                    color="text-blue-500" 
                />
                <StatCard 
                    label={t('report.views')} 
                    value={kpi?.views || 0} 
                    icon={<IconEye className="w-6 h-6" />} 
                    color="text-purple-500" 
                />
                <StatCard 
                    label={t('report.reactions')} 
                    value={kpi?.reactions || 0} 
                    icon={<IconThumbUp className="w-6 h-6" />} 
                    color="text-rose-500" 
                />
                <StatCard 
                    label={t('report.comments')} 
                    value={kpi?.comments || 0} 
                    icon={<IconMessage className="w-6 h-6" />} 
                    color="text-sky-500" 
                />
                <StatCard 
                    label={t('report.clicks')} 
                    value={kpi?.link_clicks || 0} 
                    icon={<IconClick className="w-6 h-6" />} 
                    color="text-orange-500" 
                />
                <StatCard 
                    label={t('report.avg_er') || 'Avg ER'} 
                    value={`${report.engagement_rate || 0}%`} 
                    icon={<IconChartBar className="w-6 h-6" />} 
                    color="text-green-500" 
                />
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {t('report.content_history') || 'Content History'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {sortedPosts.length} {t('report.posts_found') || 'posts found'}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="flex items-center gap-2">
                                <IconSortAscending className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {t('report.sort_by') || 'Sort by'}:
                                </span>
                                <CustomListbox
                                    value={sortBy}
                                    onChange={setSortBy}
                                    options={sortOptions}
                                    icon={IconFilter}
                                    className="w-48"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <IconEye className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {t('report.show') || 'Show'}:
                                </span>
                                <CustomListbox
                                    value={rowsPerPage}
                                    onChange={(value) => {
                                        setRowsPerPage(Number(value));
                                        setCurrentPage(1);
                                    }}
                                    options={rowsPerPageOptions}
                                    className="w-40"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <th className="px-6 py-4 text-left font-medium">Content</th>
                                <th className="px-6 py-4 text-center font-medium">Reach</th>
                                <th className="px-6 py-4 text-center font-medium">Views</th>
                                <th className="px6 py-4 text-center font-medium">Reactions</th>
                                <th className="px-6 py-4 text-center font-medium">ER%</th>
                                <th className="px-6 py-4 text-right font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedPosts.map((post: any, idx: number) => (
                                <tr 
                                    key={idx} 
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="max-w-xs">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {post.title}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {post.date}
                                                </span>
                                                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                                                    {post.type}
                                                </span>
                                            </div>
                                        </div>
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
                                            {/* {post.views > post.reach && (
                                                <span className="text-xs text-green-500 mt-1">
                                                    ↑ {((post.views / post.reach) * 100).toFixed(1)}%
                                                </span>
                                            )} */}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                            {post.reactions?.toLocaleString() || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                post.engagement_rate >= 5 
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                    : post.engagement_rate >= 2
                                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                            }`}>
                                                {post.engagement_rate || 0}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a
                                            href={post.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                        >
                                            <IconExternalLink className="w-4 h-4" />
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
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center justify-between">
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
            </div>
        </div>
    );
};

export default FacebookReportView;