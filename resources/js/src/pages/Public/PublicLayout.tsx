import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSun, IconMoon, IconLanguage, IconHelpCircle, IconX } from '@tabler/icons-react';

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
    const { t, i18n } = useTranslation();
    
    // Initialize state from localStorage immediately to avoid flicker
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const [showHelp, setShowHelp] = useState(false);

    // Theme effect
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);
    const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'en' ? 'kh' : 'en');

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#060818] text-black dark:text-white transition-colors duration-300">
            {/* Help Tooltip */}
            {showHelp && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard Help Guide</h3>
                            <button 
                                onClick={() => setShowHelp(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <IconX size={20} />
                            </button>
                        </div>
                        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Navigation</h4>
                                <p>• Use the calendar icon to switch between reports</p>
                                <p>• Click on any metric card for detailed breakdown</p>
                                <p>• Export data using the Export Report button</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Interactions</h4>
                                <p>• Hover over charts for detailed values</p>
                                <p>• Click on table rows to view original posts</p>
                                <p>• Use filters to customize your view</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Tips</h4>
                                <p>• Data updates automatically every 24 hours</p>
                                <p>• Share dashboard using the share button</p>
                                <p>• Switch between light/dark mode for comfort</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <header className="bg-white/70 dark:bg-[#0e1726]/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 py-3 md:py-4 sticky top-0 z-50 shadow-sm dark:shadow-gray-900/20">
                <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
                    {/* Logo/Brand */}
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-20 h-7 md:w-24 md:h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base">
                            REPORT
                        </div>
                        <span className="text-lg md:text-xl font-black uppercase dark:text-white">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">Insights</span>
                        </span>
                        <span className="hidden md:inline text-xs text-gray-500 dark:text-gray-400 ml-2">
                            Professional Analytics Dashboard
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Help Button */}
                        <button
                            onClick={() => setShowHelp(true)}
                            className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 transition-all hover:scale-105 active:scale-95"
                            aria-label="Show help guide"
                        >
                            <IconHelpCircle size={18} className="md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
                        </button>

                        {/* Theme Toggle */}
                        <button 
                            onClick={toggleTheme}
                            className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 transition-all hover:scale-105 active:scale-95"
                            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {isDarkMode ? 
                                <IconSun size={18} className="md:w-5 md:h-5 text-yellow-400" /> : 
                                <IconMoon size={18} className="md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
                            }
                        </button>

                        {/* Language Toggle */}
                        <button 
                            onClick={toggleLanguage}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 transition-all hover:scale-105 active:scale-95"
                            aria-label="Toggle language"
                        >
                            <IconLanguage size={16} className="md:w-5 md:h-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider dark:text-white">
                                {i18n.language === 'en' ? 'EN' : 'KH'}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto px-4 md:px-6 py-6 md:py-8 max-w-screen-2xl">
                {children}
            </main>

            {/* Footer - Mobile Optimized */}
            <footer className="py-8 md:py-10 border-t border-gray-200 dark:border-gray-800 mt-12 md:mt-20">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className='flex flex-col items-center' >
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                                © {new Date().getFullYear()} Degrand Solution. All rights reserved.
                            </p>
                            {/* <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Data updated daily • Last refresh: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p> */}
                        </div>
                        
                        <div className="flex flex-col items-center gap-3">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="h-px w-6 md:w-8 bg-gray-200 dark:bg-gray-800"></div>
                                <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                                    Analytics Engine v1.0
                                </p>
                                <div className="h-px w-6 md:w-8 bg-gray-200 dark:bg-gray-800"></div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => window.print()}
                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    Print Report
                                </button>
                                <button 
                                    onClick={() => setShowHelp(true)}
                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    Get Help
                                </button>
                                <a 
                                    href="#"
                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    Privacy
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
