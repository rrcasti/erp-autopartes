import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            // We assume the backend has an endpoint /user that returns the auth user with permissions usually.
            // But since we built /erp/api/users/{id}, we might need a dedicated /erp/api/me endpoint OR use the /user from Laravel Breeze
            // Laravel Breeze usually provides /api/user. Let's check accessing that or creating a specific one.
            // For now, let's try reading from a meta tag or hitting a dedicated endpoint we will add.
            
            // To be robust, let's add a quick endpoint in routes/web.php: Route::get('/me', ...) inside the group.
            const res = await axios.get('/erp/api/me'); 
            setUser(res.data.user);
            setPermissions(res.data.permissions || []);
            setRoles(res.data.roles || []);
        } catch (error) {
            console.error("Error fetching auth user:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const can = (permissionName) => {
        if (!user) return false;
        // Admin overrides all (if backend didn't already handle it, but backend does. 
        // However, frontend needs to know it too for UI hiding).
        if (roles.includes('admin')) return true; 
        
        return permissions.includes(permissionName);
    };

    const hasRole = (roleName) => {
        return roles.includes(roleName);
    };

    return (
        <AuthContext.Provider value={{ user, permissions, roles, can, hasRole, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
