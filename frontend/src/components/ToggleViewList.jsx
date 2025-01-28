import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Typography,
  Avatar,
} from '@mui/material';
import { LibraryBooks, MenuBook } from '@mui/icons-material';

const renderGrid = (items, onClick, isSection) => (
  <Grid container spacing={2}>
    {items.map((item) => (
      <Grid item xs={12} sm={6} md={4} key={item.id}>
        <Card
          onClick={() => onClick(item.id)}
          sx={{
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <CardContent>
            <Avatar sx={{ bgcolor: isSection ? 'primary.main' : 'secondary.main', mb: 2 }}>
              {isSection ? <LibraryBooks /> : <MenuBook />}
            </Avatar>
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

const renderList = (items, onClick, isSection) => (
  <List>
    {items.map((item) => (
      <ListItem
        key={item.id}
        onClick={() => onClick(item.id)}
        sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        divider
      >
        <Avatar sx={{ bgcolor: isSection ? 'primary.main' : 'secondary.main', mr: 2 }}>
          {isSection ? <LibraryBooks /> : <MenuBook />}
        </Avatar>
        <ListItemText
          primary={item.name || item.title}
          secondary={item.description || item.content?.substring(0, 100) || 'Нет описания'}
        />
      </ListItem>
    ))}
  </List>
);

const ToggleViewList = ({ items, viewType, onClick, isSection }) => {
  return viewType === 'grid'
    ? renderGrid(items, onClick, isSection)
    : renderList(items, onClick, isSection);
};

export default ToggleViewList;
