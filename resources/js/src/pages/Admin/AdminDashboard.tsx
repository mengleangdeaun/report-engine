import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';
import {
    IconArrowDownRight,
    IconArrowUpRight,
    IconChartLine,
    IconCoins,
    IconReportAnalytics,
    IconUsersGroup,
    IconBuildingBank,
    IconUsers,
    IconTrophy,
    IconQrcode,
    IconAd,
    IconRefresh,
    IconClock,
    IconSettings,
    IconMail,
    IconChevronRight,
    IconDotsVertical
} from '@tabler/icons-react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// --- Stat Card (unchanged) ---
const StatCard = ({ 
    icon: Icon, 
    color, 
    value, 
    label, 
    loading,
    badge,
    trend
}: { 
    icon: React.ElementType; 
    color: string; 
    value?: number | string; 
    label: string; 
    loading: boolean;
    badge?: React.ReactNode;
    trend?: { value: number; label: string; positive?: boolean };
}) => {
    return (
        <div className="relative bg-white/80 dark:bg-[#1a1f2e]/80 backdrop-blur-sm border border-white/20 dark:border-gray-800/50 rounded-xl p-5 shadow-xl shadow-gray-200/20 dark:shadow-black/20 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${color} bg-opacity-20 dark:bg-opacity-30`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                        trend.positive 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                        {trend.positive ? '↑' : '↓'} {trend.value}%
                        <span className="sr-only">{trend.label}</span>
                    </div>
                )}
            </div>
            <div className="mt-4">
                {loading ? (
                    <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ) : (
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value?.toLocaleString() ?? 0}</div>
                )}
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                {badge && <div className="mt-3">{badge}</div>}
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const isDark = useSelector((state: IRootState) => state.themeConfig.theme === 'dark' || state.themeConfig.isDarkMode);

    // --- STATE (same) ---
    const [stats, setStats] = useState({
        total_users: 0,
        total_reports: 0,
        total_workspaces: 0,
        total_qr_codes: 0,
        total_ad_reports: 0,
        top_platform: 'N/A',
        tokens_outstanding: 0,
        tokens_spent: 0,
        recent_activity: [] as any[]
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [quickActionsOpen, setQuickActionsOpen] = useState(false);

    const fetchDashboardData = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8000/api/admin/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (typeof response.data === 'string') {
                console.error("API returned string/HTML instead of JSON");
                return;
            }

            setStats(response.data);
        } catch (error) {
            console.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        dispatch(setPageTitle('Admin Dashboard'));
        fetchDashboardData();
    }, [dispatch, fetchDashboardData]);

    const handleRefresh = () => {
        fetchDashboardData(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-8">
            
            {/* --- Header with Welcome & Actions (Quick Actions moved here) --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Admin Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back, here's what's happening with your platform.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-5 py-2.5"
                    >
                        <IconRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </Button>

                    {/* Quick Actions Dropdown */}
                    <div className="relative">
                        <Button
                            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
                            className="flex items-center gap-2 px-5 py-2.5"
                        >
                            <IconSettings className="w-4 h-4" />
                            Quick Actions
                            <IconChevronRight className={`w-4 h-4 transition-transform ${quickActionsOpen ? 'rotate-90' : ''}`} />
                        </Button>
                        {quickActionsOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setQuickActionsOpen(false)} />
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-20 overflow-hidden">
                                    <div className="p-2">
                                        <NavLink
                                            to="/admin/users"
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            onClick={() => setQuickActionsOpen(false)}
                                        >
                                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                                <IconUsers className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Manage Users</span>
                                        </NavLink>
                                        <NavLink
                                            to="/admin/landing-page"
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            onClick={() => setQuickActionsOpen(false)}
                                        >
                                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                <IconSettings className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Config Landing Page</span>
                                        </NavLink>
                                        <NavLink
                                            to="/admin/contact-submissions"
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            onClick={() => setQuickActionsOpen(false)}
                                        >
                                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                                <IconMail className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Inbox</span>
                                        </NavLink>        
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Metric Cards Grid (5 cards) --- */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
                <StatCard
                    icon={IconUsersGroup}
                    color="bg-blue-500 text-blue-600 dark:text-blue-400"
                    value={stats.total_users}
                    label="Total Users"
                    loading={loading}
                />
                <StatCard
                    icon={IconUsers}
                    color="bg-emerald-500 text-emerald-600 dark:text-emerald-400"
                    value={stats.total_workspaces}
                    label="Workspaces"
                    loading={loading}
                />
                <StatCard
                    icon={IconQrcode}
                    color="bg-purple-500 text-purple-600 dark:text-purple-400"
                    value={stats.total_qr_codes}
                    label="QR Codes"
                    loading={loading}
                />
                <StatCard
                    icon={IconAd}
                    color="bg-amber-500 text-amber-600 dark:text-amber-400"
                    value={stats.total_ad_reports}
                    label="Ad Reports"
                    loading={loading}
                />
                <StatCard
                    icon={IconReportAnalytics}
                    color="bg-pink-500 text-pink-600 dark:text-pink-400"
                    value={stats.total_reports}
                    label="Content Reports"
                    loading={loading}
                    badge={
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <IconTrophy size={14} className="text-yellow-500" />
                            <span>
                                Top Platform: 
                                {loading ? (
                                    <span className="inline-block h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-1" />
                                ) : (
                                    <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">{stats.top_platform}</span>
                                )}
                            </span>
                        </div>
                    }
                />
            </div>

            {/* --- Main Content Area (2-column layout) --- */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column - Token Economy & Liability (Quick Actions removed) */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Economy Card */}
                    <div className="relative bg-gradient-to-br from-indigo-600 to-blue-600 dark:from-indigo-800 dark:to-blue-800 rounded-xl p-6 text-white shadow-2xl overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full blur-2xl -ml-10 -mb-10" />
                        <IconCoins className="absolute top-4 right-4 w-28 h-28 text-white/10" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm border border-white/10">
                                    <IconCoins className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-semibold">Token Economy</h3>
                            </div>
                            {loading ? (
                                <div className="h-12 w-32 bg-white/20 rounded animate-pulse mb-2" />
                            ) : (
                                <div className="text-5xl font-bold mb-2">{stats.tokens_spent?.toLocaleString()}</div>
                            )}
                            <p className="text-white/80 text-sm">Total tokens spent across platform</p>
                        </div>
                    </div>

                    {/* Liability Card */}
                    <div className="relative bg-gradient-to-br from-cyan-600 to-blue-600 dark:from-cyan-800 dark:to-blue-800 rounded-xl p-6 text-white shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
                        <IconBuildingBank className="absolute bottom-4 right-4 w-28 h-28 text-white/10" />
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-black/20 rounded-xl backdrop-blur-sm border border-black/10">
                                    <IconBuildingBank className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-semibold">System Liability</h3>
                            </div>
                            {loading ? (
                                <div className="h-12 w-32 bg-white/20 rounded animate-pulse mb-2" />
                            ) : (
                                <div className="text-5xl font-bold mb-2">{stats.tokens_outstanding?.toLocaleString()}</div>
                            )}
                            <p className="text-white/80 text-sm">Unspent tokens held by users</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Recent Activity (unchanged) */}
                <div className="lg:col-span-2">
                    <div className="bg-white/80 dark:bg-[#1a1f2e]/80 backdrop-blur-sm border border-white/20 dark:border-gray-800/50 rounded-xl shadow-xl h-full flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                            <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                <IconClock className="w-5 h-5 text-indigo-500" />
                                Recent Activity
                            </h3>
                        </div>

                        <PerfectScrollbar className="flex-1 p-6 pt-2">
                            {loading ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl animate-pulse">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : Array.isArray(stats.recent_activity) && stats.recent_activity.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.recent_activity.map((activity, idx) => (
                                        <div
                                            key={activity.id || idx}
                                            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                        >
                                            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white ${
                                                activity.type === 'spend' ? 'bg-rose-500' : 'bg-emerald-500'
                                            }`}>
                                                {activity.type === 'spend' ? (
                                                    <IconArrowDownRight className="w-5 h-5" />
                                                ) : (
                                                    <IconArrowUpRight className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                        {activity.user?.name || 'Unknown User'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                                        activity.amount < 0 || activity.type === 'spend'
                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    }`}>
                                                        {activity.amount > 0 && activity.type !== 'spend' ? '+' : ''}
                                                        {activity.type === 'spend' && activity.amount > 0 ? '-' : ''}
                                                        {activity.amount} 🪙
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{activity.description}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(activity.created_at)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                                    <IconClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No recent activity</p>
                                </div>
                            )}
                        </PerfectScrollbar>
                    </div>
                </div>
            </div>

            {/* --- Optional Footer / Additional Info --- */}
            <div className="text-center text-xs text-gray-400 dark:text-gray-600">
                Last updated: {loading ? '...' : new Date().toLocaleString()}
            </div>
        </div>
    );
};

export default AdminDashboard;