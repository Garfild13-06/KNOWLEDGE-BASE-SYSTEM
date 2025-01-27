import React from 'react';
import { Grid, Card, CardContent, List, ListItem, ListItemText, Typography } from '@mui/material';

const ToggleViewList = ({ items, viewType, onClick }) => {
    if (viewType === 'grid') {
        return (
            <Grid container spacing={2}>
                {items.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                        <Card
                            onClick={() => onClick(item.id)}
                            sx={{ cursor: 'pointer', height: '100%' }}
                        >
                            <CardContent>
                                <Typography variant="h5">{item.name || item.title}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {item.description || item.content?.substring(0, 100) || 'Нет описания'}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    }

    return (
        <List>
            {items.map((item) => (
                <ListItem
                    key={item.id}
                    onClick={() => onClick(item.id)}
                    sx={{ cursor: 'pointer' }}
                    divider
                >
                    <ListItemText
                        primary={item.name || item.title}
                        secondary={item.description || item.content?.substring(0, 100) || 'Нет описания'}
                    />
                </ListItem>
            ))}
        </List>
    );
};

export default ToggleViewList;
