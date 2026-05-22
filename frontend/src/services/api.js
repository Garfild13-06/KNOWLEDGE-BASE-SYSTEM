import axios from 'axios';
import { API_BASE_URL, AUTH_REFRESH_URL } from '../config';

export const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (!error.response || error.response.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            clearAuthAndRedirect();
            return Promise.reject(error);
        }

        try {
            const response = await axios.post(AUTH_REFRESH_URL, { refresh: refreshToken });
            const newAccessToken = response.data.access;
            localStorage.setItem('access_token', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            clearAuthAndRedirect();
            return Promise.reject(refreshError);
        }
    }
);

function clearAuthAndRedirect() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
    }
}

export const fetchFolders = async () => {
    const response = await api.get('/tree_sections/');
    return response.data;
};
