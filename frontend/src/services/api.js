import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:8000/', // Замените на ваш базовый URL API
});

api.interceptors.response.use(
    response => response, // Успешные запросы пропускаем
    async error => {
        const originalRequest = error.config; // Сохраняем исходный запрос
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Помечаем, что повторяем запрос
            try {
                // Получаем refresh_token из localStorage
                const refreshToken = localStorage.getItem('refresh_token');
                // Запрос на обновление токена
                const response = await axios.post('http://localhost:8000/api/token/refresh/', {
                    refresh: refreshToken
                });
                const newAccessToken = response.data.access;
                // Сохраняем новый access_token
                localStorage.setItem('access_token', newAccessToken);
                // Обновляем заголовки для всех будущих запросов
                api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                // Повторяем исходный запрос с новым токеном
                return api(originalRequest);
            } catch (refreshError) {
                // Если обновление не удалось (например, refresh_token истек)
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login'; // Перенаправляем на страницу входа
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export const fetchFolders = async () => {
    const response = await api.get('/tree_sections/');
    return response.data;
};