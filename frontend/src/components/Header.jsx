import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
    const { isAuthenticated, logout } = useAuth();

    return (
        <AppBar position="sticky">
            <Toolbar>
                <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    style={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
                >
                    Knowledge Base
                </Typography>
                {isAuthenticated ? (
                    <Button color="inherit" onClick={logout}>
                        Выход
                    </Button>
                ) : (
                    <Button color="inherit" component={Link} to="/login">
                        Войти
                    </Button>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Header;