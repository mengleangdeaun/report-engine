import { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
    IconPencil, IconLock, IconCheck, IconX, 
    IconSearch, IconFilter, IconShield, IconInfoCircle,
    IconRefresh, IconPlus, IconTrash, IconAlertCircle,
    IconChevronDown, IconSettings, IconBuilding,
    IconChartBar, IconTicket, IconUsers, IconKey,
    IconEye, IconEyeOff, IconCategory
} from '@tabler/icons-react';

const PermissionManagement = () => {
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState({ label: '', module: '' });
    
    // Search and Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [moduleFilter, setModuleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Add Permission Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newPermission, setNewPermission] = useState({
        name: '',
        label: '',
        module: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { 
        fetchPermissions(); 
    }, []);

    const fetchPermissions = async () => {
        try {
            const res = await api.get('/admin/permissions');
            setPermissions(res.data);
        } catch (e: any) { 
            toast.error(e.response?.data?.message || "Failed to load permissions"); 
        } finally { 
            setLoading(false); 
        }
    };

    const startEdit = (p: any) => {
        setEditingId(p.id);
        setEditForm({ label: p.label || '', module: p.module || '' });
    };

    const handleUpdate = async (id: number) => {
        try {
            await api.put(`/admin/permissions/${id}`, editForm);
            toast.success("Permission updated successfully");
            setEditingId(null);
            fetchPermissions();
        } catch (e: any) { 
            toast.error(e.response?.data?.message || "Update failed"); 
        }
    };

    const handleToggleActive = async (id: number) => {
        try {
            await api.post(`/admin/permissions/${id}/toggle`);
            toast.success("Feature status updated");
            fetchPermissions();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to toggle status");
        }
    };

    const handleAddPermission = async () => {
        if (!newPermission.name || !newPermission.label) {
            toast.error("Name and Label are required");
            return;
        }
        
        setIsSubmitting(true);
        try {
            await api.post('/admin/permissions', newPermission);
            toast.success("Permission created successfully");
            setIsAddModalOpen(false);
            setNewPermission({ name: '', label: '', module: '' });
            fetchPermissions();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Failed to create permission");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Get unique modules for filter
    const uniqueModules = ['all', ...new Set(permissions.map(p => p.module).filter(Boolean))];

    // Filter permissions
    const filteredPermissions = permissions.filter(p => {
        const matchesSearch = !searchTerm || 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.module.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesModule = moduleFilter === 'all' || p.module === moduleFilter;
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'active' && p.is_active) ||
            (statusFilter === 'inactive' && !p.is_active);
        
        return matchesSearch && matchesModule && matchesStatus;
    });

    // Loading skeleton
    if (loading) {
        return (
            <div>
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                        <div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
                        </div>
                    </div>
                    
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-xl p-4 mb-6 animate-pulse">
                        <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                    </div>
                </div>

                {/* Filter Bar Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6 animate-pulse">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-full sm:w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-full sm:w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="w-full sm:w-32 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    {['System Name', 'Display Label', 'Module', 'Status', 'Actions'].map((header, index) => (
                                        <th key={index} className="py-4 px-6">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(5)].map((_, index) => (
                                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                        {[...Array(5)].map((_, cellIndex) => (
                                            <td key={cellIndex} className="py-4 px-6">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* ================= HEADER ================= */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <IconShield size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Permission Registry</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                                Manage system-wide permissions and feature flags
                            </p>
                        </div>
                    </div>
                    
                    {/* Stats Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 text-primary dark:text-primary-light rounded-full font-medium border border-primary/20 dark:border-primary/30">
                        <IconShield size={16} />
                        <span className="font-bold">{permissions.length}</span> Permissions
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border border-primary/20 dark:border-primary/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <IconInfoCircle className="text-primary shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-primary dark:text-primary-light mb-1">Permission Management</h3>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">
                                Define feature-level permissions that can be assigned to roles. Labels and modules determine how they appear to users.
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
                                placeholder="Search permissions..."
                                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>

                        {/* Module Filter */}
                        <div className="w-full sm:w-48">
                            <Listbox value={moduleFilter} onChange={setModuleFilter}>
                                <div className="relative">
                                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2.5 pl-4 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                                        <span className="flex items-center gap-2 truncate">
                                            <IconCategory size={16} className="text-gray-400" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {moduleFilter === 'all' ? 'All Modules' : moduleFilter || 'Uncategorized'}
                                            </span>
                                        </span>
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <IconChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </span>
                                    </Listbox.Button>

                                    <Listbox.Options className="absolute z-50 mt-1 w-full rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none max-h-60 overflow-auto">
                                        {uniqueModules.map((module) => (
                                            <Listbox.Option key={module} value={module}>
                                                {({ active }) => (
                                                    <div className={`px-4 py-2 text-sm cursor-pointer ${active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        {module === 'all' ? 'All Modules' : module || 'Uncategorized'}
                                                    </div>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </div>
                            </Listbox>
                        </div>

                        {/* Status Filter */}
                        <div className="w-full sm:w-48">
                            <Listbox value={statusFilter} onChange={setStatusFilter}>
                                <div className="relative">
                                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2.5 pl-4 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                                        <span className="flex items-center gap-2 truncate">
                                            <IconFilter size={16} className="text-gray-400" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {statusFilter === 'all' ? 'All Status' : statusFilter === 'active' ? 'Active Only' : 'Inactive Only'}
                                            </span>
                                        </span>
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                                            <IconChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </span>
                                    </Listbox.Button>

                                    <Listbox.Options className="absolute z-50 mt-1 w-full rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none max-h-60 overflow-auto">
                                        {['all', 'active', 'inactive'].map((status) => (
                                            <Listbox.Option key={status} value={status}>
                                                {({ active }) => (
                                                    <div className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 ${active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-emerald-500' : status === 'inactive' ? 'bg-gray-400' : 'bg-blue-500'}`}></div>
                                                        {status === 'all' ? 'All Status' : status === 'active' ? 'Active Only' : 'Inactive Only'}
                                                    </div>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </div>
                            </Listbox>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchPermissions}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                        >
                            <IconRefresh size={18} />
                            Refresh
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                        >
                            <IconPlus size={18} />
                            Add Permission
                        </button>
                    </div>
                </div>
            </div>

            {/* ================= TABLE ================= */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    System Name
                                </th>
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Display Label
                                </th>
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Module/Group
                                </th>
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredPermissions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 px-6 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                                                <IconShield size={24} className="text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                {searchTerm ? 'No Permissions Found' : 'No Permissions Yet'}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                                                {searchTerm 
                                                    ? `No permissions match "${searchTerm}". Try a different search term.`
                                                    : 'Start by adding your first system permission.'
                                                }
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPermissions.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <IconKey size={16} className="text-primary" />
                                                </div>
                                                <code className="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                    {p.name}
                                                </code>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Created {new Date(p.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        
                                        <td className="py-4 px-6">
                                            {editingId === p.id ? (
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    value={editForm.label}
                                                    onChange={e => setEditForm({...editForm, label: e.target.value})}
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className={`font-medium ${p.label ? 'text-gray-900 dark:text-white' : 'text-amber-600 dark:text-amber-400 italic'}`}>
                                                    {p.label || 'Missing Label'}
                                                </div>
                                            )}
                                        </td>
                                        
                                        <td className="py-4 px-6">
                                            {editingId === p.id ? (
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    value={editForm.module}
                                                    onChange={e => setEditForm({...editForm, module: e.target.value})}
                                                />
                                            ) : (
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                                    p.module 
                                                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                                                }`}>
                                                    {p.module || 'Uncategorized'}
                                                </span>
                                            )}
                                        </td>
                                        
                                        <td className="py-4 px-6">
                                            <button
                                                onClick={() => handleToggleActive(p.id)}
                                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 ${
                                                    p.is_active 
                                                        ? 'bg-emerald-500 dark:bg-emerald-600' 
                                                        : 'bg-gray-300 dark:bg-gray-600'
                                                }`}
                                            >
                                                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                                                    p.is_active ? 'translate-x-6' : 'translate-x-1'
                                                }`} />
                                                <span className="absolute inset-0 flex items-center justify-between px-1.5">
                                                    {p.is_active ? (
                                                        <IconCheck size={12} className="text-white" />
                                                    ) : (
                                                        <IconX size={12} className="text-gray-400" />
                                                    )}
                                                </span>
                                            </button>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {p.is_active ? 'Active' : 'Inactive'}
                                            </div>
                                        </td>
                                        
                                        <td className="py-4 px-6">
                                            {editingId === p.id ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleUpdate(p.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                    >
                                                        <IconCheck size={16} />
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <IconX size={16} />
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startEdit(p)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors"
                                                >
                                                    <IconPencil size={16} />
                                                    Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================= ADD PERMISSION MODAL ================= */}
            <Transition appear show={isAddModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !isSubmitting && setIsAddModalOpen(false)}>
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
                                                <IconPlus size={24} className="text-primary" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                                    Add New Permission
                                                </Dialog.Title>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    Create a new system permission
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    System Name (Slug)
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder="e.g., create_project"
                                                    value={newPermission.name}
                                                    onChange={e => setNewPermission({...newPermission, name: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                                                    disabled={isSubmitting}
                                                />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Use lowercase with underscores. This is the system identifier.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Display Label
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder="e.g., Create Project"
                                                    value={newPermission.label}
                                                    onChange={e => setNewPermission({...newPermission, label: e.target.value})}
                                                    disabled={isSubmitting}
                                                />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    User-friendly name shown in interfaces.
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Module/Group
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 rounded-lg text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder="e.g., Projects"
                                                    value={newPermission.module}
                                                    onChange={e => setNewPermission({...newPermission, module: e.target.value})}
                                                    disabled={isSubmitting}
                                                />
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Optional. Used to group related permissions.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                                            <button
                                                onClick={() => setIsAddModalOpen(false)}
                                                disabled={isSubmitting}
                                                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleAddPermission}
                                                disabled={isSubmitting || !newPermission.name || !newPermission.label}
                                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <IconRefresh size={16} className="animate-spin" />
                                                        Creating...
                                                    </span>
                                                ) : 'Create Permission'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default PermissionManagement;