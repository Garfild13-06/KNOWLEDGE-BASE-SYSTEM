import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AUTH_TOKEN_URL } from '../config';
import { fetchMe } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();

    const loadProfile = useCallback(async () => {
        try {
            const data = await fetchMe();
            setProfile(data);
            return data;
        } catch {
            setProfile(null);
            return null;
        }
    }, []);

    const applyToken = useCallback((access) => {
        if (access) {
            localStorage.setItem('access_token', access);
            setIsAuthenticated(true);
        } else {
            localStorage.removeItem('access_token');
            setIsAuthenticated(false);
            setProfile(null);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        setIsAuthenticated(Boolean(token));
        if (token) {
            loadProfile();
        }
    }, [loadProfile]);

    const login = async (username, password) => {
        const response = await axios.post(AUTH_TOKEN_URL, { username, password });
        const { access, refresh } = response.data;
        applyToken(access);
        if (refresh) {
            localStorage.setItem('refresh_token', refresh);
        }
        await loadProfile();
        navigate('/');
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsAuthenticated(false);
        setProfile(null);
        navigate('/login');
    };

    const canEdit = profile?.can_edit ?? false;

    const applyOAuthTokens = useCallback(
        async (access, refresh) => {
            applyToken(access);
            if (refresh) {
                localStorage.setItem('refresh_token', refresh);
            }
            await loadProfile();
        },
        [applyToken, loadProfile],
    );

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                login,
                logout,
                profile,
                canEdit,
                loadProfile,
                applyOAuthTokens,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
