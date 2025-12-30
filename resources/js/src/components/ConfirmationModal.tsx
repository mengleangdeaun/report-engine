import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { IconAlertTriangle, IconX, IconLoader2, IconTrash, IconRefresh } from '@tabler/icons-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    loading?: boolean;
    isDanger?: boolean;
}

export const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = "Confirm",
    loading = false,
    isDanger = false
}: Props) => {
    // Color scheme based on danger level
    const colors = isDanger ? {
        primary: 'rose',
        iconColor: 'text-rose-600 dark:text-rose-400',
        iconBgFrom: 'from-rose-100/60 dark:from-rose-900/30',
        iconBgTo: 'to-rose-50/40 dark:to-rose-800/20',
        iconBorder: 'border-rose-200/50 dark:border-rose-700/30',
        iconRing: 'border-rose-300/50 dark:border-rose-600/30',
        buttonFrom: 'from-rose-500/90 dark:from-rose-600/90',
        buttonTo: 'to-rose-600/90 dark:to-rose-700/90',
        buttonHoverFrom: 'from-rose-600 dark:from-rose-700',
        buttonHoverTo: 'to-rose-700 dark:to-rose-800',
        buttonBorder: 'border-rose-400/50 dark:border-rose-500/30',
        glow: 'bg-rose-500/20 dark:bg-rose-600/20',
        accent: 'rose-400/30 dark:rose-500/20'
    } : {
        primary: 'amber',
        iconColor: 'text-amber-600 dark:text-amber-400',
        iconBgFrom: 'from-amber-100/60 dark:from-amber-900/30',
        iconBgTo: 'to-amber-50/40 dark:to-amber-800/20',
        iconBorder: 'border-amber-200/50 dark:border-amber-700/30',
        iconRing: 'border-amber-300/50 dark:border-amber-600/30',
        buttonFrom: 'from-amber-500/90 dark:from-amber-600/90',
        buttonTo: 'to-amber-600/90 dark:to-amber-700/90',
        buttonHoverFrom: 'from-amber-600 dark:from-amber-700',
        buttonHoverTo: 'to-amber-700 dark:to-amber-800',
        buttonBorder: 'border-amber-400/50 dark:border-amber-500/30',
        glow: 'bg-amber-500/20 dark:bg-amber-600/20',
        accent: 'amber-400/30 dark:amber-500/20'
    };

    // Icon based on action type
    const getActionIcon = () => {
        if (confirmText.toLowerCase().includes('regenerate') || confirmText.toLowerCase().includes('refresh')) {
            return <IconRefresh size={32} className={colors.iconColor} strokeWidth={1.5} />;
        }
        if (confirmText.toLowerCase().includes('delete') || confirmText.toLowerCase().includes('clear')) {
            return <IconTrash size={32} className={colors.iconColor} strokeWidth={1.5} />;
        }
        return <IconAlertTriangle size={32} className={colors.iconColor} strokeWidth={1.5} />;
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[999]" onClose={() => !loading && onClose()}>
                {/* Enhanced Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-500"
                    enterFrom="opacity-0 backdrop-blur-0"
                    enterTo="opacity-100 backdrop-blur-xl"
                    leave="ease-in duration-300"
                    leaveFrom="opacity-100 backdrop-blur-xl"
                    leaveTo="opacity-0 backdrop-blur-0"
                >
                    <div className="fixed inset-0 bg-gradient-to-br from-gray-900/40 via-gray-800/30 to-black/20 backdrop-blur-xl dark:from-gray-950/60 dark:via-gray-900/40 dark:to-black/50" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-500"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-300"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="relative w-full max-w-md transition-all">
                                {/* Liquid Glass Background */}
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/70 via-white/40 to-white/20 backdrop-blur-3xl border border-white/40 shadow-2xl shadow-black/10 dark:from-gray-900/80 dark:via-gray-800/40 dark:to-gray-900/20 dark:border-white/20" />
                                
                                {/* Shimmer Effect */}
                                <div className="absolute inset-0 rounded-3xl overflow-hidden">
                                    <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 via-10% to-transparent animate-[shimmer_4s_ease-in-out_infinite] dark:via-white/3" />
                                </div>
                                
                                {/* Main Content Container */}
                                <div className="relative rounded-3xl bg-gradient-to-b from-white/20 to-white/10 p-8 backdrop-blur-xl border border-white/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.3)] dark:from-gray-800/30 dark:to-gray-900/30 dark:border-white/10 dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
                                    {/* Close Button */}
                                    <button
                                        onClick={onClose}
                                        disabled={loading}
                                        className="absolute top-5 right-5 p-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/30 hover:text-gray-900 hover:scale-110 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 dark:bg-gray-800/40 dark:border-gray-700/50 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-gray-100"
                                        aria-label="Close"
                                    >
                                        <IconX size={18} />
                                    </button>
                                    
                                    <div className="flex flex-col items-center text-center">
                                        {/* Action Icon */}
                                        <div className="relative mb-6">
                                            
                                            {/* Icon Container */}
                                            <div className={`relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.iconBgFrom} ${colors.iconBgTo} backdrop-blur-lg border-2 ${colors.iconBorder}`}>
                                                
                                                {/* Icon */}
                                                {getActionIcon()}
                                                
                                            </div>
                                        </div>
                                        
                                        {/* Title */}
                                        <Dialog.Title 
                                            as="h3" 
                                            className="text-2xl font-bold text-gray-900 mb-3 leading-tight dark:text-white"
                                        >
                                            {title}
                                        </Dialog.Title>
                                        
                                        {/* Message */}
                                        <div className="mt-4 w-full px-4 py-4 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 dark:bg-gray-800/30 dark:border-gray-700/50">
                                            <p className="text-sm text-gray-700 leading-relaxed dark:text-gray-300">
                                                {message}
                                            </p>
                                        </div>


                                        {/* Action Buttons */}
                                        <div className="mt-8 flex w-full gap-4">
                                            {/* Cancel Button */}
                                            <button
                                                type="button"
                                                onClick={onClose}
                                                disabled={loading}
                                                className="group relative flex-1 py-3.5 px-4 rounded-xl border border-gray-300/50 bg-white/40 backdrop-blur-sm text-gray-700 hover:bg-white/60 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600/50 dark:bg-gray-800/40 dark:text-gray-300 dark:hover:bg-gray-700/50 dark:hover:text-gray-100 dark:focus-visible:ring-gray-400/50"
                                            >
                                                <span className="relative font-semibold text-sm">
                                                    Cancel
                                                </span>
                                            </button>
                                            
                                            {/* Confirm Button */}
                                            <button
                                                type="button"
                                                disabled={loading}
                                                onClick={onConfirm}
                                                className={`group relative flex-1 py-3.5 px-4 rounded-xl border ${colors.buttonBorder} bg-gradient-to-r ${colors.buttonFrom} ${colors.buttonTo} backdrop-blur-sm text-white hover:${colors.buttonHoverFrom} hover:${colors.buttonHoverTo} focus:outline-none focus-visible:ring-2 focus-visible:ring-${colors.primary}-500/50 focus-visible:ring-offset-1 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed`}
                                            >
                                                {/* Hover Glow */}
                                                <div className={`absolute inset-0 rounded-xl bg-${colors.primary}-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                                
                                                {/* Button Content */}
                                                <span className="relative flex items-center justify-center gap-2 font-semibold text-sm">
                                                    {loading ? (
                                                        <>
                                                            <IconLoader2 className="w-4 h-4 animate-spin" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            {confirmText}
                                                        </>
                                                    )}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Outer Glow */}
                                <div className={`absolute -inset-2 bg-gradient-to-r from-${colors.primary}-400/10 via-transparent to-${colors.primary}-400/10 blur-xl rounded-3xl -z-10`} />
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};