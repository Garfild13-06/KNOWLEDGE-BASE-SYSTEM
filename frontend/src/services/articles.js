import { api } from './api';

export const fetchArticles = async () => {
    const response = await api.get('/articles/');
    return response.data;
};

export const createArticle = async (articleData) => {
    const response = await api.post('/articles/', articleData);
    return response.data;
};

export const searchArticles = async (query) => {
    const response = await api.get('/articles/search/', {
        params: { q: query },
    });
    return response.data.results;
};
