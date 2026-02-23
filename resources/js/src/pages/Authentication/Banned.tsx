import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useEffect } from 'react';
import { IRootState } from '../../store';
import { IconBan } from '@tabler/icons-react';

const Banned = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Account Banned'));
    }, [dispatch]);

    const themeConfig = useSelector((state: IRootState) => state.themeConfig);

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA] text-black dark:bg-[#060818] dark:text-white-dark">
            <div className="p-5 text-center font-semibold">
                <div className="mb-8 flex items-center justify-center">
                    <div className="rounded-full bg-red-100 p-4 text-red-500 shadow-lg dark:bg-red-500/20 dark:text-red-400">
                        <IconBan size={64} strokeWidth={1.5} />
                    </div>
                </div>
                <h2 className="mb-4 text-3xl font-bold md:text-5xl">Account Banned</h2>
                <p className="mb-8 max-w-md text-base text-gray-500 dark:text-gray-400">
                    Your account has been suspended due to a violation of our terms of service or suspicious activity.
                </p>
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <a
                        href="mailto:support@example.com"
                        className="btn btn-primary shadow-md hover:scale-105 transition-transform"
                    >
                        Contact Support
                    </a>
                    <Link to="/auth/boxed-signin" className="btn btn-outline-danger shadow-md hover:scale-105 transition-transform">
                        Back to Login
                    </Link>
                </div>
                <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
                    If you believe this is a mistake, please contact our support team immediately.
                </p>
            </div>
        </div>
    );
};

export default Banned;
