import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ✅ FIX: Interceptor checks Local AND Session storage
api.interceptors.request.use((config) => {
    const isPortal = config.url?.includes('portal/');
    const token = isPortal ? localStorage.getItem('clientToken') : localStorage.getItem('token');
    const activeTeamId = localStorage.getItem('active_team_id');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ This tells the backend to isolate permissions for this team
    if (activeTeamId && !isPortal) {
        config.headers['X-Team-Id'] = activeTeamId;
    }

    return config;
});

// Handle 401 Unauthorized (Auto Logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isPortal = error.config?.url?.includes('portal/');
        // ✅ Check if the specific request asked to skip the global toast
        const shouldSkipToast = error.config?._skipToast;

        if (error.response?.status === 403) {
            // Check if it's a ban message
            if (error.response.data.message === 'Your account has been banned.') {
                window.location.href = '/banned';
                return Promise.reject(error);
            }

            // Check if workspace is inactive
            if (error.response.data.message === 'workspace_inactive') {
                sessionStorage.setItem('inactive_team_name', error.response.data.team_name || '');
                sessionStorage.setItem('inactive_owner_email', error.response.data.owner_email || '');
                localStorage.clear();
                sessionStorage.removeItem('token');
                window.location.href = '/workspace-inactive';
                return Promise.reject(error);
            }

            // Only show toast if we aren't skipping it
            if (!shouldSkipToast) {
                toast.error(error.response.data.message || "Access Denied");
            }
        }

        if (error.response?.status === 401) {
            if (isPortal) {
                localStorage.removeItem('clientToken');
                localStorage.removeItem('client');
                if (window.location.pathname !== '/portal/login') {
                    window.location.href = '/portal/login';
                }
            } else {
                localStorage.clear();
                sessionStorage.clear();
                if (window.location.pathname !== '/auth/boxed-signin') {
                    window.location.href = '/auth/boxed-signin';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;