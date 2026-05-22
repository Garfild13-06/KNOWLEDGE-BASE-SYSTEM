import { api } from './api';

export const fetchMe = async () => {
    const response = await api.get('/api/auth/me/');
    return response.data;
};

export const joinOrganization = async (organizationSlug) => {
    const response = await api.post('/api/auth/join-organization/', {
        organization_slug: organizationSlug,
    });
    return response.data;
};

export const fetchAuthProviders = async () => {
    const response = await api.get('/api/auth/providers/');
    return response.data.providers;
};
