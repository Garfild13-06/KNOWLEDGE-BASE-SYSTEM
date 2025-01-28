import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { LibraryBooks } from '@mui/icons-material';

const ShelfCard = ({ name, description, onClick }) => {
    return (
        <Card
            onClick={onClick}
            sx={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: '#f5f5dc', // Цвет книжной полки
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
                    color: '#d2691e',
                }}
            >
                <LibraryBooks fontSize="inherit" />
            </Box>
            <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    {name}
                </Typography>
                {/* <Typography variant="body2" color="text.secondary">
                    {description || 'Описание отсутствует.'}
                </Typography> */}
            </CardContent>
        </Card>
    );
};

export default ShelfCard;
