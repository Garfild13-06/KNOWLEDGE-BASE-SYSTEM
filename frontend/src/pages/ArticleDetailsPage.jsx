import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
    Breadcrumbs,
    Link,
    Typography,
    Button,
    Box,
    TextField,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@mui/material';

const ArticleDetailsPage = () => {
    const { id } = useParams(); // ID книги из URL
    const navigate = useNavigate();
    const [article, setArticle] = useState(null); // Данные книги
    const [breadcrumbs, setBreadcrumbs] = useState([]); // Хлебные крошки
    const [isEditing, setIsEditing] = useState(false); // Режим редактирования
    const [editedArticle, setEditedArticle] = useState(null); // Редактируемая версия книги
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false); // Диалог удаления

    useEffect(() => {
        const fetchArticleData = async () => {
            try {
                // Получаем данные о книге
                const articleResponse = await api.get(`/articles/${id}/`);
                const fetchedArticle = articleResponse.data;
                setArticle(fetchedArticle);
                setEditedArticle(fetchedArticle); // Создаём копию для редактирования

                // Получаем хлебные крошки
                const fetchBreadcrumbs = async (sectionId, breadcrumbs = []) => {
                    const sectionResponse = await api.get(`/sections/${sectionId}/`);
                    breadcrumbs.unshift({ id: sectionResponse.data.id, name: sectionResponse.data.name });
                    if (sectionResponse.data.parent) {
                        return fetchBreadcrumbs(sectionResponse.data.parent, breadcrumbs);
                    }
                    return breadcrumbs;
                };

                const breadcrumbsPath = await fetchBreadcrumbs(fetchedArticle.section);
                setBreadcrumbs(breadcrumbsPath);
            } catch (error) {
                console.error('Ошибка при загрузке данных книги:', error);
            }
        };

        fetchArticleData();
    }, [id]);

    const handleEdit = () => {
        setIsEditing(true); // Включаем режим редактирования
    };

    const handleCancelEdit = () => {
        setIsEditing(false); // Выключаем режим редактирования
        setEditedArticle(article); // Сбрасываем изменения
    };

    const handleSave = async () => {
        try {
            const response = await api.put(`/articles/${id}/`, editedArticle); // Сохраняем изменения
            setArticle(response.data); // Обновляем данные книги
            setIsEditing(false); // Выходим из режима редактирования
        } catch (error) {
            console.error('Ошибка при сохранении изменений:', error);
            alert('Не удалось сохранить изменения.');
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/articles/${id}/`); // Удаляем книгу
            navigate(`/sections/${article.section}`); // Возвращаемся в раздел
        } catch (error) {
            console.error('Ошибка при удалении книги:', error);
            alert('Не удалось удалить книгу.');
        }
    };

    if (!article) {
        return <Typography>Загрузка...</Typography>;
    }

    return (
        <div>
            {/* Хлебные крошки */}
            <Breadcrumbs aria-label="breadcrumb" style={{ marginBottom: '20px' }}>
                <Link underline="hover" color="inherit" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    Главная
                </Link>
                {breadcrumbs.map((breadcrumb) => (
                    <Link
                        key={breadcrumb.id}
                        underline="hover"
                        color="inherit"
                        onClick={() => navigate(`/sections/${breadcrumb.id}`)}
                        style={{ cursor: 'pointer' }}
                    >
                        {breadcrumb.name}
                    </Link>
                ))}
                <Typography color="text.primary">{article.title}</Typography>
            </Breadcrumbs>

            {isEditing ? (
                <div>
                    {/* Режим редактирования */}
                    <TextField
                        label="Название книги"
                        value={editedArticle.title}
                        onChange={(e) => setEditedArticle({ ...editedArticle, title: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Содержание книги"
                        value={editedArticle.content}
                        onChange={(e) => setEditedArticle({ ...editedArticle, content: e.target.value })}
                        fullWidth
                        multiline
                        rows={6}
                        margin="normal"
                    />
                    <Box display="flex" justifyContent="space-between" mt={2}>
                        <Button variant="contained" color="primary" onClick={handleSave}>
                            Сохранить
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={handleCancelEdit}>
                            Отменить изменения
                        </Button>
                    </Box>
                </div>
            ) : (
                <div>
                    {/* Обычный режим */}
                    <Typography variant="h4" gutterBottom>
                        {article.title}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                        {article.content}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mt={2}>
                        <Button variant="contained" color="primary" onClick={handleEdit}>
                            Изменить
                        </Button>
                        <Button variant="outlined" color="error" onClick={() => setOpenDeleteDialog(true)}>
                            Удалить
                        </Button>
                    </Box>
                </div>
            )}

            {/* Диалог подтверждения удаления */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Удалить книгу</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы действительно хотите удалить книгу "{article.title}"? <br />
                        Полный путь: Главная /{' '}
                        {breadcrumbs.map((breadcrumb) => breadcrumb.name).join(' / ')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="secondary">
                        Отмена
                    </Button>
                    <Button onClick={handleDelete} color="error">
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ArticleDetailsPage;
