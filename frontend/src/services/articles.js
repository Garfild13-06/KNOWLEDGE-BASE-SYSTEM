import { api } from './api';

export const fetchArticles = async () => {
    const response = await api.get('/articles/');
    return response.data;
};

export const createArticle = async (articleData) => {
    const response = await api.post('/articles/', articleData);
    return response.data;
};

export const searchArticles = async (query, filters = {}) => {
    const response = await api.get('/articles/search/', {
        params: { q: query, ...filters },
    });
    return response.data.results;
};

export const fetchArticleVersions = async (articleId) => {
    const response = await api.get(`/articles/${articleId}/versions/`);
    return response.data;
};

export const restoreArticleVersion = async (articleId, versionId) => {
    const response = await api.post(`/articles/${articleId}/restore/`, {
        version_id: versionId,
    });
    return response.data;
};
