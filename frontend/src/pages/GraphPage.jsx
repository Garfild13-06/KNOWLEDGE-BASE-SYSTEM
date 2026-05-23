import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Typography, Alert, Box, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const GraphPage = () => {
    const { profile } = useAuth();
    const [graph, setGraph] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!profile?.features?.enable_graph_view) {
            setError('Граф знаний отключён администратором');
            return;
        }
        api.get('/api/graph/')
            .then((r) => setGraph(r.data))
            .catch((e) => setError(e.response?.data?.detail || 'Не удалось загрузить граф'));
    }, [profile?.features?.enable_graph_view]);

    if (error) {
        return <Alert severity="info">{error}</Alert>;
    }

    if (!graph) {
        return <Typography>Загрузка графа...</Typography>;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Граф связей
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Узлов: {graph.nodes?.length || 0}, связей: {graph.edges?.length || 0}
            </Typography>
            <List>
                {graph.nodes?.map((n) => (
                    <ListItem key={n.id} disablePadding>
                        <ListItemButton
                            component={RouterLink}
                            to={`/articles/${n.id.replace('article-', '')}`}
                        >
                            <ListItemText primary={n.label} secondary={n.type} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default GraphPage;
