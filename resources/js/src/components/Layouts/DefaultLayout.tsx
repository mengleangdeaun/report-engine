import { PropsWithChildren, Suspense, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import App from '../../App';
import { IRootState } from '../../store';
import { toggleSidebar } from '../../store/themeConfigSlice';
import Footer from './Footer';
import Header from './Header';
import Setting from './Setting';
import Sidebar from './Sidebar';
import Portals from '../../components/Portals';
import { useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { PERMISSIONS_UPDATED_EVENT } from '../../hooks/usePermission';

import toast from 'react-hot-toast';

const DefaultLayout = ({ children }: PropsWithChildren) => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();
    const location = useLocation();
    const [showLoader, setShowLoader] = useState(true);
    const [showTopButton, setShowTopButton] = useState(false);

    const goToTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    const onScrollHandler = () => {
        if (document.body.scrollTop > 50 || document.documentElement.scrollTop > 50) {
            setShowTopButton(true);
        } else {
            setShowTopButton(false);
        }
    };

    useEffect(() => {
        window.addEventListener('scroll', onScrollHandler);

        const screenLoader = document.getElementsByClassName('screen_loader');
        if (screenLoader?.length) {
            screenLoader[0].classList.add('animate__fadeOut');
            setTimeout(() => {
                setShowLoader(false);
            }, 200);
        }

        return () => {
            window.removeEventListener('onscroll', onScrollHandler);
        };
    }, []);

    const [userId, setUserId] = useState<number | null>(null);

    useEffect(() => {
        const refreshUserData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Always try to get user data to ensure we have the ID for Echo
            // Even if permissions exist, we might not have stored ID
            try {
                const response = await api.get('/auth/me');
                const { user, permissions } = response.data;
                setUserId(user.id); // Set User ID for Echo

                // Only update permissions if missing? Or always?
                const existingPerms = localStorage.getItem('permissions');
                if (!existingPerms || JSON.parse(existingPerms).length === 0) {
                    localStorage.setItem('permissions', JSON.stringify(permissions || []));
                    window.dispatchEvent(new Event('permissions-updated'));
                }
            } catch (error) {
                console.error("Refresh failed", error);
            }
        };

        refreshUserData();
    }, [location.pathname]);

    useEffect(() => {
        // Listen for Real-Time Notifications on Private Channel
        if (window.Echo && userId) {
            // Re-configure auth header just in case token changed or wasn't there at init
            window.Echo.connector.options.auth.headers.Authorization = 'Bearer ' + localStorage.getItem('token');

            const channelName = `App.Models.User.${userId}`;
            console.log('Listening to channel:', channelName);

            window.Echo.private(channelName)
                .notification((notification: any) => {
                    console.log('Notification received:', notification);

                    // Handle different notification types if structure varies
                    const title = notification.title || notification.action || 'Notification';
                    const message = notification.message || notification.description || 'You have a new notification.';

                    toast.success(`${title}: ${message}`, {
                        duration: 5000,
                        position: 'top-right',
                    });
                });

            return () => {
                window.Echo.leave(channelName);
            };
        }
    }, [userId]); // Only run when userId is available

    return (
        <App>
            {/* BEGIN MAIN CONTAINER */}
            <div className="relative">
                {/* sidebar menu overlay */}
                <div className={`${(!themeConfig.sidebar && 'hidden') || ''} fixed inset-0 bg-[black]/60 z-50 lg:hidden`} onClick={() => dispatch(toggleSidebar())}></div>
                {/* screen loader */}
                {showLoader && (
                    <div className="screen_loader fixed inset-0 bg-[#fafafa] dark:bg-[#060818] z-[60] grid place-content-center animate__animated">
                        <svg width="64" height="64" viewBox="0 0 135 135" xmlns="http://www.w3.org/2000/svg" fill="#4361ee">
                            <path d="M67.447 58c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm9.448 9.447c0 5.523 4.477 10 10 10 5.522 0 10-4.477 10-10s-4.478-10-10-10c-5.523 0-10 4.477-10 10zm-9.448 9.448c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zM58 67.447c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10z">
                                <animateTransform attributeName="transform" type="rotate" from="0 67 67" to="-360 67 67" dur="2.5s" repeatCount="indefinite" />
                            </path>
                            <path d="M28.19 40.31c6.627 0 12-5.374 12-12 0-6.628-5.373-12-12-12-6.628 0-12 5.372-12 12 0 6.626 5.372 12 12 12zm30.72-19.825c4.686 4.687 12.284 4.687 16.97 0 4.686-4.686 4.686-12.284 0-16.97-4.686-4.687-12.284-4.687-16.97 0-4.687 4.686-4.687 12.284 0 16.97zm35.74 7.705c0 6.627 5.37 12 12 12 6.626 0 12-5.373 12-12 0-6.628-5.374-12-12-12-6.63 0-12 5.372-12 12zm19.822 30.72c-4.686 4.686-4.686 12.284 0 16.97 4.687 4.686 12.285 4.686 16.97 0 4.687-4.686 4.687-12.284 0-16.97-4.685-4.687-12.283-4.687-16.97 0zm-7.704 35.74c-6.627 0-12 5.37-12 12 0 6.626 5.373 12 12 12s12-5.374 12-12c0-6.63-5.373-12-12-12zm-30.72 19.822c-4.686-4.686-12.284-4.686-16.97 0-4.686 4.687-4.686 12.285 0 16.97 4.686 4.687 12.284 4.687 16.97 0 4.687-4.685 4.687-12.283 0-16.97zm-35.74-7.704c0-6.627-5.372-12-12-12-6.626 0-12 5.373-12 12s5.374 12 12 12c6.628 0 12-5.373 12-12zm-19.823-30.72c4.687-4.686 4.687-12.284 0-16.97-4.686-4.686-12.284-4.686-16.97 0-4.687 4.686-4.687 12.284 0 16.97 4.686 4.687 12.284 4.687 16.97 0z">
                                <animateTransform attributeName="transform" type="rotate" from="0 67 67" to="360 67 67" dur="8s" repeatCount="indefinite" />
                            </path>
                        </svg>
                    </div>
                )}
                <div className="fixed bottom-6 ltr:right-6 rtl:left-6 z-50">
                    {showTopButton && (
                        <button type="button" className="btn btn-outline-primary rounded-full p-2 animate-pulse bg-[#fafafa] dark:bg-[#060818] dark:hover:bg-primary" onClick={goToTop}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l4-4m0 0l4 4m-4-4v18" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* BEGIN APP SETTING LAUNCHER */}
                <Setting />
                {/* END APP SETTING LAUNCHER */}

                <div className={`${themeConfig.navbar} main-container text-black dark:text-white-dark min-h-screen`}>
                    {/* BEGIN SIDEBAR */}
                    <Sidebar />
                    {/* END SIDEBAR */}

                    <div className="main-content flex flex-col min-h-screen">
                        {/* BEGIN TOP NAVBAR */}
                        <Header />
                        {/* END TOP NAVBAR */}

                        {/* BEGIN CONTENT AREA */}
                        <Suspense>
                            <div className={`${themeConfig.animation} p-6 animate__animated`}>{children}</div>
                        </Suspense>
                        {/* END CONTENT AREA */}

                        {/* BEGIN FOOTER */}
                        <Footer />
                        {/* END FOOTER */}
                        <Portals />
                    </div>
                </div>
            </div>
        </App>
    );
};

export default DefaultLayout;
