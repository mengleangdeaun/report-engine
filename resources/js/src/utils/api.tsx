import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://report-engine.degrandonline.com/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ✅ FIX: Interceptor checks Local AND Session storage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const activeTeamId = localStorage.getItem('active_team_id');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ This tells the backend to isolate permissions for this team
    if (activeTeamId) {
        config.headers['X-Team-Id'] = activeTeamId;
    }
    
    return config;
});

// Handle 401 Unauthorized (Auto Logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // ✅ Check if the specific request asked to skip the global toast
        const shouldSkipToast = error.config?._skipToast;

        if (error.response?.status === 403) {
            // Only show toast if we aren't skipping it
            if (!shouldSkipToast) {
                toast.error(error.response.data.message || "Access Denied");
            }
        }

        if (error.response?.status === 401) {
            localStorage.clear();
            sessionStorage.clear();
            if (window.location.pathname !== '/auth/boxed-signin') {
                 window.location.href = '/auth/boxed-signin';
            }
        }
        return Promise.reject(error);
    }
);

export default api;