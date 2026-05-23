import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Chip,
    Grid,
    Paper,
} from '@mui/material';
import { api } from '../services/api';
import { formatDateTime } from '../utils/formatDate';

const ArticleList = ({ title, items, emptyText }) => (
    <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
            {title}
        </Typography>
        {items?.length ? (
            <List dense>
                {items.map((a) => (
                    <ListItem key={a.id} disablePadding>
                        <ListItemButton component={RouterLink} to={`/articles/${a.id}`}>
                            <ListItemText
                                primary={a.title}
                                secondary={formatDateTime(a.updated_at)}
                            />
                            {a.status && a.status !== 'published' && (
                                <Chip label={a.status} size="small" sx={{ ml: 1 }} />
                            )}
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        ) : (
            <Typography variant="body2" color="text.secondary">
                {emptyText}
            </Typography>
        )}
    </Paper>
);

const DashboardPanel = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        api.get('/api/dashboard/')
            .then((res) => setData(res.data))
            .catch(() => setData(null));
    }, []);

    if (!data) return null;

    return (
        <Box mb={4}>
            <Typography variant="h5" gutterBottom>
                Обзор базы знаний
            </Typography>
            {data.stats && (
                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                    <Chip label={`Статей: ${data.stats.articles_total}`} />
                    <Chip label={`Разделов: ${data.stats.sections_total}`} />
                    {data.stats.drafts_total > 0 && (
                        <Chip label={`Черновиков: ${data.stats.drafts_total}`} color="warning" />
                    )}
                    {data.gamification && (
                        <Chip
                            label={`Уровень ${data.gamification.level} · ${data.gamification.points} очков`}
                            color="secondary"
                        />
                    )}
                </Box>
            )}
            <Grid container spacing={2}>
                <Grid item xs={12} md={6} lg={3}>
                    <ArticleList title="Недавние" items={data.recent} emptyText="Нет статей" />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <ArticleList title="Популярные" items={data.popular} emptyText="—" />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <ArticleList title="Устаревшие (>90 дн.)" items={data.stale} emptyText="Всё актуально" />
                </Grid>
                <Grid item xs={12} md={6} lg={3}>
                    <ArticleList title="Мои черновики" items={data.my_drafts} emptyText="Нет черновиков" />
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPanel;
