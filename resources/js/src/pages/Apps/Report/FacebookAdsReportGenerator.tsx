import { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { IRootState } from '../../../store';
import ReactApexChart from 'react-apexcharts';
import { toast, Toaster } from 'react-hot-toast';
import CreatableSelect from 'react-select/creatable';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import ProcessingOverlay from '../../../components/ProcessingOverlay';
import { motion, AnimatePresence } from 'framer-motion';
import usePermission from '../../../hooks/usePermission';
import MediaSelectorModal from '../../../components/Media/MediaSelectorModal';
import { formatUserDate } from '@/utils/userDate';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MetricSelectorModal } from '@/components/Report/MetricSelectorModal';
import {
    IconUpload, IconChartBar, IconTrophy, IconPrinter,
    IconFileSpreadsheet, IconPlus, IconHistory, IconTargetArrow,
    IconClick, IconEye, IconCurrencyDollar, IconPercentage,
    IconArrowLeft, IconChevronLeft, IconChevronRight,
    IconChevronsLeft, IconChevronsRight, IconRefresh, IconZoomMoney,
    IconUsers, IconBuildingStore, IconSortAscending, IconSortDescending,
    IconFileSearch, IconFile, IconX, IconFilter, IconSettings, IconSearch
} from '@tabler/icons-react';
import { Label } from '../../../components/ui/label';

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
        purple: { card: 'bg-purple-50/60 dark:bg-purple-950/20', border: 'border-purple-200 border-2 dark:border-purple-800/60', iconBg: 'bg-purple-100 dark:bg-purple-900/40', iconText: 'text-purple-600 dark:text-purple-400', text: 'text-purple-600 dark:text-purple-400', valueTint: 'text-purple-950 dark:text-purple-50', glow: '0 8px 30px -6px rgba(139,92,246,0.3)' },
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
                {/* Icon circle */}
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", theme.iconBg)}>
                    <div className={theme.iconText}>{icon}</div>
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                    <p className={cn("truncate text-[11px] font-semibold uppercase tracking-wider mb-1", theme.text)}>
                        {label}
                    </p>
                    <p className={cn("xl:text-xl lg:text-lg md:text-md truncate text-sm font-bold leading-none tracking-tight", theme.valueTint)}>
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
            {/* Soft background highlight mapped to the specific metric color */}
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

/* ─────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────── */
const FacebookAdsReportGenerator = () => {
    const dispatch = useDispatch();
    const isDark = useSelector((s: IRootState) => s.themeConfig.theme === 'dark');
    const location = useLocation();
    const navigate = useNavigate();

    const [reportId, setReportId] = useState<number | null>(location.state?.currentReportId || null);
    /* ── State ── */
    const [reportData, setReportData] = useState<any>(location.state?.preloadedData || null);
    const [accountName, setAccountName] = useState<any>(
        location.state?.accountName ? { label: location.state.accountName, value: location.state.accountName } : null
    );
    const [accountOptions, setAccountOptions] = useState<any[]>([]);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortKey, setSortKey] = useState<string>('impressions');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [storeFile, setStoreFile] = useState(false);
    const [selectedMediaFile, setSelectedMediaFile] = useState<any>(null);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { can } = usePermission();

    const [breakdownLevel, setBreakdownLevel] = useState<'ads' | 'ad_sets' | 'campaigns'>('ads');
    const [searchTerm, setSearchTerm] = useState('');

    // The active raw data depending on the selected breakdown
    const activeData = useMemo(() => {
        if (!reportData) return [];
        return reportData[breakdownLevel] || [];
    }, [reportData, breakdownLevel]);

    // The raw available columns detected from the active dataset
    const availableColumns = useMemo(() => {
        if (!activeData || activeData.length === 0) return reportData?.available_columns || [];
        return Object.keys(activeData[0]).filter(k => !['name', 'ad_count'].includes(k));
    }, [activeData, reportData]);

    // Default columns to show if no customization exists
    const defaultColumns = useMemo(() => [
        'last_significant_edit', 'campaign', 'ad_set', 'ad', 'spend', 'impressions', 'reach', 'clicks', 'ctr', 'cpc', 'cpm', 'conversions', 'results_roas'
    ].filter(c => availableColumns.includes(c)), [availableColumns]);

    // --- KPI Dynamic Selection State ---
    const [visibleKpis, setVisibleKpis] = useState<string[]>([]);
    const [kpiSearch, setKpiSearch] = useState<string>('');

    useEffect(() => {
        if (reportData?.preferences && reportData.preferences.visible_kpis) {
            setVisibleKpis(reportData.preferences.visible_kpis);
            return;
        }

        if (reportData?.kpi) {
            const saved = localStorage.getItem('fbAds_visibleKpis');
            if (saved) {
                setVisibleKpis(JSON.parse(saved));
                return;
            }

            const available = Object.keys(reportData.kpi);
            const defaultKeywords = [
                'total_spend', 'amount_spent', 'impressions', 'reach', 'views', 'video_plays',
                'messaging_conversations_started', 'new_messaging_contacts', 'cost_per_message',
                'link_clicks', 'total_clicks', 'cpm', 'results_roas'
            ];

            const defaults = available.filter(k => defaultKeywords.some(kw => k.includes(kw)));

            // Swap standard roas to the explicit result roas if available
            const finalDefaults = defaults.map(d => d === 'roas' ? 'results_roas' : d).filter(d => d !== 'roas');
            setVisibleKpis([...new Set(['objective', ...finalDefaults, 'total_campaigns', 'total_ads'])]);
        }
    }, [reportData]);

    // Visible columns state
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

    // Initialize visible columns when report data loads or breakdown changes
    useEffect(() => {
        if (availableColumns.length > 0) {
            if (reportData?.preferences && reportData.preferences.visible_columns) {
                const validPref = reportData.preferences.visible_columns.filter((c: string) => availableColumns.includes(c));
                if (validPref.length > 0) {
                    setVisibleColumns(validPref);
                    return;
                }
            }

            // Keep intersecting columns if already manually changed
            if (visibleColumns.length > 0) {
                const validVisible = visibleColumns.filter(c => availableColumns.includes(c));
                if (validVisible.length > 0) {
                    setVisibleColumns(validVisible);
                    return;
                }
            }
            setVisibleColumns(defaultColumns);
        }
    }, [availableColumns, defaultColumns, reportData]);

    const savePreferences = async (newKpis: string[], newCols: string[]) => {
        setVisibleKpis(newKpis);
        setVisibleColumns(newCols);

        if (!reportId) return;

        try {
            await api.put(`/ad-reports/${reportId}/preferences`, {
                visible_kpis: newKpis,
                visible_columns: newCols
            });
            // Update the local object silently so it maps if re-evaluated
            if (reportData) {
                setReportData({
                    ...reportData,
                    preferences: {
                        visible_kpis: newKpis,
                        visible_columns: newCols
                    }
                });
            }
        } catch (error) {
            console.error('Failed to save preferences', error);
        }
    };

    const hasMediaAccess = can('media_library_access');

    useEffect(() => {
        dispatch(setPageTitle('Facebook Ads Report'));
        fetchAccountNames();
    }, []);

    /* Restore from history navigation */
    useEffect(() => {
        if (location.state?.preloadedData) {
            setReportData(location.state.preloadedData);
            if (location.state.accountName) {
                setAccountName({ label: location.state.accountName, value: location.state.accountName });
            }
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    /* ── Account names autocomplete ── */
    const fetchAccountNames = async () => {
        setAccountsLoading(true);
        try {
            const res = await api.get('/ad-accounts');
            setAccountOptions((res.data || []).map((a: any) => ({ label: a.name, value: a.name, id: a.id })));
        } catch { }
        setAccountsLoading(false);
    };

    const handleMediaSelect = (mediaFile: any) => {
        setSelectedMediaFile(mediaFile);
        setFile(null); // Clear manual upload
    };

    /* ── File handling ── */
    const handleFileChange = (f: File | null) => {
        if (!f) return;
        if (!['csv', 'xlsx', 'xls', 'txt'].some(ext => f.name.toLowerCase().endsWith(ext))) {
            toast.error('Please upload a valid CSV or Excel file.');
            return;
        }
        setFile(f);
        setSelectedMediaFile(null); // Clear media selection
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        handleFileChange(e.dataTransfer.files?.[0] ?? null);
    };

    /* ── Generate report ── */
    const handleGenerate = async () => {
        if (!file && !selectedMediaFile) { toast.error('Please select or upload a CSV file.'); return; }
        if (!accountName) { toast.error('Please enter an Account / Campaign name.'); return; }

        const token = localStorage.getItem('token');
        const fd = new FormData();

        if (file) {
            fd.append('file', file);
        } else if (selectedMediaFile) {
            // We need to fetch the file blob from the URL to send it to the analyzer
            // Or the backend could handle the URL/path if we changed the API
            // For now, let's fetch it as a blob and append it
            try {
                const response = await fetch(selectedMediaFile.url);
                const blob = await response.blob();

                // Keep the correct file extension and determine correct MIME type
                const fileName = selectedMediaFile.name;
                let mimeType = 'text/csv';
                if (fileName.toLowerCase().endsWith('.xlsx')) {
                    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                } else if (fileName.toLowerCase().endsWith('.xls')) {
                    mimeType = 'application/vnd.ms-excel';
                }

                const f = new File([blob], fileName, { type: mimeType });
                fd.append('file', f);
            } catch (err) {
                toast.error('Failed to retrieve file from Media Library.');
                return;
            }
        }

        fd.append('account_name', accountName.value);
        if (storeFile) fd.append('store_file', '1');

        setLoading(true);
        try {
            const res = await api.post('/ad-reports/generate', fd, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
                _skipToast: true,
            } as any);
            setReportData(res.data.data);
            setReportId(res.data.id || null);
            setPage(1);
            toast.success('Report generated successfully!');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to generate report.';
            toast.error(msg, { duration: 6000 });
        } finally {
            setLoading(false);
        }
    };

    /* ── CSV export ── */
    const handleExportCSV = () => {
        if (!reportData) return;
        const dataToExport = activeData || [];
        const kpi = reportData.kpi || {};

        const columnLabels = visibleColumns.map(c => c.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

        const rows: any[][] = [
            ['Facebook Ads Performance Report'],
            ['Account', accountName?.value || ''],
            ['Period', `${reportData.period?.start || ''} to ${reportData.period?.end || ''}`],
            ['Duration', reportData.period?.duration || ''],
            ['Breakdown Level', breakdownLevel.charAt(0).toUpperCase() + breakdownLevel.slice(1)],
            [],
            ['--- KPI Summary ---'],
            ['Total Spend', kpi.total_spend?.toString() || ''],
            ['Total Impressions', kpi.total_impressions?.toString() || ''],
            ['Total Reach', kpi.total_reach?.toString() || ''],
            ['Total Clicks', kpi.total_clicks?.toString() || ''],
            ['Total Conversions', kpi.total_conversions?.toString() || ''],
            ['Avg CTR (%)', kpi.avg_ctr?.toString() || ''],
            ['Avg CPC', kpi.avg_cpc?.toString() || ''],
            ['Avg CPM', kpi.avg_cpm?.toString() || ''],
            ['Total ROAS', kpi.total_roas?.toString() || ''],
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

    /* ── Sorted Data ── */
    const sortedData = useMemo(() => {
        if (!activeData.length) return [];
        const filtered = activeData.filter((item: any) =>
            Object.values(item).some(
                (val: any) =>
                    String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
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

    /* ── Chart configs ── */
    const kpi = reportData?.kpi || {};
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




    /* ─────────────────────────────────────────
       RENDER — UPLOAD SCREEN
    ───────────────────────────────────────── */
    if (!reportData) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <ProcessingOverlay isOpen={loading} />
                <Toaster position="top-center" />
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-lg"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg mb-4">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facebook Ads Report</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Upload a Facebook Ads Manager CSV export to generate a performance report
                        </p>
                    </div>

                    {/* Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-800">
                        {/* Account Name */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ad Account / Campaign Name <span className="text-red-500">*</span>
                            </label>
                            <CreatableSelect
                                isClearable
                                placeholder="Enter or select account name..."
                                options={accountOptions}
                                value={accountName}
                                onChange={setAccountName}
                                isLoading={accountsLoading}
                                formatCreateLabel={(v) => `Use "${v}"`}
                                formatOptionLabel={(option: any) => (
                                    <div className="flex items-center justify-between">
                                        <span>{option.label}</span>
                                    </div>
                                )}
                                menuPlacement="auto"
                                classNames={{
                                    control: ({ isFocused }) => `
                                        !min-h-12 !rounded-lg !border !bg-white dark:!bg-gray-800
                                        !px-3 !py-2 !shadow-sm !border-gray-300 dark:!border-gray-600
                                        ${isFocused
                                            ? '!border-blue-500 dark:!border-blue-400 !ring-2 !ring-blue-500/20 dark:!ring-blue-400/20'
                                            : 'hover:!border-gray-400 dark:hover:!border-gray-500'
                                        }
                                    `,
                                    input: () => '!text-gray-900 dark:!text-gray-100 !text-sm',
                                    singleValue: () => '!text-gray-900 dark:!text-gray-100 !font-medium',
                                    placeholder: () => '!text-gray-500 dark:!text-gray-400',
                                    menu: () => '!mt-2 !rounded-lg !border !border-gray-200 dark:!border-gray-700 !shadow-xl !bg-white dark:!bg-gray-800',
                                    menuList: () => '!py-2 !max-h-64',
                                    option: ({ isFocused, isSelected }) => `
                                        !px-4 !py-3 !text-sm !transition-colors
                                        ${isSelected
                                            ? '!bg-blue-500 !text-white dark:!bg-blue-500/30 dark:!text-white'
                                            : isFocused
                                                ? '!bg-gray-100 dark:!bg-gray-700 !text-gray-900 dark:!text-gray-100'
                                                : '!text-gray-900 dark:!text-gray-200'
                                        }
                                    `,
                                    dropdownIndicator: () => '!text-gray-500 hover:!text-gray-700 dark:hover:!text-gray-300',
                                    clearIndicator: () => '!text-gray-500 hover:!text-red-600',
                                }}
                                styles={{
                                    menuList: (base) => ({
                                        ...base,
                                        '::-webkit-scrollbar': { width: '6px' },
                                        '::-webkit-scrollbar-track': { background: 'transparent' },
                                        '::-webkit-scrollbar-thumb': {
                                            background: '#6b7280',
                                            borderRadius: '4px'
                                        },
                                    }),
                                }}
                            />

                            {/* Account Selection Confirmation */}
                            {accountName && (
                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                                <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{accountName.label}</p>
                                            <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70">Ad Account · Ready</p>
                                        </div>
                                        <button
                                            onClick={() => setAccountName(null)}
                                            className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-blue-400 hover:text-red-500 transition-colors flex-shrink-0"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* File Upload Section */}
                        <div className="mb-4">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Ads Manager CSV Export <span className="text-red-500">*</span>
                                <div className="flex items-center gap-1 ml-auto">
                                    {['CSV', 'XLSX', 'XLS'].map((fmt) => (
                                        <span key={fmt} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
                                            {fmt}
                                        </span>
                                    ))}
                                </div>
                            </label>

                            {/* File State / Upload Box */}
                            {file ? (
                                <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <IconFileSpreadsheet size={24} className="text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm truncate">{file.name}</p>
                                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">{(file.size / 1024).toFixed(1)} KB · Ready to process</p>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                                className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 font-medium underline underline-offset-2"
                                            >
                                                Change
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-emerald-600 hover:text-red-500 transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
                                </div>
                            ) : selectedMediaFile ? (
                                <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <IconFile size={24} className="text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="font-semibold text-indigo-800 dark:text-indigo-300 text-sm truncate">{selectedMediaFile.name}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700">
                                                    Media Library
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedMediaFile(null); }}
                                            className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center justify-center text-indigo-600 hover:text-red-500 transition-colors flex-shrink-0"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)} />
                                </div>
                            ) : (
                                <div
                                    className={`relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl py-10 px-4 cursor-pointer transition-all group ${isDragging
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv,.xlsx,.xls"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                                    />
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <IconUpload size={24} className="text-blue-500" />
                                    </div>
                                    <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">Drop your file here</p>
                                    <p className="text-xs text-gray-400 mt-1">or click to browse · CSV, XLSX, XLS</p>
                                </div>
                            )}

                            {/* Or Divider */}
                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">or</span>
                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                            </div>

                            {hasMediaAccess && (
                                <div className="space-y-4">
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2 border-dashed"
                                        onClick={() => setShowMediaSelector(true)}
                                    >
                                        <IconFileSearch size={16} /> Select from Media Library
                                    </Button>

                                    <div className="flex gap-2 items-start p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800 text-left">
                                        <Checkbox
                                            size="lg"
                                            id="store-file"
                                            checked={storeFile}
                                            onCheckedChange={(checked) => setStoreFile(!!checked)}
                                        />
                                        <Label
                                            htmlFor="store-file"
                                            className="mt-1 !mb-0 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            Generate & Store Source File in Media Library
                                        </Label>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-4 mt-4" >
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={loading || !accountName || (!file && !selectedMediaFile)}
                                        className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
                                    >
                                        <IconChartBar size={20} />
                                        Generate Ads Report
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/apps/report/facebook-ads-performance')}
                                        className="h-auto items-center justify-center gap-1 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 group"
                                    >
                                        <IconHistory size={20} className="transition-transform group-hover:rotate-[-10deg]" />
                                        History
                                    </Button>
                                </div>
                            </div>

                        </div>

                        {/* Footer Hint */}
                        <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                            <p>Ensure your file contains standard Facebook Ads Manager export columns</p>
                        </div>
                    </div>
                </motion.div>

                <MediaSelectorModal
                    isOpen={showMediaSelector}
                    onClose={() => setShowMediaSelector(false)}
                    onSelect={handleMediaSelect}
                />
            </div>
        );
    }

    /* ─────────────────────────────────────────
       RENDER — REPORT DASHBOARD
    ───────────────────────────────────────── */
    return (
        <div className="space-y-6 print:p-0">
            <ProcessingOverlay isOpen={loading} />

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-3">
                    <Button onClick={() => setReportData(null)} variant="outline" className="flex items-center gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <IconArrowLeft size={16} />
                        <span className="hidden sm:inline">New Report</span>
                    </Button>
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                            </svg>
                        </div>
                        <div className='flex flex-col gap-1.5' >
                            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{accountName?.value || 'Facebook Ads Report'}</p>
                            <p className="text-xs text-gray-400">{reportData.period?.start} – {reportData.period?.end} · {reportData.period?.duration}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={handleExportCSV} className="flex items-center gap-1.5 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-200 dark:border-emerald-800/40">
                        <IconFileSpreadsheet size={16} /> Export CSV
                    </Button>
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
                    <Button onClick={() => { setReportData(null); setFile(null); }} className="flex items-center gap-1.5 text-sm  transition-all">
                        <IconPlus size={15} /> New
                    </Button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
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
                        {kpiSearch && (
                            <button
                                onClick={() => setKpiSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <IconX size={14} />
                            </button>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {(() => {
                        const cards: JSX.Element[] = [];

                        // 1. Objective (Always first)
                        cards.push(
                            <KpiCard key="objective" label="Objective" value={reportData.kpi?.objective || 'Unknown'} icon={<IconTargetArrow size={20} />} color="blue" />
                        );

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

                        // Filter visible KPIs against search query
                        const query = kpiSearch.toLowerCase();

                        // Always force string logic in loop, we can map original keys
                        const searchableKpis = visibleKpis.filter(k => {
                            if (!query) return true;
                            if (k === 'objective') return 'objective'.includes(query);
                            return formatDisplay(k).toLowerCase().includes(query) || k.toLowerCase().includes(query);
                        });

                        // 2. Dynamic KPIs from Data
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

                            if (reportData.kpi && reportData.kpi[k] !== undefined) {
                                const val = reportData.kpi[k];
                                const meta = getKpiMeta(k);
                                const isMoney = k.includes('spend') || k.includes('cost') || k.includes('cpc') || k.includes('cpm') || k.includes('usd');
                                const isPct = k.includes('ctr') || k.includes('rate');
                                const displayVal = isMoney ? fmtMoney(val) : isPct ? fmtPct(val) : fmt(val, 2);

                                cards.push(
                                    <KpiCard key={k} label={formatDisplay(k)} value={displayVal} icon={meta.icon} color={meta.color} />
                                );
                            }
                        });

                        return cards;
                    })()}
                </div>
            </div>

            {/* ── Charts Row ── */}
            {campaigns.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Donut — Spend by Campaign */}
                    <div className="panel rounded-xl p-5">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                            Spend Distribution by Campaign
                        </h3>
                        {donutSeries.some((v: number) => v > 0) ? (
                            <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height={300} />
                        ) : (
                            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No spend data</div>
                        )}
                    </div>

                    {/* Bar — Impressions vs Clicks */}
                    <div className="panel rounded-xl p-5">
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                            Impressions vs Clicks by Campaign
                        </h3>
                        {campaigns.length > 0 ? (
                            <ReactApexChart options={barOptions} series={barSeries} type="bar" height={300} />
                        ) : (
                            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Top Performers ── */}
            {Array.isArray(topPerformers) && topPerformers.length > 0 && (
                <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <IconTrophy size={18} className="text-amber-500" />
                        Top Performers <span className="text-xs font-normal text-gray-400">({reportData.kpi?.objective || 'Campaign'})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {topPerformers.map((winner: any, idx: number) => {
                            let displayVal = winner.metric;
                            if (winner.type === 'multiplier') displayVal = `${(Number(winner.metric) || 0).toFixed(2)}x`;
                            else if (winner.type === 'pct') displayVal = fmtPct(winner.metric);
                            else if (winner.type === 'money') displayVal = fmtMoney(winner.metric);
                            else displayVal = fmt(winner.metric);

                            return (
                                <TopCard
                                    key={winner.id || idx}
                                    title={winner.title}
                                    ad={winner.ad}
                                    metric={displayVal}
                                    metricLabel=""
                                    color={winner.color}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Granular Data Table ── */}
            <div className="panel p-0 rounded-xl overflow-hidden mt-8">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-wrap items-center justify-between gap-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <IconSortAscending size={18} className="text-blue-500" />
                        Detailed Performance Breakdown
                        <span className="ml-1 text-xs font-normal text-gray-400">({sortedData.length} rows)</span>
                    </h3>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <MetricSelectorModal
                            title="Customize Table Columns"
                            triggerIcon={<IconSettings size={16} />}
                            triggerText="Customize Columns"
                            availableItems={availableColumns}
                            selectedItems={visibleColumns}
                            onChange={(cols) => savePreferences(visibleKpis, cols)}
                            lockedItems={['campaign']}
                        />
                        <div className="hidden sm:block h-5 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
                        <div className="w-full sm:w-48 relative">
                            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search table..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                                className="w-full text-sm pl-9 pr-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                        <Select
                            value={breakdownLevel}
                            onValueChange={(val: any) => {
                                setBreakdownLevel(val);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8 text-sm focus:ring-blue-500 w-[130px] font-medium bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                                <SelectValue placeholder="Breakdown Level" />
                            </SelectTrigger>
                            <SelectContent className="z-50" align="end">
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
                                {visibleColumns.map(col => {
                                    // Make nice column labels
                                    const label = col.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                    const isNumeric = ['impressions', 'reach', 'clicks', 'ctr', 'spend', 'cpc', 'cpm', 'conversions', 'roas', 'frequency', 'results', 'view', 'play', 'amount', 'purchase', 'lead'].some(kw => col.toLowerCase().includes(kw));

                                    return (
                                        <th
                                            key={col}
                                            className={`px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:text-blue-500 whitespace-nowrap select-none ${isNumeric ? 'text-right' : 'text-left'}`}
                                            onClick={() => handleSort(col)}
                                        >
                                            <span className={`flex items-center gap-1 ${isNumeric ? 'justify-end' : 'justify-start'}`}>
                                                {label} <SortIcon k={col} />
                                            </span>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedData.map((ad: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    {visibleColumns.map(col => {
                                        let val = ad[col];
                                        let displayVal: React.ReactNode = val;

                                        // Apply dynamic formatting based on column name convention
                                        if (col === 'campaign' || col === 'ad_set' || col === 'ad') {
                                            displayVal = <span className="max-w-[140px] truncate block" title={val as string}>{val || '—'}</span>;
                                        } else if (['last_significant_edit', 'reporting_starts', 'reporting_ends', 'start_date', 'end_date'].includes(col) || col.includes('date') || col.includes('created') || col.includes('updated') || col.includes('time')) {
                                            displayVal = <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">{val && val !== '-' ? formatUserDate(val) : '—'}</span>;
                                        } else if (['ctr', 'roas'].includes(col) || col.endsWith('_rate')) {
                                            // Handle special rates
                                            if (col === 'roas') displayVal = <span className={`font-bold ${val >= 2 ? 'text-green-600 dark:text-green-400' : val >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>{(val || 0).toFixed(2)}x</span>;
                                            else displayVal = <span className="text-blue-600 dark:text-blue-400 font-medium">{val ? val.toFixed(2) + '%' : '0.00%'}</span>;
                                        } else if (['spend', 'cpc', 'cpm'].includes(col) || col.includes('cost') || col.includes('amount') || col.endsWith('_value')) {
                                            displayVal = <span className="font-medium text-gray-700 dark:text-gray-300">{fmtMoney(val as number)}</span>;
                                        } else if (typeof val === 'number') {
                                            displayVal = <span className="text-gray-700 dark:text-gray-300">{fmt(val)}</span>;
                                        } else {
                                            displayVal = <span className="text-gray-600 dark:text-gray-400">{val || '—'}</span>;
                                        }

                                        const align = typeof val === 'number' || !val ? 'text-right' : 'text-left';

                                        return (
                                            <td key={col} className={`px-4 py-3 ${align}`}>
                                                {displayVal}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            {paginatedData.length === 0 && (
                                <tr><td colSpan={visibleColumns.length} className="text-center py-10 text-gray-400">No data found.</td></tr>
                            )}
                        </tbody>
                    </table>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {/* Pagination */}
                {sortedData.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                                <span>Rows per page</span>
                                <Select
                                    value={pageSize.toString()}
                                    onValueChange={(val) => {
                                        setPageSize(Number(val));
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-7 w-[70px] text-xs bg-white dark:bg-gray-900">
                                        <SelectValue placeholder={pageSize.toString()} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 20, 50, 100].map((size) => (
                                            <SelectItem key={size} value={size.toString()}>
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <span>
                                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sortedData.length)} of {sortedData.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setPage(1)} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><IconChevronsLeft size={15} /></button>
                            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><IconChevronLeft size={15} /></button>
                            <span className="px-3 py-1 text-xs bg-blue-600 text-white rounded font-medium">{page}</span>
                            <button onClick={() => setPage(p => p + 1)} disabled={page === pageCount} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><IconChevronRight size={15} /></button>
                            <button onClick={() => setPage(pageCount)} disabled={page === pageCount} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"><IconChevronsRight size={15} /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacebookAdsReportGenerator;
