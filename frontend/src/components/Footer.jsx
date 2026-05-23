import { Box, Typography } from '@mui/material';

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                mt: 'auto',
                py: 1.5,
                px: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                textAlign: 'center',
                boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
            }}
        >
            <Typography variant="body2">&copy; 2025 Knowledge Base System</Typography>
        </Box>
    );
};

export default Footer;
