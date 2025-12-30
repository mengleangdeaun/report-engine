import { PropsWithChildren, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from './store';
import { toggleRTL, toggleTheme, toggleLocale, toggleMenu, toggleLayout, toggleAnimation, toggleNavbar, toggleSemidark } from './store/themeConfigSlice';
import { setCredentials } from './store/authSlice'; // ✅ 1. Import Auth Action
import store from './store';
import { toast, Toaster } from 'react-hot-toast'; 
import api from './utils/api'; // ✅ 2. Import API Helper


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
                    
                } catch (error) {
                    console.error("Session invalid or expired");
                }
            }
        };

        checkAuth();
    }, [dispatch]);


    return (
        <div
            className={`${(store.getState().themeConfig.sidebar && 'toggle-sidebar') || ''} ${themeConfig.menu} ${themeConfig.layout} ${
                themeConfig.rtlClass
            } main-section antialiased relative font-nunito text-sm font-normal`} >
            {children}
            <Toaster position="top-center" reverseOrder={false} />
        </div>
    );
}

export default App;