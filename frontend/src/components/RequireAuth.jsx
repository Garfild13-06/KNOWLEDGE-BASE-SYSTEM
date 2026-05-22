import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Рендерит children только для пользователей с правом редактирования.
 */
const RequireAuth = ({ children, fallback = null }) => {
    const { canEdit } = useAuth();
    if (!canEdit) {
        return fallback;
    }
    return children;
};

export default RequireAuth;
