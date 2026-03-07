import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconDownload, IconLoader2, IconAlertCircle, IconDeviceDesktopAnalytics } from '@tabler/icons-react';
import api from '../../utils/api';
import FacebookReportView from '../Public/components/FacebookReportView';
import TikTokReportView from '../Public/components/TikTokReportView';
import themeConfig from '../../theme.config';

const PortalReportDetail = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReportDetail();
    }, [type, id]);

    const fetchReportDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get(`/portal/reports/${type}/${id}`);
            setReport(data);
        } catch (err: any) {
            console.error('Failed to fetch report detail', err);
            setError(err.response?.data?.message || 'Failed to load report data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const pageName = report?.page?.name || report?.ad_account?.account_name || report?.account_name || 'Report Detail';

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <div className="relative">
                    <IconLoader2 className="animate-spin text-primary" size={64} />
                    <div className="absolute inset-0 blur-2xl bg-primary/20 animate-pulse rounded-full" />
                </div>
                <p className="mt-8 font-black text-xl text-gray-900 dark:text-white tracking-tight">Synchronizing Analytics...</p>
                <p className="text-gray-500 mt-2 font-medium">Fetching secure data from enterprise providers</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
                <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-[2rem] mb-6 ring-1 ring-red-100 dark:ring-red-900/30">
                    <IconAlertCircle className="text-red-500" size={48} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Access Interrupted</h2>
                <p className="text-gray-500 max-w-sm text-center font-medium mb-8">{error}</p>
                <button
                    onClick={() => navigate('/portal/dashboard')}
                    className="btn btn-primary px-8 rounded-2xl gap-2 shadow-xl shadow-primary/20"
                >
                    <IconArrowLeft size={20} />
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#060818] font-sans antialiased transition-colors duration-300">
            {/* Premium Header */}
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/portal/dashboard')}
                            className="p-2.5 bg-gray-50 dark:bg-white/5 hover:bg-primary/10 hover:text-primary rounded-xl transition-all group"
                            title="Back to Dashboard"
                        >
                            <IconArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight line-clamp-1 leading-tight">
                                {pageName}
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${report.platform === 'facebook' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10' : 'bg-gray-900 text-white'}`}>
                                    {report.platform}
                                </span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-70">
                                    Secure Analysis &bull; {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.open(`/api/portal/reports/${type}/${id}/export?token=${localStorage.getItem('clientToken')}`, '_blank')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all font-black text-sm shadow-xl shadow-primary/20 active:scale-95"
                        >
                            <IconDownload size={18} />
                            <span className="hidden sm:inline">Export Insights</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {report.platform === 'facebook' ? (
                        <FacebookReportView report={report} pageName={pageName} />
                    ) : (
                        <TikTokReportView report={report} pageName={pageName} />
                    )}
                </div>
            </main>

            <footer className="max-w-7xl mx-auto px-4 py-16 text-center border-t border-gray-100 dark:border-gray-800/50 mt-12">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary/40">
                        <IconDeviceDesktopAnalytics size={24} />
                    </div>
                    <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.4em]">Report Engine</p>
                    <p className="text-gray-500 text-xs font-medium opacity-60 max-w-md">
                        This document contains confidential proprietary analytics data protected by secure tunneling.
                        Unauthorized reproduction is strictly prohibited.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PortalReportDetail;
