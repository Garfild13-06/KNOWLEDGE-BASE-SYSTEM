import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ItemList = ({ items, onClick, titleKey = 'name', descriptionKey = 'description' }) => {
    const navigate = useNavigate();

    return (
        <Grid container spacing={2}>
            {items.map((item) => (
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Card onClick={() => onClick(item.id)} sx={{ cursor: 'pointer' }}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                {item[titleKey]}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {item[descriptionKey] || 'Описание отсутствует.'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default ItemList;
