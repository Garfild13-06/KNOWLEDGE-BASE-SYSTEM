import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Box, Paper, Alert, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../contexts/AuthContext';
import { fetchAuthProviders } from '../services/auth';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [googleAuthUrl, setGoogleAuthUrl] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated, login } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        fetchAuthProviders()
            .then((providers) => {
                const google = providers.find((p) => p.id === 'google');
                if (google?.auth_url) {
                    setGoogleAuthUrl(google.auth_url);
                }
            })
            .catch(() => {});
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);
        } catch {
            setError('Неверное имя пользователя или пароль');
        }
    };

    if (isAuthenticated) {
        return null;
    }

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <Paper elevation={3} sx={{ padding: 4, width: '400px' }}>
                <Typography variant="h4" gutterBottom>
                    Вход
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Имя пользователя"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Пароль"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                        Войти
                    </Button>
                </form>
                {googleAuthUrl && (
                    <>
                        <Divider sx={{ my: 2 }}>или</Divider>
                        <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<GoogleIcon />}
                            href={googleAuthUrl}
                        >
                            Войти через Google
                        </Button>
                    </>
                )}
            </Paper>
        </Box>
    );
};

export default LoginPage;
