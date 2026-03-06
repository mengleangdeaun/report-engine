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
    IconBrandTiktok, IconDeviceDesktopAnalytics
} from '@tabler/icons-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Listbox, Transition } from '@headlessui/react';
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
import { IconSun, IconMoon } from '@tabler/icons-react';
import AnalyticsPagination from '../../components/Analytics/AnalyticsPagination';

const PortalDashboard = () => {
    const navigate = useNavigate();

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
        fetchData();
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

    // Removed columnHelper and useReactTable logic.

    const dispatch = useDispatch();

    return (
        <ScrollArea className="h-screen w-full bg-gray-50 dark:bg-[#060818] font-sans antialiased text-gray-900 selection:bg-primary/10">
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <IconDeviceDesktopAnalytics className="text-primary" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{clientName}</h2>
                            <p className="text-[10px] text-primary uppercase font-black tracking-[0.2em] opacity-70">Client Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => {
                                const currentTheme = store.getState().themeConfig.theme;
                                dispatch(toggleTheme(currentTheme === 'dark' ? 'light' : 'dark'));
                            }}
                            className="p-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-primary/10 text-gray-400 hover:text-primary rounded-xl transition-all"
                            title="Toggle Appearance"
                        >
                            {store.getState().themeConfig.theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
                        </button>

                        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2.5 px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-xl transition-all font-bold text-sm"
                        >
                            <IconLogout size={18} />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                <div className="relative mb-10 overflow-hidden rounded-2xl bg-primary/5 dark:bg-gray-800/50 p-8 md:p-14 border border-primary/10">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 to-transparent opacity-50" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 backdrop-blur-sm border border-primary/20 rounded-lg mb-6">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Verified Secure Access</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-6">
                                Dashboard <span className="text-primary">Overview</span>
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-xl font-medium leading-relaxed">
                                Welcome, <span className="text-gray-900 dark:text-white">{clientName}</span>.
                                Access your high-performance marketing insights and specialized data reports below.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto min-w-[320px]">
                            <div className="p-6 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center text-center">
                                <div className="text-3xl font-black text-gray-900 dark:text-white mb-0.5">{rowCount}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#506690]">Total Reports</div>
                            </div>
                            <div className="p-6 bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center text-center">
                                <div className="text-3xl font-black text-primary mb-0.5">
                                    {data.filter(r => r.platform === 'facebook').length}
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-[#506690]">Meta Syncs</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/40 dark:shadow-none mb-10 sticky top-[6.5rem] z-30">
                    <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                        <div className="flex-1 relative">
                            <IconSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search reports..."
                                className="w-full pl-14 pr-6 h-12 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-gray-700 dark:text-gray-200 text-sm font-bold"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="w-full sm:w-[200px]">
                                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                                    <SelectTrigger className="h-12 border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl font-bold text-sm">
                                        <div className="flex items-center gap-2">
                                            <IconFilter size={16} className="text-gray-400" />
                                            <SelectValue placeholder="All Channels" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Channels</SelectItem>
                                        <SelectItem value="facebook">Meta Advertising</SelectItem>
                                        <SelectItem value="tiktok">TikTok Business</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <button
                                onClick={fetchData}
                                className="h-12 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all flex items-center justify-center gap-2 font-black shadow-lg shadow-primary/20 active:scale-95 whitespace-nowrap"
                            >
                                <IconRefresh size={18} className={loading ? 'animate-spin' : ''} />
                                <span className="text-sm">Refresh Data</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-2xl shadow-gray-200/40 dark:shadow-none overflow-hidden group/table">
                    <div className="px-8 py-7 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Report Catalog</h3>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Verified Real-Time Insights</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active Sync</span>
                        </div>
                    </div>

                    <Table className="w-full">
                        <TableHeader className="bg-gray-50/50 dark:bg-gray-900/30">
                            <TableRow className="border-b border-gray-100 dark:border-gray-700">
                                {[
                                    { id: 'title', label: 'Report Page / Account' },
                                    { id: 'type', label: 'Type' },
                                    { id: 'created_at', label: 'Generated Date' },
                                    { id: 'actions', label: 'Actions', sortable: false }
                                ].map(head => (
                                    <TableHead
                                        key={head.id}
                                        className={`h-auto py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ${head.sortable !== false ? 'cursor-pointer hover:text-primary' : ''} transition-colors select-none group/th`}
                                        onClick={() => {
                                            if (head.sortable === false) return;
                                            setSorting([{ id: head.id, desc: sorting[0]?.id === head.id ? !sorting[0]?.desc : true }]);
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {head.label}
                                            {head.sortable !== false && (
                                                <div className="flex flex-col text-gray-300 group-hover/th:text-primary transition-colors">
                                                    {sorting[0]?.id === head.id ? (
                                                        sorting[0]?.desc ? <IconChevronDown size={14} className="text-primary" /> : <IconChevronUp size={14} className="text-primary" />
                                                    ) : (
                                                        <div className="opacity-0 group-hover/th:opacity-100 transition-opacity">
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
                        <TableBody className="divide-y divide-gray-50/50 dark:divide-gray-700/50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i} className="animate-pulse">
                                        {[...Array(4)].map((_, j) => (
                                            <TableCell key={j} className="py-8 px-8 border-none">
                                                <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full w-2/3"></div>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-24 text-center border-none">
                                        <div className="max-w-xs mx-auto">
                                            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900 rounded-[2.5rem] flex items-center justify-center m-auto mb-6 shadow-inner ring-4 ring-white dark:ring-gray-800">
                                                <IconHistory className="text-gray-200" size={48} />
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 dark:text-white">Empty Catalog</h3>
                                            <p className="text-gray-500 mt-2 font-medium">Adjust your filters or contact your coordinator to request new report assignments.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row: any) => (
                                    <TableRow key={row.id} className="group hover:bg-primary/[0.03] dark:hover:bg-primary/5 transition-all border-none">
                                        <TableCell className="py-7 px-8 transition-all duration-300">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${row.platform === 'facebook' ? 'bg-blue-50 text-blue-500' : 'bg-black text-white'}`}>
                                                    {row.platform === 'facebook' ? <IconBrandFacebook size={20} /> : <IconBrandTiktok size={20} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white line-clamp-1">
                                                        {row.title}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                                                        {row.platform}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-7 px-8 transition-all duration-300">
                                            {row.type === 'page' ? (
                                                <Badge variant="accent" className="uppercase tracking-wider">
                                                    Page Folder
                                                </Badge>
                                            ) : (
                                                <Badge variant={row.type === 'facebook' ? 'default' : 'success'} className="uppercase tracking-wider">
                                                    {row.type} Report
                                                </Badge>
                                            )}
                                        </TableCell>

                                        <TableCell className="py-7 px-8 transition-all duration-300">
                                            <div className="text-gray-500 font-medium">
                                                {row.created_at}
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-7 px-8 transition-all  duration-300">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openReport(row)}
                                                    className={`p-2 hover:bg-primary/10 text-gray-400 hover:text-primary rounded-xl transition-all ${row.type === 'page' ? 'w-full flex justify-center bg-gray-50 dark:bg-gray-800' : ''}`}
                                                    title={row.type === 'page' ? "View Reports" : "View Secured Report"}
                                                >
                                                    {row.type === 'page' ? <div className="flex items-center gap-1 text-xs font-bold uppercase"><IconEye size={16} /> View All</div> : <IconEye size={20} />}
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    <div className="px-8 py-8 bg-gray-50/50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700">
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

            <footer className="max-w-7xl mx-auto px-4 py-20 text-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800/10 backdrop-blur-md rounded-2xl flex items-center justify-center opacity-30 group hover:opacity-100 transition-all cursor-pointer ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-gray-700">
                        <IconFileAnalytics className="text-gray-400 group-hover:text-primary transition-colors" size={24} />
                    </div>
                    <div className="max-w-md">
                        <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.4em] mb-2">Report Engine v4.0</p>
                        <p className="text-gray-500 text-xs font-medium opacity-60">&copy; {new Date().getFullYear()} Secured Enterprise Infrastructure. All insights strictly confidential and protected by high-grade encryption.</p>
                    </div>
                </div>
            </footer>
        </ScrollArea>
    );
};

export default PortalDashboard;
