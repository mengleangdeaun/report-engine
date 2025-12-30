import { useEffect, useState, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '../../utils/api';
import { getStoragePath } from '../../utils/config';
import { IconSearch, IconHistory, IconUser, IconClock } from '@tabler/icons-react';
import { useLocation } from 'react-router-dom';

const ActivityLog = () => {
    const dispatch = useDispatch();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<any>(null);

    useEffect(() => {
        dispatch(setPageTitle('Activity Log'));
        fetchLogs();
    }, [page, search]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/activity-logs?page=${page}&search=${search}`);
            setLogs(res.data.data);
            setMeta(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Helper to debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchLogs();
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
        }).format(date);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <IconHistory size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Activity Log</h2>
                        <p className="text-xs text-gray-500 font-semibold">Track team actions and history</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-64">
                    <input 
                        type="text" 
                        placeholder="Search logs..." 
                        className="form-input pl-10 pr-4"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
            </div>

            {/* Table */}
            <div className="panel p-0 overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                <div className="table-responsive">
                    <table className="table table-hover w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#1a2941] text-gray-500 uppercase text-xs font-bold">
                                <th className="p-4">User</th>
                                <th className="p-4">Action</th>
                                <th className="p-4">Description</th>
                                <th className="p-4 text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        <span className="animate-spin border-2 border-primary border-l-transparent rounded-full w-6 h-6 inline-block mr-2"></span>
                                        Loading history...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No activity recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1b2e4b] transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                    {log.user?.avatar ? (
                                                        <img src={getStoragePath(log.user.avatar)} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-primary text-white font-bold text-xs">
                                                            {log.user?.name?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                    {log.user?.name || 'Unknown User'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`badge ${
                                                log.action.includes('Delete') ? 'bg-red-100 text-red-600' :
                                                log.action.includes('Update') ? 'bg-blue-100 text-blue-600' :
                                                'bg-gray-100 text-gray-600'
                                            } border-0`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={log.description}>
                                            {log.description || '-'}
                                        </td>
                                        <td className="p-4 text-right text-xs font-mono text-gray-500">
                                            {formatDate(log.created_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <div className="p-4 border-t dark:border-gray-700 flex justify-center gap-2">
                        <button 
                            disabled={page === 1} 
                            onClick={() => setPage(p => p - 1)}
                            className="btn btn-sm btn-outline-secondary"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 text-sm font-semibold flex items-center">
                            Page {page} of {meta.last_page}
                        </span>
                        <button 
                            disabled={page === meta.last_page} 
                            onClick={() => setPage(p => p + 1)}
                            className="btn btn-sm btn-outline-secondary"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLog;