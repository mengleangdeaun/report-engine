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
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Button } from '../../../components/ui/button';
import {
    IconUpload, IconChartBar, IconTrophy, IconPrinter,
    IconFileSpreadsheet, IconPlus, IconHistory, IconTargetArrow,
    IconClick, IconEye, IconCurrencyDollar, IconPercentage,
    IconArrowLeft, IconChevronLeft, IconChevronRight,
    IconChevronsLeft, IconChevronsRight, IconRefresh, IconZoomMoney,
    IconUsers, IconBuildingStore, IconSortAscending, IconSortDescending,
    IconFileSearch, IconFile, IconX
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

/* ─────────────────────────────────────────────────────────
   KPI Card
───────────────────────────────────────────────────────── */
const KpiCard = ({
    label, value, icon, color = 'blue', sub
}: { label: string; value: string; icon: React.ReactNode; color?: string; sub?: string }) => {
    const palette: Record<string, string> = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
        pink: 'from-pink-500 to-pink-600',
        teal: 'from-teal-500 to-teal-600',
        indigo: 'from-indigo-500 to-indigo-600',
        rose: 'from-rose-500 to-rose-600',
        cyan: 'from-cyan-500 to-cyan-600',
    };
    const bg = palette[color] ?? palette.blue;

    return (
        <div className="panel rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`bg-gradient-to-br ${bg} rounded-xl p-3 text-white shrink-0 shadow-sm`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{label}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white leading-tight">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
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
        <div className="panel rounded-xl p-4 border-l-4" style={{ borderLeftColor: color }}>
            <div className="flex items-center gap-2 mb-3">
                <IconTrophy size={16} style={{ color }} />
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</span>
            </div>
            <p className="font-semibold text-sm text-gray-800 dark:text-white mb-1 truncate" title={ad.ad}>{ad.ad || '—'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">{ad.campaign}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold" style={{ color }}>{metric}</span>
                <span className="text-xs text-gray-500">{metricLabel}</span>
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
    const [pageSize] = useState(10);
    const [sortKey, setSortKey] = useState<string>('impressions');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [showMediaSelector, setShowMediaSelector] = useState(false);
    const [storeFile, setStoreFile] = useState(false);
    const [selectedMediaFile, setSelectedMediaFile] = useState<any>(null);
    const [accountsLoading, setAccountsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { can } = usePermission();

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
                const f = new File([blob], selectedMediaFile.name, { type: 'text/csv' });
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
        const ads = reportData.ads || [];
        const kpi = reportData.kpi || {};
        const rows: string[][] = [
            ['Facebook Ads Performance Report'],
            ['Account', accountName?.value || ''],
            ['Period', `${reportData.period?.start || ''} to ${reportData.period?.end || ''}`],
            ['Duration', reportData.period?.duration || ''],
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
            ['Campaign', 'Ad Set', 'Ad', 'Impressions', 'Reach', 'Clicks', 'CTR (%)', 'Spend', 'CPC', 'CPM', 'Conversions', 'ROAS'],
            ...ads.map((a: any) => [
                a.campaign, a.ad_set, a.ad,
                a.impressions, a.reach, a.clicks, a.ctr,
                a.spend, a.cpc, a.cpm, a.conversions, a.roas,
            ]),
        ];
        const csv = rows.map(r => r.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `fb-ads-report-${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    /* ── Sorted ads ── */
    const sortedAds = useMemo(() => {
        if (!reportData?.ads) return [];
        return [...reportData.ads].sort((a, b) => {
            const va = a[sortKey] ?? 0, vb = b[sortKey] ?? 0;
            return sortDir === 'desc' ? vb - va : va - vb;
        });
    }, [reportData, sortKey, sortDir]);

    const pageCount = Math.ceil(sortedAds.length / pageSize);
    const paginatedAds = sortedAds.slice((page - 1) * pageSize, page * pageSize);

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
                                        onClick={() => navigate('/apps/ads/report/history')}
                                        className="h-auto items-center justify-center gap-1 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 group"
                                        >
                                        <IconHistory size={20} className="transition-transform group-hover:rotate-[-10deg]" />
                                        History
                                        </Button>
                                    </div>
                                </div>
                            )}
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
        <div className="p-4 md:p-6 space-y-6 print:p-0">
            <ProcessingOverlay isOpen={loading} />

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-3">
                    <button onClick={() => setReportData(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        <IconArrowLeft size={16} />
                        <span className="hidden sm:inline">New Report</span>
                    </button>
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{accountName?.value || 'Facebook Ads Report'}</p>
                            <p className="text-xs text-gray-400">{reportData.period?.start} – {reportData.period?.end} · {reportData.period?.duration}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border border-emerald-200 dark:border-emerald-800/40">
                        <IconFileSpreadsheet size={15} /> Export CSV
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                        <IconPrinter size={15} /> Print
                    </button>
                    <button onClick={() => { setReportData(null); setFile(null); }} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                        <IconPlus size={15} /> New
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <KpiCard label="Total Spend" value={fmtMoney(kpi.total_spend)} icon={<IconCurrencyDollar size={20} />} color="blue" />
                <KpiCard label="Impressions" value={fmt(kpi.total_impressions)} icon={<IconEye size={20} />} color="purple" />
                <KpiCard label="Reach" value={fmt(kpi.total_reach)} icon={<IconUsers size={20} />} color="teal" />
                <KpiCard label="Clicks" value={fmt(kpi.total_clicks)} icon={<IconClick size={20} />} color="orange" />
                <KpiCard label="Conversions" value={fmt(kpi.total_conversions)} icon={<IconTargetArrow size={20} />} color="green" />
                <KpiCard label="Avg CTR" value={fmtPct(kpi.avg_ctr)} icon={<IconPercentage size={20} />} color="indigo" sub="Click-through rate" />
                <KpiCard label="Avg CPC" value={fmtMoney(kpi.avg_cpc)} icon={<IconCurrencyDollar size={20} />} color="rose" sub="Cost per click" />
                <KpiCard label="Avg CPM" value={fmtMoney(kpi.avg_cpm)} icon={<IconCurrencyDollar size={20} />} color="cyan" sub="Cost per 1k impressions" />
                <KpiCard label="ROAS" value={`${(kpi.total_roas || 0).toFixed(2)}x`} icon={<IconZoomMoney size={20} />} color="pink" sub="Return on ad spend" />
                <KpiCard label="Campaigns" value={fmt(reportData.total_campaigns)} icon={<IconBuildingStore size={20} />} color="green" sub={`${reportData.total_ads} Ads`} />
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
            {(topPerformers.best_roas || topPerformers.best_ctr || topPerformers.best_conversions) && (
                <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                        <IconTrophy size={18} className="text-amber-500" />
                        Top Performers
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <TopCard title="Best ROAS" ad={topPerformers.best_roas} metric={`${(topPerformers.best_roas?.roas || 0).toFixed(2)}x`} metricLabel="return" color="#0866FF" />
                        <TopCard title="Best CTR" ad={topPerformers.best_ctr} metric={fmtPct(topPerformers.best_ctr?.ctr || 0)} metricLabel="CTR" color="#34A853" />
                        <TopCard title="Most Conversions" ad={topPerformers.best_conversions} metric={fmt(topPerformers.best_conversions?.conversions || 0)} metricLabel="conv." color="#FBBC05" />
                    </div>
                </div>
            )}

            {/* ── Ad-Level Table ── */}
            <div className="panel rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <IconChartBar size={17} className="text-blue-500" />
                        Ad Performance Breakdown
                        <span className="ml-1 text-xs font-normal text-gray-400">({sortedAds.length} ads)</span>
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                {[
                                    { k: 'campaign', label: 'Campaign' },
                                    { k: 'ad_set', label: 'Ad Set' },
                                    { k: 'ad', label: 'Ad' },
                                    { k: 'impressions', label: 'Impressions' },
                                    { k: 'reach', label: 'Reach' },
                                    { k: 'clicks', label: 'Clicks' },
                                    { k: 'ctr', label: 'CTR' },
                                    { k: 'spend', label: 'Spend' },
                                    { k: 'cpc', label: 'CPC' },
                                    { k: 'cpm', label: 'CPM' },
                                    { k: 'conversions', label: 'Conv.' },
                                    { k: 'roas', label: 'ROAS' },
                                ].map(col => (
                                    <th
                                        key={col.k}
                                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide cursor-pointer hover:text-blue-500 whitespace-nowrap select-none"
                                        onClick={() => handleSort(col.k)}
                                    >
                                        <span className="flex items-center gap-1">
                                            {col.label} <SortIcon k={col.k} />
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedAds.map((ad: any, i: number) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium max-w-[140px] truncate" title={ad.campaign}>{ad.campaign}</td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[120px] truncate" title={ad.ad_set}>{ad.ad_set}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[140px] truncate" title={ad.ad}>{ad.ad}</td>
                                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmt(ad.impressions)}</td>
                                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmt(ad.reach)}</td>
                                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{fmt(ad.clicks)}</td>
                                    <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400 font-medium">{fmtPct(ad.ctr)}</td>
                                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">{fmtMoney(ad.spend)}</td>
                                    <td className="px-4 py-3 text-right text-gray-500">{fmtMoney(ad.cpc)}</td>
                                    <td className="px-4 py-3 text-right text-gray-500">{fmtMoney(ad.cpm)}</td>
                                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">{fmt(ad.conversions)}</td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`font-bold ${ad.roas >= 2 ? 'text-green-600 dark:text-green-400' : ad.roas >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>
                                            {(ad.roas || 0).toFixed(2)}x
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {paginatedAds.length === 0 && (
                                <tr><td colSpan={12} className="text-center py-10 text-gray-400">No ads found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pageCount > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800">
                        <span className="text-xs text-gray-500">
                            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, sortedAds.length)} of {sortedAds.length}
                        </span>
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
