import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AUTH_TOKEN_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    const applyToken = useCallback((access) => {
        if (access) {
            localStorage.setItem('access_token', access);
            setIsAuthenticated(true);
        } else {
            localStorage.removeItem('access_token');
            setIsAuthenticated(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        setIsAuthenticated(Boolean(token));
    }, []);

    const login = async (username, password) => {
        const response = await axios.post(AUTH_TOKEN_URL, { username, password });
        const { access, refresh } = response.data;
        applyToken(access);
        if (refresh) {
            localStorage.setItem('refresh_token', refresh);
        }
        navigate('/');
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsAuthenticated(false);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
