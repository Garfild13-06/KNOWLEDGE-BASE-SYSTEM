import React from 'react';
import { AppBar, Toolbar, Typography, Button, Chip, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ArticleSearch from './ArticleSearch';

const Header = () => {
    const { isAuthenticated, logout, profile } = useAuth();

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
                {profile?.organization && (
                    <Chip
                        label={profile.organization.name}
                        size="small"
                        sx={{ mr: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
                    />
                )}
                {profile?.role_display && isAuthenticated && (
                    <Chip
                        label={profile.role_display}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 2, color: 'inherit', borderColor: 'rgba(255,255,255,0.5)' }}
                    />
                )}
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
