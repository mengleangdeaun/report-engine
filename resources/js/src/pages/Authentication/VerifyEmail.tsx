import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';
import { logout } from '../../store/authSlice';
import { IconMail } from '@tabler/icons-react';
import { IRootState } from '../../store';

const VerifyEmail = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const user = useSelector((state: IRootState) => state.auth.user);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);

    // ✅ NEW: Robust Status Check
    const checkVerificationStatus = async () => {
        setVerifying(true);
        try {
            // 1. Call Backend to get fresh user
            const response = await api.get('/auth/me');
            const freshUser = response.data.user;

            console.log("Fresh User Data:", freshUser); // 👈 Debug log

            // 2. Update LocalStorage
            localStorage.setItem('user', JSON.stringify(freshUser));

            // 3. Check if verified (handle both null and string dates)
            if (freshUser.email_verified_at !== null) {
                toast.success("Verified! Redirecting...");
                
                // Force reload to bypass Redux/State lag
                window.location.href = '/'; 
            } else {
                toast.error("Status: Not Verified yet. Please click the link in your email.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Could not check status. Please try refreshing the page.");
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
            // If backend says 400 (Already verified), we treat it as success
            if (error.response?.status === 400) {
                toast.success("You are already verified! Click 'I have verified my email'.");
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
        <div className="flex justify-center items-center min-h-screen bg-[#fafafa] dark:bg-[#060818]">
            <div className="panel max-w-md w-full text-center sm:p-10 p-6">
                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <IconMail size={40} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold mb-3">Verify Your Email</h2>
                <p className="text-gray-500 mb-6">
                    We sent a link to <strong className="text-gray-800 dark:text-gray-200">{user?.email}</strong>
                </p>

                <div className="flex flex-col gap-4">
                    {/* ✅ Check Status Button */}
                    <button 
                        onClick={checkVerificationStatus} 
                        className="btn btn-success w-full gap-2 shadow-lg"
                        disabled={verifying}
                    >
                        {verifying && <span className="animate-spin border-2 border-white border-l-transparent rounded-full w-4 h-4"></span>}
                        I have verified my email
                    </button>

                    <button 
                        onClick={handleResend} 
                        className="btn btn-primary w-full"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Resend Email'}
                    </button>
                    
                    <button onClick={handleLogout} className="btn btn-outline-danger w-full">
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;