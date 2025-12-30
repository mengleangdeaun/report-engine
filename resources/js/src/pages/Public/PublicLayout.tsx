import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconSun, IconMoon, IconLanguage } from '@tabler/icons-react';

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
    const { t, i18n } = useTranslation();
    
    // Initialize state from localStorage immediately to avoid flicker
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    // 🔥 This Effect ensures the DOM updates INSTANTLY when state changes
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
            <header className="bg-white dark:bg-[#0e1726] border-b border-gray-200 dark:border-gray-800 py-3 sticky top-0 z-50">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">REPORT</div>
                        <span className="text-xl font-black uppercase dark:text-white"><span className="text-primary">Insights</span></span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Theme Toggle Button */}
                        <button 
                            onClick={toggleTheme}
                            className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 transition-all hover:text-primary"
                        >
                            {isDarkMode ? <IconSun size={20} className="text-yellow-400" /> : <IconMoon size={20} className="text-gray-500" />}
                        </button>

                        {/* Language Toggle Button */}
                        <button 
                            onClick={toggleLanguage}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 transition-all"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest dark:text-white">
                                {i18n.language === 'en' ? 'English' : 'ភាសាខ្មែរ'}
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto px-4 py-8">{children}</main>

            {/* Footer */}
            <footer className="py-10 text-center border-t border-gray-200 dark:border-gray-800 mt-20 transition-colors">
                <p className="text-sm text-gray-500 italic">© {new Date().getFullYear()} Degrand Solution. All rights reserved.</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <div className="h-[1px] w-8 bg-gray-200 dark:bg-gray-800"></div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">Analytics Engine v1.0</p>
                    <div className="h-[1px] w-8 bg-gray-200 dark:bg-gray-800"></div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;