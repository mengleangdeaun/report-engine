import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '@/store';
import { setUserPreferences } from '@/store/themeConfigSlice';
import { IconCookie, IconX, IconShieldCheck, IconCheck } from '@tabler/icons-react';
import api from '@/utils/api';

export default function CookieConsent() {
    const dispatch = useDispatch();
    const cookieConsent = useSelector((state: IRootState) => state.themeConfig.cookieConsent);
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        // Small delay for slide-up animation
        if (cookieConsent === 'pending') {
            const timer = setTimeout(() => setVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, [cookieConsent]);

    // Already consented — don't render at all
    if (cookieConsent !== 'pending') return null;

    const handleConsent = async (value: 'accepted' | 'essential') => {
        setExiting(true);
        setTimeout(() => {
            dispatch(setUserPreferences({ cookie_consent: value }));

            // If logged in, persist to backend
            const token = localStorage.getItem('token');
            if (token) {
                api.put('/user/preferences', {
                    preferences: { cookie_consent: value },
                }).catch(() => {/* silent — localStorage is source of truth here */ });
            }
        }, 300);
    };

    const handleDismiss = () => {
        setExiting(true);
        setTimeout(() => setVisible(false), 300);
    };

    if (!visible) return null;

    return (
        <div
            className={`fixed top-0 inset-x-0 z-[9999]  p-4 sm:p-6 transition-all duration-500 ease-out ${exiting ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
                }`}
        >
            <div className="max-w-4xl mx-auto">
                <div className="relative rounded-2xl border border-gray-200/70 dark:border-gray-700/60 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden">

                    {/* Accent top bar */}
                    <div className="h-3 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600" />

                    <div className="p-5 sm:p-6">
                        <div className="flex gap-4 items-start">

                            {/* Icon */}
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/30">
                                <IconCookie size={22} className="text-amber-600 dark:text-amber-400" />
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">
                                    We value your privacy 🍪
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                                    We use cookies to enhance your experience, remember your preferences, and improve our service.
                                    You can choose to accept all cookies or limit to essential ones only.
                                </p>
                                {/* Learn more link */}
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                    You can update your cookie preferences anytime in{' '}
                                    <a href="/settings/preferences" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium hover:underline">
                                        User Preferences
                                    </a>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom action bar */}
                    <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-end gap-2.5">
                        <button
                            onClick={() => handleConsent('essential')}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:shadow-sm"
                        >
                            <IconShieldCheck size={15} />
                            Essential Only
                        </button>
                        <button
                            onClick={() => handleConsent('accepted')}
                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 dark:from-emerald-500 dark:to-emerald-400 dark:hover:from-emerald-600 dark:hover:to-emerald-500 transition-all duration-200 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30"
                        >
                            <IconCheck size={15} />
                            Accept All
                        </button>
                    </div>

                    {/* Dismiss button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="Dismiss"
                    >
                        <IconX size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
