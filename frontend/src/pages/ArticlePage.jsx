import React, { useState, useEffect } from 'react';
import { Button, Typography, Dialog, DialogActions, DialogContent, DialogTitle, TextField, ButtonGroup } from '@mui/material';
import { ViewModule, ViewList } from '@mui/icons-material';
import ToggleViewList from '../components/ToggleViewList';
import { fetchArticles, createArticle } from '../services/articles';
import { useNavigate } from 'react-router-dom';
import { useViewType } from '../contexts/ViewTypeContext'; // Используем глобальный переключатель вида

const ArticlePage = () => {
    const [articles, setArticles] = useState([]);
    const { viewType, setViewType } = useViewType(); // Используем глобальное состояние
    const [open, setOpen] = useState(false);
    const [newArticle, setNewArticle] = useState({ title: '', content: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const loadArticles = async () => {
            const data = await fetchArticles();
            setArticles(data);
        };

        loadArticles();
    }, []);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setNewArticle({ title: '', content: '' });
    };

    const handleCreateArticle = async () => {
        const createdArticle = await createArticle(newArticle);
        setArticles((prev) => [...prev, createdArticle]);
        handleClose();
    };

    const handleNavigate = (id) => {
        navigate(`/articles/${id}`);
    };

    return (
        <div>
            {/* Переключатель вида */}
            <ButtonGroup style={{ marginBottom: '20px' }}>
                <Button
                    variant={viewType === 'grid' ? 'contained' : 'outlined'}
                    onClick={() => setViewType('grid')}
                    startIcon={<ViewModule />}
                >
                    Карточки
                </Button>
                <Button
                    variant={viewType === 'list' ? 'contained' : 'outlined'}
                    onClick={() => setViewType('list')}
                    startIcon={<ViewList />}
                >
                    Список
                </Button>
            </ButtonGroup>

            <Typography variant="h4" gutterBottom>
                Книги
            </Typography>

            {/* Список книг */}
            <ToggleViewList items={articles} viewType={viewType} onClick={handleNavigate} />

            {/* Модальное окно для добавления книги */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить новую книгу</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Заголовок"
                        value={newArticle.title}
                        onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Содержание"
                        value={newArticle.content}
                        onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                        multiline
                        rows={4}
                        fullWidth
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="secondary">
                        Отмена
                    </Button>
                    <Button onClick={handleCreateArticle} variant="contained" color="primary">
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ArticlePage;
