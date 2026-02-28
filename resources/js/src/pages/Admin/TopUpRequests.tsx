import { useEffect, useState, Fragment } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { IconCheck, IconX, IconRefresh, IconLoader } from '@tabler/icons-react';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import DeleteModal from '../../components/DeleteModal';
import { formatUserDate } from '../../utils/userDate';
import { DateRangePicker } from '../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

const AdminTopUpRequests = () => {
    const dispatch = useDispatch();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRows, setTotalRows] = useState(0);

    // Filter State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Top Up Requests'));
        fetchRequests();
    }, [page, pageSize, statusFilter, dateRange]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1); // Reset to page 1 on search
            fetchRequests();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Real-time Listener for Top Up Requests
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        let channelName = '';
        let intervalId: any = null;

        const setupEcho = () => {
            if (window.Echo) {
                try {
                    const userObj = JSON.parse(storedUser || '{}');
                    if (userObj.id) {
                        channelName = `App.Models.User.${userObj.id}`;
                        const channel = window.Echo.private(channelName);

                        console.log('TopUpRequests: Listening to', channelName);

                        channel.notification((notification: any) => {
                            console.log('TopUpRequests: Notification received', notification);
                            if (
                                notification.action === 'New Top Up Request' ||
                                notification.type === 'App\\Notifications\\AdminTopUpAlert'
                            ) {
                                fetchRequests();
                                toast.success('New Top Up Request received!');
                            }
                        });

                        // Clear interval once connected
                        if (intervalId) clearInterval(intervalId);
                    }
                } catch (e) {
                    console.error("Error parsing user for Echo in TopUpRequests", e);
                }
            }
        };

        if (storedUser) {
            if (window.Echo) {
                setupEcho();
            } else {
                // Poll for Echo instance
                intervalId = setInterval(() => {
                    if (window.Echo) {
                        setupEcho();
                    }
                }, 500);
            }
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (channelName && window.Echo) {
                window.Echo.leave(channelName);
            }
        };
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            let startStr = '';
            let endStr = '';
            if (dateRange?.from) {
                const d1 = new Date(dateRange.from);
                d1.setHours(0, 0, 0, 0); // Start of local day
                const startIso = d1.toISOString();

                const d2 = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
                d2.setHours(23, 59, 59, 999); // End of local day
                const endIso = d2.toISOString();

                startStr = startIso;
                endStr = endIso;
            }

            const response = await api.get('/admin/top-up-requests', {
                params: {
                    page,
                    per_page: pageSize,
                    search,
                    status: statusFilter,
                    start_date: startStr || undefined,
                    end_date: endStr || undefined
                }
            });
            setRequests(response.data.data);
            setTotalPages(response.data.last_page);
            setTotalRows(response.data.total);
        } catch (error) {
            console.error('Failed to fetch requests', error);
            toast.error('Failed to load requests');
        } finally {
            setLoading(false);
        }
    };

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [approvedAmount, setApprovedAmount] = useState<number | ''>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [rejectingIds, setRejectingIds] = useState<number[]>([]);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteType, setDeleteType] = useState<'single' | 'batch'>('single');
    const [recordToDelete, setRecordToDelete] = useState<number | null>(null);

    const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
        if (status === 'rejected') {
            setRejectingIds(prev => [...prev, id]);
        }
        try {
            await api.put(`/admin/top-up-requests/${id}`, { status });
            toast.success(`Request ${status}`);
            fetchRequests(); // Refresh list
        } catch (error) {
            toast.error('Failed to update status');
        } finally {
            if (status === 'rejected') {
                setRejectingIds(prev => prev.filter(rid => rid !== id));
            }
        }
    };

    const handleTopUpClick = (req: any) => {
        setSelectedRequest(req);
        setApprovedAmount(req.amount); // Default to requested amount
        setIsConfirmModalOpen(true);
    };

    const confirmTopUp = async () => {
        if (!selectedRequest || !approvedAmount) return;

        setIsProcessing(true);
        try {
            // Call Approve Endpoint with custom amount
            await api.post(`/admin/top-up-requests/${selectedRequest.id}/approve`, {
                amount: approvedAmount
            });

            toast.success('Request approved & tokens added!');
            fetchRequests();
            setIsConfirmModalOpen(false);
            setSelectedRequest(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to process top up.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (statusFilter !== 'all') count++;
        if (dateRange?.from) count++;
        if (search.trim() !== '') count++;
        return count;
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setDateRange(undefined);
        setPage(1);
    };

    // --- NEW: Sorting & Selection State ---
    const [selectedRecords, setSelectedRecords] = useState<number[]>([]);
    const [sortStatus, setSortStatus] = useState<{ columnAccessor: string; direction: 'asc' | 'desc' }>({
        columnAccessor: 'created_at',
        direction: 'desc',
    });

    // Handle Selection
    const toggleSelectAll = () => {
        if (selectedRecords.length === requests.length) {
            setSelectedRecords([]);
        } else {
            setSelectedRecords(requests.map((r) => r.id));
        }
    };

    const toggleSelectOne = (id: number) => {
        if (selectedRecords.includes(id)) {
            setSelectedRecords((prev) => prev.filter((r) => r !== id));
        } else {
            setSelectedRecords((prev) => [...prev, id]);
        }
    };

    // Handle Sorting (Client-side for now as API might not support it yet, or we can add params)
    // For now, let's sort the `requests` array on render or prior to rendering
    // But since `requests` is from API, better to do server side. But user asked for "sort table filter".
    // I'll stick to client-side sorting of the current page for simplicity unless user complains,
    // OR ideally pass sort params to API. The `fetchRequests` doesn't support sort params yet.
    // Let's implement client-side sorting on the `requests` state for the current page.
    const sortedRequests = [...requests].sort((a, b) => {
        const first = a[sortStatus.columnAccessor];
        const second = b[sortStatus.columnAccessor];
        // Handle nested properties if needed (e.g. user.name)
        // Simple implementation:
        let valA = first;
        let valB = second;

        if (sortStatus.columnAccessor === 'user.name') {
            valA = a.user?.name || '';
            valB = b.user?.name || '';
        }
        if (sortStatus.columnAccessor === 'team.name') {
            valA = a.team?.name || '';
            valB = b.team?.name || '';
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortStatus.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        // Numeric sort
        return sortStatus.direction === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
    });

    const handleSort = (column: string) => {
        setSortStatus((prev) => ({
            columnAccessor: column,
            direction: prev.columnAccessor === column && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // --- NEW: Delete Logic ---
    const deleteRow = (id: number) => {
        setDeleteType('single');
        setRecordToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const deleteSelected = () => {
        setDeleteType('batch');
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setDeleteLoading(true);
        try {
            if (deleteType === 'single' && recordToDelete) {
                await api.delete(`/admin/top-up-requests/${recordToDelete}`);
                toast.success('Request deleted');
                setSelectedRecords(prev => prev.filter(r => r !== recordToDelete));
            } else if (deleteType === 'batch') {
                await api.post('/admin/top-up-requests/batch-delete', { ids: selectedRecords });
                toast.success('Requests deleted');
                setSelectedRecords([]);
            }
            fetchRequests();
            setIsDeleteModalOpen(false);
            setRecordToDelete(null);
        } catch (e) {
            toast.error('Failed to delete');
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Top Up Requests</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage token top up requests from users</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedRecords.length > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={deleteSelected}
                        >
                            Delete Selected ({selectedRecords.length})
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsFilterPanelVisible(!isFilterPanelVisible)}
                        className="gap-2"
                    >
                        <SlidersHorizontal size={16} />
                        {isFilterPanelVisible ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchRequests} className="gap-2">
                        <IconRefresh size={16} /> Refresh
                    </Button>
                </div>
            </div>

            {/* Filter Panel */}
            {isFilterPanelVisible && (
                <Card className="mb-6 overflow-hidden border-border/60 shadow-sm">
                    <CardContent className="p-0">
                        {/* Filter Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
                            <div className="flex items-center gap-2.5">
                                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-semibold text-foreground">Filters</span>
                                {getActiveFilterCount() > 0 && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-semibold">
                                        {getActiveFilterCount()} active
                                    </Badge>
                                )}
                            </div>
                            {getActiveFilterCount() > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                                    onClick={clearFilters}
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear all
                                </Button>
                            )}
                        </div>

                        {/* Filter Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-end gap-4 px-5 py-4">

                            {/* Search */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Search className="h-3.5 w-3.5" />
                                    Search
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        type="text"
                                        placeholder="Search by User Name or Email..."
                                        className="pl-9 h-10"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button
                                            onClick={() => setSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Date Range Filter */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar size={13} /> {/* Using Check icon as placeholder for Calendar if needed, or just remove icon */}
                                    Date Range
                                </Label>
                                <DateRangePicker
                                    value={dateRange}
                                    onChange={(range) => {
                                        setDateRange(range);
                                        setPage(1);
                                    }}
                                    placeholder="Select date range"
                                    align="start"
                                    showClear
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <IconLoader size={13} />
                                    Status
                                </Label>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(value) => {
                                        setStatusFilter(value);
                                        setPage(1);
                                    }}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            <div className="panel p-0 border-0 overflow-hidden rounded-lg">
                <div className="table-responsive">
                    <table className="table-hover w-full text-left">
                        <thead>
                            <tr className="bg-white dark:bg-[#1a2941] text-gray-800 dark:text-white-light uppercase text-xs font-bold tracking-wider border-b dark:border-gray-700">
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        className="form-checkbox h-5 w-5 text-primary border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-primary"
                                        checked={requests.length > 0 && selectedRecords.length === requests.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="p-4 cursor-pointer hover:text-primary" onClick={() => handleSort('user.name')}>
                                    <div className="flex items-center gap-1">
                                        User {sortStatus.columnAccessor === 'user.name' && (sortStatus.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-primary" onClick={() => handleSort('team.name')}>
                                    <div className="flex items-center gap-1">
                                        Workspace {sortStatus.columnAccessor === 'team.name' && (sortStatus.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-primary" onClick={() => handleSort('created_at')}>
                                    <div className="flex items-center gap-1">
                                        Date {sortStatus.columnAccessor === 'created_at' && (sortStatus.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-primary" onClick={() => handleSort('amount')}>
                                    <div className="flex items-center gap-1">
                                        Requested {sortStatus.columnAccessor === 'amount' && (sortStatus.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-primary" onClick={() => handleSort('approved_amount')}>
                                    <div className="flex items-center gap-1">
                                        Approved {sortStatus.columnAccessor === 'approved_amount' && (sortStatus.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 cursor-pointer hover:text-primary" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1">
                                        Status {sortStatus.columnAccessor === 'status' && (sortStatus.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index} className="animate-pulse">
                                        <td className="p-4"><Skeleton className="h-5 w-5 rounded" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-24" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                                        <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                                        <td className="p-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                        <td className="p-4"><Skeleton className="h-8 w-24 mx-auto rounded-md" /></td>
                                    </tr>
                                ))
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-8">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <IconX size={48} className="text-gray-300 mb-2" />
                                            <p className="font-semibold text-lg">No requests found</p>
                                            {(search || statusFilter !== 'all' || dateRange?.from) && (
                                                <Button variant="link" onClick={clearFilters} className="mt-2">
                                                    Clear Filters
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedRequests.map((req) => (
                                    <tr key={req.id} className={`hover:bg-gray-50 dark:hover:bg-[#1b2e4b] transition-colors ${selectedRecords.includes(req.id) ? 'bg-primary/5 dark:bg-primary/10' : ''}`}>
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-5 w-5 text-primary border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 focus:ring-primary"
                                                checked={selectedRecords.includes(req.id)}
                                                onChange={() => toggleSelectOne(req.id)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-900 dark:text-gray-100">{req.user?.name}</div>
                                            <div className="text-xs text-gray-500">{req.user?.email}</div>
                                        </td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300">{req.team?.name}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300">
                                            <div>{formatUserDate(req.created_at)}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{formatUserDate(req.created_at, true)}</div>
                                        </td>
                                        <td className="p-4 font-semibold">{req.amount}</td>
                                        <td className="p-4 font-semibold text-success">{req.approved_amount || '-'}</td>
                                        <td className="p-4">
                                            <Badge dot
                                                variant={
                                                    req.status === 'approved' ? 'success' :
                                                        req.status === 'rejected' ? 'destructive' :
                                                            'warning'
                                                }
                                                className=""
                                            >
                                                {req.status}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-center">
                                            {req.status === 'pending' && (
                                                <div className="flex justify-center gap-2">
                                                    <Tippy content="Approve & Top Up">
                                                        <button
                                                            onClick={() => handleTopUpClick(req)}
                                                            className="flex items-center justify-center p-2 rounded-full text-white bg-green-500 hover:bg-green-600 transition-colors shadow-sm"
                                                        >
                                                            <IconCheck size={16} />
                                                        </button>
                                                    </Tippy>
                                                    <Tippy content="Reject">
                                                        <button
                                                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                                                            disabled={rejectingIds.includes(req.id)}
                                                            className={`flex items-center justify-center p-2 rounded-full text-white transition-colors shadow-sm ${rejectingIds.includes(req.id)
                                                                ? 'bg-gray-400 cursor-not-allowed'
                                                                : 'bg-red-500 hover:bg-red-600'
                                                                }`}
                                                        >
                                                            {rejectingIds.includes(req.id) ? (
                                                                <IconLoader className="animate-spin" size={16} />
                                                            ) : (
                                                                <IconX size={16} />
                                                            )}
                                                        </button>
                                                    </Tippy>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-4">
                        {/* Rows per page */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(value) => {
                                    setPageSize(Number(value));
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 50, 100].map((size) => (
                                        <SelectItem key={size} value={String(size)}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                        <span className="text-sm text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span> - <span className="font-medium text-foreground">{Math.min(page * pageSize, totalRows)}</span> of <span className="font-medium text-foreground">{totalRows}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        <div className="flex items-center justify-center text-sm font-medium h-8 min-w-[3rem] px-2 rounded-md border bg-background">
                            {page} / {totalPages}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(page + 1)}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setPage(totalPages)}
                            disabled={page === totalPages}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => {
                    if (!isProcessing) {
                        setIsConfirmModalOpen(false);
                        setSelectedRequest(null);
                    }
                }}
                onConfirm={confirmTopUp}
                title="Approve Top Up"
                message={
                    <div className="flex flex-col gap-4">
                        <p>
                            Are you sure you want to approve this request for <b>{selectedRequest?.user?.name}</b>?
                        </p>
                        <div>
                            <label className="block text-sm font-medium mb-1">Approved Amount</label>
                            <input
                                type="number"
                                className="form-input w-full"
                                value={approvedAmount}
                                onChange={(e) => setApprovedAmount(Number(e.target.value))}
                                disabled={isProcessing}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Requested: {selectedRequest?.amount} tokens
                            </p>
                        </div>
                    </div>
                }
                confirmText="Approve & Top Up"
                loading={isProcessing}
            />

            <DeleteModal
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
                onConfirm={handleDeleteConfirm}
                title={deleteType === 'batch' ? 'Delete Selected Requests' : 'Delete Request'}
                message={deleteType === 'batch'
                    ? `Are you sure you want to delete ${selectedRecords.length} selected requests? This action cannot be undone.`
                    : "Are you sure you want to delete this request? This action cannot be undone."}
                isLoading={deleteLoading}
                confirmButtonText="Delete"
            />
        </div>
    );
};

export default AdminTopUpRequests;
