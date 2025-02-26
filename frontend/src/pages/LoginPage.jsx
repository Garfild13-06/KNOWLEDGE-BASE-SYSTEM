import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Box, Paper, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { isAuthenticated, login } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
        } catch (error) {
            setError('Неверное имя пользователя или пароль');
        }
    };

    if (isAuthenticated) {
        return null; // Ничего не рендерим, так как идет перенаправление
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
                    {error && <Alert severity="error">{error}</Alert>}
                    <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                        Войти
                    </Button>
                </form>
            </Paper>
        </Box>
    );
};

export default LoginPage;