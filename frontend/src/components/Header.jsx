import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <AppBar position="sticky">
            <Toolbar>
                <Typography
                    variant="h6"
                    component={Link} to="/"
                    style={
                        {
                            flexGrow: 1,
                            textDecoration: 'none',
                            color: 'inherit'
                        }
                    }>
                    Knowledge Base
                </Typography>
                <Button color="inherit" component={Link} to="/articles">Файлы</Button>
                <Button color="inherit" component={Link} to="/">Папки</Button>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
