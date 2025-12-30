import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../utils/api';
// Assuming your action is named setCredentials as discussed previously
import { setCredentials } from '../../store/authSlice'; 

const AuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const handleCallback = async () => {
            try {
                // 1. Extract token from URL (?token=...)
                const params = new URLSearchParams(location.search);
                const token = params.get('token');

                if (!token) {
                    throw new Error('No token found in callback URL');
                }

                // 2. ✅ CRITICAL: Clear old sessions to prevent stale data bugs
                localStorage.clear();
                sessionStorage.clear();

                // 3. Set the token so the /auth/me call is authorized
                localStorage.setItem('token', token);

                // 4. Fetch fresh user data from the backend
                const response = await api.get('/auth/me');
                const { user, permissions, is_admin } = response.data;

                // 5. ✅ Sync with Redux and LocalStorage
                // This ensures the Sidebar and Navbar update immediately
                dispatch(setCredentials({ user, token }));
                
                localStorage.setItem('permissions', JSON.stringify(permissions || []));

                window.dispatchEvent(new Event('permissions-updated'));
                
                if (user.active_team_id) {
                    localStorage.setItem('active_team_id', user.active_team_id.toString());
                }

                // AuthCallback.tsx

                // Change Step 6 to this:
                setTimeout(() => {
                    // Only redirect to verify-email if the user is truly unverified
                    if (!user.email_verified_at) {
                        toast.error('Please verify your email.');
                        navigate('/auth/verify-email');
                    } else {
                        toast.success(`Welcome back, ${user.name}!`);
                        
                        // Use your role logic to decide where to go
                        const userRoles = user.roles || [];
                        if (userRoles.includes('admin') || user.email === 'mengleangdeaun@gmail.com') {
                            navigate('/admin/dashboard');
                        } else {
                            navigate('/dashboard');
                        }
                    }
                }, 100);

            } catch (error: any) {
                console.error('Auth sync failed:', error);
                toast.error('Login failed. Please try again.');
                navigate('/auth/boxed-signin');
            }
        };

        handleCallback();
    }, [navigate, location, dispatch]);

    return (
        <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-[#060818]">
            <div className="text-center">
                <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-14 h-14 inline-block mb-4"></span>
                <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200">Finalizing your login...</h2>
            </div>
        </div>
    );
};

export default AuthCallback;