import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { MenuBook } from '@mui/icons-material';

const BookCard = ({ title, description, onClick }) => {
    return (
        <Card
            onClick={onClick}
            sx={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#fff8dc', // Цвет файла
                borderRadius: 2,
                boxShadow: 3,
                '&:hover': { boxShadow: 6, transform: 'scale(1.02)' },
                transition: 'transform 0.2s ease-in-out',
                padding: 2,
                height: '100%',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 1,
                    fontSize: '3rem',
                    color: '#8b4513',
                }}
            >
                <MenuBook fontSize="inherit" />
            </Box>
            <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {title}
                </Typography>
                {/* <Typography variant="body2" color="text.secondary">
                    {description || 'Содержание отсутствует.'}
                </Typography> */}
            </CardContent>
        </Card>
    );
};

export default BookCard;
