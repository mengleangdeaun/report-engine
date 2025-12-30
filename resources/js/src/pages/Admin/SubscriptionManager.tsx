import { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
    IconBuilding, IconUsers, IconCoin, IconCrown,
    IconCalendar, IconCheck, IconChevronDown, IconRefresh,
    IconSearch, IconFilter, IconInfoCircle, IconShield,
    IconChartBar, IconTicket, IconX, IconPlus,
    IconAlertCircle
} from '@tabler/icons-react';
import PerfectScrollbar from 'react-perfect-scrollbar';

const SubscriptionManager = () => {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState<string>('all');
    
    // Modal State
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<any>(null);
    const [selectedPlan, setSelectedPlan] = useState('free');
    const [duration, setDuration] = useState<number>(12);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);

    const PLANS = [
        { id: 'free', name: 'Free', color: 'bg-blue-500', description: 'Basic features, limited usage' },
        { id: 'pro', name: 'Pro', color: 'bg-purple-500', description: 'Advanced features, higher limits' },
        { id: 'enterprise', name: 'Enterprise', color: 'bg-orange-500', description: 'Full access, custom limits' }
    ];
    

    const STATUS_OPTIONS = [
        { id: 'all', name: 'All Status' },
        { id: 'active', name: 'Active Only' },
        { id: 'expired', name: 'Expired Only' }
    ];

    const DURATIONS = [
        { months: 1, label: '1 Month' },
        { months: 3, label: '3 Months' },
        { months: 6, label: '6 Months' },
        { months: 12, label: '1 Year' },
        { months: 24, label: '2 Years' }
    ];

// const [teams, setTeams] = useState([]);
const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
});

const fetchTeams = async (page = 1) => {
    setLoading(true);
    try {
        const res = await api.get('/admin/teams', {
            params: {
                page,
                search: searchTerm,
                plan: planFilter,
                status: statusFilter,
                per_page: 10
            }
        });
        
        setTeams(res.data.data);
        setPagination({
            current_page: res.data.current_page,
            last_page: res.data.last_page,
            total: res.data.total
        });
    } catch (e: any) {
        toast.error('Failed to load teams');
    } finally {
        setLoading(false);
    }
};


const getPlanColor = (slug: string) => {
    const colors: Record<string, string> = {
        free: 'bg-blue-500',
        pro: 'bg-purple-500',
        enterprise: 'bg-orange-500',
    };
    // Default to a neutral color if the slug is new/custom
    return colors[slug] || 'bg-emerald-500';
};

const fetchAvailablePlans = async () => {
    try {
        const res = await api.get('/admin/plans');
        const activePlans = res.data.filter((p: any) => p.is_active);
        setAvailablePlans(activePlans);
    } catch (e) {
        console.error("Failed to fetch plans", e);
    }
};

useEffect(() => {
    fetchAvailablePlans();
    fetchTeams();
}, []);


// Inside SubscriptionManager component

// 1. Add a temporary state for the input field


// 2. Effect for Debouncing
useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
        setSearchTerm(searchQuery); // This updates the actual search term used in fetchTeams
    }, 500);

    return () => clearTimeout(delayDebounceFn);
}, [searchQuery]);


useEffect(() => {
    fetchTeams(1);
}, [searchTerm, planFilter, statusFilter]);

    const openModal = (team: any) => {
        setSelectedTeam(team);
        setSelectedPlan(team.plan_type || 'free');
        setDuration(team.subscription_duration || 12);
        setIsOpen(true);
    };

    const handleUpdate = async () => {
        if (!selectedTeam) return;
        setIsSubmitting(true);
        try {
            await api.put(`/admin/teams/${selectedTeam.id}/plan`, {
                plan: selectedPlan,
                duration_months: duration
            });
            toast.success(`Plan updated to ${selectedPlan.toUpperCase()}`);
            setIsOpen(false);
            fetchTeams();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Update failed');
        } finally {
            setIsSubmitting(false);
        }
    };


    const getPlanDisplayName = (plan: string) => {
        const planObj = PLANS.find(p => p.id === plan);
        return planObj?.name || 'Unknown';
    };

const getExpiryPreview = (monthsToAdd: number) => {
    // 1. Get the current expiry date of the selected team from props/state
    const currentExpiryStr = selectedTeam?.subscription_expires_at;
    const now = new Date();
    
    let baseDate: Date;

    // 2. Logic: If team has a future expiry, use it as the base. Otherwise, use 'now'.
    if (currentExpiryStr && new Date(currentExpiryStr) > now) {
        baseDate = new Date(currentExpiryStr);
    } else {
        baseDate = now;
    }

    // 3. Add the selected months to the base date
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);

    return newExpiry.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};

    // Filter teams
const filteredTeams = teams.filter(team => {
    // 1. Search Logic
    const matchesSearch = !searchTerm || 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.owner?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Plan Logic
    const matchesPlan = planFilter === 'all' || team.plan_type === planFilter;

    // 3. Expiry/Status Logic
    const now = new Date();
    const expiryDate = team.subscription_expires_at ? new Date(team.subscription_expires_at) : null;
    const isExpired = expiryDate ? expiryDate < now : false;

    const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'expired' && isExpired) || 
        (statusFilter === 'active' && !isExpired);
    
    return matchesSearch && matchesPlan && matchesStatus;
});


const getRemainingDays = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expire = new Date(expiryDate);
    
    // Calculate difference in milliseconds
    const diffTime = expire.getTime() - now.getTime();
    // Convert to days
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
};

const getStatusBadge = (expiryDate: string | null) => {
    const days = getRemainingDays(expiryDate);
    
    if (days === null) return <span className="text-gray-400">No Expiry</span>;
    if (days < 0) return <span className="px-2 py-1 rounded bg-red-100 text-red-600 text-xs font-bold">Expired</span>;
    if (days <= 7) return <span className="px-2 py-1 rounded bg-orange-100 text-orange-600 text-xs font-bold">{days} Days Left</span>;
    
    return <span className="px-2 py-1 rounded bg-green-100 text-green-600 text-xs font-bold">{days} Days Left</span>;
};

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
                        <div className="w-full md:w-48 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                </div>

                {/* Table Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    {['Team', 'Owner', 'Plan', 'Members', 'Tokens', 'Actions'].map((header, index) => (
                                        <th key={index} className="py-4 px-6">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(5)].map((_, index) => (
                                    <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                                        {[...Array(6)].map((_, cellIndex) => (
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
                            <IconCrown size={24} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-0.5">Manage team plans, limits, and subscriptions</p>
                        </div>
                    </div>
                    
                    {/* Stats Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-500/10 dark:to-purple-500/5 text-purple-700 dark:text-purple-400 rounded-full font-medium border border-purple-200 dark:border-purple-500/20">
                        <IconBuilding size={16} />
                        <span className="font-bold">{teams.length}</span> Total Teams
                    </div>
                </div>

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5 border border-purple-200 dark:border-purple-500/20 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <IconInfoCircle className="text-purple-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-1">Plan Management</h3>
                            <p className="text-purple-700 dark:text-purple-400 text-sm">
                                Upgrade, downgrade, or modify team subscription plans. Changes take effect immediately.
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
                                placeholder="Search teams by name or owner..."
                                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>

                        {/* Plan Filter */}
                        <div className="w-full sm:w-48">
                            <Listbox value={planFilter} onChange={setPlanFilter}>
                                <div className="relative">
                                    <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2.5 pl-4 pr-10 text-left text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                                        <span className="flex items-center gap-2 truncate">
                                            <IconFilter size={16} className="text-gray-400" />
                                            <span className="text-gray-700 dark:text-gray-300">
                                                {planFilter === 'all' ? 'All Plans' : getPlanDisplayName(planFilter)}
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
                                                    All Plans
                                                </div>
                                            )}
                                        </Listbox.Option>
                                        {availablePlans.map((plan) => (
                                            <Listbox.Option key={plan.slug} value={plan.slug}>
                                                {({ active }) => (
                                                    <div className={`px-4 py-2 text-sm cursor-pointer flex items-center gap-2 ${active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        <div className={`w-3 h-3 rounded-full ${plan.color}`}></div>
                                                        {plan.name}
                                                    </div>
                                                )}
                                            </Listbox.Option>
                                        ))}
                                    </Listbox.Options>
                                </div>
                            </Listbox>
                        </div>
                        <div className="w-full sm:w-44">
                        <Listbox value={statusFilter} onChange={setStatusFilter}>
                            <div className="relative">
                                <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2.5 pl-4 pr-10 text-left text-sm focus:ring-2 focus:ring-primary/20 transition-all">
                                    <span className="flex items-center gap-2 truncate text-gray-700 dark:text-gray-300">
                                        <IconCalendar size={16} className="text-gray-400" />
                                        {STATUS_OPTIONS.find(opt => opt.id === statusFilter)?.name}
                                    </span>
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <IconChevronDown className="h-5 w-5 text-gray-400" />
                                    </span>
                                </Listbox.Button>
                                <Listbox.Options className="absolute z-50 mt-1 w-full rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg border border-gray-200 dark:border-gray-700 overflow-auto">
                                    {STATUS_OPTIONS.map((opt) => (
                                        <Listbox.Option key={opt.id} value={opt.id}>
                                            {({ active }) => (
                                                <div className={`px-4 py-2 text-sm cursor-pointer ${active ? 'bg-primary/5 text-primary' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {opt.name}
                                                </div>
                                            )}
                                        </Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </div>
                        </Listbox>
                    </div>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchTeams}
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
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Team
                                </th>
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Owner
                                </th>
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Current Plan
                                </th>
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Members
                                </th>
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Tokens
                                </th>
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Expires At
                                </th>
                                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredTeams.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-20 px-6 text-center">
                                        <div className="flex flex-col items-center justify-center animate-fade-in">
                                            {/* Visual Icon */}
                                            <div className="relative mb-6">
                                                <div className="w-20 h-20 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center border border-gray-100 dark:border-gray-600 shadow-sm">
                                                    <IconBuilding size={32} className="text-gray-300 dark:text-gray-500" />
                                                </div>
                                                {(searchTerm || planFilter !== 'all' || statusFilter !== 'all') && (
                                                    <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-50 dark:border-gray-700 flex items-center justify-center text-primary shadow-sm">
                                                        <IconSearch size={16} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Text Content */}
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                                {searchTerm || planFilter !== 'all' || statusFilter !== 'all' 
                                                    ? 'No teams match your filters' 
                                                    : 'Your workspace is empty'}
                                            </h3>
                                            
                                            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8 leading-relaxed">
                                                {searchTerm || planFilter !== 'all' || statusFilter !== 'all'
                                                    ? `We couldn't find any teams for "${searchTerm || 'your selected filters'}". Try adjusting your search or filters.`
                                                    : "There are currently no teams registered in the system. When teams are created, they will appear here."}
                                            </p>

                                            {/* Action Button: Clear Filters */}
                                            {(searchTerm || planFilter !== 'all' || statusFilter !== 'all') && (
                                                <button
                                                    onClick={() => {
                                                        setSearchQuery(''); // Clears the input and triggers the debounce
                                                        setPlanFilter('all');
                                                        setStatusFilter('all');
                                                    }}
                                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95"
                                                >
                                                    <IconX size={16} />
                                                    Clear All Filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )  : (
                                filteredTeams.map((team) => (
                                    <tr key={team.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/10 dark:to-blue-500/5 flex items-center justify-center">
                                                    <IconBuilding size={20} className="text-blue-500" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {team.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        Created {new Date(team.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="py-4 px-6">
                                            {team.owner ? (
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {team.owner.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {team.owner.email}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500 text-sm">No owner</span>
                                            )}
                                        </td>
                                        
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${getPlanColor(team.plan_type)}`}></div>
                                                <span className={`font-medium capitalize ${
                                                    team.plan_type === 'pro' ? 'text-purple-600 dark:text-purple-400' :
                                                    team.plan_type === 'enterprise' ? 'text-orange-600 dark:text-orange-400' :
                                                    'text-blue-600 dark:text-blue-400'
                                                }`}>
                                                    {getPlanDisplayName(team.plan_type)}
                                                </span>
                                            </div>
                                            {team.subscription_duration && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {team.subscription_duration} months
                                                </div>
                                            )}
                                        </td>
                                        
<td className="py-4 px-6">
    <div className="space-y-2">
        <div className="flex items-center gap-2">
            <IconUsers size={14} className="text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">
                {/* Use member_count from withCount('members') */}
                {team.members_count || 0} Members
            </span>
        </div>
    </div>
</td>
                                        
{/* TOKENS COLUMN */}
<td className="py-4 px-6">
    <div className="space-y-2">
        <div className="flex items-center gap-2">
            <IconCoin size={14} className="text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">
                {/* Use the token_balance from the eager-loaded owner */}
                {team.owner?.token_balance?.toLocaleString() || 0} Available
            </span>
        </div>
    </div>
</td>
<td className="py-4 px-6">
    <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
            {team.subscription_expires_at 
                ? new Date(team.subscription_expires_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })
                : 'Lifetime'
            }
        </span>
        <div className="mt-1">
            {getStatusBadge(team.subscription_expires_at)}
        </div>
    </div>
</td>
                                        
<td className="py-4 px-6 flex items-center gap-2">
    {/* Info Button */}
    <button
        onClick={() => {
            setSelectedTeam(team);
            setShowInfoModal(true);
        }}
        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all"
        title="View Team Members"
    >
        <IconInfoCircle size={20} />
    </button>

    {/* Manage Plan Button */}
    <button
        onClick={() => openModal(team)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/5"
    >
        <IconShield size={14} />
        Manage
    </button>
</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ================= PAGINATION ================= */}
<div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
    <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing Page <span className="font-medium text-gray-900 dark:text-white">{pagination.current_page}</span> of <span className="font-medium text-gray-900 dark:text-white">{pagination.last_page}</span>
    </div>
    <div className="flex gap-2">
        <button
            onClick={() => fetchTeams(pagination.current_page - 1)}
            disabled={pagination.current_page === 1 || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            Previous
        </button>
        <button
            onClick={() => fetchTeams(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.last_page || loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            Next
        </button>
    </div>
</div>
            </div>

            {/* ================= EDIT MODAL ================= */}
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => !isSubmitting && setIsOpen(false)}>
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
                                            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                                                <IconCrown size={24} className="text-purple-500" />
                                            </div>
                                            <div>
                                                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                                    Update Subscription
                                                </Dialog.Title>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    For: <span className="font-medium">{selectedTeam?.name}</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* Current Plan Info */}
                                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Current Plan</span>
                                                <span className={`font-semibold capitalize ${getPlanColor(selectedTeam?.plan_type)} text-white px-2 py-1 rounded text-xs`}>
                                                    {getPlanDisplayName(selectedTeam?.plan_type)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {/* {team?.owner?.name} • {team?.member_count || 0} members */}
                                            </div>
                                        </div>

                                        {/* Plan Selection */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Select New Plan
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {availablePlans.map((plan) => (
                                                    <button
                                                        key={plan.slug}
                                                        type="button"
                                                        onClick={() => setSelectedPlan(plan.slug)}
                                                        className={`p-3 rounded-lg border-2 transition-all ${
                                                            selectedPlan === plan.slug
                                                                ? 'border-primary bg-primary/5 text-primary'
                                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex flex-col items-center text-center">
                                                            <div className={`w-8 h-8 rounded-full ${getPlanColor(plan.slug)} flex items-center justify-center mb-2 text-white`}>
                                                                {selectedPlan === plan.slug && <IconCheck size={16} />}
                                                            </div>
                                                            <span className="font-semibold text-xs">{plan.name}</span>
                                                            <span className="text-[10px] opacity-70">${plan.price}/mo</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Duration */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Subscription Duration
                                            </label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {DURATIONS.map((dur) => (
                                                    <button
                                                        key={dur.months}
                                                        type="button"
                                                        onClick={() => setDuration(dur.months)}
                                                        className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                                                            duration === dur.months
                                                                ? 'border-primary bg-primary/5 text-primary'
                                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {dur.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Plan Details */}
                                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5 rounded-lg border border-blue-200 dark:border-blue-500/20">
                                            <div className="flex items-center gap-2 mb-3">
                                                <IconInfoCircle size={16} className="text-blue-500" />
                                                <span className="font-medium text-blue-700 dark:text-blue-400">New Plan Details</span>
                                            </div>
                                            <div className="text-sm text-blue-700 dark:text-blue-400">
                                                <div className="flex justify-between mb-1">
                                                    <span>Plan:</span>
                                                    <span className="font-semibold">{getPlanDisplayName(selectedPlan).toUpperCase()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Duration:</span>
                                                    <span className="font-semibold">{duration} month{duration !== 1 ? 's' : ''}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-blue-200 dark:border-blue-500/30 flex justify-between items-center">
                                        <span className="flex items-center gap-1">
                                            <IconCalendar size={14} /> New Expiry:
                                        </span>
                                        <span className="font-bold text-blue-800 dark:text-blue-300">
                                            {getExpiryPreview(duration)}
                                        </span>
                                    </div>

                                        {/* Buttons */}
                                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                disabled={isSubmitting}
                                                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUpdate}
                                                disabled={isSubmitting}
                                                className="px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <IconRefresh size={16} className="animate-spin" />
                                                        Updating...
                                                    </span>
                                                ) : 'Update Plan'}
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>


{/* ================= TEAM INFO MODAL ================= */}
<Transition appear show={showInfoModal} as={Fragment}>
    <Dialog as="div" className="relative z-50" onClose={() => setShowInfoModal(false)}>
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
                            <div className="flex items-center justify-between mb-6">
                                <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                                    Team Composition
                                </Dialog.Title>
                                <button onClick={() => setShowInfoModal(false)} className="text-gray-400 hover:text-gray-500">
                                    <IconX size={20} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Workspace: <span className="font-semibold text-gray-900 dark:text-white">{selectedTeam?.name}</span>
                                </p>
                            </div>

                            <div className="space-y-1">
                                {/* Member Usage Header */}
                                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 uppercase font-bold">Member Usage</span>
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {selectedTeam?.members_count} / {selectedTeam?.member_limit || 'N/A'}
                                        </span>
                                    </div>
                                    
                                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-500 ${
                                                (selectedTeam?.members_count / selectedTeam?.member_limit) >= 1 ? 'bg-red-500' : 'bg-primary'
                                            }`}
                                            style={{ width: `${Math.min((selectedTeam?.members_count / selectedTeam?.member_limit) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Scrollable Area */}
                                {/* 1. Added suppressScrollX option */}
                                <PerfectScrollbar 
                                    options={{ suppressScrollX: true, wheelPropagation: false }} 
                                    className="relative max-h-60 pr-2"
                                >
                                    <div className="space-y-0">
                                        {selectedTeam?.members?.map((member: any) => (
                                            <div key={member.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-700 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                        {member.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{member.name}</p>
                                                        <p className="text-xs text-gray-500">{member.email}</p>
                                                    </div>
                                                </div>
                                                {member.id === selectedTeam.user_id ? (
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">OWNER</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold">MEMBER</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </PerfectScrollbar>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={() => setShowInfoModal(false)}
                                    className="w-full py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Close
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

export default SubscriptionManager;

