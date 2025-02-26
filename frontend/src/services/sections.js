import { api } from './api';

export const fetchSections = async () => {
    const response = await api.get('/sections/');
    return response.data;
};