import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, CardContent, Typography } from '@mui/material';

const SectionList = ({ sections }) => {
    const navigate = useNavigate();

    return (
        <Grid container spacing={2}>
            {sections.map((section) => (
                <Grid item xs={12} sm={6} md={4} key={section.id}>
                    <Card onClick={() => navigate(`/sections/${section.id}`)} sx={{ cursor: 'pointer' }}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                {section.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {section.description || 'Описание отсутствует.'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default SectionList;
