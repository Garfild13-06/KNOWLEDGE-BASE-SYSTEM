import { api } from './api';

// Получить все статьи
export const fetchArticles = async () => {
    const response = await api.get('/articles/');
    return response.data;
};

// Создать новую статью
export const createArticle = async (articleData) => {
    const response = await api.post('/articles/', articleData);
    return response.data;
};
