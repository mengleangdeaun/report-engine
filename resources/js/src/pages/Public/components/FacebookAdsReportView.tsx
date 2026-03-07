import React, { useState, useMemo, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';
import {
    IconChartBar, IconTrophy, IconFileSpreadsheet, IconPlus,
    IconTargetArrow, IconClick, IconEye, IconCurrencyDollar,
    IconPercentage, IconChevronLeft, IconChevronRight,
    IconChevronsLeft, IconChevronsRight, IconRefresh, IconZoomMoney,
    IconUsers, IconBuildingStore, IconSortAscending, IconSortDescending,
    IconFileSearch, IconFile, IconX, IconFilter, IconSettings, IconSearch
} from '@tabler/icons-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MetricSelectorModal } from '@/components/Report/MetricSelectorModal';
import { formatUserDate } from '@/utils/userDate';
import api from '../../../utils/api';

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const fmt = (n: number, decimals = 0) =>
    new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(n ?? 0);

const fmtMoney = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n ?? 0);

const fmtPct = (n: number) => `${(n ?? 0).toFixed(2)}%`;

const formatDisplay = (col: string) => col.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/* ─────────────────────────────────────────────────────────
   KPI Card
───────────────────────────────────────────────────────── */
const KpiCard = ({
    label, value, icon, color = 'blue', sub
}: { label: string; value: string; icon: React.ReactNode; color?: string; sub?: string }) => {
    const palette: Record<string, {
        card: string; border: string; iconBg: string; iconText: string; text: string; valueTint: string; glow: string;
    }> = {
        blue: { card: 'bg-blue-50/60 dark:bg-blue-950/20', border: 'border-blue-200 border-2 dark:border-blue-800/60', iconBg: 'bg-blue-100 dark:bg-blue-900/40', iconText: 'text-blue-600 dark:text-blue-400', text: 'text-blue-600 dark:text-blue-400', valueTint: 'text-blue-950 dark:text-blue-50', glow: '0 8px 30px -6px rgba(59,130,246,0.3)' },
        green: { card: 'bg-emerald-50/60 dark:bg-emerald-950/20', border: 'border-emerald-200 border-2 dark:border-emerald-800/60', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconText: 'text-emerald-600 dark:text-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', valueTint: 'text-emerald-950 dark:text-emerald-50', glow: '0 8px 30px -6px rgba(16,185,129,0.3)' },
        purple: { card: 'bg-purple-50/60 dark:bg-purple-950/20', border: 'border-purple-200 border-2 dark:border-purple-800/60', iconBg: 'bg-purple-100 dark:bg-purple-900/40', iconText: 'text-purple-600 dark:text-purple-400', text: 'text-purple-600 dark:text-purple-400', valueTint: 'text-purple-950 dark:text-blue-50', glow: '0 8px 30px -6px rgba(139,92,246,0.3)' },
        orange: { card: 'bg-orange-50/60 dark:bg-orange-950/20', border: 'border-orange-200 border-2 dark:border-orange-800/60', iconBg: 'bg-orange-100 dark:bg-orange-900/40', iconText: 'text-orange-600 dark:text-orange-400', text: 'text-orange-600 dark:text-orange-400', valueTint: 'text-orange-950 dark:text-orange-50', glow: '0 8px 30px -6px rgba(249,115,22,0.3)' },
        pink: { card: 'bg-pink-50/60 dark:bg-pink-950/20', border: 'border-pink-200 border-2 dark:border-pink-800/60', iconBg: 'bg-pink-100 dark:bg-pink-900/40', iconText: 'text-pink-600 dark:text-pink-400', text: 'text-pink-600 dark:text-pink-400', valueTint: 'text-pink-950 dark:text-pink-50', glow: '0 8px 30px -6px rgba(236,72,153,0.3)' },
        teal: { card: 'bg-teal-50/60 dark:bg-teal-950/20', border: 'border-teal-200 border-2 dark:border-teal-800/60', iconBg: 'bg-teal-100 dark:bg-teal-900/40', iconText: 'text-teal-600 dark:text-teal-400', text: 'text-teal-600 dark:text-teal-400', valueTint: 'text-teal-950 dark:text-teal-50', glow: '0 8px 30px -6px rgba(20,184,166,0.3)' },
        indigo: { card: 'bg-indigo-50/60 dark:bg-indigo-950/20', border: 'border-indigo-200 border-2 dark:border-indigo-800/60', iconBg: 'bg-indigo-100 dark:bg-indigo-900/40', iconText: 'text-indigo-600 dark:text-indigo-400', text: 'text-indigo-600 dark:text-indigo-400', valueTint: 'text-indigo-950 dark:text-indigo-50', glow: '0 8px 30px -6px rgba(99,102,241,0.3)' },
        rose: { card: 'bg-rose-50/60 dark:bg-rose-950/20', border: 'border-rose-200 border-2 dark:border-rose-800/60', iconBg: 'bg-rose-100 dark:bg-rose-900/40', iconText: 'text-rose-600 dark:text-rose-400', text: 'text-rose-600 dark:text-rose-400', valueTint: 'text-rose-950 dark:text-rose-50', glow: '0 8px 30px -6px rgba(244,63,94,0.3)' },
        cyan: { card: 'bg-cyan-50/60 dark:bg-cyan-950/20', border: 'border-cyan-200 border-2 dark:border-cyan-800/60', iconBg: 'bg-cyan-100 dark:bg-cyan-900/40', iconText: 'text-cyan-600 dark:text-cyan-400', text: 'text-cyan-600 dark:text-cyan-400', valueTint: 'text-cyan-950 dark:text-cyan-50', glow: '0 8px 30px -6px rgba(6,182,212,0.3)' },
    };

    const theme = palette[color] ?? palette.blue;

    return (
        <div
            className={cn(
                "group relative rounded-lg border p-5 transition-all duration-300 hover:-translate-y-0.5",
                theme.card, theme.border
            )}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = theme.glow)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
        >
            <div className="flex items-start gap-3.5">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", theme.iconBg)}>
                    <div className={theme.iconText}>{icon}</div>
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                    <p className={cn("wrap-break-word text-[11px] font-semibold uppercase tracking-wider mb-1", theme.text)}>
                        {label}
                    </p>
                    <p className={cn("xl:text-xl lg:text-lg md:text-md wrap-break-word text-sm font-bold leading-none tracking-tight", theme.valueTint)}>
                        {value}
                    </p>
                    {sub && <p className={cn("mt-1.5 text-[11px] font-medium opacity-70", theme.text)}>{sub}</p>}
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────
   Top Performer Card
───────────────────────────────────────────────────────── */
const TopCard = ({ title, ad, metric, metricLabel, color }: any) => {
    if (!ad) return null;
    return (
        <div
            className="panel relative overflow-hidden rounded-2xl p-5 border-l-[6px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl bg-white dark:bg-gray-800/90 backdrop-blur-xl group"
            style={{ borderLeftColor: color }}
        >
            <div
                className="absolute inset-x-0 top-0 h-1 opacity-20 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: `linear-gradient(90deg, ${color} 0%, transparent 100%)` }}
            />

            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <IconTrophy size={18} style={{ color }} className="transform transition-transform group-hover:scale-110 group-hover:-rotate-12 duration-300" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">{title}</span>
            </div>

            <p className="font-bold text-[15px] leading-tight text-gray-900 dark:text-white mb-1.5 truncate transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" title={ad.ad}>
                {ad.ad || '—'}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                {ad.campaign}
            </p>

            <div className="flex items-baseline gap-1.5 mt-auto">
                <span className="text-2xl font-black tracking-tighter" style={{ color }}>{metric}</span>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{metricLabel}</span>
            </div>
        </div>
    );
};

interface Props {
    report: any;
    isDark?: boolean;
    isPublic?: boolean;
}

const FacebookAdsReportView = ({ report: initialReport, isDark = false, isPublic = false }: Props) => {
    const [report, setReport] = useState(initialReport);
    const reportData = report.report_data || {};
    const [reportId] = useState(report.id || null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortKey, setSortKey] = useState<string>('impressions');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [breakdownLevel, setBreakdownLevel] = useState<'ads' | 'ad_sets' | 'campaigns'>('ads');
    const [searchTerm, setSearchTerm] = useState('');
    const [kpiSearch, setKpiSearch] = useState('');

    // Breakdown Data
    const activeData = useMemo(() => {
        return reportData[breakdownLevel] || [];
    }, [reportData, breakdownLevel]);

    const availableColumns = useMemo(() => {
        if (!activeData || activeData.length === 0) return reportData?.available_columns || [];
        return Object.keys(activeData[0]).filter(k => !['name', 'ad_count'].includes(k));
    }, [activeData, reportData]);

    const defaultColumns = useMemo(() => [
        'last_significant_edit', 'campaign', 'ad_set', 'ad', 'spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpc', 'cpm', 'conversions', 'results_roas'
    ].filter(c => availableColumns.includes(c)), [availableColumns]);

    const [visibleKpis, setVisibleKpis] = useState<string[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

    useEffect(() => {
        if (reportData?.preferences?.visible_kpis) {
            setVisibleKpis(reportData.preferences.visible_kpis);
        } else {
            const available = Object.keys(reportData.kpi || {});
            const defaultKeywords = ['total_spend', 'amount_spent', 'impressions', 'reach', 'views', 'link_clicks', 'total_clicks', 'results_roas'];
            const defaults = available.filter(k => defaultKeywords.some(kw => k.includes(kw)));
            setVisibleKpis([...new Set(['objective', ...defaults, 'total_campaigns', 'total_ads'])]);
        }
    }, [reportData]);

    useEffect(() => {
        if (availableColumns.length > 0) {
            if (reportData?.preferences?.visible_columns) {
                setVisibleColumns(reportData.preferences.visible_columns.filter((c: string) => availableColumns.includes(c)));
            } else {
                setVisibleColumns(defaultColumns);
            }
        }
    }, [availableColumns, defaultColumns, reportData]);

    const savePreferences = async (newKpis: string[], newCols: string[]) => {
        setVisibleKpis(newKpis);
        setVisibleColumns(newCols);
        if (isPublic || !reportId) return;

        try {
            await api.put(`/ad-reports/${reportId}/preferences`, {
                visible_kpis: newKpis,
                visible_columns: newCols
            });
            setReport({
                ...report,
                report_data: {
                    ...reportData,
                    preferences: { visible_kpis: newKpis, visible_columns: newCols }
                }
            });
        } catch (error) {
            console.error('Failed to save preferences', error);
        }
    };

    const handleExportCSV = () => {
        const dataToExport = activeData || [];
        const kpi = reportData.kpi || {};
        const columnLabels = visibleColumns.map(c => formatDisplay(c));

        const rows: any[][] = [
            ['Facebook Ads Performance Report'],
            ['Account', report.account_name || ''],
            ['Period', `${reportData.period?.start || ''} to ${reportData.period?.end || ''}`],
            [],
            ['--- KPI Summary ---'],
            ...visibleKpis.map(k => [formatDisplay(k), reportData.kpi?.[k] || '']),
            [],
            columnLabels,
            ...dataToExport.map((row: any) => visibleColumns.map(c => row[c] ?? '')),
        ];

        const csv = rows.map(r => r.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `fb-${breakdownLevel}-report-${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const sortedData = useMemo(() => {
        if (!activeData.length) return [];
        const filtered = activeData.filter((item: any) =>
            Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
        );
        return [...filtered].sort((a, b) => {
            const va = a[sortKey] ?? 0, vb = b[sortKey] ?? 0;
            return sortDir === 'desc' ? vb - va : va - vb;
        });
    }, [activeData, sortKey, sortDir, searchTerm]);

    const pageCount = Math.ceil(sortedData.length / pageSize);
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

    const handleSort = (key: string) => {
        if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const SortIcon = ({ k }: { k: string }) => sortKey === k
        ? (sortDir === 'desc' ? <IconSortDescending size={14} className="text-blue-500" /> : <IconSortAscending size={14} className="text-blue-500" />)
        : <IconSortAscending size={14} className="text-gray-300" />;

    const campaigns = reportData?.campaigns || [];
    const topPerformers = reportData?.top_performers || {};

    const donutOptions = useMemo((): any => ({
        chart: { type: 'donut', fontFamily: 'Nunito, sans-serif' },
        labels: campaigns.map((c: any) => c.name),
        colors: ['#0866FF', '#34A853', '#FBBC05', '#EA4335', '#9B59B6', '#1ABC9C', '#F39C12'],
        legend: { position: 'bottom', labels: { colors: isDark ? '#d0d0d0' : '#333' } },
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: '65%' } } },
        tooltip: { y: { formatter: (v: number) => `$${v.toFixed(2)}` } },
        stroke: { width: 0 },
    }), [campaigns, isDark]);

    const donutSeries = campaigns.map((c: any) => +(c.spend || 0));

    const barOptions = useMemo((): any => ({
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Nunito, sans-serif' },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '60%', dataLabels: { position: 'top' } } },
        colors: ['#0866FF', '#34A853'],
        dataLabels: { enabled: false },
        xaxis: {
            categories: campaigns.map((c: any) => c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name),
            labels: { style: { colors: isDark ? '#888' : '#555', fontSize: '11px' } },
        },
        yaxis: { labels: { style: { colors: isDark ? '#888' : '#555' } } },
        legend: { position: 'top', labels: { colors: isDark ? '#d0d0d0' : '#333' } },
        grid: { borderColor: isDark ? '#1f2937' : '#f0f0f0' },
        tooltip: { theme: isDark ? 'dark' : 'light' },
    }), [campaigns, isDark]);

    const barSeries = [
        { name: 'Impressions', data: campaigns.map((c: any) => c.impressions || 0) },
        { name: 'Clicks', data: campaigns.map((c: any) => c.clicks || 0) },
    ];

    return (
        <div className="space-y-6 print:p-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                        </svg>
                    </div>
                    <div className='flex flex-col gap-1.5' >
                        <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{report.account_name || 'Facebook Ads Report'}</p>
                        <p className="text-xs text-gray-400">{reportData.period?.start} – {reportData.period?.end} · {reportData.period?.duration}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleExportCSV} className="flex items-center gap-1.5 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-200 dark:border-emerald-800/40">
                        <IconFileSpreadsheet size={16} /> Export CSV
                    </Button>
                    {!isPublic && (
                        <MetricSelectorModal
                            className="sm:w-auto px-3 !py-5"
                            title="Customize KPIs"
                            triggerIcon={<IconFilter size={16} />}
                            triggerText="Customize KPIs"
                            availableItems={Object.keys(reportData?.kpi || {}).filter(k => k !== 'objective').concat(['total_campaigns', 'total_ads'])}
                            selectedItems={visibleKpis}
                            onChange={(metrics) => savePreferences(metrics, visibleColumns)}
                            lockedItems={['objective']}
                        />
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                    <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <IconChartBar size={18} className="text-blue-500" />
                        Key Performance Indicators
                    </h3>
                    <div className="relative w-full sm:w-64 flex-shrink-0">
                        <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            placeholder="Find Metric..."
                            value={kpiSearch}
                            onChange={e => setKpiSearch(e.target.value)}
                            className="pl-9 text-sm"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {(() => {
                        const cards: JSX.Element[] = [];
                        cards.push(<KpiCard key="objective" label="Objective" value={reportData.kpi?.objective || 'Unknown'} icon={<IconTargetArrow size={20} />} color="blue" />);

                        const getKpiMeta = (k: string) => {
                            const key = k.toLowerCase();
                            if (key.includes('spend') || key.includes('cost') || key.includes('cpc') || key.includes('cpm') || key.includes('usd')) return { icon: <IconCurrencyDollar size={20} />, color: 'rose' };
                            if (key.includes('impression') || key.includes('view') || key.includes('reach') || key.includes('play')) return { icon: <IconEye size={20} />, color: 'purple' };
                            if (key.includes('click')) return { icon: <IconClick size={20} />, color: 'orange' };
                            if (key.includes('message') || key.includes('contact')) return { icon: <IconUsers size={20} />, color: 'teal' };
                            if (key.includes('conversion') || key.includes('result') || key.includes('lead')) return { icon: <IconTargetArrow size={20} />, color: 'green' };
                            if (key.includes('ctr') || key.includes('rate') || key.includes('percentage')) return { icon: <IconPercentage size={20} />, color: 'indigo' };
                            if (key.includes('roas') || key.includes('return')) return { icon: <IconZoomMoney size={20} />, color: 'pink' };
                            return { icon: <IconChartBar size={20} />, color: 'cyan' };
                        };

                        const query = kpiSearch.toLowerCase();
                        const searchableKpis = visibleKpis.filter(k => {
                            if (!query) return true;
                            if (k === 'objective') return 'objective'.includes(query);
                            return formatDisplay(k).toLowerCase().includes(query) || k.toLowerCase().includes(query);
                        });

                        searchableKpis.forEach(k => {
                            if (k === 'objective') return;
                            if (k === 'total_campaigns') {
                                cards.push(<KpiCard key="campaigns" label="Total Campaigns" value={fmt(reportData.total_campaigns)} icon={<IconBuildingStore size={20} />} color="green" />);
                                return;
                            }
                            if (k === 'total_ads') {
                                cards.push(<KpiCard key="ads" label="Total Ads" value={fmt(reportData.total_ads)} icon={<IconBuildingStore size={20} />} color="green" />);
                                return;
                            }
                            if (reportData.kpi?.[k] !== undefined) {
                                const val = reportData.kpi[k];
                                const meta = getKpiMeta(k);
                                const isMoney = k.includes('spend') || k.includes('cost') || k.includes('cpc') || k.includes('cpm') || k.includes('usd');
                                const isPct = k.includes('ctr') || k.includes('rate');
                                const displayVal = isMoney ? fmtMoney(val) : isPct ? fmtPct(val) : fmt(val, 2);
                                cards.push(<KpiCard key={k} label={formatDisplay(k)} value={displayVal} icon={meta.icon} color={meta.color} />);
                            }
                        });
                        return cards;
                    })()}
                </div>
            </div>

            {/* Charts Row */}
            {campaigns.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="panel rounded-xl p-5">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                            Spend Distribution
                        </h3>
                        {donutSeries.some((v: number) => v > 0) ? (
                            <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height={300} />
                        ) : (
                            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No spend data</div>
                        )}
                    </div>
                    <div className="panel rounded-xl p-5">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                            Impressions vs Clicks
                        </h3>
                        <ReactApexChart options={barOptions} series={barSeries} type="bar" height={300} />
                    </div>
                </div>
            )}

            {/* Top Performers */}
            {Array.isArray(topPerformers) && topPerformers.length > 0 && (
                <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <IconTrophy size={18} className="text-amber-500" />
                        Top Performers
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {topPerformers.map((winner: any, idx: number) => {
                            let displayVal = winner.metric;
                            if (winner.type === 'multiplier') displayVal = `${(Number(winner.metric) || 0).toFixed(2)}x`;
                            else if (winner.type === 'pct') displayVal = fmtPct(winner.metric);
                            else if (winner.type === 'money') displayVal = fmtMoney(winner.metric);
                            else displayVal = fmt(winner.metric);
                            return <TopCard key={winner.id || idx} title={winner.title} ad={winner.ad} metric={displayVal} metricLabel="" color={winner.color} />;
                        })}
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="panel p-0 rounded-xl overflow-hidden mt-8">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-wrap items-center justify-between gap-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <IconSortAscending size={18} className="text-blue-500" />
                        Detailed Performance
                    </h3>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {!isPublic && (
                            <MetricSelectorModal
                                title="Customize Columns"
                                triggerIcon={<IconSettings size={16} />}
                                triggerText="Columns"
                                availableItems={availableColumns}
                                selectedItems={visibleColumns}
                                onChange={(cols) => savePreferences(visibleKpis, cols)}
                                lockedItems={['campaign']}
                            />
                        )}
                        <input
                            type="text"
                            placeholder="Search table..."
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                            className="text-sm pl-9 pr-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none w-full sm:w-48"
                        />
                        <Select value={breakdownLevel} onValueChange={(val: any) => { setBreakdownLevel(val); setPage(1); }}>
                            <SelectTrigger className="h-8 text-sm w-[130px] bg-gray-50 dark:bg-gray-900">
                                <SelectValue placeholder="Level" />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="campaigns">Campaigns</SelectItem>
                                <SelectItem value="ad_sets">Ad Sets</SelectItem>
                                <SelectItem value="ads">Ads</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <ScrollArea className="w-full">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                {visibleColumns.map(col => (
                                    <th
                                        key={col}
                                        className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-blue-500 whitespace-nowrap`}
                                        onClick={() => handleSort(col)}
                                    >
                                        <div className="flex items-center gap-1">{formatDisplay(col)} <SortIcon k={col} /></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedData.map((ad: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    {visibleColumns.map(col => {
                                        let val = ad[col];
                                        let displayVal: React.ReactNode = val;
                                        if (col === 'campaign' || col === 'ad_set' || col === 'ad') displayVal = <span className="max-w-[140px] truncate block" title={val}>{val || '—'}</span>;
                                        else if (['last_significant_edit', 'start_date', 'end_date'].includes(col) || col.includes('date')) displayVal = <span>{val && val !== '-' ? formatUserDate(val) : '—'}</span>;
                                        else if (['ctr', 'roas'].includes(col) || col.endsWith('_rate')) displayVal = <span>{col === 'roas' ? (val || 0).toFixed(2) + 'x' : (val || 0).toFixed(2) + '%'}</span>;
                                        else if (['spend', 'cpc', 'cpm'].includes(col) || col.includes('cost')) displayVal = <span>{fmtMoney(val)}</span>;
                                        else if (typeof val === 'number') displayVal = <span>{fmt(val)}</span>;
                                        return <td key={col} className="px-4 py-3">{displayVal}</td>;
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {sortedData.length > 0 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t">
                        <div className="flex items-center gap-2">
                            <Select value={pageSize.toString()} onValueChange={(val) => { setPageSize(Number(val)); setPage(1); }}>
                                <SelectTrigger className="h-7 w-[70px] text-xs">
                                    <SelectValue placeholder={pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 50, 100].map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <span className="text-xs text-gray-500">Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sortedData.length)} of {sortedData.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 disabled:opacity-40"><IconChevronsLeft size={15} /></button>
                            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1 disabled:opacity-40"><IconChevronLeft size={15} /></button>
                            <span className="px-3 text-xs font-bold text-blue-600">{page}</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={page === pageCount} className="p-1 disabled:opacity-40"><IconChevronRight size={15} /></button>
                            <button onClick={() => setPage(pageCount)} disabled={page === pageCount} className="p-1 disabled:opacity-40"><IconChevronsRight size={15} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacebookAdsReportView;
