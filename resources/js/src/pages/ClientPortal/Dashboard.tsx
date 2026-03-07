import { useEffect, useState, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toggleTheme } from '../../store/themeConfigSlice';
import store from '../../store';
import {
    IconLogout, IconFileAnalytics, IconBrandFacebook,
    IconDownload, IconEye, IconRefresh, IconSearch,
    IconHistory, IconChevronLeft, IconChevronRight,
    IconChevronUp, IconChevronDown, IconFilter,
    IconBrandTiktok, IconDeviceDesktopAnalytics,
    IconSun, IconMoon, IconLayoutDashboard, IconChartPie
} from '@tabler/icons-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { ScrollArea } from '../../components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import { Badge } from '../../components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import AnalyticsPagination from '../../components/Analytics/AnalyticsPagination';

const PortalDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // --- Data State ---
    const [data, setData] = useState<any[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [clientName, setClientName] = useState('');

    // --- Table State ---
    const [sorting, setSorting] = useState<{ id: string, desc: boolean }>([{ id: 'created_at', desc: true }]);
    const [pagination, setPagination] = useState<{ pageIndex: number, pageSize: number }>({ pageIndex: 0, pageSize: 10 });
    const [search, setSearch] = useState('');
    const [platformFilter, setPlatformFilter] = useState('all');

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: response } = await api.get('/portal/reports', {
                params: {
                    page: pagination.pageIndex + 1,
                    per_page: pagination.pageSize,
                    search: search,
                    platform: platformFilter,
                    sort_by: sorting[0]?.id || 'created_at',
                    sort_dir: sorting[0]?.desc ? 'desc' : 'asc',
                }
            });
            setData(response.data || []);
            setRowCount(response.total || 0);
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again.');
                navigate('/portal/login');
            } else {
                toast.error(error.response?.data?.message || 'Failed to load reports. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const client = JSON.parse(localStorage.getItem('client') || '{}');
        if (!client.name) {
            navigate('/portal/login');
            return;
        }
        setClientName(client.name);
    }, []);

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(debounce);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.pageIndex, pagination.pageSize, sorting, search, platformFilter]);

    const handleLogout = () => {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('client');
        navigate('/portal/login');
    };

    const openReport = (report: any) => {
        if (report.type === 'page') {
            navigate(`/portal/pages/${report.id}`);
        } else {
            navigate(`/portal/reports/${report.type}/${report.id}`);
        }
    };

    // Calculate metrics based on current page data (existing logic kept for simplicity, can be adjusted if API sends totals)
    const facebookCount = data.filter(r => r.platform === 'facebook').length;
    const tiktokCount = data.filter(r => r.platform === 'tiktok').length;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="h-screen w-full bg-[#f8fafc] dark:bg-[#0f172a] font-sans antialiased text-slate-900 selection:bg-primary/20">
            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center border border-primary/20">
                            <IconLayoutDashboard className="text-primary" size={20} />
                        </div>
                        <div className="hidden sm:block">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight capitalize">{clientName}</h2>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Client Portal</p>
                        </div>
                        <div className="sm:hidden">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Portal</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const currentTheme = store.getState().themeConfig.theme;
                                dispatch(toggleTheme(currentTheme === 'dark' ? 'light' : 'dark'));
                            }}
                            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                            title="Toggle Theme"
                        >
                            {store.getState().themeConfig.theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
                        </button>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors text-sm font-semibold"
                        >
                            <IconLogout size={16} />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
                {/* Hero Section */}
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 capitalize">
                            {getGreeting()}, {clientName}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl">
                            Here is the latest performance data and analytics reports assigned to your account.
                        </p>
                    </div>

                    {/* Metric Cards - Right aligned on desktop */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 md:gap-4 w-full md:w-auto">
                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col items-center justify-center min-w-[140px] transition-transform hover:-translate-y-1 duration-300">
                            <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{rowCount}</div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Total Reports</div>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col items-center justify-center min-w-[140px] transition-transform hover:-translate-y-1 duration-300">
                            <div className="text-2xl font-black text-blue-600 dark:text-blue-500 mb-1">{facebookCount}</div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Content Performance</div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">

                    {/* Toolbar (Search & Filter) */}
                    <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="w-full sm:w-96 relative group">
                            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search report name..."
                                className="w-full pl-10 pr-4 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-700 dark:text-slate-200 text-sm placeholder:text-slate-400"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-3">
                            <div className="w-full sm:w-[260px]">
                                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                                    <SelectTrigger className="h-10 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl text-sm font-medium w-full">
                                        <div className="flex items-center gap-2 text-left">
                                            <IconFilter size={16} className="text-slate-400 shrink-0" />
                                            <SelectValue placeholder="All Platforms" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Platforms</SelectItem>
                                        <SelectItem value="facebook">Facebook Content Performance</SelectItem>
                                        <SelectItem value="tiktok">TikTok Content Performance</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <button
                                onClick={fetchData}
                                className="h-10 w-full sm:w-auto sm:px-4 bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold shadow-sm focus:ring-2 focus:ring-primary/20 focus:outline-none shrink-0"
                                title="Refresh Data"
                            >
                                <IconRefresh size={18} className={loading ? 'animate-spin' : ''} />
                                <span className="inline text-sm break-keep whitespace-nowrap">Refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto w-full">
                        <Table className="w-full min-w-[800px]">
                            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                                <TableRow className="border-b border-slate-200 dark:border-slate-800 hover:bg-transparent">
                                    {[
                                        { id: 'title', label: 'Report Name' },
                                        { id: 'platform', label: 'Platform & Type', sortable: false },
                                        { id: 'created_at', label: 'Generated Date' },
                                        { id: 'actions', label: 'Action', sortable: false }
                                    ].map(head => (
                                        <TableHead
                                            key={head.id}
                                            className={`h-14 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${head.sortable !== false ? 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200' : ''} transition-colors select-none`}
                                            onClick={() => {
                                                if (head.sortable === false) return;
                                                setSorting([{ id: head.id, desc: sorting[0]?.id === head.id ? !sorting[0]?.desc : true }]);
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                {head.label}
                                                {head.sortable !== false && (
                                                    <div className="flex flex-col text-slate-300 dark:text-slate-600">
                                                        {sorting[0]?.id === head.id ? (
                                                            sorting[0]?.desc ? <IconChevronDown size={14} className="text-primary" /> : <IconChevronUp size={14} className="text-primary" />
                                                        ) : (
                                                            <div className="opacity-0 transition-opacity group-hover:opacity-100">
                                                                <IconChevronUp size={14} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i} className="animate-pulse hover:bg-transparent">
                                            {[...Array(4)].map((_, j) => (
                                                <TableCell key={j} className="py-5 px-6 border-none">
                                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-2/3"></div>
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : data.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={4} className="py-24 text-center border-none">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-700">
                                                    <IconChartPie className="text-slate-400 dark:text-slate-500" size={32} />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No reports found</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                                                    Try adjusting your search or filters. If you believe this is an error, please contact your account manager.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((row: any) => (
                                        <TableRow key={row.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors border-none">
                                            {/* Report Name */}
                                            <TableCell className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center border shadow-sm ${row.platform === 'facebook'
                                                        ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                                                        : row.platform === 'tiktok'
                                                            ? 'bg-slate-900 border-slate-800 text-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                                            : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                                        }`}>
                                                        {row.platform === 'facebook' ? <IconBrandFacebook size={24} className="fill-current" /> :
                                                            row.platform === 'tiktok' ? <IconBrandTiktok size={24} /> :
                                                                <IconFileAnalytics size={24} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-0.5 text-[15px]">
                                                            {row.title}
                                                        </div>
                                                        <div className="text-[11px] font-semibold tracking-wide text-slate-400 dark:text-slate-500 uppercase">
                                                            ID: {row.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Platform & Type */}
                                            <TableCell className="py-5 px-6">
                                                <div className="flex flex-col gap-1.5 items-start">
                                                    <span className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                                        {row.platform === 'facebook' ? 'Facebook' : row.platform === 'tiktok' ? 'TikTok' : row.platform}
                                                    </span>
                                                    {row.type === 'page' ? (
                                                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 rounded-md font-bold uppercase tracking-wider text-[10px]">
                                                            Page Folder
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className={row.platform === 'facebook'
                                                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 rounded-md font-bold uppercase tracking-wider text-[10px]"
                                                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 rounded-md font-bold uppercase tracking-wider text-[10px]"
                                                        }>
                                                            {row.type === 'standard' ? 'Content Performance' : `${row.type} Report`}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>

                                            {/* Date */}
                                            <TableCell className="py-5 px-6">
                                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {new Date(row.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                                <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                                                    {new Date(row.created_at).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="py-5 px-6">
                                                <button
                                                    onClick={() => openReport(row)}
                                                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors text-sm font-bold shadow-sm"
                                                >
                                                    <IconEye size={18} />
                                                    <span>View</span>
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 sm:px-6 sm:py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <AnalyticsPagination
                            currentPage={pagination.pageIndex + 1}
                            totalPages={Math.ceil(rowCount / pagination.pageSize) || 1}
                            rowsPerPage={pagination.pageSize}
                            onPageChange={(page) => setPagination(prev => ({ ...prev, pageIndex: page - 1 }))}
                            onRowsPerPageChange={(size) => setPagination({ pageIndex: 0, pageSize: size })}
                            totalItems={rowCount}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center pb-24">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center opacity-60">
                        <IconChartPie className="text-slate-400 dark:text-slate-500" size={20} />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Scool Report Engine</p>
                        <p className="text-slate-500 dark:text-slate-500 text-xs font-medium">
                            &copy; {new Date().getFullYear()} All rights reserved. Secure Data Access.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PortalDashboard;
