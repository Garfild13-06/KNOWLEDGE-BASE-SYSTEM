import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Card, CardContent, Typography } from '@mui/material';

const ArticleList = ({ articles }) => {
    const navigate = useNavigate();

    return (
        <Grid container spacing={2}>
            {articles.map((article) => (
                <Grid item xs={12} sm={6} md={4} key={article.id}>
                    <Card onClick={() => navigate(`/articles/${article.id}`)} sx={{ cursor: 'pointer' }}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                {article.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {article.content?.substring(0, 100) || 'Содержание отсутствует...'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default ArticleList;
