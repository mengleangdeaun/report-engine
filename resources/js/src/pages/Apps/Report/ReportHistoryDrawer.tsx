import { Fragment, useEffect, useState, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { IconX, IconBrandFacebook, 
    IconBrandTiktok,
    IconChevronRight, 
    IconClock, 
    IconEye,
    IconShare,IconCheck,IconQrcode, IconDeviceMobile, IconDeviceDesktop, IconDeviceTablet, IconMapPin, IconCopy, IconExternalLink } from '@tabler/icons-react';
import api from '../../../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import usePermission from '../../../hooks/usePermission';
import { formatNotificationTime } from '../../../utils/formatNotificationTime';
import { useTranslation } from 'react-i18next';
interface ReportHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    pageId: number | null;
    pageName: string;
    onSelectReport: (report: any) => void;
    activeReportId?: number | null;
}

const ReportHistoryDrawer = ({ isOpen, onClose, pageId, pageName, onSelectReport, activeReportId }: ReportHistoryDrawerProps) => {
    const { t, i18n } = useTranslation();
    const { t: tTime } = useTranslation(undefined, { keyPrefix: 'time' });
    const { t: tToast } = useTranslation(undefined, { keyPrefix: 'toast' });
    const { t: tLink } = useTranslation(undefined, { keyPrefix: 'link' });
    const { t: tButton } = useTranslation(undefined, { keyPrefix: 'button' });
    const { t: tSpan } = useTranslation(undefined, { keyPrefix: 'span' });
    const { t: tTitle } = useTranslation(undefined, { keyPrefix: 'title' });

    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { can } = usePermission();

    useEffect(() => {
    if (isOpen && pageId) {
        fetchReports();
    }
}, [isOpen, pageId]);



    const fetchReports = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/history', {
                params: {
                    page_id: pageId,
                    per_page: 50,
                    sort_by: 'created_at',
                    sort_dir: 'desc'
                }
            });
            setReports(response.data.data || []);
        } catch (error) {
            console.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const getSafePageName = (input: any) => {
        if (input && typeof input === 'object' && 'label' in input) {
            return input.label;
        }
        return input || 'Unknown Page';
    };

    const handleShare = async (reportId: number) => {
        try {
            const response = await api.post(`/reports/${reportId}/share`);
            const url = response.data.url;
            
            // Copy to clipboard
            await navigator.clipboard.writeText(url);
            toast.success(tToast('public_link_copied_to_clipboard'));
        } catch (error) {
            toast.error(tToast('failed_to_get_share_link'));
        }
    };

// Use a ref to track if the initial fetch has already been initiated


    return (
        <>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(156, 163, 175, 0.5);
                    border-radius: 10px;
                    transition: background 0.2s;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(156, 163, 175, 0.8);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(75, 85, 99, 0.5);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(75, 85, 99, 0.8);
                }
            `}</style>

<Transition appear show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-[999]" onClose={onClose}>
        {/* BACKDROP */}
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

        <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                    {/* SLIDE-OVER PANEL */}
                    <Transition.Child 
                        as={Fragment} 
                        enter="transform transition ease-in-out duration-500 sm:duration-700" 
                        enterFrom="translate-x-full" 
                        enterTo="translate-x-0" 
                        leave="transform transition ease-in-out duration-500 sm:duration-700" 
                        leaveFrom="translate-x-0" 
                        leaveTo="translate-x-full"
                    >
                        <Dialog.Panel className="pointer-events-auto w-screen max-w-4xl ">
                            <div>
                                
                                {/* RIGHT PANEL - Reports List */}
                                <div className="h-screen w-full  bg-white dark:bg-[#0e1726] overflow-y-auto">
                                    <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-primary/5 to-transparent">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <IconShare size={20} className="text-sky-600" />
                                                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {tTitle('report_history')}
                                                    </Dialog.Title>
                                                <p className="text-sky-700 px-2 py-0.5 rounded border text-xs font-bold w-fit bg-sky-100 border-sky-200 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20">
                                                    {getSafePageName(pageName)}
                                                </p>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {tTitle('select_a_report_to_view_details')}
                                                </p>
                                            </div>
                                            <button 
                                                type="button" 
                                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" 
                                                onClick={onClose}
                                            >
                                                <IconX size={22} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Reports List */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
                                        {loading ? (
                                                <div className="space-y-2.5 animate-pulse">
                                                {[1, 2, 3, 4, 5].map((i) => (
                                                    <div 
                                                        key={i}
                                                        className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3.5"
                                                    >
                                                        {/* Platform Icon Skeleton */}
                                                        <div className="w-[44px] h-[44px] bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
                                                        
                                                        {/* Content Skeleton */}
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                                        </div>
                                                        
                                                        {/* Arrow Skeleton */}
                                                        <div className="w-[18px] h-[18px] bg-gray-200 dark:bg-gray-700 rounded shrink-0" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : reports.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center mt-20">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                                    <IconClock size={32} className="text-gray-400" />
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400 font-medium">No reports found</p>
                                                <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">Reports will appear here once created</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5">
                                                {reports.map((report) => {
                                                    const isActive = activeReportId === report.id;
                                                    const isPlatformFacebook = report.platform === 'facebook';

                                                    return (
                                                        <div 
                                                            key={report.id} 
                                                            onClick={() => { onSelectReport(report); onClose(); }} 
                                                            className={`group relative rounded-xl border transition-all duration-200 p-4 flex items-center gap-3.5 cursor-pointer ${
                                                                isActive 
                                                                ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-primary scale-[1.01]' 
                                                                : 'bg-white dark:bg-black/20 border-gray-200 dark:border-gray-700 hover:border-primary hover:shadow-md'
                                                            }`}
                                                        >
                                                            {/* Platform Icon */}
                                                            <div className={`p-3 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${
                                                                isPlatformFacebook 
                                                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                                                : 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white'
                                                            }`}>
                                                                {isPlatformFacebook ? <IconBrandFacebook size={20} /> : <IconBrandTiktok size={20} />}
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <div className={`text-sm font-bold ${isActive ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                                                         {formatDate(report.start_date)} – {formatDate(report.end_date)} 
                                                                    </div>
                                                                    {isActive && (
                                                                        <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full tracking-wide">
                                                                            ACTIVE
                                                                        </span>
                                                                    )}
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
                                                            </div>

                                                            {can('share_report_link') && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleShare(report.id);
                                                                    }}
                                                                    className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-200 opacity-0 group-hover:opacity-100"
                                                                    title="Copy public link"
                                                                >
                                                                    <IconShare size={18} />
                                                                </button>
                                                            )}

                                                            {/* Arrow Icon */}
                                                            {!isActive && (
                                                                <IconChevronRight 
                                                                    className="text-gray-300 dark:text-gray-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" 
                                                                    size={18}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    {!loading && reports.length > 0 && (
                                        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-[#0e1726]">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                                Showing {reports.length} report{reports.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </div>
    </Dialog>

</Transition>



        </>
    );
};

export default ReportHistoryDrawer;