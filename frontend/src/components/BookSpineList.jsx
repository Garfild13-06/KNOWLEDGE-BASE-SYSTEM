import React from 'react';
import { List, ListItem, ListItemText, Typography, Box } from '@mui/material';
import { MenuBook } from '@mui/icons-material';

const BookSpineList = ({ books, onClick }) => {
    return (
        <List>
            {books.map((book) => (
                <ListItem
                    key={book.id}
                    onClick={() => onClick(book.id)}
                    sx={{
                        cursor: 'pointer',
                        borderBottom: '1px solid #ddd',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': { backgroundColor: '#f0f0f0' },
                    }}
                >
                    <Box sx={{ marginRight: 2, color: '#8b4513', fontSize: '2rem' }}>
                        <MenuBook fontSize="inherit" />
                    </Box>
                    <ListItemText
                        primary={
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                {book.title}
                            </Typography>
                        }
                        secondary={book.description || 'Нет описания.'}
                    />
                </ListItem>
            ))}
        </List>
    );
};

export default BookSpineList;
