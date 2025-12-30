import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import translation hook
import api from '../../../utils/api';
import PublicLayout from '../PublicLayout';
import TikTokReportView from './TikTokReportView';
import FacebookReportView from './FacebookReportView';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    IconCalendar, 
    IconChevronRight, 
    IconLoader2, 
    IconAlertCircle, 
    IconChevronDown 
} from '@tabler/icons-react';

const PublicPageDashboard = () => {
    const { token } = useParams();
    const { t } = useTranslation(); // Initialize translation
    const [data, setData] = useState<any>(null);
    const [activeReport, setActiveReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false); 

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

    const reportList = data?.reports?.data || [];
    const showHistory = reportList.length > 1;

    // Sub-component for the History List to avoid repetition
    const HistoryContent = ({ reportList, activeReport, setActiveReport, t }: any) => (
        <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4 px-2">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                    <IconCalendar size={16} />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-800 dark:text-white">
                    {t('report.archive')}
                </h2>
            </div>
            
            <div className="space-y-3 max-h-[50vh] lg:max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {reportList.map((report: any) => (
                    <button
                        key={report.id}
                        onClick={() => setActiveReport(report)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${
                            activeReport?.id === report.id 
                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]' 
                            : 'bg-gray-50 dark:bg-black/20 border-transparent hover:border-primary/50'
                        }`}
                    >
                        <div className={`text-[9px] font-black uppercase mb-1 ${activeReport?.id === report.id ? 'text-white/70' : 'text-gray-400'}`}>
                            {new Date(report.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold truncate pr-2">{t('report.summary')}</span>
                            <IconChevronRight size={14} className={activeReport?.id === report.id ? 'text-white' : 'text-primary'} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    if (loading) return <PublicLayout><div className="flex flex-col items-center justify-center min-h-[60vh]"><IconLoader2 className="animate-spin text-primary" size={40} /></div></PublicLayout>;
    if (error) return <PublicLayout><div className="flex flex-col items-center py-20"><IconAlertCircle size={48} className="text-rose-500 mb-4" />{error}</div></PublicLayout>;

    return (
        <PublicLayout>
            <div className="flex flex-col lg:flex-row gap-8 items-start relative min-h-[70vh]">
                
                {/* LEFT SIDE: DYNAMIC DASHBOARD */}
                <div className="flex-1 w-full">
                    {activeReport?.platform === 'tiktok' ? (
                        <TikTokReportView report={activeReport} pageName={data.page_name} />
                    ) : (
                        <FacebookReportView report={activeReport} pageName={data.page_name} />
                    )}
                </div>

                {/* HISTORY SECTION */}
                {showHistory && (
                    <>
                        {/* DESKTOP VIEW: Sticky Sidebar */}
                        <div className="hidden lg:block w-80 shrink-0 sticky top-24">
                            <div className="bg-white dark:bg-[#0e1726] p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                <HistoryContent 
                                    reportList={reportList} 
                                    activeReport={activeReport} 
                                    setActiveReport={setActiveReport} 
                                    t={t} 
                                />
                            </div>
                        </div>

                        {/* MOBILE VIEW: Floating Popup at Bottom Right */}
                        <div className="lg:hidden fixed bottom-6 right-6 z-[60]">
                            {/* Popup Menu */}
                            <AnimatePresence>
                                {isHistoryOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                        className="absolute bottom-20 right-0 w-[280px] max-h-[70vh] overflow-hidden shadow-2xl rounded-[2.5rem]"
                                    >
                                        <div className="bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 p-5">
                                            <HistoryContent 
                                                reportList={reportList} 
                                                activeReport={activeReport} 
                                                setActiveReport={(r: any) => {
                                                    setActiveReport(r);
                                                    setIsHistoryOpen(false); 
                                                }} 
                                                t={t} 
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Floating Action Button */}
                            <button 
                                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all duration-300 ${isHistoryOpen ? 'bg-rose-500 rotate-90' : 'bg-primary'}`}
                            >
                                {isHistoryOpen ? <IconChevronDown size={28} className="text-white" /> : <IconCalendar size={28} className="text-white" />}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </PublicLayout>
    );
};

export default PublicPageDashboard;