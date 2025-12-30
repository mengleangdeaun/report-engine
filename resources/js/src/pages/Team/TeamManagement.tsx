import { useEffect, useState, Fragment } from 'react';
import { Tab, Dialog, Transition, Listbox } from '@headlessui/react';
import { 
    IconUserPlus, IconTrash, IconMail, IconLock, 
    IconSettings, IconUsers, IconChevronDown, IconCheck,
    IconBuilding, IconChartBar, IconShield, IconTicket,
    IconInfoCircle, IconX, IconSearch, IconFilter,
    IconRefresh, IconCrown, IconUser, IconKey,
    IconAlertCircle
} from '@tabler/icons-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import usePermission from '../../hooks/usePermission';
import DeleteModal from '../../components/DeleteModal';
import PerfectScrollbar from 'react-perfect-scrollbar';

const TeamManagement = () => {
    const { can } = usePermission();
    const [teamData, setTeamData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [roleTemplates, setRoleTemplates] = useState<any[]>([]);
    
    // Rename State
    const [teamName, setTeamName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);

    // Limit Modal State
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const [newLimit, setNewLimit] = useState<string>('');
    const [limitMember, setLimitMember] = useState<any>(null);

    // Invite Modal State
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [sendingInvite, setSendingInvite] = useState(false);

    // Permissions Modal State
    const [permModalOpen, setPermModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>('Custom');
    const [permMember, setPermMember] = useState<any>(null);
    const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
    const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);
    const [savingPerms, setSavingPerms] = useState(false);
    const [permissionSearch, setPermissionSearch] = useState('');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteData, setDeleteData] = useState<{ type: 'member' | 'invite', id: number, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Search and Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');

    // Fetch Data
    const fetchTeamAndTemplates = async () => {
        try {
            const [teamRes, rolesRes] = await Promise.all([
                api.get('/team/my-team'),
                api.get('/team/role-templates')
            ]);
            
            setTeamData(teamRes.data);
            setTeamName(teamRes.data.team_name);

            if (teamRes.data.available_permissions) {
                setAvailablePermissions(teamRes.data.available_permissions);
                // Initialize expanded modules
                const modules = new Set(teamRes.data.available_permissions?.map((p: any) => p.module) || []);
                setExpandedModules(modules);
            } else {
                setAvailablePermissions([]);
            }

            const roles = Array.isArray(rolesRes.data) ? rolesRes.data : [];
            setRoleTemplates(roles);
            
        } catch (error) {
            toast.error("Failed to load team data");
            setAvailablePermissions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeamAndTemplates();
    }, []);

    // Group permissions by module
    const groupedPermissions = () => {
        const groups: { module: string; permissions: any[] }[] = [];
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
        
        return groups.sort((a, b) => a.module.localeCompare(b.module));
    };

    // Toggle module expansion
    const toggleModule = (module: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(module)) {
            newExpanded.delete(module);
        } else {
            newExpanded.add(module);
        }
        setExpandedModules(newExpanded);
    };

    // Toggle all modules
    const toggleAllModules = () => {
        if (expandedModules.size === groupedPermissions().length) {
            setExpandedModules(new Set());
        } else {
            const allModules = new Set(groupedPermissions().map(g => g.module));
            setExpandedModules(allModules);
        }
    };

    // Handle Rename
    const handleRename = async () => {
        setIsRenaming(true);
        try {
            await api.put('/team/name', { name: teamName });
            toast.success('Workspace renamed successfully');
            fetchTeamAndTemplates();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to rename');
        } finally {
            setIsRenaming(false);
        }
    };

    // Handle Invite
    const handleInvite = async () => {
        if (!inviteEmail) return;
        setSendingInvite(true);
        try {
            await api.post('/team/invitations', { email: inviteEmail, role: 'member' });
            toast.success('Invitation sent successfully');
            setInviteModalOpen(false);
            setInviteEmail('');
            fetchTeamAndTemplates();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to send invite');
        } finally {
            setSendingInvite(false);
        }
    };

    // Handle Role Change
    const handleRoleChange = async (memberId: number, newRole: string) => {
        try {
            await api.put(`/team/member/${memberId}/role`, { role: newRole });
            toast.success('Role updated');
            fetchTeamAndTemplates();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to update role');
        }
    };

    // Handle Limits
    const openLimitModal = (member: any) => {
        setLimitMember(member);
        setNewLimit(member.token_limit === null ? '-1' : member.token_limit.toString());
        setLimitModalOpen(true);
    };

    const saveLimit = async () => {
        if (!limitMember) return;
        try {
            await api.put(`team/member/${limitMember.id}/limit`, {
                limit: parseInt(newLimit)
            });
            toast.success('Limit updated');
            setLimitModalOpen(false);
            fetchTeamAndTemplates();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to update limit');
        }
    };

    // Handle Permissions
    const openPermModal = (member: any) => {
        setPermMember(member);
        const currentPerms = member.permission_names || [];
        setSelectedPerms(currentPerms);
        setSelectedRole(member.display_role);
        setPermModalOpen(true);
    };

    const handleRoleSelect = (roleName: string) => {
        setSelectedRole(roleName);
        if (roleName === 'Custom') return;

        const template = roleTemplates.find(r => r.name === roleName);
        
        if (template) {
            const rolePermNames = template.permissions.map((p: any) => 
                typeof p === 'string' ? p : p.name
            );
            setSelectedPerms(rolePermNames); 
        }
    };

    const togglePerm = (permId: string) => {
        setSelectedPerms((prev) => {
            const newPerms = prev.includes(permId) 
                ? prev.filter((id) => id !== permId) 
                : [...prev, permId];

            setSelectedRole('Custom'); 
            
            return newPerms;
        });
    };

    const savePermissions = async () => {
        if (!permMember) return;
        try {
            await api.put(`/team/member/${permMember.id}/permissions`, {
                permissions: selectedPerms,
                role_name: selectedRole 
            });
            
            toast.success('Access updated');
            setPermModalOpen(false);
            fetchTeamAndTemplates();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to update access');
        }
    };

    // Handle Delete
    const openDeleteMember = (member: any) => {
        setDeleteData({ type: 'member', id: member.id, name: member.name });
        setDeleteModalOpen(true);
    };

    const openCancelInvite = (invite: any) => {
        setDeleteData({ type: 'invite', id: invite.id, name: invite.email });
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteData) return;
        setIsDeleting(true);
        try {
            if (deleteData.type === 'member') {
                await api.delete(`/team/member/${deleteData.id}`);
                toast.success('Member removed from workspace');
            } else {
                await api.delete(`/team/invitations/${deleteData.id}`);
                toast.success('Invitation cancelled');
            }
            setDeleteModalOpen(false);
            fetchTeamAndTemplates();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Operation failed');
        } finally {
            setIsDeleting(false);
        }
    };

    // Filter members based on search and role
    const filteredMembers = teamData?.members?.filter((member: any) => {
        const matchesSearch = searchTerm === '' || 
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesRole = selectedRoleFilter === 'all' || 
            member.display_role?.toLowerCase() === selectedRoleFilter.toLowerCase();
        
        return matchesSearch && matchesRole;
    }) || [];

    // Whole Page Skeleton Loading
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
                    
                    {/* Tab Skeleton */}
                    <div className="flex gap-4 mb-6">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                    </div>
                </div>
                
                {/* General Tab Skeleton */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3"></div>
                            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4"></div>
                            <div className="space-y-4">
                                <div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                </div>
                                <div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-2"></div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                </div>
                            </div>
                        </div>
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
                            <IconBuilding size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage your workspace members and permissions</p>
                        </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        {teamData?.plan} Plan • {teamData?.member_count}/{teamData?.member_limit} Seats
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <IconInfoCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Team Management</h3>
                            <p className="text-blue-700 dark:text-blue-400 text-sm">
                                Invite team members, assign roles, and manage permissions. You have {teamData?.member_limit - teamData?.member_count} seat(s) remaining.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ================= TABS ================= */}
            <Tab.Group>
                <div className="mb-6">
                    <Tab.List className="flex space-x-1 rounded-xl bg-white dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
                        <Tab
                            className={({ selected }) =>
                                `w-full py-3 px-4 text-sm font-medium rounded-lg transition-all ${
                                    selected
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`
                            }
                        >
                            <div className="flex items-center justify-center gap-2">
                                <IconSettings size={18} />
                                General
                            </div>
                        </Tab>
                        <Tab
                            className={({ selected }) =>
                                `w-full py-3 px-4 text-sm font-medium rounded-lg transition-all ${
                                    selected
                                    ? 'bg-primary text-white shadow-sm'
                                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`
                            }
                        >
                            <div className="flex items-center justify-center gap-2">
                                <IconUsers size={18} />
                                Members
                            </div>
                        </Tab>
                    </Tab.List>
                </div>

                <Tab.Panels className="mt-2">
                    {/* ================= GENERAL TAB ================= */}
                    <Tab.Panel>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Workspace Name Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <IconBuilding size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Workspace Name</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Update your workspace display name</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Workspace Name
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                            disabled={!teamData?.is_owner}
                                        />
                                    </div>

                                    {teamData?.is_owner && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleRename}
                                                disabled={isRenaming}
                                                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                                            >
                                                {isRenaming ? (
                                                    <span className="flex items-center gap-2">
                                                        <IconRefresh size={18} className="animate-spin" />
                                                        Saving...
                                                    </span>
                                                ) : 'Save Changes'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Plan Usage Card */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <IconChartBar size={20} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Plan Usage</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{teamData?.plan} Plan</p>
                                        </div>
                                    </div>
                                    <span className="badge bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30">
                                        Active
                                    </span>
                                </div>

                                {/* Members Usage */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">Seats Used</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {teamData?.member_count} / {teamData?.member_limit}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                teamData?.member_count >= teamData?.member_limit ? 'bg-red-500' : 'bg-blue-500'
                                            }`}
                                            style={{ width: `${Math.min((teamData?.member_count / teamData?.member_limit) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Token Usage */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600 dark:text-gray-400">Monthly Tokens</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {teamData?.tokens_used?.toLocaleString()} / {teamData?.token_limit?.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                (teamData?.tokens_used / teamData?.token_limit) > 0.9 ? 'bg-red-500' : 'bg-purple-500'
                                            }`}
                                            style={{ width: `${Math.min((teamData?.tokens_used / teamData?.token_limit) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                                        Resets on the 1st of each month
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Tab.Panel>

                    {/* ================= MEMBERS TAB ================= */}
                    <Tab.Panel>
                        <div className="space-y-6">
                            {/* Filter Bar */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                                        {/* Search */}
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                placeholder="Search members by name or email..."
                                                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                        </div>

                                        {/* Role Filter */}
                                        <div className="w-full sm:w-48">
                                            <Listbox value={selectedRoleFilter} onChange={setSelectedRoleFilter}>
                                                <div className="relative">
                                                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2.5 pl-4 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                                                        <span className="flex items-center gap-2 truncate">
                                                            <IconUser size={16} className="text-gray-400" />
                                                            <span className="text-gray-700 dark:text-gray-300">
                                                                {selectedRoleFilter === 'all' ? 'All Roles' : selectedRoleFilter}
                                                            </span>
                                                        </span>
                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                            <IconChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                                        </span>
                                                    </Listbox.Button>

                                                    <Listbox.Options className="absolute z-50 mt-1 w-full rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none max-h-60 overflow-auto">
                                                        <Listbox.Option value="all">
                                                            {({ active }) => (
                                                                <div className={`px-4 py-2 text-sm cursor-pointer ${active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                    All Roles
                                                                </div>
                                                            )}
                                                        </Listbox.Option>
                                                        {[...new Set(teamData?.members.map((m: any) => m.display_role))].map((role) => (
                                                            <Listbox.Option key={role} value={role}>
                                                                {({ active }) => (
                                                                    <div className={`px-4 py-2 text-sm cursor-pointer ${active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                        {role}
                                                                    </div>
                                                                )}
                                                            </Listbox.Option>
                                                        ))}
                                                    </Listbox.Options>
                                                </div>
                                            </Listbox>
                                        </div>
                                    </div>

                                    {/* Invite Button */}
                                    {(teamData?.is_owner || teamData?.is_admin) && (
                                        <button
                                            onClick={() => setInviteModalOpen(true)}
                                            disabled={teamData?.member_count >= teamData?.member_limit}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md whitespace-nowrap"
                                        >
                                            <IconUserPlus size={18} />
                                            Invite Member
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Members Table */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                            <tr>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Member
                                                </th>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Role
                                                </th>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Permissions
                                                </th>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Token Usage
                                                </th>
                                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {filteredMembers.map((member: any) => (
                                                <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <img 
                                                                src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=primary&color=fff&bold=true&size=128`} 
                                                                className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                                                                alt={member.name}
                                                            />
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                                    {member.name}
                                                                    {member.display_role === 'Owner' && (
                                                                        <IconCrown size={14} className="text-amber-500" />
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {member.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-4 px-6">
                                                        {member.display_role === 'Owner' ? (
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium">
                                                                <IconCrown size={12} />
                                                                Owner
                                                            </span>
                                                        ) : (
                                                            <Listbox 
                                                                value={member.pivot?.role || 'member'} 
                                                                onChange={(val) => handleRoleChange(member.id, val)}
                                                            >
                                                                <div className="relative">
                                                                    <Listbox.Button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors cursor-pointer">
                                                                        <span className="capitalize">{member.pivot?.role || 'member'}</span>
                                                                        <IconChevronDown size={14} />
                                                                    </Listbox.Button>
                                                                    
                                                                    <Listbox.Options className="absolute z-50 mt-1 w-32 rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none">
                                                                        {roleTemplates.map((role: any) => (
                                                                            <Listbox.Option 
                                                                                key={role.id} 
                                                                                value={role.name}
                                                                                className={({ active }) => `px-3 py-2 cursor-pointer text-sm ${active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'}`}
                                                                            >
                                                                                <span className="capitalize">{role.name}</span>
                                                                            </Listbox.Option>
                                                                        ))}
                                                                    </Listbox.Options>
                                                                </div>
                                                            </Listbox>
                                                        )}
                                                    </td>

                                                    <td className="py-4 px-6">
                                                        {member.display_role !== 'Owner' && teamData?.is_owner && (
                                                            <button
                                                                onClick={() => openPermModal(member)}
                                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-lg transition-colors"
                                                                title="Manage Permissions"
                                                            >
                                                                <IconKey size={16} />
                                                                Manage Access
                                                            </button>
                                                        )}
                                                    </td>

                                                    <td className="py-4 px-6">
                                                        <div className="space-y-2 min-w-[180px]">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500 dark:text-gray-400">Used</span>
                                                                <span className="font-medium text-gray-900 dark:text-white">
                                                                    {member.tokens_used?.toLocaleString() || 0}
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                {member.token_limit === null ? (
                                                                    <div className="h-full bg-emerald-500 w-full"></div>
                                                                ) : (
                                                                    <div 
                                                                        className={`h-full rounded-full ${
                                                                            (member.tokens_used / member.token_limit) > 0.9 ? 'bg-red-500' : 
                                                                            (member.tokens_used / member.token_limit) > 0.7 ? 'bg-amber-500' : 'bg-primary'
                                                                        }`}
                                                                        style={{ width: `${Math.min(((member.tokens_used || 0) / member.token_limit) * 100, 100)}%` }}
                                                                    ></div>
                                                                )}
                                                            </div>
                                                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                                                <span>Limit: {member.token_limit === null ? '∞' : member.token_limit.toLocaleString()}</span>
                                                                {member.token_limit !== null && teamData?.is_owner && (
                                                                    <button
                                                                        onClick={() => openLimitModal(member)}
                                                                        className="text-primary hover:text-primary/80 font-medium"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="py-4 px-6">
                                                        {member.display_role !== 'Owner' && (teamData?.is_owner || teamData?.is_admin) && (
                                                            <button
                                                                onClick={() => openDeleteMember(member)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                            >
                                                                <IconTrash size={16} />
                                                                Remove
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pending Invites */}
                            {teamData?.invites.length > 0 && (
                                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 rounded-xl border border-amber-200 dark:border-amber-500/20 shadow-sm overflow-hidden">
                                    <div className="p-5 border-b border-amber-200 dark:border-amber-500/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                                <IconMail size={20} className="text-amber-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-amber-800 dark:text-amber-400 text-lg">Pending Invitations</h3>
                                                <p className="text-sm text-amber-700/70 dark:text-amber-400/70">
                                                    {teamData.invites.length} invitation(s) waiting for acceptance
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-amber-100 dark:divide-amber-500/10">
                                        {teamData.invites.map((invite: any) => (
                                            <div key={invite.id} className="p-5 flex items-center justify-between hover:bg-amber-50/50 dark:hover:bg-amber-500/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                                                        <IconMail size={14} className="text-amber-600 dark:text-amber-400" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">{invite.email}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            Sent {new Date(invite.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => openCancelInvite(invite)}
                                                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Tab.Panel>
                </Tab.Panels>
            </Tab.Group>

            {/* ================= MODALS ================= */}

            {/* Invite Modal */}
            <Transition appear show={inviteModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setInviteModalOpen(false)}>
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
                                        <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                            Invite Team Member
                                        </Dialog.Title>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 mb-6">
                                            Send an invitation to join your workspace
                                        </p>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                placeholder="colleague@company.com"
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                                autoFocus
                                            />
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => setInviteModalOpen(false)}
                                                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleInvite}
                                                disabled={sendingInvite || !inviteEmail}
                                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                            >
                                                {sendingInvite ? (
                                                    <span className="flex items-center gap-2">
                                                        <IconRefresh size={16} className="animate-spin" />
                                                        Sending...
                                                    </span>
                                                ) : 'Send Invitation'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>

            {/* Limit Modal */}
            <Transition appear show={limitModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setLimitModalOpen(false)}>
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
                                                <IconTicket size={24} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                                    Set Token Limit
                                                </Dialog.Title>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    For: <span className="font-medium">{limitMember?.name}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Monthly Token Allocation
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                                    placeholder="Enter token limit"
                                                    value={newLimit}
                                                    onChange={(e) => setNewLimit(e.target.value)}
                                                />
                                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                                                    tokens
                                                </span>
                                            </div>
                                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                                    <strong>💡 Tip:</strong> Enter <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 rounded">-1</code> for unlimited access
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => setLimitModalOpen(false)}
                                                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={saveLimit}
                                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                                            >
                                                Save Limit
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
            <Transition appear show={permModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setPermModalOpen(false)}>
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
                                                    Configure features for <span className="font-medium">{permMember?.name}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Role Selector */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Quick Role Assignment
                                            </label>
                                            <Listbox value={selectedRole} onChange={handleRoleSelect}>
                                                <div className="relative">
                                                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-3 pl-4 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <span className="block font-medium text-gray-900 dark:text-white">
                                                                    {selectedRole}
                                                                </span>
                                                                <span className="block text-sm text-gray-500 dark:text-gray-400">
                                                                    {roleTemplates.find(r => r.name === selectedRole)?.description || 'Custom permission set'}
                                                                </span>
                                                            </div>
                                                            <IconChevronDown className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                    </Listbox.Button>

                                                    <Listbox.Options className="absolute z-50 mt-1 w-full rounded-lg bg-white dark:bg-gray-800 py-2 shadow-lg border border-gray-200 dark:border-gray-700 focus:outline-none max-h-60 overflow-auto">
                                                        <Listbox.Option
                                                            value="Custom"
                                                            className={({ active }) => `px-4 py-3 cursor-pointer ${active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'}`}
                                                        >
                                                            <div>
                                                                <span className="font-medium">Custom</span>
                                                                <p className="text-sm text-gray-500">Manual permission selection</p>
                                                            </div>
                                                        </Listbox.Option>
                                                        {roleTemplates.map((role) => (
                                                            <Listbox.Option
                                                                key={role.id}
                                                                value={role.name}
                                                                className={({ active }) => `px-4 py-3 cursor-pointer ${active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'}`}
                                                            >
                                                                <div>
                                                                    <span className="font-medium">{role.name}</span>
                                                                    <p className="text-sm text-gray-500">{role.description}</p>
                                                                </div>
                                                            </Listbox.Option>
                                                        ))}
                                                    </Listbox.Options>
                                                </div>
                                            </Listbox>
                                        </div>

                                        {/* Permissions Grid */}
                                        <div className="max-h-[400px] overflow-hidden">
                                            <PerfectScrollbar>
                                                <div className="pr-2 space-y-4">
                                                    {groupedPermissions().map((group) => (
                                                        <div key={group.module} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleModule(group.module)}
                                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                        <IconShield size={16} className="text-primary" />
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <h4 className="font-semibold text-gray-900 dark:text-white">{group.module}</h4>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {group.permissions.length} permission{group.permissions.length !== 1 ? 's' : ''}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {expandedModules.has(group.module) ? (
                                                                    <IconChevronDown size={20} className="text-gray-400 rotate-180" />
                                                                ) : (
                                                                    <IconChevronDown size={20} className="text-gray-400" />
                                                                )}
                                                            </button>

                                                            {expandedModules.has(group.module) && (
                                                                <div className="p-4 bg-white dark:bg-gray-800 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {group.permissions.map((perm) => {
                                                                        const isSelected = selectedPerms.includes(perm.id);
                                                                        return (
                                                                            <label
                                                                                key={perm.id}
                                                                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected 
                                                                                    ? 'border-primary bg-primary/5' 
                                                                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                                                }`}
                                                                            >
                                                                                <div className="flex items-center h-5">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/20"
                                                                                        checked={isSelected}
                                                                                        onChange={() => togglePerm(perm.id)}
                                                                                    />
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-start justify-between">
                                                                                        <div>
                                                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                                                {perm.label}
                                                                                            </span>
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
                                                    ))}
                                                </div>
                                            </PerfectScrollbar>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
                                            <button
                                                onClick={() => setPermModalOpen(false)}
                                                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={savePermissions}
                                                disabled={savingPerms}
                                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                            >
                                                {savingPerms ? (
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
            </Transition>

            {/* Delete Modal */}
            <DeleteModal
                isOpen={deleteModalOpen}
                setIsOpen={setDeleteModalOpen}
                title={deleteData?.type === 'member' ? 'Remove Team Member' : 'Cancel Invitation'}
                message={
                    deleteData?.type === 'member'
                        ? `Are you sure you want to remove ${deleteData?.name} from the team? This action cannot be undone.`
                        : `Are you sure you want to cancel the invitation for ${deleteData?.name}?`
                }
                onConfirm={confirmDelete}
                confirmButtonText={deleteData?.type === 'member' ? 'Remove Member' : 'Cancel Invitation'}
                cancelButtonText="Cancel"
                isLoading={isDeleting}
            />
        </div>
    );
};

export default TeamManagement;