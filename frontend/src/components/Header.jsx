import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ArticleSearch from './ArticleSearch';

const Header = () => {
    const { isAuthenticated, logout } = useAuth();

    return (
        <AppBar position="sticky">
            <Toolbar>
                <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    style={{ textDecoration: 'none', color: 'inherit', marginRight: 16 }}
                >
                    Knowledge Base
                </Typography>
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                    <ArticleSearch />
                </Box>
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