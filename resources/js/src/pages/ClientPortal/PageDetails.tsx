import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    IconArrowLeft,
    IconRefresh,
    IconFileAnalytics,
    IconBrandFacebook,
    IconEye,
    IconDownload,
    IconCalendarEvent,
    IconLogout
} from '@tabler/icons-react';
import toast from 'react-hot-toast';

import { Badge } from '../../components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";

import api from '../../utils/api';

const PageDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pageUser, setPageUser] = useState<any>(null);
    const [pageDetails, setPageDetails] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const clientToken = localStorage.getItem('clientToken');
        if (!clientToken) {
            navigate('/portal/login');
            return;
        }

        const clientUserStr = localStorage.getItem('clientUser');
        if (clientUserStr) {
            setPageUser(JSON.parse(clientUserStr));
        }

        const fetchPageDetails = async () => {
            try {
                api.defaults.headers.common['Authorization'] = `Bearer ${clientToken}`;

                const { data } = await api.get(`/portal/pages/${id}`);
                setPageDetails(data.page);

                // Combine standard and facebook reports
                const combinedReports = [
                    ...(data.reports.standard || []).map((r: any) => ({ ...r, type: 'standard' })),
                    ...(data.reports.facebook || []).map((r: any) => ({ ...r, type: 'facebook' }))
                ];

                // Sort by generated date descending
                combinedReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setReports(combinedReports);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    localStorage.removeItem('clientToken');
                    localStorage.removeItem('clientUser');
                    navigate('/portal/login');
                } else if (error.response?.status === 403) {
                    toast.error('You do not have permission to view this page.');
                    navigate('/portal/dashboard');
                } else {
                    toast.error('Failed to load page data');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchPageDetails();
    }, [id, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('clientToken');
        localStorage.removeItem('clientUser');
        navigate('/portal/login');
    };

    const openReport = (report: any) => {
        navigate(`/portal/reports/${report.type}/${report.id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <IconRefresh className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/portal/dashboard')}
                                className="p-2 -ml-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-all"
                                title="Back to Dashboard"
                            >
                                <IconArrowLeft size={20} />
                            </button>
                            <div className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <IconFileAnalytics className="text-primary" />
                                <span className="hidden sm:inline">Client Portal</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-right hidden md:block">
                                <div className="font-semibold text-gray-900 dark:text-white">{pageUser?.name}</div>
                                <div className="text-xs text-gray-500">{pageUser?.email}</div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold outline outline-2 outline-offset-2 outline-primary/30 uppercase">
                                {pageUser?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <IconLogout size={18} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {pageDetails?.platform === 'facebook' ? <IconBrandFacebook className="text-blue-500" /> : <IconFileAnalytics className="text-primary" />}
                        {pageDetails?.name || 'Page Details'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 flex gap-2">
                        <span className="capitalize">{pageDetails?.platform}</span>
                        • Viewing all reports in this page folder.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <IconCalendarEvent size={18} className="text-gray-400" />
                            {reports.length} Report{reports.length !== 1 && 's'} Found
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table className="w-full text-left">
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 hover:bg-transparent">
                                    {[
                                        { id: 'name', label: 'Report Name' },
                                        { id: 'type', label: 'Type' },
                                        { id: 'created_at', label: 'Generated Date' },
                                        { id: 'actions', label: 'Actions' }
                                    ].map(head => (
                                        <TableHead key={head.id} className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            {head.label}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {reports.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={4} className="p-10 text-center">
                                            <div className="flex justify-center mb-4">
                                                <div className="p-4 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                    <IconFileAnalytics className="text-gray-400" size={32} />
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No reports found</h3>
                                            <p className="text-gray-500 max-w-sm mx-auto mt-2">There are currently no reports associated with this page.</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reports.map((row: any) => (
                                        <TableRow key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <TableCell className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${row.type === 'facebook' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'}`}>
                                                        {row.type === 'facebook' ? <IconBrandFacebook size={20} /> : <IconFileAnalytics size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-white">
                                                            {row.account_name || row.page?.name || 'Report'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 capitalize">
                                                            {row.platform} Platform
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <Badge variant={row.type === 'facebook' ? 'default' : 'success'} className="uppercase tracking-wider">
                                                    {row.type} Report
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="text-gray-600 dark:text-gray-400 text-sm">
                                                    {new Date(row.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <div className="flex items-center gap-2 text-right justify-end w-full">
                                                    <button
                                                        onClick={() => openReport(row)}
                                                        className="p-2 hover:bg-primary/10 text-gray-400 hover:text-primary rounded-xl transition-all"
                                                        title="View Secured Report"
                                                    >
                                                        <IconEye size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => window.open(`/api/portal/reports/${row.type}/${row.id}/export?token=${localStorage.getItem('clientToken')}`, '_blank')}
                                                        className="p-2 hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 rounded-xl transition-all"
                                                        title="Download Data"
                                                    >
                                                        <IconDownload size={20} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PageDetails;
