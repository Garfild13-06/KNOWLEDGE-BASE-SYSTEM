import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { applyOAuthTokens } = useAuth();
    const [error, setError] = useState('');

    useEffect(() => {
        const oauthError = searchParams.get('error');
        if (oauthError) {
            setError(`Ошибка входа: ${oauthError}`);
            return;
        }

        const access = searchParams.get('access');
        const refresh = searchParams.get('refresh');
        if (!access) {
            setError('Токен не получен');
            return;
        }

        applyOAuthTokens(access, refresh).then(() => {
            navigate('/', { replace: true });
        });
    }, [searchParams, applyOAuthTokens, navigate]);

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Завершение входа…</Typography>
        </Box>
    );
};

export default OAuthCallbackPage;
