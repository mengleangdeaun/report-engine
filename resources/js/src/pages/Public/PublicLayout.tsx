import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSun, IconMoon, IconLanguage } from '@tabler/icons-react';

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
    const { t, i18n } = useTranslation();
    
    // Initialize state from localStorage immediately to avoid flicker
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

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
            {/* Header - Mobile First */}
            <header className="bg-white dark:bg-[#0e1726] border-b border-gray-200 dark:border-gray-800 py-3 md:py-4 sticky top-0 z-50">
                <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
                    {/* Logo/Brand */}
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-20 h-7 md:w-24 md:h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-base">
                            REPORT
                        </div>
                        <span className="text-lg md:text-xl font-black uppercase dark:text-white">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">Insights</span>
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 md:gap-3">
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
                            <IconLanguage size={16} className="md:w-4 md:h-4 text-gray-600 dark:text-gray-400" />
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider dark:text-white">
                                {i18n.language === 'en' ? 'EN' : 'KH'}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto px-4 md:px-6 py-6 md:py-8 max-w-7xl">
                {children}
            </main>

            {/* Footer - Mobile Optimized */}
            <footer className="py-8 md:py-10 text-center border-t border-gray-200 dark:border-gray-800 mt-12 md:mt-20">
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} Degrand Solution. All rights reserved.
                </p>
                <div className="flex items-center justify-center gap-2 md:gap-3 mt-3 md:mt-4">
                    <div className="h-px w-6 md:w-8 bg-gray-200 dark:bg-gray-800"></div>
                    <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                        Analytics Engine v1.0
                    </p>
                    <div className="h-px w-6 md:w-8 bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;