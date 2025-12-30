import { useEffect, useState, useMemo, Fragment } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { Dialog, Listbox, Transition } from '@headlessui/react';
import { 
    useReactTable, 
    getCoreRowModel, 
    flexRender, 
    createColumnHelper,
    SortingState,
    PaginationState
} from '@tanstack/react-table';
import { toast, Toaster } from 'react-hot-toast';
import api from '../../utils/api';
import { 
    IconSearch, IconTrash, IconShield, IconCoin, 
    IconSettings, IconLoader, IconLock, IconPencil,
    IconChevronLeft, IconChevronRight, IconChevronDown,
    IconCheck, IconX, IconUsers, IconBuilding,
    IconChartBar, IconInfoCircle, IconCrown, IconUser,
    IconKey, IconAlertCircle, IconPlus, IconRefresh,
    IconFilter, IconChevronUp, IconChecks
} from '@tabler/icons-react';
import DeleteModal from '../../components/DeleteModal';
import PerfectScrollbar from 'react-perfect-scrollbar';

const UserManagement = () => {
    const dispatch = useDispatch();
    
    // --- DATA STATE ---
    const [data, setData] = useState<any[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [availableRoles, setAvailableRoles] = useState<string[]>([]); 

    // --- PERMISSION MODAL STATES ---
    const [isPermModalOpen, setIsPermModalOpen] = useState(false);
    const [allPermissions, setAllPermissions] = useState<string[]>([]);
    const [userPermissions, setUserPermissions] = useState<string[]>([]);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
    const [initialPermissions, setInitialPermissions] = useState<string[]>([]);
    const [initialMemberLimit, setInitialMemberLimit] = useState(0);
    const [memberLimit, setMemberLimit] = useState<number>(0);

    // --- UI STATE ---
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- TABLE STATE ---
    const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
    const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
    const [search, setSearch] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

    // --- MODAL STATES ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '', password: '', roles: [] as string[] });
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
    const [tokenAmount, setTokenAmount] = useState<string>('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);

    useEffect(() => {
        dispatch(setPageTitle('User Management'));
        fetchRoles();
    }, [dispatch]);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setAvailableRoles(res.data.map((r: any) => r.name));
        } catch (e) { 
            console.error("Failed to fetch roles"); 
        }
    };

    // --- API FETCHING ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/admin/users', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: pagination.pageIndex + 1,
                    per_page: pagination.pageSize,
                    search: search,
                    role: selectedRoleFilter !== 'all' ? selectedRoleFilter : '',
                    sort_by: sorting[0]?.id || 'created_at',
                    sort_dir: sorting[0]?.desc ? 'desc' : 'asc',
                }
            });

            setData(response.data?.data || []);
            setRowCount(response.data?.total || 0);
        } catch (error: any) {
            setData([]);
            toast.error(error.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.pageIndex, pagination.pageSize, sorting, search, selectedRoleFilter]);

    // --- SMART ACTIONS ---
    
    const openEditModal = (user: any) => {
        setSelectedUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            password: '',
            roles: user.roles.map((r: any) => r.name)
        });
        setIsEditModalOpen(true);
    };

    const submitEditUser = async () => {
        setIsSubmitting(true);
        try {
            await api.put(`/admin/users/${selectedUser.id}`, {
                name: editForm.name,
                email: editForm.email,
                password: editForm.password || undefined,
                roles: editForm.roles
            });

            toast.success('User updated successfully');
            setIsEditModalOpen(false);
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Update failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openTokenModal = (user: any) => {
        setSelectedUser(user);
        setTokenAmount('');
        setIsTokenModalOpen(true);
    };

    const submitTokenUpdate = async () => {
        if (!selectedUser || !tokenAmount) return;
        setIsSubmitting(true);

        const token = localStorage.getItem('token');
        const apiCall = api.post(`admin/users/${selectedUser.id}/tokens`, 
            { amount: parseInt(tokenAmount), description: 'Admin Adjustment' }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );

        await toast.promise(apiCall, {
            loading: 'Updating wallet balance...',
            success: 'Tokens updated successfully!',
            error: 'Failed to update tokens.',
        });

        setIsSubmitting(false);
        setIsTokenModalOpen(false);
        fetchData();
    };

    const confirmDelete = (userId: number) => {
        setUserToDelete(userId);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!userToDelete) return;
        setIsSubmitting(true);

        const apiCall = api.delete(`/admin/users/${userToDelete}`);

        await toast.promise(apiCall, {
            loading: 'Deleting user...',
            success: 'User deleted permanently.',
            error: 'Failed to delete user.',
        });

        setIsSubmitting(false);
        setIsDeleteModalOpen(false);
        fetchData();
    };

// const openPermissionModal = async (user: any) => {
//     setSelectedUser(user);
//     setIsPermModalOpen(true);
//     setIsLoadingPermissions(true);
//     try {
//         const token = localStorage.getItem('token');
//         const res = await api.get(`admin/users/${user.id}/details`, {
//             headers: { Authorization: `Bearer ${token}` }
//         });

//         // Use the exact keys from your Laravel response
//         const userPerms = res.data.user_permissions || [];
//         const mLimit = res.data.user_settings?.member_limit || 0;

//         setAllPermissions(res.data.all_permissions || []);
//         setUserPermissions(userPerms);
//         setMemberLimit(mLimit);

//         // Fix: Make sure these match the data variables above
//         setInitialPermissions(userPerms); 
//         setInitialMemberLimit(mLimit);

//     } catch (e) {
//         toast.error("Failed to load permissions");
//     } finally {
//         setIsLoadingPermissions(false);
//     }
// };

    const submitPermissions = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await api.put(`admin/users/${selectedUser.id}/permissions`, {
                permissions: userPermissions,
                member_limit: memberLimit
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            toast.success("Permission updated!");
            setIsPermModalOpen(false);
            fetchData();
        } catch (e) {
            toast.error("Failed to update permission");
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasPermissionChanges = useMemo(() => {
        const permissionsChanged = JSON.stringify(userPermissions.sort()) !== JSON.stringify(initialPermissions.sort());
        const memberLimitChanged = memberLimit !== initialMemberLimit;
        return permissionsChanged || memberLimitChanged;
    }, [userPermissions, initialPermissions, memberLimit, initialMemberLimit]);

    const togglePermission = (perm: string) => {
        if (userPermissions.includes(perm)) {
            setUserPermissions(prev => prev.filter(p => p !== perm));
        } else {
            setUserPermissions(prev => [...prev, perm]);
        }
    };

    // --- TABLE COLUMNS ---
    const columnHelper = createColumnHelper<any>();

    const columns = [
        columnHelper.accessor('name', {
            header: 'User Profile',
            cell: (info) => (
                <div className="flex items-center gap-3">
                    <img 
                        src={info.row.original.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(info.getValue())}&background=primary&color=fff&bold=true&size=128`} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                        alt={info.getValue()}
                    />
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            {info.getValue()}
                            {info.row.original.roles?.some((r: any) => r.name === 'admin') && (
                                <IconCrown size={14} className="text-amber-500" />
                            )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {info.row.original.email}
                        </div>
                    </div>
                </div>
            ),
        }),
        columnHelper.accessor('roles', {
            header: 'Role',
            enableSorting: false,
            cell: (info) => {
                const isAdmin = info.getValue()?.some((r: any) => r.name === 'admin');
                const isOwner = info.row.original.is_owner;
                return (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        isOwner ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30' :
                        isAdmin ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' :
                        'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                    }`}>
                        {isOwner && <IconCrown size={12} />}
                        {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'User'}
                    </span>
                );
            },
        }),
        columnHelper.accessor('token_balance', {
            header: 'Tokens',
            cell: (info) => (
                <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                    <IconCoin size={18} className="text-primary" />
                    {info.getValue().toLocaleString()}
                </div>
            ),
        }),
        columnHelper.accessor('created_at', {
            header: 'Joined',
            cell: (info) => (
                <div className="text-gray-600 dark:text-gray-400">
                    {new Date(info.getValue()).toLocaleDateString()}
                </div>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            header: 'Actions',
            cell: (info) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => openTokenModal(info.row.original)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors"
                        title="Manage Tokens"
                    >
                        <IconCoin size={16} />
                        Tokens
                    </button>

                    <button 
                        onClick={() => openEditModal(info.row.original)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Edit User"
                    >
                        <IconPencil size={16} />
                        Edit
                    </button>

                    {/* <button 
                        onClick={() => openPermissionModal(info.row.original)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Manage Permissions"
                    >
                        <IconKey size={16} />
                        Access
                    </button> */}

                    <button 
                        onClick={() => confirmDelete(info.row.original.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete User"
                    >
                        <IconTrash size={16} />
                        Remove
                    </button>
                </div>
            ),
        }),
    ];

    const table = useReactTable({
        data,
        columns,
        state: { pagination, sorting },
        pageCount: Math.ceil(rowCount / pagination.pageSize),
        manualPagination: true,
        manualSorting: true,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
    });

    // Filter available roles for dropdown
    const availableRoleFilters = useMemo(() => {
        const roles = new Set<string>(['all']);
        data.forEach(user => {
            user.roles?.forEach((role: any) => roles.add(role.name));
        });
        return Array.from(roles);
    }, [data]);

    return (
        <div>
            {/* ================= HEADER ================= */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <IconUsers size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage system users, permissions, and tokens</p>
                        </div>
                    </div>
                    
                    {/* Stats Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-500/10 dark:to-blue-500/5 text-blue-700 dark:text-blue-400 rounded-full font-medium border border-blue-200 dark:border-blue-500/20">
                        <IconUsers size={16} />
                        <span className="font-bold">{rowCount}</span> Total Users
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/20 dark:border-primary/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <IconInfoCircle className="text-primary shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-primary dark:text-primary-light mb-1">System Administration</h3>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                                Manage all user accounts, assign permissions, adjust token balances, and monitor system usage.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= FILTER BAR ================= */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        {/* Search */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchData}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                    >
                        <IconRefresh size={18} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ================= TABLE ================= */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                {table.getHeaderGroups().map(headerGroup => (
                                    <Fragment key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th 
                                                key={header.id} 
                                                className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                    {{
                                                        asc: <IconChevronUp size={14} className="text-primary" />,
                                                        desc: <IconChevronDown size={14} className="text-primary" />
                                                    }[header.column.getIsSorted() as string] ?? null}
                                                </div>
                                            </th>
                                        ))}
                                    </Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                // Skeleton Rows
                                [...Array(5)].map((_, index) => (
                                    <tr key={index} className="animate-pulse">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                                                <div className="space-y-2">
                                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (data || []).length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="py-16 px-6 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                                                <IconUsers size={24} className="text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                {search ? 'No Users Found' : 'No Users Yet'}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                                {search 
                                                    ? `No users match "${search}". Try a different search term.`
                                                    : 'Start by adding users to manage permissions and tokens.'
                                                }
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="py-4 px-6">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ================= PAGINATION ================= */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Page Size Selector */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
                            <div className="relative w-20">
                                <Listbox value={table.getState().pagination.pageSize} onChange={(value) => table.setPageSize(Number(value))}>
                                    <div className="relative">
                                        <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1.5 pl-3 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                                            <span className="block truncate font-medium text-gray-700 dark:text-gray-300">
                                                {table.getState().pagination.pageSize}
                                            </span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <IconChevronUp className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </span>
                                        </Listbox.Button>
                                        <Transition
                                            as={Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <Listbox.Options className="absolute bottom-full z-50 mb-2 w-full rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none">
                                                {[5, 10, 20, 50, 100].map((pageSize) => (
                                                    <Listbox.Option
                                                        key={pageSize}
                                                        className={({ active }) =>
                                                            `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                                                active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'
                                                            }`
                                                        }
                                                        value={pageSize}
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                                    {pageSize}
                                                                </span>
                                                                {selected && (
                                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                                                                        <IconCheck className="h-5 w-5" />
                                                                    </span>
                                                                )}
                                                            </>
                                                        )}
                                                    </Listbox.Option>
                                                ))}
                                            </Listbox.Options>
                                        </Transition>
                                    </div>
                                </Listbox>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
                        </div>

                        {/* Page Info */}
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing <span className="font-semibold text-gray-900 dark:text-white">
                                {Math.min(table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1, rowCount)}
                            </span> to <span className="font-semibold text-gray-900 dark:text-white">
                                {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, rowCount)}
                            </span> of <span className="font-semibold text-gray-900 dark:text-white">{rowCount}</span> users
                        </div>

                        {/* Page Navigation */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <IconChevronLeft size={16} />
                            </button>
                            <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                            </span>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <IconChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= MODALS ================= */}

            {/* Edit User Modal */}
            <Transition appear show={isEditModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsEditModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <IconPencil size={24} className="text-primary" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                                    Edit User
                                                </Dialog.Title>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    Update user information
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Name
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 rounded-lg border text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    className="w-full px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    value={editForm.email}
                                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Reset Password (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Leave empty to keep current"
                                                    className="w-full px-4 text-gray-700 dark:text-gray-200 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    value={editForm.password}
                                                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                                                />
                                            </div>

                                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                                                <button
                                                    onClick={() => setIsEditModalOpen(false)}
                                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={submitEditUser}
                                                    disabled={isSubmitting}
                                                    className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                                >
                                                    {isSubmitting ? (
                                                        <span className="flex items-center gap-2">
                                                            <IconRefresh size={16} className="animate-spin" />
                                                            Saving...
                                                        </span>
                                                    ) : 'Save Changes'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Token Modal */}
            <Transition appear show={isTokenModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !isSubmitting && setIsTokenModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                                <IconCoin size={24} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                                    Manage Tokens
                                                </Dialog.Title>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    For: <span className="font-medium">{selectedUser?.name}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 rounded-lg border border-blue-200 dark:border-blue-500/20">
                                                <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">Current Balance</p>
                                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                    {selectedUser?.token_balance?.toLocaleString()} 🪙
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Adjustment Amount
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        className="w-full px-4 py-3 rounded-lg border text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                        placeholder="e.g., 100 or -50"
                                                        value={tokenAmount}
                                                        onChange={(e) => setTokenAmount(e.target.value)}
                                                        disabled={isSubmitting}
                                                    />
                                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                                                        tokens
                                                    </span>
                                                </div>
                                                {tokenAmount && !isNaN(Number(tokenAmount)) && Number(tokenAmount) !== 0 && (
                                                    <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                                                        <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                                            New balance: <span className="font-bold">
                                                                {(selectedUser?.token_balance || 0) + Number(tokenAmount)} 🪙
                                                            </span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => setIsTokenModalOpen(false)}
                                                disabled={isSubmitting}
                                                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={submitTokenUpdate}
                                                disabled={isSubmitting || !tokenAmount || isNaN(Number(tokenAmount)) || Number(tokenAmount) === 0}
                                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <IconRefresh size={16} className="animate-spin" />
                                                        Updating...
                                                    </span>
                                                ) : 'Update Balance'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Permissions Modal */}
            {/* <Transition appear show={isPermModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !isSubmitting && setIsPermModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                                    <div className="p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <IconShield size={24} className="text-primary" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                                    Manage Access Permissions
                                                </Dialog.Title>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    Configure system access for <span className="font-medium">{selectedUser?.name}</span>
                                                </p>
                                            </div>
                                        </div>

                                        
                                        
                                            <PerfectScrollbar 
                                                    options={{ suppressScrollX: true, wheelPropagation: false }} 
                                                    className='h-[450px]' >
                                                <div className="pr-2 space-y-4">
                                                    
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                                                            Feature Permissions
                                                        </h4>
                                                        {isLoadingPermissions ? (
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                                {[...Array(6)].map((_, index) => (
                                                                    <div key={index} className="flex items-center gap-2 p-2 animate-pulse">
                                                                        <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                                                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {allPermissions.map(perm => (
                                                                    <label
                                                                        key={perm}
                                                                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${userPermissions.includes(perm)
                                                                            ? 'border-primary bg-primary/5'
                                                                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center h-5">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20"
                                                                                checked={userPermissions.includes(perm)}
                                                                                onChange={() => togglePermission(perm)}
                                                                                disabled={isSubmitting}
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <div className="flex items-start justify-between">
                                                                                <div>
                                                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                                                        {perm.replace(/_/g, ' ')}
                                                                                    </span>
                                                                                </div>
                                                                                {userPermissions.includes(perm) && (
                                                                                    <IconCheck size={16} className="text-primary shrink-0 mt-1" />
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    
                                                    <div>
                                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">
                                                            System Limits
                                                        </h4>
                                                        {isLoadingPermissions ? (
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="animate-pulse">
                                                                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-2"></div>
                                                                    <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                        Member Limit
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                                        value={memberLimit}
                                                                        onChange={(e) => setMemberLimit(parseInt(e.target.value) || 0)}
                                                                        disabled={isSubmitting}
                                                                        min="0"
                                                                    />
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                                        Maximum users this account can create
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </PerfectScrollbar>
                                        

                                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => setIsPermModalOpen(false)}
                                                disabled={isSubmitting}
                                                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={submitPermissions}
                                                disabled={isSubmitting || isLoadingPermissions || !hasPermissionChanges}
                                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <IconRefresh size={16} className="animate-spin" />
                                                        Saving...
                                                    </span>
                                                ) : 'Save Permissions'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition> */}

            {/* Delete Modal */}
            <DeleteModal
                isOpen={isDeleteModalOpen}
                setIsOpen={setIsDeleteModalOpen}
                title="Delete User Account?"
                message={`Are you sure you want to permanently delete ${selectedUser?.name}'s account? This will erase all their data, tokens, and cannot be undone.`}
                onConfirm={executeDelete}
                confirmButtonText="Delete Permanently"
                cancelButtonText="Cancel"
                isLoading={isSubmitting}
            />
        </div>
    );
};

export default UserManagement;