import { useState, useEffect } from 'react';

export const PERMISSIONS_UPDATED_EVENT = 'permissions-updated';

const usePermission = () => {
    const [permissions, setPermissions] = useState<string[]>(() => {
        try {
            // ✅ We look for the permissions specifically for the ACTIVE team
            const stored = localStorage.getItem('permissions');
            const parsed = stored ? JSON.parse(stored) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        const handleUpdate = () => {
            try {
                const stored = localStorage.getItem('permissions');
                const parsed = stored ? JSON.parse(stored) : [];
                setPermissions(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
                setPermissions([]);
            }
        };

        window.addEventListener(PERMISSIONS_UPDATED_EVENT, handleUpdate);
        window.addEventListener('storage', handleUpdate);
        
        return () => {
            window.removeEventListener(PERMISSIONS_UPDATED_EVENT, handleUpdate);
            window.removeEventListener('storage', handleUpdate);
        };
    }, []);

    // ✅ can() remains the same, but 'permissions' will now be team-specific
    const can = (permissionName: string) => {
        return Array.isArray(permissions) && permissions.includes(permissionName);
    };

    return { can, permissions };
};

export default usePermission;