import { Fragment, useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import PerfectScrollbar from 'react-perfect-scrollbar';

import {
    IconPlus,
    IconShieldLock,
    IconTrash,
    IconPencil,
    IconCircleCheck,
    IconInfoCircle,
    IconChevronDown,
    IconChevronUp,
    IconSearch,
    IconFilter,
    IconX,
    IconCheck,
    IconUserShield,
    IconRefresh,
    IconUsers
} from '@tabler/icons-react';

import api from '../../utils/api';
import { setPageTitle } from '../../store/themeConfigSlice';
import DeleteModal from '../../components/DeleteModal';

type Role = {
    id: number;
    name: string;
    permissions: { id: number; name: string; label?: string; module?: string }[];
    member_count?: number;
    created_at?: string;
};

type Permission = {
    name: string;
    label: string;
    module: string;
    description?: string;
};

const WorkspaceRoles = () => {
    const dispatch = useDispatch();

    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [roleName, setRoleName] = useState('');
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    const [permissionSearch, setPermissionSearch] = useState('');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        roleId: number | null;
        roleName: string;
    }>({
        isOpen: false,
        roleId: null,
        roleName: ''
    });

    useEffect(() => {
        dispatch(setPageTitle('Workspace Roles'));
        fetchData();
    }, [dispatch]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/roles');
            setRoles(Array.isArray(res.data.roles) ? res.data.roles : []);
            setAvailablePermissions(
                Array.isArray(res.data.available_permissions)
                    ? res.data.available_permissions
                    : []
            );
            // Initialize expanded modules
            const modules = new Set(res.data.available_permissions?.map((p: Permission) => p.module) || []);
            setExpandedModules(modules);
        } catch (e: any) {
            setRoles([]);
            setAvailablePermissions([]);
            toast.error(e.response?.data?.message || 'Failed to load roles');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (role: Role | null = null) => {
        if (role) {
            setEditId(role.id);
            setRoleName(role.name);
            setSelectedPerms(role.permissions.map((p) => p.name));
        } else {
            setEditId(null);
            setRoleName('');
            setSelectedPerms([]);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = { name: roleName, permissions: selectedPerms };

            if (editId) {
                await api.put(`/roles/${editId}`, payload);
                toast.success('Role updated successfully');
            } else {
                await api.post('/roles', payload);
                toast.success('Role created successfully');
            }

            setIsModalOpen(false);
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Action failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSyncRoles = async () => {
        setIsSyncing(true);
        try {
            const res = await api.post('/roles/sync-plan');
            toast.success(res.data.message || 'Roles synced with plan');
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Sync failed');
        } finally {
            setIsSyncing(false);
        }
    };

    const togglePermission = (perm: string) => {
        setSelectedPerms((prev) =>
            prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
        );
    };

    const toggleModule = (module: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(module)) {
            newExpanded.delete(module);
        } else {
            newExpanded.add(module);
        }
        setExpandedModules(newExpanded);
    };

    const toggleAllModules = () => {
        if (expandedModules.size === groupedPermissions.length) {
            setExpandedModules(new Set());
        } else {
            const allModules = new Set(groupedPermissions.map(g => g.module));
            setExpandedModules(allModules);
        }
    };

    // Group permissions by module
    const groupedPermissions = useMemo(() => {
        const groups: { module: string; permissions: Permission[] }[] = [];
        const modules = new Set(availablePermissions.map(p => p.module));
        
        modules.forEach(module => {
            const modulePerms = availablePermissions.filter(p => 
                p.module === module && 
                (!permissionSearch || 
                 p.label.toLowerCase().includes(permissionSearch.toLowerCase()))
            );
            
            if (modulePerms.length > 0) {
                groups.push({
                    module,
                    permissions: modulePerms
                });
            }
        });
        
        // Sort modules alphabetically
        return groups.sort((a, b) => a.module.localeCompare(b.module));
    }, [availablePermissions, permissionSearch]);

    // Filter roles based on search
    const filteredRoles = useMemo(() => {
        if (!searchTerm) return roles;
        
        return roles.filter(role =>
            role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            role.permissions.some(p => 
                p.label?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [roles, searchTerm]);

    const handleDeleteRole = async (roleId: number, roleName: string) => {
        setDeleteModal({
            isOpen: true,
            roleId,
            roleName
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.roleId) return;
        
        try {
            await api.delete(`/roles/${deleteModal.roleId}`);
            toast.success('Role deleted successfully');
            fetchData();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to delete role');
        } finally {
            setDeleteModal({ isOpen: false, roleId: null, roleName: '' });
        }
    };

    // Whole Page Skeleton Loading
    if (loading) {
        return (
            <div>
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            <div>
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-44 animate-pulse"></div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse"></div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                        </div>
                    </div>
                    
                    {/* Plan Info Skeleton */}
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-xl p-4 mb-6 animate-pulse">
                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
                                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-64"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Roles Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                            </div>
                            <div className="mb-3">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                                <div className="flex flex-wrap gap-1.5">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                                </div>
                            </div>
                        </div>
                    ))}
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
                            <IconUserShield size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workspace Roles</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage permissions and access control for your team</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                     <div className="relative">
                        <input
                            type="text"
                            placeholder="Search roles by name or permissions..."
                            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/40 outline-0 focus:border-primary transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <IconX size={16} />
                            </button>
                        )}
                    </div>
                        <button
                            onClick={handleSyncRoles}
                            disabled={isSyncing}
                            className="inline-flex items-center border border-blue-500 dark:border-blue-700/80 gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20  rounded-lg transition-all font-medium"
                        >
                            <IconRefresh size={18} className={isSyncing ? 'animate-spin' : ''} />
                            {isSyncing ? 'Syncing...' : 'Sync with Plan'}
                        </button>

                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all font-medium shadow-sm hover:shadow-md"
                        >
                            <IconPlus size={18} />
                            New Role
                        </button>
                    </div>
                </div>

                {/* Plan Info Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <IconInfoCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Plan Capabilities</h3>
                            <p className="text-blue-700 dark:text-blue-400 text-sm">
                                Your current plan includes <span className="font-bold">{availablePermissions.length}</span> assignable permissions across {groupedPermissions.length} modules.
                                Upgrade your plan to access more features.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= ROLES GRID ================= */}
            {filteredRoles.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <IconShieldLock size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No roles found</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        {searchTerm ? 'Try a different search term.' : 'Create your first role to manage team permissions.'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all font-medium"
                        >
                            <IconPlus size={18} />
                            Create New Role
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRoles.map((role) => (
                        <div
                            key={role.id}
                            className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5  transition-all duration-200 group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize mb-1">
                                        {role.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                                            {role.permissions.length} permissions
                                        </span>
                                        {role.member_count !== undefined && (
                                            <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                                <IconUsers size={12} className="inline mr-1" />
                                                {role.member_count}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleOpenModal(role)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Edit role"
                                    >
                                        <IconPencil size={18} className="text-gray-600 dark:text-gray-400" />
                                    </button>
                                    {role.name.toLowerCase() !== 'admin' && (
                                        <button 
                                            onClick={() => handleDeleteRole(role.id, role.name)}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete role"
                                        >
                                            <IconTrash size={18} className="text-red-500" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                    Key Permissions
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {role.permissions.slice(0, 4).map((p) => (
                                        <span
                                            key={p.id}
                                            className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md"
                                        >
                                            {p.label || p.name.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                    {role.permissions.length > 4 && (
                                        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-md">
                                            +{role.permissions.length - 4} more
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {role.created_at ? `Created ${new Date(role.created_at).toLocaleDateString()}` : 'Custom role'}
                                    </span>
                                    <button
                                        onClick={() => handleOpenModal(role)}
                                        className="text-primary hover:text-primary/80 font-medium"
                                    >
                                        View details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ================= CREATE/EDIT MODAL ================= */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/70 backdrop:blur-xl" />
                    </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 ">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full text-base max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform transition-all">
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                        <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                            {editId ? 'Edit Role' : 'Create New Role'}
                                        </Dialog.Title>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                            Assign permissions to define what users with this role can access
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit}>
                                        <div className="p-4">
                                            {/* Role Name Input */}
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Role Name
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2 text-gray-700 dark:text-gray-400 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary/20 outline-0 outline-primary transition-all"
                                                    placeholder="e.g., Content Manager, Analyst, Moderator"
                                                    value={roleName}
                                                    onChange={(e) => setRoleName(e.target.value)}
                                                    required
                                                />
                                            </div>

                                            {/* Permissions Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                <div>
                                                    <h3 className="font-medium text-gray-700 dark:text-gray-300">Permissions</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {selectedPerms.length} of {availablePermissions.length} permissions selected
                                                    </p>
                                                </div>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={toggleAllModules}
                                                    className="flex items-center gap-2 text-sm text-primary  border border-primary px-3 py-2 rounded-lg hover:text-primary/80 font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                                                >
                                                    {expandedModules.size === groupedPermissions.length ? (
                                                        <>
                                                            <IconChevronUp size={16} />
                                                            Collapse All
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconChevronDown size={16} />
                                                            Expand All
                                                        </>
                                                    )}
                                                </button>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Search permissions..."
                                                        className="pl-9 pr-3 py-2 text-sm rounded-lg border text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-0 outline-primary transition-all"
                                                        value={permissionSearch}
                                                        onChange={(e) => setPermissionSearch(e.target.value)}
                                                    />
                                                    <IconSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                                </div>
                                            </div>
                                            </div>

                                            {/* Permissions Grid - Grouped by Module */}
                                           
                                                <PerfectScrollbar className='relative max-h-[450px]'>
                                                    <div className="p-3 space-y-4">
                                                        {groupedPermissions.length === 0 ? (
                                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                                No permissions found matching your search
                                                            </div>
                                                        ) : (
                                                            groupedPermissions.map((group) => (
                                                                <div key={group.module} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                                                    {/* Module Header */}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleModule(group.module)}
                                                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                                <IconShieldLock size={16} className="text-primary" />
                                                                            </div>
                                                                            <div className="text-left">
                                                                                <h4 className="font-semibold text-gray-900 dark:text-white">{group.module}</h4>
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                    {group.permissions.length} permission{group.permissions.length !== 1 ? 's' : ''}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        {expandedModules.has(group.module) ? (
                                                                            <IconChevronUp size={20} className="text-gray-400" />
                                                                        ) : (
                                                                            <IconChevronDown size={20} className="text-gray-400" />
                                                                        )}
                                                                    </button>

                                                                    {/* Module Permissions - Collapsible */}
                                                                    {expandedModules.has(group.module) && (
                                                                        <div className="p-3 bg-white dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                            {group.permissions.map((perm) => {
                                                                                const isSelected = selectedPerms.includes(perm.name);
                                                                                return (
                                                                                    <label
                                                                                        key={perm.name}
                                                                                        className={`flex items-start gap-3 p-3 mb-0 rounded-lg border cursor-pointer transition-all ${isSelected 
                                                                                            ? 'border-primary bg-primary/5' 
                                                                                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-center h-5">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                className="w-4 h-4 form-checkbox peer text-primary border-gray-300 rounded focus:ring-primary/20"
                                                                                                checked={isSelected}
                                                                                                onChange={() => togglePermission(perm.name)}
                                                                                            />
                                                                                            <span className="peer-checked:text-primary text-gray-600 dark:text-gray-400 ml-1"> {perm.label}</span>
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                            <div className="flex items-start justify-between">
                                                                                                <div>
                                                                                                    {perm.description && (
                                                                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                                                                            {perm.description}  {perm.label}
                                                                                                        </p>
                                                                                                    )}
                                                                                                </div>
                                                                                                {isSelected && (
                                                                                                    <IconCheck size={16} className="text-primary shrink-0 mt-1" />
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </label>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </PerfectScrollbar>
                                            
                                        </div>

                                        {/* Modal Footer */}
                                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">{selectedPerms.length}</span> permissions selected
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    className="px-4 border border-gray-200 dark:border-gray-600 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                    onClick={() => setIsModalOpen(false)}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || selectedPerms.length === 0}
                                                    className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                                >
                                                    {isSubmitting ? (
                                                        <span className="flex items-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                            Saving...
                                                        </span>
                                                    ) : editId ? 'Update Role' : 'Create Role'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Delete Modal */}
            <DeleteModal
                isOpen={deleteModal.isOpen}
                setIsOpen={(value) => setDeleteModal(prev => ({ ...prev, isOpen: value }))}
                onConfirm={confirmDelete}
                title="Delete Role"
                message={`Are you sure you want to delete the role "${deleteModal.roleName}"? This action cannot be undone.`}
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
            />
        </div>
    );
};

export default WorkspaceRoles;