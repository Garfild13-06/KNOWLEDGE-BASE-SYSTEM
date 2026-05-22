import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Рендерит children только для авторизованных пользователей.
 */
const RequireAuth = ({ children, fallback = null }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        return fallback;
    }
    return children;
};

export default RequireAuth;
