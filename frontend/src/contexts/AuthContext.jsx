import React, {createContext, useContext, useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({children}) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            setIsAuthenticated(true);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            setIsAuthenticated(false);
            delete axios.defaults.headers.common['Authorization'];
        }
    }, []);

    const login = async (username, password) => {
        const response = await axios.post('http://localhost:8000/api/token/', {username, password});
        const {access} = response.data;
        localStorage.setItem('access_token', access);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        setIsAuthenticated(true);
        navigate('/');
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{isAuthenticated, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};