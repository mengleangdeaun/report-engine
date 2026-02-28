import { PropsWithChildren, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from './store';
import { toggleRTL, toggleTheme, toggleLocale, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark, setUserPreferences } from './store/themeConfigSlice';
import { setCredentials } from './store/authSlice'; // ✅ 1. Import Auth Action
import store from './store';
import { toast, Toaster } from 'react-hot-toast';
import api from './utils/api'; // ✅ 2. Import API Helper
import CookieConsent from './components/CookieConsent';


function App({ children }: PropsWithChildren) {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();

    // --- EXISTING THEME LOGIC ---
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

    // --- ACCENT COLOR PERSISTENCE ---
    useEffect(() => {
        const apply = () => {
            const accentColor = localStorage.getItem('accentColor');
            if (!accentColor || accentColor === 'blue') {
                // Reset to defaults if blue
                document.body.style.removeProperty('--primary');
                document.body.style.removeProperty('--primary-foreground');
                document.body.style.removeProperty('--secondary');
                document.body.style.removeProperty('--accent');
                document.body.style.removeProperty('--ring');
                document.documentElement.style.removeProperty('--primary');
                document.documentElement.style.removeProperty('--primary-foreground');
                document.documentElement.style.removeProperty('--secondary');
                document.documentElement.style.removeProperty('--accent');
                document.documentElement.style.removeProperty('--ring');
                return;
            }

            const THEME_COLORS: Record<string, { primary: string; secondary: string; accent: string; ring: string; darkPrimary: string; darkSecondary: string; darkAccent: string; darkRing: string }> = {
                sky: { primary: '199 89% 48%', secondary: '199 40% 94%', accent: '199 50% 90%', ring: '199 89% 48%', darkPrimary: '199 89% 52%', darkSecondary: '199 30% 18%', darkAccent: '199 35% 20%', darkRing: '199 89% 52%' },
                indigo: { primary: '239 84% 67%', secondary: '239 40% 94%', accent: '239 50% 92%', ring: '239 84% 67%', darkPrimary: '239 84% 67%', darkSecondary: '239 30% 18%', darkAccent: '239 35% 20%', darkRing: '239 84% 67%' },
                violet: { primary: '263 70% 66%', secondary: '263 40% 94%', accent: '263 50% 92%', ring: '263 70% 66%', darkPrimary: '263 70% 66%', darkSecondary: '263 30% 18%', darkAccent: '263 35% 20%', darkRing: '263 70% 66%' },
                fuchsia: { primary: '292 84% 61%', secondary: '292 40% 94%', accent: '292 50% 92%', ring: '292 84% 61%', darkPrimary: '292 84% 61%', darkSecondary: '292 30% 18%', darkAccent: '292 35% 20%', darkRing: '292 84% 61%' },
                pink: { primary: '330 81% 60%', secondary: '330 40% 94%', accent: '330 50% 92%', ring: '330 81% 60%', darkPrimary: '330 81% 60%', darkSecondary: '330 30% 18%', darkAccent: '330 35% 20%', darkRing: '330 81% 60%' },
                rose: { primary: '347 77% 60%', secondary: '347 40% 94%', accent: '347 50% 92%', ring: '347 77% 60%', darkPrimary: '347 77% 60%', darkSecondary: '347 30% 18%', darkAccent: '347 35% 20%', darkRing: '347 77% 60%' },
                red: { primary: '0 72% 51%', secondary: '0 40% 94%', accent: '0 50% 92%', ring: '0 72% 51%', darkPrimary: '0 72% 55%', darkSecondary: '0 30% 18%', darkAccent: '0 35% 20%', darkRing: '0 72% 55%' },
                orange: { primary: '25 95% 53%', secondary: '25 40% 94%', accent: '25 50% 90%', ring: '25 95% 53%', darkPrimary: '25 95% 53%', darkSecondary: '25 30% 18%', darkAccent: '25 35% 20%', darkRing: '25 95% 53%' },
                amber: { primary: '38 92% 50%', secondary: '38 40% 94%', accent: '38 50% 90%', ring: '38 92% 50%', darkPrimary: '38 92% 50%', darkSecondary: '38 30% 18%', darkAccent: '38 35% 20%', darkRing: '38 92% 50%' },
                lime: { primary: '84 81% 44%', secondary: '84 40% 94%', accent: '84 50% 90%', ring: '84 81% 44%', darkPrimary: '84 81% 50%', darkSecondary: '84 30% 18%', darkAccent: '84 35% 20%', darkRing: '84 81% 50%' },
                emerald: { primary: '160 84% 39%', secondary: '160 40% 94%', accent: '160 50% 90%', ring: '160 84% 39%', darkPrimary: '160 84% 45%', darkSecondary: '160 30% 18%', darkAccent: '160 35% 20%', darkRing: '160 84% 45%' },
                teal: { primary: '174 72% 40%', secondary: '174 40% 94%', accent: '174 50% 90%', ring: '174 72% 40%', darkPrimary: '174 72% 46%', darkSecondary: '174 30% 18%', darkAccent: '174 35% 20%', darkRing: '174 72% 46%' },
                cyan: { primary: '189 94% 43%', secondary: '189 40% 94%', accent: '189 50% 90%', ring: '189 94% 43%', darkPrimary: '189 94% 48%', darkSecondary: '189 30% 18%', darkAccent: '189 35% 20%', darkRing: '189 94% 48%' },
                slate: { primary: '215 16% 47%', secondary: '215 20% 94%', accent: '215 25% 90%', ring: '215 16% 47%', darkPrimary: '215 20% 55%', darkSecondary: '215 15% 18%', darkAccent: '215 18% 20%', darkRing: '215 20% 55%' },
            };

            const color = THEME_COLORS[accentColor];
            if (!color) return;
            const isDark = document.body.classList.contains('dark');
            const targets = [document.documentElement, document.body];
            targets.forEach(el => {
                el.style.setProperty('--primary', isDark ? color.darkPrimary : color.primary);
                el.style.setProperty('--primary-foreground', '0 0% 100%');
                el.style.setProperty('--secondary', isDark ? color.darkSecondary : color.secondary);
                el.style.setProperty('--accent', isDark ? color.darkAccent : color.accent);
                el.style.setProperty('--ring', isDark ? color.darkRing : color.ring);
            });
        };

        // Immediate + delayed to handle theme toggle timing
        apply();
        const timer = setTimeout(apply, 50);
        return () => clearTimeout(timer);
    }, [themeConfig.theme]);


    // --- ✅ NEW: SESSION RESTORATION LOGIC ---
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');

            if (token) {
                // Set the header immediately so the request works
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                try {
                    // Fetch fresh user data (Make sure this endpoint exists in your API!)
                    const res = await api.get('/auth/me');

                    // Save to Redux
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
        <div
            style={{ fontFamily: themeConfig.fontFamily }}
            className={`${(store.getState().themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${themeConfig.rtlClass
                } main-section antialiased relative text-sm font-normal`} >
            {children}
            <Toaster position="top-center" reverseOrder={false} />
            <CookieConsent />
        </div>
    );
}

export default App;