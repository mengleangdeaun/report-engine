import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
    children?: ReactNode; // Made optional to support Outlet
    roleRequired?: string;
    permissionRequired?: string;
}

const ProtectedRoute = ({ children, roleRequired, permissionRequired }: ProtectedRouteProps) => {
    const location = useLocation();

    // 1. Get Auth Data
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    // We fetch fresh permissions from storage or default to empty
    const permsStr = localStorage.getItem('permissions') || sessionStorage.getItem('permissions'); 
    
    // 2. Auth Check: Must have User AND Token
    if (!userStr || !token) {
        return <Navigate to="/auth/boxed-signin" state={{ from: location }} replace />;
    }

    const user = JSON.parse(userStr);
    const permissions = permsStr ? JSON.parse(permsStr) : [];

    // 3. ✅ NEW: Email Verification Check
    // If user is logged in BUT email is not verified, send them to Verify Page.
    // We check 'email_verified_at' (standard Laravel field)
    if (!user.email_verified_at) {
        return <Navigate to="/auth/verify-email" replace />;
    }

    // 4. Role Check (Authorization)
    if (roleRequired) {
        const hasRole = Array.isArray(user.roles) && user.roles.some((r: any) => 
            (typeof r === 'string' && r === roleRequired) || 
            (typeof r === 'object' && r.name === roleRequired)
        );
        
        if (!hasRole) {
            // User is verified but doesn't have the role -> Dashboard or 403
            return <Navigate to="/" replace />;
        }
    }

    // 5. Permission Check (Feature Access)
    if (permissionRequired) {
        // Check if user is a Super Admin first
        const isAdmin = Array.isArray(user.roles) && user.roles.some((r: any) => 
            (typeof r === 'string' && r === 'admin') || 
            (typeof r === 'object' && r.name === 'admin')
        );

        // If NOT admin, then check specific permissions
        if (!isAdmin) {
            if (!Array.isArray(permissions) || !permissions.includes(permissionRequired)) {
                console.warn(`Access denied: Missing permission [${permissionRequired}]`);
                return <Navigate to="/" replace />;
            }
        }
    }

    // 6. Render Children or Outlet
    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;