import { Fragment, useEffect, useState, useRef, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { IconX, IconBrandFacebook, 
    IconBrandTiktok,
    IconBrandTelegram, 
    IconChevronRight, 
    IconClock, 
    IconRefresh,
    IconDownload,
    IconChevronDown,
    IconChevronUp,
    IconShieldLock,
    IconHistory,
    IconEye,
    IconShare,IconCheck,IconQrcode, IconDeviceMobile, IconDeviceDesktop, IconDeviceTablet, IconMapPin, IconCopy, IconExternalLink } from '@tabler/icons-react';
import api from '../../../utils/api';
import toast, { Toaster } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import usePermission from '../../../hooks/usePermission';
import { formatNotificationTime } from '../../../utils/formatNotificationTime';
import { useTranslation } from 'react-i18next';
import { ConfirmationModal } from '../../../components/ConfirmationModal';
import { motion, AnimatePresence } from 'framer-motion';
interface ReportLogDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    pageId: number | null;
    pageName: string;
    onSelectReport: (report: any) => void;
    activeReportId?: number | null;
}

const ReportLogDrawer = ({ isOpen, onClose, pageId, pageName, }: ReportLogDrawerProps) => {
    const { t, i18n } = useTranslation();
    const { t: tTime } = useTranslation(undefined, { keyPrefix: 'time' });
    const { t: tToast } = useTranslation(undefined, { keyPrefix: 'toast' });
    const { t: tLink } = useTranslation(undefined, { keyPrefix: 'link' });
    const { t: tButton } = useTranslation(undefined, { keyPrefix: 'button' });
    const { t: tSpan } = useTranslation(undefined, { keyPrefix: 'span' });
    const { t: tTitle } = useTranslation(undefined, { keyPrefix: 'title' });

    const [loading, setLoading] = useState(false);
    const [loadingCopy, setLoadingCopy] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [hasToken, setHasToken] = useState(false); // To check if a link even exists yet
    const [isCopied, setIsCopied] = useState(false);
    const [showQR, setShowQR] = useState(false); // Default to hidden for a cleaner look
    const [shareToken, setShareToken] = useState<string | null>(null); // Add this state
    const [viewCount, setViewCount] = useState(0);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [history, setHistory] = useState<any[]>([]); // ✅ New state for the log array
    const qrRef = useRef<HTMLDivElement>(null);
    const [isToggling, setIsToggling] = useState(false);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const lastToggleTimeRef = useRef(0);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'regenerate' | 'reset' | null;
    }>({ isOpen: false, type: null });

    // Helper to open the modal
    const openConfirm = (type: 'regenerate' | 'reset') => {
        setConfirmModal({ isOpen: true, type });
    };
    
    // const shareUrl = `${window.location.origin}/share/page/${shareToken}`;
    const shareUrl = shareToken 
    ? `${window.location.origin}/share/page/${shareToken}` 
    : '';
    const { can } = usePermission();

    useEffect(() => {
    if (isOpen && pageId) {
        checkShareStatus(); // Initial fetch

        // 2. Start Polling every 10 seconds
        pollingRef.current = setInterval(() => {
            checkShareStatus();
        }, 10000); 
    }

    // 3. Cleanup: Stop polling when drawer closes or page changes
    return () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };
}, [isOpen, pageId]);

const checkShareStatus = async () => {
    try {
        const response = await api.get(`/pages/${pageId}/share-status`);
        const data = response.data;
        
        setHasToken(data.exists);
        setIsPublic(data.is_active);
        setViewCount(data.view_count);
        setShareToken(data.token);
        
        // Use the history array directly for the timeline
        setHistory(data.history || []);

        // We no longer need setLat(data.lat) as it's handled within the history array objects
    } catch (error) {
        setHasToken(false);
    }
};



const handleShareAction = async () => {
    if (hasToken && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        triggerCopyAnimation();
        return;
    }

    if (!pageId || loadingCopy) return;
    setLoadingCopy(true);

    try {
        const response = await api.post(`/pages/${pageId}/share-all`);
        
        // 🚀 THE FIX: Your API returns "url", not "token"
        const fullUrlFromApi = response.data.url; 
        
        // Extract the token from the end of the URL string
        const newToken = fullUrlFromApi.split('/').pop();

        // Update states
        setShareToken(newToken);
        setHasToken(true);
        setIsPublic(true);

        // ✅ Use the API's full URL directly for the clipboard
        await navigator.clipboard.writeText(fullUrlFromApi);
        
        triggerCopyAnimation();
    } catch (error) {
        toast.error(tToast('failed_to_generate_page_link'));
    } finally {
        setLoadingCopy(false);
    }
};


// Reusable animation trigger
const triggerCopyAnimation = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
};



// 2. The Actual Process (Replaces processRegenerate)
const processRegenerate = async () => {
    setIsRegenerating(true);
    try {
        const response = await api.post(`/pages/${pageId}/regenerate-share`);
        
        // Extract new token and URL from backend
        const fullUrlFromApi = response.data.url;
        const newToken = response.data.token || fullUrlFromApi.split('/').pop();

        // ✅ Update Main States
        setShareToken(newToken);
        
        // ✅ IMPORTANT: Clear history logs because the new token has 0 visits
        setHistory([]); 
        setViewCount(0);
        
        // Copy to clipboard immediately for convenience
        await navigator.clipboard.writeText(fullUrlFromApi);
        
        // UI Feedback
        triggerCopyAnimation();
        toast.success(tToast('new_link_generated_and_copied'));
        
        // ✅ Close the shared modal
        setConfirmModal({ isOpen: false, type: null });

    } catch (error) {
        console.error("Regenerate error:", error);
        toast.error(tToast('failed_to_regenerate'));
    } finally {
        setIsRegenerating(false);
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




const handleToggleShare = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastToggle = now - lastToggleTimeRef.current;
    
    // Prevent clicks faster than 500ms apart
    if (timeSinceLastToggle < 500 || isToggling) {
        return;
    }
    
    lastToggleTimeRef.current = now;
    setIsToggling(true);
    
    // 1. Optimistic Update
    const previousState = isPublic;
    setIsPublic(!previousState); 
    
    try {
        await api.post(`/pages/${pageId}/toggle-share`);
        toast.dismiss();
        toast.success(!previousState ? 'Link Activated' : 'Link Deactivated');
    } catch (error) {
        // 2. Rollback if server fails
        setIsPublic(previousState);
        toast.error('Failed to sync settings');
    } finally {
        // Short delay for visual feedback, then allow next toggle
        setTimeout(() => {
            setIsToggling(false);
        }, 400);
    }
}, [isToggling, isPublic, pageId]);


const handleResetHistory = async () => {
    try {
        // 1. Hit the backend endpoint
        const response = await api.post(`/pages/${pageId}/reset-share-history`);
        
        // 2. Clear all local activity states
        // We no longer use setLat or setLng here because coordinates 
        // are now managed within the history array objects.
        setHistory([]);        // Clear the vertical timeline
        setViewCount(0);       // Reset the total counter in the header

        // 4. Success feedback with translation support
        toast.success(response.data.message || tToast('history_cleared_success'));
        
        // 5. Close the shared confirm modal
        setConfirmModal({ isOpen: false, type: null });

    } catch (error) {
        console.error("Reset error:", error);
        toast.error(tToast('failed_to_clear_history'));
    }
};

const handleDownloadQR = () => {
    // 1. Target the SVG inside our specific Ref
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const cleanName = typeof pageName === 'string' 
        ? pageName 
        : (pageName?.name || 'DASHBOARD');

    // 2. Serialize the SVG to XML
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
        // Set high resolution for the download (e.g., 1000px)
        const padding = 40;
        canvas.width = img.width + padding;
        canvas.height = img.height + padding;
        
        if (ctx) {
            // Fill background white (required for PNG visibility)
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, padding / 2, padding / 2);

            // 3. Trigger Download
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            const safeFileName = `${cleanName.toString().replace(/\s+/g, '-').toUpperCase()}-QR.png`;
            downloadLink.download = safeFileName;
            downloadLink.href = pngFile;
            downloadLink.click();
        }
    };

    // Convert SVG string to Base64 for the image source
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
};

const handleShareToTelegram = async () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const cleanName = typeof pageName === 'string' ? pageName : (pageName?.name || 'DASHBOARD');


    img.onload = async () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        
        if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 20, 20);

            // 1. Convert Canvas to Blob
            canvas.toBlob(async (blob) => {
                if (!blob) return;

                // 2. Create a File object
                const file = new File([blob], `${pageName}-QR.png`, { type: 'image/png' });

                // 3. Check if the browser supports sharing files
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: `${cleanName} QR Code`,
                            text: `Scan this to view the latest performance reports for ${pageName}.`,
                        });
                    } catch (error) {
                        console.error('Error sharing:', error);
                    }
                } else {
                    // Fallback: If Web Share API isn't supported, just open the Telegram URL
                    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out the reports for ${pageName}`)}`;
                    window.open(telegramUrl, '_blank');
                }
            }, 'image/png');
        }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
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
                        <Dialog.Panel className="pointer-events-auto w-screen max-w-5xl ">
                            {/* Main Container with Two Columns */}
                            <div>
                                
                                
                                {/* LEFT PANEL - Share/QR Section */}
                                {can('report_facebook_pro') &&(
                                <div className="h-screen w-full bg-white dark:bg-[#0e1726] overflow-y-auto">
                                    
                                    {/* HEADER */}
                                    <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700/50 bg-gradient-to-r from-primary/5 to-transparent">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <IconShare size={20} className="text-primary" />
                                                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {tTitle('share_report')}
                                                    </Dialog.Title>
                                                <p className="text-sky-700 px-2 py-0.5 rounded border text-xs font-bold w-fit bg-sky-100 border-sky-200 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20">
                                                    {getSafePageName(pageName)}
                                                </p>
                                                </div>
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
                                
                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-4">
                                    {loading ? (
                                            <div className="space-y-4 animate-pulse">
                                                {/* Button Skeleton */}
                                                {/* <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" /> */}
                                                
                                                {/* Enhanced Card Skeleton - Active Link */}
                                                <div className="p-4 bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 rounded-2xl border border-emerald-200 dark:border-emerald-500/30">
                                                    <div className="space-y-4">
                                                        {/* Header with badges */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-24" />
                                                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-md w-20" />
                                                            </div>
                                                        </div>
                                                        
                                                        {/* URL Input + Copy Button */}
                                                        <div className="flex gap-2">
                                                            <div className="flex-1 h-10 bg-white dark:bg-gray-900 rounded-lg" />
                                                            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                                                        </div>
                                                        
                                                        {/* Footer */}
                                                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                                                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Card Skeleton 2 */}
                                                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className='space-y-2' >
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                                                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                                                                    </div>
                                                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                                                                </div>
                                                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                                                            </div>
                                                            
                                                        </div>
                                                </div>
                                                
                                    
                                                <div 
                                                    className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-gray-700 animate-pulse"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                                                            <div className="w-[18px] h-[18px] bg-gray-300 dark:bg-gray-600 rounded"></div>
                                                        </div>
                                                        <div className="flex flex-col items-start gap-1.5">
                                                            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                                            <div className="h-2.5 w-24 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                                        </div>
                                                    </div>
                                                    <div className="w-[18px] h-[18px] bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                                </div>
<div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                {/* History icon skeleton */}
                <div className="w-[18px] h-[18px] bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
            </div>
            <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-2.5 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
        </div>
        {/* Reset button skeleton */}
        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>

    {/* Timeline skeleton with 5 items */}
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-100 before:to-transparent dark:before:from-gray-700 dark:before:via-gray-800">
        {[1, 2, 3, 4, 5].map((_, index) => (
            <div key={index} className="relative flex items-center gap-4">
                {/* Timeline dot skeleton */}
                <div className={`absolute left-4 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 z-10 
                    ${index === 0 ? 'animate-pulse bg-gray-400 dark:bg-gray-500' : 'bg-gray-300 dark:bg-gray-600'}`} 
                />
                
                <div className="ml-10 flex-1 bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col gap-3 animate-pulse">
                        {/* Header with arrow time icon */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {/* Arrow time icon (clock with arrow) skeleton */}
                                <div className="relative w-[12px] h-[12px]">
                                    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                </div>
                                <div className="h-2.5 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Device icon skeleton */}
                                <div className="w-[10px] h-[10px] bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-2.5 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>

                        {/* Location with pin icon */}
                        <div className="flex items-center gap-2">
                            {/* Map pin icon skeleton */}
                            <div className="relative w-[12px] h-[12px]">
                               <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            </div>
                            <div className="h-2.5 w-36 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>

                        {/* Map link with external link icon */}
                        <div className="flex items-center gap-1 w-fit">
                            {/* External link icon skeleton */}
                            <div className="relative w-[10px] h-[10px]">
                                <div className="absolute inset-0 border border-gray-200 dark:border-gray-700 rounded-sm"></div>
                                
                            </div>
                            <div className="h-2.5 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        ))}
    </div>
</div>
                                            </div>
                                        ) : (
                                            <>
{!hasToken && (
    <button 
        onClick={handleShareAction}
        disabled={loadingCopy}
        className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition-all duration-300
            ${loadingCopy ? 'bg-gray-400 cursor-wait' : 'bg-primary text-white hover:scale-[1.02] active:scale-95 shadow-primary/20'}
        `}
    >
        {loadingCopy ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
            <>
                <IconShare size={18} />
                <span>{tButton('generate_public_dashboard_link')}</span>
            </>
        )}
    </button>
)}

{isPublic && (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500 transition-all">
        {/* Main Container */}
        <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-white/40 via-white/20 to-white/10 backdrop-blur-xl shadow-lg shadow-emerald-500/5 dark:from-emerald-900/10 dark:via-emerald-900/5 dark:to-emerald-950/5 dark:border-emerald-500/20">
            {/* Liquid Glass Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 via-transparent to-emerald-400/5" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
            </div>
            
            {/* Subtle Animated Shimmer */}
            <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 via-10% to-transparent animate-[shimmer_4s_ease-in-out_infinite] opacity-50" />

            <div className="relative p-5">
                {/* Header with Status Badge */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Live Status Indicator */}
                        <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50" />
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
                            {/* Outer Glow */}
                            <div className="absolute -inset-1 rounded-full bg-emerald-500/20 blur-sm" />
                        </div>
                        
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                                Public Link Active
                            </span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                Real-time tracking enabled
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {/* Telegram Share Button */}
                        <a
                            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative overflow-hidden px-3.5 py-2 rounded-xl bg-gradient-to-br from-sky-500/90 to-blue-600/90 backdrop-blur-sm border border-sky-400/50 hover:border-sky-300/70 shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
                        >
                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            
                            <span className="relative flex items-center gap-2 text-xs font-bold text-white">
                                <IconBrandTelegram size={15} className="drop-shadow-sm" />
                                <span>{tButton('share')}</span>
                            </span>
                        </a>

                        {/* Preview Button */}
                        <button
                            onClick={() => window.open(shareUrl, '_blank')}
                            className="group relative overflow-hidden px-3.5 py-2 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 hover:border-white/60 text-gray-800 hover:text-gray-900 shadow-sm hover:shadow transition-all duration-300 active:scale-95 dark:bg-gray-800/40 dark:border-gray-500/50 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:border-gray-600/70"
                        >
                            {/* Hover Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 opacity-50" />
                            
                            <span className="relative flex items-center gap-2 text-xs font-bold">
                                <IconExternalLink size={14} />
                                <span>{tButton('preview')}</span>
                            </span>
                        </button>
                    </div>
                </div>

                {/* URL Input Section */}
                <div className="mb-4">
                    <div className="flex gap-3">
                        {/* URL Input */}
                        <div className="relative flex-1 group/input">
                            {/* Input Background */}
                            <div className="absolute inset-0 rounded-xl bg-white/40 backdrop-blur-sm border border-white/50 group-hover/input:border-emerald-300/50 transition-colors duration-300 dark:bg-gray-900/40 dark:border-gray-700/50 dark:group-hover/input:border-emerald-500/30" />
                            
                            {/* Shimmer Effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/input:opacity-100 transition-opacity duration-500" />
                            
                            <input 
                                readOnly 
                                value={shareUrl} 
                                className="relative w-full bg-transparent text-blue-700 dark:text-blue-300 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 cursor-pointer select-all caret-transparent"
                                onClick={(e) => {
                                    e.currentTarget.select();
                                    handleShareAction();
                                }}
                                onFocus={(e) => e.target.select()}
                            />
                            
                        </div>

                        {/* Copy Button */}
                        <button 
                            onClick={handleShareAction}
                            disabled={isCopied}
                            className={`group relative overflow-hidden px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${
                                isCopied 
                                    ? 'bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/30' 
                                    : 'bg-gradient-to-br from-emerald-500/90 to-emerald-600/90 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg'
                            }`}
                        >
                            {/* Liquid Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            
                            {/* Button Content */}
                            <span className="relative flex items-center gap-2">
                                {isCopied ? (
                                    <>
                                        <IconCheck size={18} className="animate-in zoom-in-50 duration-200" />
                                        <span className="font-bold">{tButton('copied')}</span>
                                    </>
                                ) : (
                                    <>
                                        <IconCopy size={18} className="drop-shadow-sm" />
                                        <span className="font-bold">{tButton('copy')}</span>
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Footer with Security Info */}
                <div className="pt-4 border-t border-gray/200 dark:border-gray-700/50 flex items-center justify-between">
                    {/* Security Info */}
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-500/10 backdrop-blur-sm border border-emerald-400/20">
                            <IconShieldLock size={16} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-200">
                                Security Advisory
                            </span>
                            <span className="text-[11px] text-gray-600 dark:text-gray-400">
                                Rotate link if shared with unintended recipients
                            </span>
                        </div>
                    </div>

                    {/* Regenerate Button */}
                    <button 
                        onClick={() => openConfirm('regenerate')}
                        className="group relative overflow-hidden px-4 py-2.5 rounded-xl bg-gradient-to-br from-rose-500/10 to-rose-600/10 backdrop-blur-sm border border-rose-400/30 hover:border-rose-400/50 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 transition-all duration-300 active:scale-95 dark:from-rose-500/5 dark:to-rose-600/5 dark:border-rose-500/20"
                    >
                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/10 to-rose-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        
                        <span className="relative flex items-center gap-2 text-xs font-bold">
                            <IconRefresh size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                            <span>{tButton('regenerate')}</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    </div>
)}


{/* Security Toggle Section */}
{hasToken && (
    <div className="relative overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-white/40 via-white/20 to-white/10 backdrop-blur-xl shadow-lg shadow-indigo-500/5 transition-all duration-500 hover:border-indigo-300/50 dark:from-gray-900/30 dark:via-gray-800/20 dark:to-gray-900/10 dark:border-gray-700/50 dark:hover:border-indigo-500/30">
        {/* Liquid Glass Background Effects */}
        <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/[0.03] via-transparent to-indigo-400/[0.03]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent" />
        </div>
        
        {/* Conditional Active Glow */}
        {isPublic && (
            <div className="absolute inset-0 bg-indigo-500/5 blur-xl" />
        )}
        
        {/* Subtle Animated Shimmer */}
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/3 via-10% to-transparent animate-[shimmer_6s_ease-in-out_infinite] opacity-40" />
        
        <div className="relative p-5">
            <div className="flex items-center justify-between">
                {/* Status Info */}
                <div className="flex items-center gap-4">
                    {/* Status Indicator */}
                    <div className="relative">
                        {/* Outer Glow Ring */}
                        <div className={`absolute -inset-2 rounded-full blur-md transition-all duration-500 ${
                            isPublic 
                                ? 'bg-indigo-500/30' 
                                : 'bg-gray-400/20'
                        }`} />
                        
                        {/* Inner Status Circle */}
                        <div className={`relative w-4 h-4 rounded-full transition-all duration-500 ${
                            isPublic 
                                ? 'bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.6)]' 
                                : 'bg-gray-400 dark:bg-gray-500'
                        }`}>
                            {/* Pulsing Effect for Active State */}
                            {isPublic && (
                                <>
                                    <div className="absolute inset-0 rounded-full bg-indigo-500 animate-ping opacity-75" />
                                    <div className="absolute -inset-1 rounded-full bg-indigo-500/20 animate-ping opacity-50" />
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* Status Text */}
                    <div className="flex flex-col">
                        <span className={`text-base font-bold transition-all duration-300 ${
                            isPublic 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300'
                        }`}>
                            {isPublic ? 'Public Access Active' : 'Access Restricted'}
                        </span>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1 uppercase tracking-wider">
                            {isPublic ? 'Real-time tracking enabled' : 'Link is currently inactive'}
                        </span>
                    </div>
                </div>
                
                {/* Enhanced Toggle Switch */}
                <div className="relative">
                    <label className="relative inline-flex items-center cursor-pointer group">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={isPublic} 
                            onChange={handleToggleShare} 
                            disabled={isToggling}
                        />
                        
                        {/* Toggle Container */}
                        <div className={`
                            relative w-14 h-7 rounded-full
                            transition-all duration-300 ease-in-out overflow-hidden
                            ${isPublic 
                                ? 'bg-gradient-to-r from-indigo-500/90 to-indigo-600/90' 
                                : 'bg-gradient-to-r from-gray-300/80 to-gray-400/80 dark:from-gray-700/80 dark:to-gray-800/80'
                            }
                            ${loading ? 'opacity-60 cursor-not-allowed' : ''}
                        `}>
                            {/* Glass Effect Layer */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                            
                            {/* Animated Background on Active State */}
                            <div className={`
                                absolute inset-0 bg-gradient-to-r from-indigo-400/30 via-indigo-400/10 to-indigo-400/30
                                translate-x-[-100%] transition-transform duration-700
                                ${isPublic ? 'group-hover:translate-x-[100%]' : ''}
                            `} />
                            
                            {/* Toggle Knob */}
                            <div className={`
                                absolute top-0.5 left-0.5 w-6 h-6 rounded-full
                                bg-gradient-to-b from-white to-white/90
                                shadow-lg shadow-black/20
                                transition-all duration-300 ease-in-out
                                flex items-center justify-center
                                ${isPublic ? 'translate-x-7' : ''}
                                ${loading ? '' : 'group-hover:scale-105'}
                            `}>
                                {/* Loading Spinner or Icon */}
                                {loading ? (
                                    <div className="w-3 h-3">
                                        <div className="w-full h-full rounded-full border-2 border-gray-300 border-t-indigo-500 animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Lock/Unlock Icon */}
                                        <svg 
                                            className={`w-3 h-3 transition-all duration-300 ${
                                                isPublic 
                                                    ? 'text-indigo-600' 
                                                    : 'text-gray-500 dark:text-gray-400'
                                            }`} 
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            {isPublic ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            )}
                                        </svg>
                                    </>
                                )}
                            </div>
                        
  
                        </div>
                    </label>
                </div>
            </div>
            
            {/* Additional Info */}
            <div className="mt-4 pt-3 border-t border-white/20 dark:border-gray-700/50">
                <div className="flex items-start gap-2">
                    <svg 
                        className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        {isPublic 
                            ? 'Share the generated link with clients for real-time tracking access. Toggle off to instantly revoke access.'
                            : 'Enable public access to generate a secure, shareable tracking link. Clients will see live updates.'
                        }
                    </span>
                </div>
            </div>
        </div>
    </div>
)}                   



{isPublic && (
    <div className="space-y-4">
        <button 
                    onClick={() => setShowQR(!showQR)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary/30 transition-all duration-300 group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <IconQrcode size={18} />
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-black uppercase text-gray-800 dark:text-white">
                                {showQR ? tSpan('hide') : tSpan('show')} {tSpan('instant_qr_code')}
                            </span>
                            <span className="text-[9px] text-gray-500 font-medium">
                                {showQR ? 'Collapse this section' : 'Scan to preview on mobile'}
                            </span>
                        </div>
                    </div>
                    {/* Smooth icon rotation */}
                    <motion.div 
                        animate={{ rotate: showQR ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-gray-400 group-hover:text-primary"
                    >
                        <IconChevronDown size={18} />
                    </motion.div>
                </button>

        {/* Expandable QR Section */}
        <AnimatePresence>
            {showQR && (
                
                <motion.div
                    initial={{ height: 0, opacity: 0, scale: 0.95 }}
                    animate={{ height: 'auto', opacity: 1, scale: 1 }}
                    exit={{ height: 0, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "circOut" }}
                    className="overflow-hidden"
                >
                <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-3xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center gap-2 mb-4">
                        <IconQrcode size={18} className="text-primary" />
                        <span className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">
                            Instant Preview QR
                        </span>
                    </div>

                    <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 group hover:scale-105 transition-transform duration-300 cursor-pointer">
                        <QRCodeSVG 
                            value={shareUrl} 
                            size={256} 
                            level="H" 
                            includeMargin={true}
                            className="w-[140px] h-[140px]" 
                        />
                    </div>
                    
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium px-4 leading-relaxed">
                        Clients can scan this to view their history live on their mobile devices.
                    </p>

                    <div className="flex w-full gap-3 mt-5">
                        {/* Primary Telegram Share */}
                        <button
                            onClick={handleShareToTelegram}
                            className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-xl text-xs font-semibold border text-sky-700 bg-sky-100 border-sky-200 dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/20 hover:bg-sky-200 dark:hover:bg-sky-500/20 transition-all duration-200 active:scale-95"
                        >
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-sky-200/60 dark:bg-sky-500/20">
                                <IconBrandTelegram size={16} />
                            </span>
                            {tButton('share')}
                        </button>

                        {/* Secondary Download */}
                        <button
                            onClick={handleDownloadQR}
                            className="flex-1 flex items-center justify-center px-2 py-2 rounded-xl text-xs font-semibold border text-gray-700 bg-gray-100 border-gray-200 dark:text-gray-300 dark:bg-white/5 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-all duration-200 active:scale-95"
                        >
                            {tButton('download')}
                        </button>
                    </div>
                </div>
                </motion.div>

            )}
        </AnimatePresence>

    </div>
)}

{/* ACTIVITY TIMELINE SECTION */}
{isPublic && (
<div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg text-indigo-500 bg-indigo-50 border border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20">
                        <IconHistory size={18} className='text-' />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-800 dark:text-white">
                            {tSpan('access_history')}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                            {viewCount} {tSpan('total_views')}
                        </span>
                    </div>
                </div>

                {/* Reset Button moved here for a cleaner look */}
                {history && history.length > 0 && (
                <button 
                    onClick={() => openConfirm('reset')}
                    className="text-[10px] font-bold text-gray-400 hover:text-rose-500 uppercase tracking-widest transition-colors"
                >
                    {tButton('reset_log')}
                </button>
                )}
            </div>
       

   
    {history && history.length > 0 ? (
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-100 before:to-transparent dark:before:from-gray-700 dark:before:via-gray-800">
        {history.map((log: any, index: number) => (
            <div key={log.id || index} className="relative flex items-center gap-4 group">
                {/* Pulsating dot for the very latest scan, static for others */}
                <div className={`absolute left-4 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 shadow-sm z-10 
                    ${index === 0 ? 'bg-primary animate-pulse' : 'bg-gray-300 dark:bg-gray-600'}`} 
                />

                <div className="ml-10 flex-1 bg-white dark:bg-gray-900 rounded-2xl p-3 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-primary/30 transition-all duration-300">
                    <div className="flex flex-col gap-1.5">
                        {/* Header: localized time using your existing utility */}
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-primary">
                                {formatNotificationTime(log.accessed_at, t, i18n )}
                            </span>
                            <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase">
                                {log.device === 'Mobile' ? <IconDeviceMobile size={10} /> : <IconDeviceDesktop size={10} />}
                                {log.device}
                            </div>
                        </div>

                        {/* Location Context */}
                        <div className="flex items-center gap-2">
                            <IconMapPin size={12} className={log.location?.includes('GPS') ? "text-emerald-500" : "text-rose-500"} />
                            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 truncate">
                                {log.location || 'Unknown Location'}
                            </span>
                        </div>

                        {/* Precise Map Link - FIXED URL STRUCTURE */}
                        {log.lat && log.lng && (
                            <a 
                                href={`https://www.google.com/maps?q=${log.lat},${log.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[9px] font-bold text-blue-500 hover:underline flex items-center gap-1 w-fit mt-0.5"
                            >
                                <IconExternalLink size={10} /> 
                                {t('link.view_exact_location')}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        ))}
        </div>
    ) : (
        /* Empty State */
        <div className="py-10 text-center bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                No recorded yet
            </p>
        </div>
    )}
</div>
)}


                                    

                                        </>
                                        )}
                                    </div>
                                </div>
                                )}

                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </div>
        </div>
    </Dialog>

</Transition>


<ConfirmationModal
    isOpen={confirmModal.isOpen}
    onClose={() => setConfirmModal({ isOpen: false, type: null })}
    onConfirm={confirmModal.type === 'regenerate' ? processRegenerate : handleResetHistory}
    title={confirmModal.type === 'regenerate' ? "Regenerate Link?" : "Reset Activity Log?"}
    message={
        confirmModal.type === 'regenerate' 
            ? "This will deactivate the current link. All previous QR codes and shared links will stop working immediately."
            : "This will permanently delete all client visit history and GPS logs."
    }
    confirmText={confirmModal.type === 'regenerate' ? "Regenerate" : "Clear History"}
    loading={isRegenerating}
    isDanger={true} 
/>


        </>
    );
};

export default ReportLogDrawer;