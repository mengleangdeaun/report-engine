import { createSlice } from '@reduxjs/toolkit';

// ✅ Initialize state from LocalStorage to prevent redirect loops on refresh
const initialState = {
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // ✅ Renamed from setAuth to setCredentials
        setCredentials(state, action) {
            // Handle both {user, token} and just {user} payloads
            const { user, token } = action.payload.user ? action.payload : { user: action.payload, token: null };
            
            const finalUser = user.user ? user.user : user;
            
            state.user = finalUser;
            // Only update token if it was provided in the payload
            if (token || action.payload.token) {
                state.token = token || action.payload.token;
            }

            // ✅ Persist to storage so ProtectedRoute can see it
            localStorage.setItem('user', JSON.stringify(state.user));
            if (state.token) {
                localStorage.setItem('token', state.token);
            }
        },
        logout(state) {
            state.user = null;
            state.token = null;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('permissions');
            localStorage.removeItem('active_team_id');
        },
    },
});

// ✅ Export the correctly named action
export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;