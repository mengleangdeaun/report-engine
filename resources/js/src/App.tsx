import { PropsWithChildren, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from './store';
import { toggleRTL, toggleTheme, toggleLocale, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark, setUserPreferences } from './store/themeConfigSlice';
import { setCredentials } from './store/authSlice';
import store from './store';
import { toast, Toaster } from 'react-hot-toast';
import api from './utils/api';
import CookieConsent from './components/CookieConsent';
import { THEME_COLORS } from './constants/themeColors'; // ✅ Import full color definitions
import { ScrollArea } from './components/ui/scroll-area';

// Helper: HSL to CSS string
function hslToString(h: number, s: number, l: number): string {
    return `${h} ${s}% ${l}%`;
}

function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();

    // --- EXISTING THEME LOGIC (unchanged) ---
    useEffect(() => {
        dispatch(toggleTheme(localStorage.getItem('theme') || themeConfig.theme));
        dispatch(toggleMenu(localStorage.getItem('menu') || themeConfig.menu));
        dispatch(toggleLayout(localStorage.getItem('layout') || themeConfig.layout));
        dispatch(toggleRTL(localStorage.getItem('rtlClass') || themeConfig.rtlClass));
        dispatch(toggleAnimation(localStorage.getItem('animation') || themeConfig.animation));
        dispatch(toggleNavbar(localStorage.getItem('navbar') || themeConfig.navbar));
        dispatch(toggleLocale(localStorage.getItem('i18nextLng') || themeConfig.locale));
        dispatch(toggleSemidark(localStorage.getItem('semidark') || themeConfig.semidark));
    }, [dispatch, themeConfig.theme, themeConfig.menu, themeConfig.layout, themeConfig.rtlClass, themeConfig.animation, themeConfig.navbar, themeConfig.locale, themeConfig.semidark]);

    // --- ENHANCED ACCENT COLOR PERSISTENCE (supports custom colors) ---
    useEffect(() => {
        const applyAccentColor = () => {
            const accentColor = localStorage.getItem('accentColor');
            const isDark = document.body.classList.contains('dark');
            const targets = [document.documentElement, document.body];

            // If no accent color stored or it's blue (default), reset to default values
            if (!accentColor || accentColor === 'blue') {
                targets.forEach(el => {
                    el.style.removeProperty('--primary');
                    el.style.removeProperty('--primary-foreground');
                    el.style.removeProperty('--secondary');
                    el.style.removeProperty('--accent');
                    el.style.removeProperty('--ring');
                });
                return;
            }

            // Handle custom color
            if (accentColor === 'custom') {
                const customRaw = localStorage.getItem('customPrimaryColor');
                if (!customRaw) return;
                try {
                    const custom = JSON.parse(customRaw) as { h: number; s: number; l: number };
                    const h = custom.h;
                    // Use the same derivation logic as in UserPreferences
                    const primary = hslToString(h, custom.s, custom.l);
                    let secondary: string, accent: string, ring: string;
                    if (isDark) {
                        secondary = hslToString(h, 30, 18);
                        accent = hslToString(h, 35, 20);
                        ring = primary;
                    } else {
                        secondary = hslToString(h, 40, 94);
                        accent = hslToString(h, 50, 90);
                        ring = primary;
                    }
                    targets.forEach(el => {
                        el.style.setProperty('--primary', primary);
                        el.style.setProperty('--primary-foreground', '0 0% 100%');
                        el.style.setProperty('--secondary', secondary);
                        el.style.setProperty('--accent', accent);
                        el.style.setProperty('--ring', ring);
                    });
                } catch (e) {
                    console.error('Failed to parse custom color', e);
                }
                return;
            }

            // Handle preset colors
            const color = THEME_COLORS.find(c => c.value === accentColor);
            if (!color) return;

            targets.forEach(el => {
                el.style.setProperty('--primary', isDark ? color.darkPrimary : color.primary);
                el.style.setProperty('--primary-foreground', '0 0% 100%');
                el.style.setProperty('--secondary', isDark ? color.darkSecondary : color.secondary);
                el.style.setProperty('--accent', isDark ? color.darkAccent : color.accent);
                el.style.setProperty('--ring', isDark ? color.darkRing : color.ring);
            });
        };

        // Apply immediately and also after a short delay to catch theme toggle timing issues
        applyAccentColor();
        const timer = setTimeout(applyAccentColor, 50);
        return () => clearTimeout(timer);
    }, [themeConfig.theme]); // Re-run when theme (light/dark) changes

    // --- SESSION RESTORATION LOGIC (unchanged) ---
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                try {
                    const res = await api.get('/auth/me');
                    dispatch(setCredentials({
                        user: res.data,
                        token: token
                    }));

                    if (res.data?.preferences) {
                        dispatch(setUserPreferences(res.data.preferences));
                    }
                } catch (error) {
                    console.error("Session invalid or expired");
                }
            }
        };

        checkAuth();
    }, [dispatch]);

    return (
        <ScrollArea className="h-screen w-full">
            <div
                style={{ fontFamily: themeConfig.fontFamily }}
                className={`${(store.getState().themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${themeConfig.rtlClass
                    } main-section antialiased relative text-sm font-normal`}
            >
                {children}
                <Toaster position="top-center" reverseOrder={false} />
                <CookieConsent />
            </div>
        </ScrollArea>
    );
}

export default App;