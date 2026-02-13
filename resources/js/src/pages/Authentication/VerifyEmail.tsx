import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { logout } from '../../store/authSlice';
import { setPageTitle } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';

const VerifyEmail = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state: IRootState) => state.auth.user);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Verify Email'));
    }, [dispatch]);

    const checkVerificationStatus = async () => {
        setVerifying(true);
        try {
            const response = await api.get('/auth/me');
            const freshUser = response.data.user;

            localStorage.setItem('user', JSON.stringify(freshUser));

            if (freshUser.email_verified_at !== null) {
                toast.success("Verified! Redirecting...");
                window.location.href = '/'; 
            } else {
                toast.error("Status: Not Verified yet. Please check your email.");
            }
        } catch (error) {
            toast.error("Could not check status. Please refresh.");
        } finally {
            setVerifying(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            await api.post('/email/verification-notification');
            toast.success('Link sent! Check your inbox.');
        } catch (error: any) {
            if (error.response?.status === 400) {
                toast.success("Already verified! Click the verification check button.");
            } else {
                toast.error(error.response?.data?.message || 'Failed to send.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        navigate('/auth/boxed-signin');
    };

    return (
        <div>
            {/* Background images to match Auth design */}
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
            </div>
            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                
                {/* Main Boxed Container */}
                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0E1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,rgba(14,23,38,0)_80.07%,#0E1726_100%)]">
                    
                    {/* Glassmorphism Inner Panel */}
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 px-6 lg:min-h-[758px] py-20 text-center">
                        <div className="mx-auto w-full max-w-[440px]">
                            
                            {/* Header Section */}
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Verify Email</h1>
                                <p className="text-base font-bold leading-normal text-white-dark mt-2">
                                    We've sent a verification link to:
                                </p>
                                <p className="text-lg font-extrabold text-primary break-all">{user?.email}</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4">
                                <button 
                                    type="button"
                                    onClick={checkVerificationStatus} 
                                    className="btn btn-gradient w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]"
                                    disabled={verifying}
                                >
                                    {verifying ? 'Checking...' : 'I have verified my email'}
                                </button>

                                <button 
                                    type="button"
                                    onClick={handleResend} 
                                    className="btn btn-outline-primary w-full uppercase"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Resend Verification Email'}
                                </button>
                                
                                <div className="pt-4">
                                    <button 
                                        type="button"
                                        onClick={handleLogout} 
                                        className="text-white-dark hover:text-danger font-bold transition uppercase underline underline-offset-4"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </div>

                            <div className="mt-10 text-white-dark">
                                <p className="text-sm">
                                    Please check your spam folder if you don't see the email within a few minutes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;