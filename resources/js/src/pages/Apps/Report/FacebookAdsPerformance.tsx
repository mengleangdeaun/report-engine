import { useEffect, useState, useMemo, Fragment } from 'react';
import usePermission from '../../../hooks/usePermission';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import Tippy from '@tippyjs/react';
import { useTranslation } from 'react-i18next';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import 'tippy.js/animations/shift-away.css';
import 'tippy.js/animations/shift-toward.css';
import { Dialog, Transition } from '@headlessui/react';
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
    PaginationState,
    SortingState,
} from '@tanstack/react-table';
import {
    IconSearch,
    IconFileAnalytics,
    IconX,
    IconChevronLeft,
    IconChevronRight,
    IconChevronUp,
    IconCheck,
    IconCalendar,
    IconChevronsLeft,
    IconChevronsRight,
    IconUser,
    IconChevronDown,
    IconArrowUpRight,
    IconArrowDownRight,
    IconDownload,
    IconUsers,
    IconFilter,
    IconFilterOff
} from '@tabler/icons-react';
import DeleteModal from '../../../components/DeleteModal';

// --- SHADCN UI ---
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Card, CardContent } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Search, X, SlidersHorizontal, Info } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';

type CanProps = {
    when: boolean;
    children: React.ReactNode;
    fallback?: React.ReactNode;
};

const Can = ({ when, children, fallback = null }: CanProps) => {
    if (!when) return <>{fallback}</>;
    return <>{children}</>;
};

const FacebookAdsPerformance = () => {
    const { t } = useTranslation();
    const { can } = usePermission();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // --- SERVER SIDE STATE ---
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [rowCount, setRowCount] = useState(0);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [isAdminOrOwner, setIsAdminOrOwner] = useState(false);

    // Table State
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    // --- DATE FILTER STATE ---
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Utils
    const [refreshKey, setRefreshKey] = useState(0);

    // Modal State
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

    const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(() => {
        const saved = localStorage.getItem('fbAds_filterPanelVisible');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('fbAds_filterPanelVisible', JSON.stringify(isFilterPanelVisible));
    }, [isFilterPanelVisible]);

    const getActiveFilterCount = () => {
        let count = 0;
        if (selectedUsers.length > 0) count++;
        if (dateRange?.from) count++;
        if (globalFilter.trim() !== '') count++;
        return count;
    };

    useEffect(() => {
        dispatch(setPageTitle('Ad Performance Report'));
    }, [dispatch]);

    const isTeamMembersLoading = teamMembers.length === 0;

    const [isTeamLoading, setIsTeamLoading] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const fetchTeamAndPermissions = async () => {
            if (isTeamLoading || teamMembers.length > 0) return;
            setIsTeamLoading(true);
            try {
                const res = await api.get('/team/my-team', { signal: controller.signal });
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

                if (res.data.is_owner || res.data.is_admin || can('view all team reports')) {
                    setIsAdminOrOwner(true);
                    const otherMembers = (res.data.members || []).filter((m: any) => m.id !== currentUser.id);
                    setTeamMembers([
                        { id: 'me', name: 'My Reports (Me)' },
                        ...otherMembers.map((m: any) => ({ id: m.id, name: m.name }))
                    ]);
                }
            } catch (e: any) {
                if (e.name === 'CanceledError') return;
                console.error("Failed to load team data", e);
            } finally {
                setIsTeamLoading(false);
            }
        };
        fetchTeamAndPermissions();
        return () => controller.abort();
    }, [can, teamMembers.length]);

    // --- FETCH DATA ---
    useEffect(() => {
        const controller = new AbortController();

        const fetchReports = async () => {
            setLoading(true);
            try {
                const sortField = sorting.length > 0 ? sorting[0].id : 'created_at';
                const sortDirection = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc';

                let startStr = '';
                let endStr = '';
                if (dateRange?.from) {
                    const d1 = dateRange.from;
                    const d2 = dateRange.to || dateRange.from;
                    startStr = `${d1.getFullYear()}-${String(d1.getMonth() + 1).padStart(2, '0')}-${String(d1.getDate()).padStart(2, '0')}`;
                    endStr = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
                }

                const userIdsParam = selectedUsers && selectedUsers.length > 0
                    ? selectedUsers.map(u => (u.id === 'me' ? JSON.parse(localStorage.getItem('user') || '{}').id : u.id)).join(',')
                    : undefined;

                const response = await api.get('/ad-reports/history', {
                    params: {
                        page: pagination.pageIndex + 1,
                        per_page: pagination.pageSize,
                        search: globalFilter,
                        sort_by: sortField,
                        sort_dir: sortDirection,
                        start_date: startStr || undefined,
                        end_date: endStr || undefined,
                        user_ids: userIdsParam
                    },
                    signal: controller.signal
                });

                setData(response.data.data || []);
                setRowCount(response.data.total || 0);
            } catch (error: any) {
                if (error.name === 'CanceledError' || error.message === 'canceled') return;
                console.error(error);
                toast.error('Failed to load performance data.');
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        const timeoutId = setTimeout(() => {
            fetchReports();
        }, 300);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter, refreshKey, dateRange, selectedUsers]);

    const handleDeleteClick = (id: number) => {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!deleteId) return;
        setIsSubmitting(true);
        try {
            await api.delete(`/ad-reports/${deleteId}`);
            toast.success('Report deleted successfully');
            setRefreshKey(prev => prev + 1);
            setIsDeleteModalOpen(false);
            setDeleteId(null);
        } catch (error) {
            toast.error('Failed to delete report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const navigateToGenerator = (report: any) => {
        navigate('/apps/report/facebook-ads-report-generator', {
            state: {
                preloadedData: report.report_data,
                accountName: report.account_name,
                backPath: '/apps/report/facebook-ads-performance',
                currentReportId: report.id
            }
        });
    };

    const handleExport = async (reportId?: number) => {
        try {
            const url = reportId ? `/ad-reports/${reportId}/export` : `/ad-reports/export`;
            const response = await api.get(url, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', `fb-ads-performance-${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
            toast.error("Export failed");
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            return date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).replace(/ /g, '-');
        } catch (e) {
            return dateString;
        }
    };

    const columnHelper = createColumnHelper<any>();
    const columns = useMemo(() => [
        columnHelper.display({
            id: 'rowNumber',
            header: '#',
            cell: info => <span className="text-gray-500 font-semibold text-xs">{(pagination.pageIndex * pagination.pageSize) + info.row.index + 1}</span>,
        }),
        columnHelper.accessor('account_name', {
            header: 'Account Name',
            cell: info => (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{info.getValue() || 'Unknown Account'}</span>
                    <span className="text-[11px] text-gray-400 mt-0.5">
                        Range: {formatDate(info.row.original.start_date)} to {formatDate(info.row.original.end_date)}
                    </span>
                    {isAdminOrOwner && info.row.original.user && (
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 flex items-center gap-1 w-fit mt-1">
                            <IconUser size={10} />
                            {info.row.original.user.name}
                        </span>
                    )}
                </div>
            ),
        }),
        columnHelper.accessor('total_spend', {
            header: 'Spend',
            cell: info => <span className="font-bold text-gray-900 dark:text-white">${Number(info.getValue() || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>,
        }),
        columnHelper.accessor('total_impressions', {
            header: 'Impr / Reach',
            cell: info => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 italic">I: {Number(info.getValue() || 0).toLocaleString()}</span>
                    <span className="text-xs text-gray-500 italic">R: {Number(info.row.original.total_reach || 0).toLocaleString()}</span>
                </div>
            ),
        }),
        columnHelper.accessor('total_clicks', {
            header: 'Clicks / CTR',
            cell: info => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-800 dark:text-gray-200 italic">C: {Number(info.getValue() || 0).toLocaleString()}</span>
                    <span className="text-xs text-blue-500 font-bold italic">CTR: {info.row.original.avg_ctr}%</span>
                </div>
            ),
        }),
        columnHelper.accessor('total_conversions', {
            header: 'Conversions',
            cell: info => <span className="font-bold text-emerald-600 dark:text-emerald-400 italic">{Number(info.getValue() || 0).toLocaleString()}</span>,
        }),
        columnHelper.accessor('total_roas', {
            header: 'ROAS',
            cell: info => {
                const val = parseFloat(info.getValue() || 0);
                const color = val >= 3 ? 'text-emerald-600' : val >= 1 ? 'text-amber-500' : 'text-rose-500';
                return <span className={`font-extrabold italic ${color}`}>{val.toFixed(2)}x</span>
            },
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: info => (
                <div className="flex items-center gap-2">
                    <Tippy content="Preview">
                        <button className="p-2 rounded-full text-amber-600 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100" onClick={() => { setSelectedReport(info.row.original); setIsModalOpen(true); }}>
                            <IconFileAnalytics size={18} />
                        </button>
                    </Tippy>
                    <Tippy content="View Full Report">
                        <button className="p-2 rounded-full text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100" onClick={() => navigateToGenerator(info.row.original)}>
                            <IconArrowUpRight size={18} />
                        </button>
                    </Tippy>
                    <Tippy content="Export CSV">
                        <button className="p-2 rounded-full text-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100" onClick={() => handleExport(info.row.original.id)}>
                            <IconDownload size={18} />
                        </button>
                    </Tippy>
                    <Tippy content="Delete">
                        <button className="p-2 rounded-full text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100" onClick={() => handleDeleteClick(info.row.original.id)}>
                            <IconX size={18} />
                        </button>
                    </Tippy>
                </div>
            ),
        }),
    ], [pagination.pageIndex, pagination.pageSize, isAdminOrOwner, sorting]);

    const table = useReactTable({
        data,
        columns,
        state: { pagination, sorting, globalFilter },
        pageCount: Math.ceil(rowCount / pagination.pageSize),
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <div>
            <Toaster position="top-right" />
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <IconFileAnalytics size={26} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ad Performance Report</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Facebook Ads Manager analytics history</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsFilterPanelVisible(!isFilterPanelVisible)}
                        className={`gap-2 ${isFilterPanelVisible ? 'bg-primary/5 border-primary/20 text-primary' : ''}`}
                    >
                        {isFilterPanelVisible ? <IconFilterOff size={18} /> : <IconFilter size={18} />}
                        <span className="hidden sm:inline">{isFilterPanelVisible ? 'Hide' : 'Show'} Filters</span>
                    </Button>
                    <Button onClick={() => handleExport()} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                        <IconDownload size={18} />
                        Export All
                    </Button>
                </div>
            </div>

            {isFilterPanelVisible && (
                <Card className="mb-8 shadow-sm backdrop-blur-sm">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <SlidersHorizontal size={16} className="text-gray-400" />
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Filters</span>
                                {getActiveFilterCount() > 0 && <Badge className="bg-primary/10 text-primary border-none text-[10px] h-5">{getActiveFilterCount()}</Badge>}
                            </div>
                            <button onClick={() => { setDateRange(undefined); setGlobalFilter(''); setSelectedUsers([]); }} className="text-xs text-gray-400 hover:text-primary transition-colors">Clear all</button>
                        </div>
                        <div className="flex flex-wrap items-end gap-6 p-5">
                            <div className="w-full md:w-[280px] space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><IconCalendar size={14} /> Date Range</Label>
                                <DateRangePicker value={dateRange} onChange={setDateRange} placeholder="Select dates" />
                            </div>

                            <Can when={isAdminOrOwner || can('view all team reports')}>
                                <div className="w-full md:w-[240px] space-y-2">
                                    <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><IconUsers size={14} /> Team Members</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between font-normal">
                                                <span className="truncate">{selectedUsers.length === 0 ? 'All members' : `${selectedUsers.length} selected`}</span>
                                                <IconChevronDown size={16} className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[240px] p-1 shadow-xl border-gray-100 dark:border-gray-700">
                                            <div className="max-h-60 overflow-auto">
                                                {teamMembers.map(m => (
                                                    <div key={m.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                                                        onClick={() => {
                                                            const exists = selectedUsers.find(u => u.id === m.id);
                                                            setSelectedUsers(exists ? selectedUsers.filter(u => u.id !== m.id) : [...selectedUsers, m]);
                                                        }}>
                                                        <div className="flex items-center gap-2">
                                                            <Checkbox checked={!!selectedUsers.find(u => u.id === m.id)} />
                                                            <span className="text-sm">{m.name}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </Can>

                            <div className="w-full md:flex-1 min-w-[200px] space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5"><IconSearch size={14} /> Search</Label>
                                <div className="relative">
                                    <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="pl-9" placeholder="Search accounts..." />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="border-none shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {columns.map((_, j) => (
                                            <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <IconFileAnalytics size={48} strokeWidth={1} />
                                            <p className="text-sm">No performance reports found matching your filters.</p>
                                            <Button onClick={() => navigate('/apps/report/facebook-ads-report-generator')} className="mt-2 bg-primary text-white">Generate Now</Button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-6 py-4">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
                    <div className="text-xs text-gray-500">
                        Showing <span className="font-bold text-gray-900 dark:text-white">{(pagination.pageIndex * pagination.pageSize) + 1}</span> to <span className="font-bold text-gray-900 dark:text-white">{Math.min((pagination.pageIndex + 1) * pagination.pageSize, rowCount)}</span> of <span className="font-bold text-gray-900 dark:text-white">{rowCount}</span> reports
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><IconChevronLeft size={16} /></Button>
                        <div className="flex items-center gap-1 text-xs font-medium px-3">
                            <span>Page</span>
                            <span className="text-primary font-bold">{table.getState().pagination.pageIndex + 1}</span>
                            <span>of</span>
                            <span>{table.getPageCount()}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><IconChevronRight size={16} /></Button>
                    </div>
                </div>
            </Card>

            {/* Preview Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <div className="fixed inset-0 z-[999] overflow-y-auto">
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                        <div className="flex min-h-screen items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-blue-600">
                                        <div className="text-white">
                                            <h3 className="text-xl font-bold">{selectedReport?.account_name}</h3>
                                            <p className="text-xs opacity-80">Quick KPI Overview</p>
                                        </div>
                                        <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white"><IconX size={24} /></button>
                                    </div>
                                    <div className="p-8">
                                        {selectedReport && (
                                            <div className="space-y-8">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                    {[
                                                        { label: 'Spend', value: `$${selectedReport.total_spend.toLocaleString()}`, color: 'blue' },
                                                        { label: 'Impressions', value: selectedReport.total_impressions.toLocaleString(), color: 'amber' },
                                                        { label: 'Clicks', value: selectedReport.total_clicks.toLocaleString(), color: 'purple' },
                                                        { label: 'ROAS', value: `${selectedReport.total_roas}x`, color: 'emerald' }
                                                    ].map((kpi, idx) => (
                                                        <div key={idx} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                                                            <p className="text-2xl font-black text-gray-900 dark:text-white">{kpi.value}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-900 dark:text-amber-200 text-sm">
                                                    <Info size={20} className="shrink-0" />
                                                    <p>This is a high-level summary. For the full detailed breakdown including ad-level metrics, click <strong>View Full Report</strong>.</p>
                                                </div>

                                                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                                                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
                                                    <Button onClick={() => { setIsModalOpen(false); navigateToGenerator(selectedReport); }} className="bg-blue-600 text-white">View Full Report</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            <DeleteModal isOpen={isDeleteModalOpen} setIsOpen={setIsDeleteModalOpen} onConfirm={executeDelete} isLoading={isSubmitting} title="Delete Performance Data?" message="This will permanently delete the selected ad performance record." />
        </div>
    );
};

export default FacebookAdsPerformance;
