import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import AnimateHeight from 'react-animate-height';
import { IRootState } from '../../store';
import { useState, useEffect, useMemo } from 'react';
import usePermission from '../../hooks/usePermission'; // Import the hook


interface UserProfile {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const [errorSubMenu, setErrorSubMenu] = useState(false);
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };
    const { can } = usePermission();

    // Inside Sidebar.tsx
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = () => {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                setUser(parsed.user || parsed); // Handle nesting
            }
        };
        loadUser();
        window.addEventListener('permissions-updated', loadUser);
        return () => window.removeEventListener('permissions-updated', loadUser);
    }, []);

    const isAdmin = useMemo(() => {
        if (!user || !user.roles) return false;
        return user.roles.includes('admin');
    }, [user]);




    useEffect(() => {
        const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link') || [];
                if (ele.length) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele.click();
                    });
                }
            }
        }
    }, []);




    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-8 ml-[5px] flex-none" src="/assets/images/logo.png" alt="logo" />
                            <span className="text-xl ltr:ml-1.5 rtl:mr-1.5 font-semibold align-middle lg:inline dark:text-white-light">{t('Report Engine')}</span>
                        </NavLink>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 m-auto">
                                <path d="M13 19L7 12L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path opacity="0.5" d="M16.9998 19L10.9998 12L16.9998 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'dashboard' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('dashboard')}>
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                opacity="0.5"
                                                d="M2 12.2039C2 9.91549 2 8.77128 2.5192 7.82274C3.0384 6.87421 3.98695 6.28551 5.88403 5.10813L7.88403 3.86687C9.88939 2.62229 10.8921 2 12 2C13.1079 2 14.1106 2.62229 16.116 3.86687L18.116 5.10812C20.0131 6.28551 20.9616 6.87421 21.4808 7.82274C22 8.77128 22 9.91549 22 12.2039V13.725C22 17.6258 22 19.5763 20.8284 20.7881C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.7881C2 19.5763 2 17.6258 2 13.725V12.2039Z"
                                                fill="currentColor"
                                            />
                                            <path
                                                d="M9 17.25C8.58579 17.25 8.25 17.5858 8.25 18C8.25 18.4142 8.58579 18.75 9 18.75H15C15.4142 18.75 15.75 18.4142 15.75 18C15.75 17.5858 15.4142 17.25 15 17.25H9Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('dashboard')}</span>
                                    </div>

                                    <div className={currentMenu === 'dashboard' ? 'rotate-90' : 'rtl:rotate-180'}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'dashboard' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/admin/dashboard">{t('dashboard')}</NavLink>
                                        </li>
                                    </ul>
                                </AnimateHeight>
                            </li>

                            {isAdmin && (
                                <li className="menu nav-item">
                                    <button type="button" className={`${currentMenu === 'sys-config' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('sys-config')}>
                                        <div className="flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M14.2788 2.15224C13.9085 2 13.439 2 12.5 2C11.561 2 11.0915 2 10.7212 2.15224C10.2274 2.35523 9.83509 2.74458 9.63056 3.23463C9.53719 3.45834 9.50065 3.7185 9.48635 4.09799C9.46534 4.65568 9.17716 5.17189 8.69017 5.45093C8.20318 5.72996 7.60864 5.71954 7.11149 5.45876C6.77318 5.2813 6.52789 5.18262 6.28599 5.15102C5.75609 5.08178 5.22018 5.22429 4.79616 5.5472C4.47814 5.78938 4.24339 6.1929 3.7739 6.99993C3.30441 7.80697 3.06967 8.21048 3.01735 8.60491C2.94758 9.1308 3.09118 9.66266 3.41655 10.0835C3.56506 10.2756 3.77377 10.437 4.0977 10.639C4.57391 10.936 4.88032 11.4419 4.88029 12C4.88026 12.5581 4.57386 13.0639 4.0977 13.3608C3.77372 13.5629 3.56497 13.7244 3.41645 13.9165C3.09108 14.3373 2.94749 14.8691 3.01725 15.395C3.06957 15.7894 3.30432 16.193 3.7738 17C4.24329 17.807 4.47804 18.2106 4.79606 18.4527C5.22008 18.7756 5.75599 18.9181 6.28589 18.8489C6.52778 18.8173 6.77305 18.7186 7.11133 18.5412C7.60852 18.2804 8.2031 18.27 8.69012 18.549C9.17714 18.8281 9.46533 19.3443 9.48635 19.9021C9.50065 20.2815 9.53719 20.5417 9.63056 20.7654C9.83509 21.2554 10.2274 21.6448 10.7212 21.8478C11.0915 22 11.561 22 12.5 22C13.439 22 13.9085 22 14.2788 21.8478C14.7726 21.6448 15.1649 21.2554 15.3694 20.7654C15.4628 20.5417 15.4994 20.2815 15.5137 19.902C15.5347 19.3443 15.8228 18.8281 16.3098 18.549C16.7968 18.2699 17.3914 18.2804 17.8886 18.5412C18.2269 18.7186 18.4721 18.8172 18.714 18.8488C19.2439 18.9181 19.7798 18.7756 20.2038 18.4527C20.5219 18.2105 20.7566 17.807 21.2261 16.9999C21.6956 16.1929 21.9303 15.7894 21.9827 15.395C22.0524 14.8691 21.9088 14.3372 21.5835 13.9164C21.4349 13.7243 21.2262 13.5628 20.9022 13.3608C20.4261 13.0639 20.1197 12.558 20.1197 11.9999C20.1197 11.4418 20.4261 10.9361 20.9022 10.6392C21.2263 10.4371 21.435 10.2757 21.5836 10.0835C21.9089 9.66273 22.0525 9.13087 21.9828 8.60497C21.9304 8.21055 21.6957 7.80703 21.2262 7C20.7567 6.19297 20.522 5.78945 20.2039 5.54727C19.7799 5.22436 19.244 5.08185 18.7141 5.15109C18.4722 5.18269 18.2269 5.28136 17.8887 5.4588C17.3915 5.71959 16.7969 5.73002 16.3099 5.45096C15.8229 5.17191 15.5347 4.65566 15.5136 4.09794C15.4993 3.71848 15.4628 3.45833 15.3694 3.23463C15.1649 2.74458 14.7726 2.35523 14.2788 2.15224Z" fill="currentColor"></path><path d="M15.5227 12C15.5227 13.6569 14.1694 15 12.4999 15C10.8304 15 9.47705 13.6569 9.47705 12C9.47705 10.3431 10.8304 9 12.4999 9C14.1694 9 15.5227 10.3431 15.5227 12Z" fill="currentColor"></path></svg>
                                            <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">System Config</span>
                                        </div>
                                        <div className={currentMenu === 'sys-config' ? 'rotate-90' : 'rtl:rotate-180'}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </button>
                                    <AnimateHeight duration={300} height={currentMenu === 'sys-config' ? 'auto' : 0}>
                                        <ul className="sub-menu text-gray-500">
                                            <li>
                                                <NavLink to="/admin/system-config">Settings</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/admin/top-up-requests">Top Up Requests</NavLink>
                                            </li>
                                        </ul>
                                    </AnimateHeight>
                                </li>
                            )}

                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <span>{t('apps')}</span>
                            </h2>
                            <li className="nav-item">
                                <ul>

                                    {can('generate facebook report') && (
                                        <li className="nav-item">
                                            <NavLink to="/apps/report/facebook-report-generator" className="group mt-1">
                                                <div className="flex items-center">
                                                    <svg className="group-hover:!text-primary shrink-0" width="22" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">


                                                        <path
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M13.5 21.8882V12.8882H16.5L17 9.38818H13.5V7.38818C13.5 6.48818 13.75 5.88818 15.05 5.88818H17.1V2.78818C16.8 2.74818 15.75 2.64818 14.55 2.64818C12.05 2.64818 10.3 4.21818 10.3 7.03818V9.38818H7.25V12.8882H10.3V21.8882H13.5Z"
                                                            fill="currentColor"
                                                        />
                                                        {/* Secondary layer - 70% opacity */}
                                                        <path
                                                            opacity="0.7"
                                                            fillRule="evenodd"
                                                            clipRule="evenodd"
                                                            d="M13.5 21.8882V12.8882H16.5L17 9.38818H13.5V7.38818C13.5 6.48818 13.75 5.88818 15.05 5.88818H17.1V2.78818C16.8 2.74818 15.75 2.64818 14.55 2.64818C12.05 2.64818 10.3 4.21818 10.3 7.03818V9.38818H7.25V12.8882H10.3V21.8882H13.5Z"
                                                            fill="currentColor"
                                                            transform="translate(0.3, 0.3)"
                                                        />


                                                    </svg>
                                                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('facebookreportgenerator')}</span>
                                                </div>
                                            </NavLink>
                                        </li>
                                    )}

                                    {can('generate tiktok report') && (
                                        <li className="nav-item">
                                            <NavLink to="/apps/report/tiktok-report-generator" className="group">
                                                <div className="flex items-center">
                                                    <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">


                                                        <path
                                                            d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                                                            fill="currentColor"
                                                        />
                                                        {/* Shadow/accent layer - 70% opacity */}
                                                        <path
                                                            opacity="0.7"
                                                            d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
                                                            fill="currentColor"
                                                            transform="translate(0.5, 0.5)"
                                                        />

                                                    </svg>
                                                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('tiktokreportgenerator')}</span>
                                                </div>
                                            </NavLink>
                                        </li>
                                    )}

                                    {can('generate_facebook_ads_performance') && (
                                        <li className="menu nav-item">
                                            <button type="button" className={`${currentMenu === 'fb-ads' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('fb-ads')}>
                                                <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"  fill="currentColor" viewBox="0 0 24 24"><path opacity="0.5" d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" fill="currentColor"></path><path d="M22 5C22 6.65685 20.6569 8 19 8C17.3431 8 16 6.65685 16 5C16 3.34315 17.3431 2 19 2C20.6569 2 22 3.34315 22 5Z" fill="currentColor"></path><path d="M14.5 10.75C14.0858 10.75 13.75 10.4142 13.75 10C13.75 9.58579 14.0858 9.25 14.5 9.25H17C17.4142 9.25 17.75 9.58579 17.75 10V12.5C17.75 12.9142 17.4142 13.25 17 13.25C16.5858 13.25 16.25 12.9142 16.25 12.5V11.8107L14.2374 13.8232C13.554 14.5066 12.446 14.5066 11.7626 13.8232L10.1768 12.2374C10.0791 12.1398 9.92085 12.1398 9.82322 12.2374L7.53033 14.5303C7.23744 14.8232 6.76256 14.8232 6.46967 14.5303C6.17678 14.2374 6.17678 13.7626 6.46967 13.4697L8.76256 11.1768C9.44598 10.4934 10.554 10.4934 11.2374 11.1768L12.8232 12.7626C12.9209 12.8602 13.0791 12.8602 13.1768 12.7626L15.1893 10.75H14.5Z" fill="currentColor"></path></svg>
                                                    <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('facebook_ads')}</span>
                                                </div>

                                                <div className={currentMenu === 'fb-ads' ? 'rotate-90' : 'rtl:rotate-180'}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </button>

                                            <AnimateHeight duration={300} height={currentMenu === 'fb-ads' ? 'auto' : 0}>
                                                <ul className="sub-menu text-gray-500">
                                                    <li>
                                                        <NavLink to="/apps/report/facebook-ads-report-generator">{t('generator')}</NavLink>
                                                    </li>
                                                    <li>
                                                        <NavLink to="/apps/report/facebook-ads-performance">{t('ad_performance_report')}</NavLink>
                                                    </li>
                                                </ul>
                                            </AnimateHeight>
                                        </li>
                                    )}

                                    {/* Media Library */}
                                    <li className="nav-item">
                                        <NavLink to="/apps/media-library" className="group mt-1">
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"  fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M8.67239 7.54199H15.3276C18.7024 7.54199 20.3898 7.54199 21.3377 8.52882C22.2855 9.51565 22.0625 11.0403 21.6165 14.0895L21.1935 16.9811C20.8437 19.3723 20.6689 20.5679 19.7717 21.2839C18.8745 21.9999 17.5512 21.9999 14.9046 21.9999H9.09536C6.44881 21.9999 5.12553 21.9999 4.22834 21.2839C3.33115 20.5679 3.15626 19.3723 2.80648 16.9811L2.38351 14.0895C1.93748 11.0403 1.71447 9.51565 2.66232 8.52882C3.61017 7.54199 5.29758 7.54199 8.67239 7.54199ZM8 18.0001C8 17.5859 8.3731 17.2501 8.83333 17.2501H15.1667C15.6269 17.2501 16 17.5859 16 18.0001C16 18.4143 15.6269 18.7501 15.1667 18.7501H8.83333C8.3731 18.7501 8 18.4143 8 18.0001Z" fill="currentColor"></path><g opacity="0.4"><path d="M8.51005 2.00001H15.4901C15.7226 1.99995 15.9009 1.99991 16.0567 2.01515C17.1645 2.12352 18.0712 2.78958 18.4558 3.68678H5.54443C5.92895 2.78958 6.8357 2.12352 7.94352 2.01515C8.09933 1.99991 8.27757 1.99995 8.51005 2.00001Z" fill="currentColor"></path></g><g opacity="0.7"><path d="M6.31069 4.72266C4.92007 4.72266 3.7798 5.56241 3.39927 6.67645C3.39134 6.69967 3.38374 6.72302 3.37646 6.74647C3.77461 6.6259 4.18898 6.54713 4.60845 6.49336C5.68882 6.35485 7.05416 6.35492 8.64019 6.35501L8.75863 6.35501L15.5323 6.35501C17.1183 6.35492 18.4837 6.35485 19.564 6.49336C19.9835 6.54713 20.3979 6.6259 20.796 6.74647C20.7887 6.72302 20.7811 6.69967 20.7732 6.67645C20.3927 5.56241 19.2524 4.72266 17.8618 4.72266H6.31069Z" fill="currentColor"></path></g></svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('medialibrary')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="nav-item">
                                        <NavLink to="/apps/report/history" className="group">
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path fillRule="evenodd" clipRule="evenodd" d="M5.07868 5.06891C8.87402 1.27893 15.0437 1.31923 18.8622 5.13778C22.6824 8.95797 22.7211 15.1313 18.9262 18.9262C15.1312 22.7211 8.95793 22.6824 5.13774 18.8622C2.87389 16.5984 1.93904 13.5099 2.34047 10.5812C2.39672 10.1708 2.775 9.88377 3.18537 9.94002C3.59575 9.99627 3.88282 10.3745 3.82658 10.7849C3.4866 13.2652 4.27782 15.881 6.1984 17.8016C9.44288 21.0461 14.6664 21.0646 17.8655 17.8655C21.0646 14.6664 21.046 9.44292 17.8015 6.19844C14.5587 2.95561 9.33889 2.93539 6.13935 6.12957L6.88705 6.13333C7.30126 6.13541 7.63535 6.47288 7.63327 6.88709C7.63119 7.3013 7.29372 7.63539 6.87951 7.63331L4.33396 7.62052C3.92269 7.61845 3.58981 7.28556 3.58774 6.8743L3.57495 4.32874C3.57286 3.91454 3.90696 3.57707 4.32117 3.57498C4.73538 3.5729 5.07285 3.907 5.07493 4.32121L5.07868 5.06891Z" fill="currentColor" />
                                                    <path opacity="0.5" d="M12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V11.6893L15.0303 13.9697C15.3232 14.2626 15.3232 14.7374 15.0303 15.0303C14.7374 15.3232 14.2626 15.3232 13.9697 15.0303L11.5429 12.6036C11.3554 12.416 11.25 12.1617 11.25 11.8964V8C11.25 7.58579 11.5858 7.25 12 7.25Z" fill="currentColor" />
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('report_history')}</span>
                                            </div>
                                        </NavLink>
                                    </li>


                                    <li className="nav-item">
                                        <NavLink to="/apps/pagemanager" className="group">
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">


                                                    <circle opacity="0.5" cx="12" cy="10" r="7" fill="currentColor" />
                                                    <path d="M9.60212 8.21316C9.47104 6.75421 8.34593 5.39474 7.79976 4.89737L7.49805 4.63933C8.71505 3.61626 10.2854 3 11.9998 3C13.5491 3 14.9809 3.50337 16.1405 4.3555C16.3044 4.85287 15.9923 5.89211 15.6646 6.38947C15.5459 6.56963 15.2767 6.79329 14.9817 7.0053C14.3163 7.48334 13.4767 7.71978 13.0498 8.6C12.9277 8.85162 12.9329 9.09758 12.9916 9.31138C13.0338 9.46509 13.0608 9.63217 13.0612 9.79558C13.0626 10.324 12.5282 10.7058 11.9998 10.7C10.6248 10.685 9.72465 9.57688 9.60212 8.21316Z" fill="currentColor" />
                                                    <path d="M13.0057 14.3935C13.6974 13.0901 16.003 13.0901 16.003 13.0901C18.4053 13.065 18.7299 11.6064 18.9468 10.8691C18.5585 14.0061 16.0948 16.4997 12.9722 16.9335C12.7463 16.4582 12.4788 15.3865 13.0057 14.3935Z" fill="currentColor" />
                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M18.0035 1.49982C18.2797 1.19118 18.7539 1.16491 19.0625 1.44116C21.3246 3.4658 22.75 6.41044 22.75 9.687C22.75 15.4384 18.3612 20.1647 12.75 20.6996V21.25H14C14.4142 21.25 14.75 21.5858 14.75 22C14.75 22.4142 14.4142 22.75 14 22.75H10C9.58579 22.75 9.25001 22.4142 9.25001 22C9.25001 21.5858 9.58579 21.25 10 21.25H11.25V20.7415C8.14923 20.621 5.37537 19.2236 3.44116 17.0625C3.16491 16.7539 3.19118 16.2797 3.49982 16.0035C3.80847 15.7272 4.28261 15.7535 4.55886 16.0622C6.31098 18.0198 8.85483 19.25 11.687 19.25C16.9685 19.25 21.25 14.9685 21.25 9.687C21.25 6.85483 20.0198 4.31098 18.0622 2.55886C17.7535 2.28261 17.7272 1.80847 18.0035 1.49982Z" fill="currentColor" />



                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('pagemanager')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'qr-code' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('qr-code')}>
                                            <div className="flex items-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><g opacity="0.5"><path d="M10.5531 13.4469C10.1294 13.0232 9.60212 12.8505 9.01812 12.772C8.46484 12.6976 7.76789 12.6976 6.93209 12.6977L5.82717 12.6977C5.24648 12.6977 4.76184 12.6976 4.36823 12.7351C3.95674 12.7742 3.57325 12.8591 3.22152 13.0746C2.87731 13.2856 2.5879 13.575 2.37697 13.9192C2.16142 14.2709 2.07653 14.6544 2.0374 15.0659C1.99998 15.4595 1.99999 15.9442 2 16.5249V16.5932C1.99999 17.477 1.99999 18.1897 2.05454 18.7635C2.1108 19.3552 2.22996 19.8707 2.51405 20.3343C2.80168 20.8037 3.19632 21.1983 3.6657 21.486C4.12929 21.77 4.64482 21.8892 5.23653 21.9455C5.8103 22 6.52304 22 7.40683 22H7.47507C8.05577 22 8.54048 22 8.9341 21.9626C9.34559 21.9235 9.72907 21.8386 10.0808 21.623C10.425 21.4121 10.7144 21.1227 10.9254 20.7785C11.1409 20.4267 11.2258 20.0433 11.2649 19.6318C11.3024 19.2382 11.3023 18.7535 11.3023 18.1728L11.3023 17.0679C11.3024 16.2321 11.3024 15.5352 11.228 14.9819C11.1495 14.3979 10.9768 13.8706 10.5531 13.4469Z" fill="currentColor"></path><path d="M8.9341 2.0374C9.34559 2.07653 9.72907 2.16142 10.0808 2.37697C10.425 2.5879 10.7144 2.87731 10.9254 3.22152C11.1409 3.57325 11.2258 3.95674 11.2649 4.36823C11.3024 4.76183 11.3023 5.24658 11.3023 5.82726L11.3023 6.93212C11.3024 7.7679 11.3024 8.46484 11.228 9.01812C11.1495 9.60212 10.9768 10.1294 10.5531 10.5531C10.1294 10.9768 9.60212 11.1495 9.01812 11.228C8.46484 11.3024 7.76787 11.3024 6.93209 11.3023L5.82711 11.3023C5.24643 11.3023 4.76183 11.3024 4.36823 11.2649C3.95674 11.2258 3.57325 11.1409 3.22152 10.9254C2.87731 10.7144 2.5879 10.425 2.37697 10.0808C2.16142 9.72907 2.07653 9.34559 2.0374 8.9341C1.99998 8.54047 1.99999 8.05579 2 7.47506V7.40679C1.99999 6.52302 1.99999 5.81029 2.05454 5.23653C2.1108 4.64482 2.22996 4.12929 2.51405 3.6657C2.80168 3.19632 3.19632 2.80168 3.6657 2.51405C4.12929 2.22996 4.64482 2.1108 5.23653 2.05454C5.81029 1.99999 6.52307 1.99999 7.40684 2H7.4751C8.05583 1.99999 8.54047 1.99998 8.9341 2.0374Z" fill="currentColor"></path><path d="M16.5932 2H16.5249C15.9442 1.99999 15.4595 1.99998 15.0659 2.0374C14.6544 2.07653 14.2709 2.16142 13.9192 2.37697C13.575 2.5879 13.2856 2.87731 13.0746 3.22152C12.8591 3.57325 12.7742 3.95674 12.7351 4.36823C12.6976 4.76185 12.6977 5.24654 12.6977 5.82725L12.6977 6.93209C12.6976 7.76789 12.6976 8.46484 12.772 9.01812C12.8505 9.60212 13.0232 10.1294 13.4469 10.5531C13.8706 10.9768 14.3979 11.1495 14.9819 11.228C15.5352 11.3024 16.2321 11.3024 17.0679 11.3023L18.1728 11.3023C18.7535 11.3023 19.2382 11.3024 19.6318 11.2649C20.0433 11.2258 20.4267 11.1409 20.7785 10.9254C21.1227 10.7144 21.4121 10.425 21.623 10.0808C21.8386 9.72907 21.9235 9.34559 21.9626 8.9341C22 8.54048 22 8.05587 22 7.47517V7.40683C22 6.52304 22 5.8103 21.9455 5.23653C21.8892 4.64482 21.77 4.12929 21.486 3.6657C21.1983 3.19632 20.8037 2.80168 20.3343 2.51405C19.8707 2.22996 19.3552 2.1108 18.7635 2.05454C18.1897 1.99999 17.477 1.99999 16.5932 2Z" fill="currentColor"></path></g><path opacity="0.4" d="M14.0926 21.3024C14.0926 21.6877 13.7803 22.0001 13.3949 22.0001C13.0096 22.0001 12.6973 21.6877 12.6973 21.3024V18.5117H14.0926V21.3024Z" fill="currentColor"></path><path opacity="0.5" d="M21.3022 12.6978C20.9169 12.6978 20.6045 13.0101 20.6045 13.3954V16.6512H21.9998V13.3954C21.9998 13.0101 21.6875 12.6978 21.3022 12.6978Z" fill="currentColor"></path><path d="M16.0761 16.6173C16 16.8011 16 17.0341 16 17.5C16 17.9659 16 18.1989 16.0761 18.3827C16.1776 18.6277 16.3723 18.8224 16.6173 18.9239C16.8011 19 17.0341 19 17.5 19C17.9659 19 18.1989 19 18.3827 18.9239C18.6277 18.8224 18.8224 18.6277 18.9239 18.3827C19 18.1989 19 17.9659 19 17.5C19 17.0341 19 16.8011 18.9239 16.6173C18.8224 16.3723 18.6277 16.1776 18.3827 16.0761C18.1989 16 17.9659 16 17.5 16C17.0341 16 16.8011 16 16.6173 16.0761C16.3723 16.1776 16.1776 16.3723 16.0761 16.6173Z" fill="currentColor"></path><path opacity="0.7" d="M21.9992 18.5352V18.5117H20.6039C20.6039 18.9547 20.6035 19.252 20.5878 19.4822C20.5725 19.7061 20.5451 19.8152 20.5154 19.8869C20.3974 20.1718 20.171 20.3982 19.8861 20.5162C19.8143 20.546 19.7053 20.5734 19.4813 20.5887C19.2511 20.6044 18.9538 20.6047 18.5109 20.6047H16.6504V22.0001H18.5344C18.9478 22.0001 19.293 22.0001 19.5763 21.9808C19.8713 21.9606 20.1499 21.9173 20.42 21.8054C21.0469 21.5457 21.5449 21.0477 21.8045 20.4209C21.9164 20.1508 21.9598 19.8722 21.9799 19.5772C21.9992 19.2938 21.9992 18.9487 21.9992 18.5352Z" fill="currentColor"></path><path opacity="0.6" d="M12.6973 16.6156V16.6512H14.0926C14.0926 15.9835 14.0935 15.5352 14.1282 15.1934C14.1618 14.8633 14.2212 14.7108 14.2886 14.6099C14.3734 14.4829 14.4824 14.3739 14.6094 14.2891C14.7103 14.2217 14.8628 14.1623 15.1929 14.1287C15.5347 14.0939 15.983 14.0931 16.6508 14.0931H18.5112V12.6978H16.6151C15.9922 12.6977 15.4725 12.6977 15.0517 12.7405C14.6113 12.7853 14.2025 12.8827 13.8342 13.1289C13.5549 13.3155 13.315 13.5553 13.1284 13.8347C12.8823 14.203 12.7848 14.6118 12.74 15.0522C12.6972 15.473 12.6973 15.9927 12.6973 16.6156Z" fill="currentColor"></path><path d="M5.50821 18.6903C5.72656 18.8452 6.03581 18.8452 6.6543 18.8452C7.27278 18.8452 7.58203 18.8452 7.80038 18.6903C7.87743 18.6356 7.9447 18.5683 7.99937 18.4913C8.1543 18.2729 8.1543 17.9637 8.1543 17.3452C8.1543 16.7267 8.1543 16.4175 7.99937 16.1991C7.9447 16.1221 7.87743 16.0548 7.80038 16.0001C7.58203 15.8452 7.27276 15.8452 6.65428 15.8452C6.0358 15.8452 5.72656 15.8452 5.50821 16.0001C5.43117 16.0548 5.36389 16.1221 5.30923 16.1991C5.1543 16.4175 5.1543 16.7267 5.1543 17.3452C5.1543 17.9637 5.1543 18.2729 5.30923 18.4913C5.36389 18.5683 5.43117 18.6356 5.50821 18.6903Z" fill="currentColor"></path><path d="M6.6543 8.15479C6.03581 8.15479 5.72656 8.15479 5.50821 7.99986C5.43117 7.94519 5.36389 7.87792 5.30923 7.80087C5.1543 7.58252 5.1543 7.27327 5.1543 6.65479C5.1543 6.0363 5.1543 5.72705 5.30923 5.5087C5.36389 5.43165 5.43117 5.36438 5.50821 5.30971C5.72656 5.15479 6.03581 5.15479 6.6543 5.15479C7.27278 5.15479 7.58203 5.15479 7.80038 5.30971C7.87743 5.36438 7.9447 5.43165 7.99937 5.5087C8.1543 5.72705 8.1543 6.0363 8.1543 6.65479C8.1543 7.27327 8.1543 7.58252 7.99937 7.80087C7.9447 7.87792 7.87743 7.94519 7.80038 7.99986C7.58203 8.15479 7.27278 8.15479 6.6543 8.15479Z" fill="currentColor"></path><path d="M16.1996 8C16.418 8.15493 16.7272 8.15493 17.3457 8.15493C17.9642 8.15493 18.2734 8.15493 18.4918 8C18.5688 7.94533 18.6361 7.87806 18.6908 7.80101C18.8457 7.58266 18.8457 7.27342 18.8457 6.65493C18.8457 6.03644 18.8457 5.7272 18.6908 5.50885C18.6361 5.4318 18.5688 5.36453 18.4918 5.30986C18.2734 5.15493 17.9642 5.15493 17.3457 5.15493C16.7272 5.15493 16.418 5.15493 16.1996 5.30986C16.1226 5.36453 16.0553 5.4318 16.0006 5.50885C15.8457 5.7272 15.8457 6.03647 15.8457 6.65494C15.8457 7.27342 15.8457 7.58266 16.0006 7.80101C16.0553 7.87806 16.1226 7.94533 16.1996 8Z" fill="currentColor"></path></svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('qr_code_generator')}</span>
                                            </div>

                                            <div className={currentMenu === 'qr-code' ? 'rotate-90' : 'rtl:rotate-180'}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'qr-code' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li>
                                                    <NavLink to="/apps/qr-code/create">{t('create_qr')}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/apps/qr-code/list">{t('qr_list')}</NavLink>
                                                </li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                </ul>
                            </li>

                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <span>{t('settings')}</span>
                            </h2>

                            <li className="menu nav-item">
                                <button type="button" className={`${currentMenu === 'users' ? 'active' : ''} mt-1.5 nav-link group w-full`} onClick={() => toggleMenu('users')}>
                                    <div className="flex items-center">
                                        <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle opacity="0.5" cx="15" cy="6" r="3" fill="currentColor" />
                                            <ellipse opacity="0.5" cx="16" cy="17" rx="5" ry="3" fill="currentColor" />
                                            <circle cx="9.00098" cy="6" r="4" fill="currentColor" />
                                            <ellipse cx="9.00098" cy="17.001" rx="7" ry="4" fill="currentColor" />
                                        </svg>
                                        <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('users_and_team_setting')}</span>
                                    </div>
                                    <div className={currentMenu === 'users' ? 'rotate-90' : 'rtl:rotate-180'}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </button>

                                <AnimateHeight duration={300} height={currentMenu === 'users' ? 'auto' : 0}>
                                    <ul className="sub-menu text-gray-500">
                                        <li>
                                            <NavLink to="/users/profile">{t('profile')}</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/team/settings">{t('team_member')}</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/apps/settings/roles">{t('workspace_role')}</NavLink>
                                        </li>
                                        {can('bot_telegram') && (
                                            <li>
                                                <NavLink to="/apps/settings/telegram">{t('telegram_bot')}</NavLink>
                                            </li>
                                        )}

                                    </ul>
                                </AnimateHeight>
                            </li>
                            {isAdmin && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1">
                                        <svg className="w-4 h-5 flex-none hidden" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                        <span>{t('admin')}</span>
                                    </h2>

                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'admin-users' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('admin-users')}>
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle opacity="0.5" cx="15" cy="6" r="3" fill="currentColor" />
                                                    <ellipse opacity="0.5" cx="16" cy="17" rx="5" ry="3" fill="currentColor" />
                                                    <circle cx="9.00098" cy="6" r="4" fill="currentColor" />
                                                    <ellipse cx="9.00098" cy="17.001" rx="7" ry="4" fill="currentColor" />
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('users')}</span>
                                            </div>
                                            <div className={currentMenu === 'admin-users' ? 'rotate-90' : 'rtl:rotate-180'}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'admin-users' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li>
                                                    <NavLink to="/admin/users">{t('list')}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/admin/top-up-requests">{t('Top Up Requests')}</NavLink>
                                                </li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>


                                    <li className="menu nav-item">
                                        <NavLink to="/admin/permissions" className="group">
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle opacity="0.5" cx="15" cy="6" r="3" fill="currentColor" />
                                                    <ellipse opacity="0.5" cx="16" cy="17" rx="5" ry="3" fill="currentColor" />
                                                    <circle cx="9.00098" cy="6" r="4" fill="currentColor" />
                                                    <ellipse cx="9.00098" cy="17.001" rx="7" ry="4" fill="currentColor" />
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('permission')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="menu nav-item">
                                        <NavLink to="/admin/subscriptions" className="group">
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">

                                                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 16C15.866 16 19 12.866 19 9C19 5.13401 15.866 2 12 2C8.13401 2 5 5.13401 5 9C5 12.866 8.13401 16 12 16ZM12 6C11.7159 6 11.5259 6.34084 11.1459 7.02251L11.0476 7.19887C10.9397 7.39258 10.8857 7.48944 10.8015 7.55334C10.7173 7.61725 10.6125 7.64097 10.4028 7.68841L10.2119 7.73161C9.47396 7.89857 9.10501 7.98205 9.01723 8.26432C8.92945 8.54659 9.18097 8.84072 9.68403 9.42898L9.81418 9.58117C9.95713 9.74833 10.0286 9.83191 10.0608 9.93531C10.0929 10.0387 10.0821 10.1502 10.0605 10.3733L10.0408 10.5763C9.96476 11.3612 9.92674 11.7536 10.1565 11.9281C10.3864 12.1025 10.7318 11.9435 11.4227 11.6254L11.6014 11.5431C11.7978 11.4527 11.8959 11.4075 12 11.4075C12.1041 11.4075 12.2022 11.4527 12.3986 11.5431L12.5773 11.6254C13.2682 11.9435 13.6136 12.1025 13.8435 11.9281C14.0733 11.7536 14.0352 11.3612 13.9592 10.5763L13.9395 10.3733C13.9179 10.1502 13.9071 10.0387 13.9392 9.93531C13.9714 9.83191 14.0429 9.74833 14.1858 9.58118L14.316 9.42898C14.819 8.84072 15.0706 8.54659 14.9828 8.26432C14.895 7.98205 14.526 7.89857 13.7881 7.73161L13.5972 7.68841C13.3875 7.64097 13.2827 7.61725 13.1985 7.55334C13.1143 7.48944 13.0603 7.39258 12.9524 7.19887L12.8541 7.02251C12.4741 6.34084 12.2841 6 12 6Z" fill="currentColor" />
                                                    <path opacity="0.5" d="M6.71424 17.323L7.35111 15L8 13H16L16.6489 15L17.2858 17.323C17.9141 19.6148 18.2283 20.7607 17.809 21.3881C17.6621 21.6079 17.465 21.7844 17.2363 21.9008C16.5837 22.2331 15.576 21.7081 13.5607 20.658C12.8901 20.3086 12.5548 20.1339 12.1986 20.0959C12.0665 20.0818 11.9335 20.0818 11.8014 20.0959C11.4452 20.1339 11.1099 20.3086 10.4393 20.658L10.4393 20.658C8.42401 21.7081 7.41635 22.2331 6.76372 21.9008C6.535 21.7844 6.3379 21.6079 6.19097 21.3881C5.77173 20.7607 6.0859 19.6148 6.71424 17.323Z" fill="currentColor" />


                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('subscriptions')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="menu nav-item">
                                        <NavLink to="/admin/plans" className="group">
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path opacity="0.5" d="M17.9665 6.55812L16.1369 4.72848L16.1369 4.72848C14.5913 3.18295 13.8186 2.41018 12.816 2.12264C11.8134 1.83509 10.7485 2.08083 8.61875 2.57231L7.39057 2.85574C5.5988 3.26922 4.70292 3.47597 4.08944 4.08944C3.47597 4.70292 3.26922 5.5988 2.85574 7.39057L2.85574 7.39057L2.57231 8.61875C2.08083 10.7485 1.83509 11.8134 2.12264 12.816C2.41018 13.8186 3.18295 14.5914 4.72848 16.1369L6.55812 17.9665L6.55813 17.9665C9.24711 20.6555 10.5916 22 12.2623 22C13.933 22 15.2775 20.6555 17.9665 17.9665L17.9665 17.9665L17.9665 17.9665C20.6555 15.2775 22 13.933 22 12.2623C22 10.5916 20.6555 9.24711 17.9665 6.55813L17.9665 6.55812Z" fill="currentColor" />
                                                    <path d="M11.1469 14.3284C10.4739 13.6555 10.4796 12.6899 10.882 11.9247C10.6809 11.6325 10.7103 11.2295 10.9701 10.9697C11.2289 10.7108 11.63 10.6807 11.9219 10.8795C12.2617 10.6988 12.6351 10.6033 13.0073 10.6068C13.4215 10.6107 13.7541 10.9497 13.7502 11.3639C13.7462 11.7781 13.4073 12.1107 12.9931 12.1068C12.8162 12.1051 12.5837 12.1845 12.3843 12.3839C11.9968 12.7714 12.0987 13.1589 12.2075 13.2678C12.3164 13.3766 12.7039 13.4785 13.0914 13.091C13.8754 12.307 15.2291 12.0467 16.0966 12.9142C16.7696 13.5872 16.7639 14.5528 16.3614 15.318C16.5625 15.6102 16.5332 16.0132 16.2734 16.273C16.0145 16.5319 15.6133 16.5619 15.3214 16.3631C14.8645 16.6059 14.3448 16.6969 13.8492 16.595C13.4435 16.5117 13.1822 16.1152 13.2655 15.7094C13.3489 15.3037 13.7454 15.0424 14.1512 15.1257C14.3283 15.1622 14.6139 15.104 14.8592 14.8588C15.2467 14.4712 15.1448 14.0837 15.0359 13.9749C14.9271 13.866 14.5396 13.7641 14.1521 14.1517C13.368 14.9357 12.0143 15.1959 11.1469 14.3284Z" fill="currentColor" />
                                                    <path d="M10.0211 10.2931C10.8022 9.51207 10.8022 8.24574 10.0211 7.46469C9.2401 6.68364 7.97377 6.68364 7.19272 7.46469C6.41167 8.24574 6.41167 9.51207 7.19272 10.2931C7.97377 11.0742 9.2401 11.0742 10.0211 10.2931Z" fill="currentColor" />
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('plans')}</span>
                                            </div>
                                        </NavLink>
                                    </li>

                                    <li className="menu nav-item">
                                        <NavLink to="/admin/colors" className="group">
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path opacity="0.5" d="M17.9665 6.55812L16.1369 4.72848L16.1369 4.72848C14.5913 3.18295 13.8186 2.41018 12.816 2.12264C11.8134 1.83509 10.7485 2.08083 8.61875 2.57231L7.39057 2.85574C5.5988 3.26922 4.70292 3.47597 4.08944 4.08944C3.47597 4.70292 3.26922 5.5988 2.85574 7.39057L2.85574 7.39057L2.57231 8.61875C2.08083 10.7485 1.83509 11.8134 2.12264 12.816C2.41018 13.8186 3.18295 14.5914 4.72848 16.1369L6.55812 17.9665L6.55813 17.9665C9.24711 20.6555 10.5916 22 12.2623 22C13.933 22 15.2775 20.6555 17.9665 17.9665L17.9665 17.9665L17.9665 17.9665C20.6555 15.2775 22 13.933 22 12.2623C22 10.5916 20.6555 9.24711 17.9665 6.55813L17.9665 6.55812Z" fill="currentColor" />
                                                    <path d="M11.1469 14.3284C10.4739 13.6555 10.4796 12.6899 10.882 11.9247C10.6809 11.6325 10.7103 11.2295 10.9701 10.9697C11.2289 10.7108 11.63 10.6807 11.9219 10.8795C12.2617 10.6988 12.6351 10.6033 13.0073 10.6068C13.4215 10.6107 13.7541 10.9497 13.7502 11.3639C13.7462 11.7781 13.4073 12.1107 12.9931 12.1068C12.8162 12.1051 12.5837 12.1845 12.3843 12.3839C11.9968 12.7714 12.0987 13.1589 12.2075 13.2678C12.3164 13.3766 12.7039 13.4785 13.0914 13.091C13.8754 12.307 15.2291 12.0467 16.0966 12.9142C16.7696 13.5872 16.7639 14.5528 16.3614 15.318C16.5625 15.6102 16.5332 16.0132 16.2734 16.273C16.0145 16.5319 15.6133 16.5619 15.3214 16.3631C14.8645 16.6059 14.3448 16.6969 13.8492 16.595C13.4435 16.5117 13.1822 16.1152 13.2655 15.7094C13.3489 15.3037 13.7454 15.0424 14.1512 15.1257C14.3283 15.1622 14.6139 15.104 14.8592 14.8588C15.2467 14.4712 15.1448 14.0837 15.0359 13.9749C14.9271 13.866 14.5396 13.7641 14.1521 14.1517C13.368 14.9357 12.0143 15.1959 11.1469 14.3284Z" fill="currentColor" />
                                                    <path d="M10.0211 10.2931C10.8022 9.51207 10.8022 8.24574 10.0211 7.46469C9.2401 6.68364 7.97377 6.68364 7.19272 7.46469C6.41167 8.24574 6.41167 9.51207 7.19272 10.2931C7.97377 11.0742 9.2401 11.0742 10.0211 10.2931Z" fill="currentColor" />
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('colors')}</span>
                                            </div>
                                        </NavLink>
                                    </li>
                                </>
                            )}
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
