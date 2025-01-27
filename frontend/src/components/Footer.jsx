import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                position: 'fixed',
                bottom: 0,
                width: '100%',
                backgroundColor: 'primary.main',
                color: 'white',
                textAlign: 'center',
                padding: '1rem',
                boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
            }}
        >
            <Typography variant="body2">&copy; 2025 Knowledge Base System</Typography>
        </Box>
    );
};

export default Footer;
