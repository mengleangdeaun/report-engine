import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useEffect } from 'react';
import { IconAlertTriangle, IconDoorExit, IconMail } from '@tabler/icons-react';

const ExpiredPlan = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);

    useEffect(() => {
        dispatch(setPageTitle('Subscription Expired'));
    }, [dispatch]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        navigate('/auth/boxed-signin');
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
            <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
            <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                <div className="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 lg:min-h-[600px] py-20 text-center">

                    <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <IconAlertTriangle size={40} className="text-amber-600 dark:text-amber-500" />
                    </div>

                    <h1 className="mb-4 text-3xl font-extrabold text-primary md:text-4xl">
                        Subscription Expired
                    </h1>

                    <p className="mx-auto mb-8 max-w-lg text-lg font-medium text-white-dark">
                        Your workspace subscription has ended. To continue accessing your reports and dashboard, please renew your plan or contact support.
                    </p>

                    <div className="mx-auto flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <a
                            href="https://t.me/mengleang_deaun"
                            className="btn btn-primary shadow-lg shadow-primary/30"
                        >
                            <IconMail className="mr-2 h-5 w-5" />
                            Contact Support
                        </a>

                        <button
                            onClick={handleLogout}
                            className="btn btn-outline-danger"
                        >
                            <IconDoorExit className="mr-2 h-5 w-5" />
                            Logout & Switch Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpiredPlan;
