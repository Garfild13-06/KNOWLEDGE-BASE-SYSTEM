import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
    Breadcrumbs,
    Link,
    Typography,
    Button,
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Grid,
    ButtonGroup,
} from '@mui/material';
import { ViewModule, ViewList } from '@mui/icons-material';
import { useViewType } from '../contexts/ViewTypeContext';
import ShelfCard from '../components/ShelfCard';
import ShelfList from '../components/ShelfList';
import BookCard from '../components/BookCard';
import BookSpineList from '../components/BookSpineList';

const SectionDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { viewType, setViewType } = useViewType();
    const [section, setSection] = useState(null);
    const [subsections, setSubsections] = useState([]);
    const [articles, setArticles] = useState([]);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [openNewBook, setOpenNewBook] = useState(false);
    const [openNewShelf, setOpenNewShelf] = useState(false);
    const [newBook, setNewBook] = useState({ title: '', content: '', section: id });
    const [newShelf, setNewShelf] = useState({ name: '', description: '', parent: id });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const sectionResponse = await api.get(`/sections/${id}/`);
                setSection(sectionResponse.data);

                const subsectionsResponse = await api.get(`/sections/?parent=${id}`);
                setSubsections(subsectionsResponse.data);

                const articlesResponse = await api.get(`/articles/?section=${id}`);
                setArticles(articlesResponse.data);

                const fetchBreadcrumbs = async (sectionId, breadcrumbs = []) => {
                    const response = await api.get(`/sections/${sectionId}/`);
                    breadcrumbs.unshift({ id: response.data.id, name: response.data.name });
                    if (response.data.parent) {
                        return fetchBreadcrumbs(response.data.parent, breadcrumbs);
                    }
                    return breadcrumbs;
                };

                const breadcrumbsPath = await fetchBreadcrumbs(id);
                setBreadcrumbs(breadcrumbsPath);
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
            }
        };

        fetchData();
    }, [id]);

    if (!section) {
        return <Typography>Загрузка...</Typography>;
    }

    const handleCreateBook = async () => {
        try {
            const response = await api.post('/articles/', newBook);
            setArticles((prev) => [...prev, response.data]);
            setOpenNewBook(false);
        } catch (error) {
            console.error('Ошибка при добавлении книги:', error.response?.data || error.message);
        }
    };

    const handleCreateShelf = async () => {
        try {
            const response = await api.post('/sections/', newShelf);
            setSubsections((prev) => [...prev, response.data]);
            setOpenNewShelf(false);
        } catch (error) {
            console.error('Ошибка при добавлении полки:', error.response?.data || error.message);
        }
    };

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
                <Typography color="text.primary">{section.name}</Typography>
            </Breadcrumbs>

            <Typography variant="h4" gutterBottom>
                {section.name}
            </Typography>
            <Typography variant="body1" gutterBottom>
                {section.description}
            </Typography>

            {/* Кнопки добавления */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Button variant="contained" color="primary" onClick={() => setOpenNewBook(true)}>
                    Новая книга
                </Button>
                <Button variant="contained" color="secondary" onClick={() => setOpenNewShelf(true)}>
                    Новая полка
                </Button>

                {/* Переключатель вида */}
                <ButtonGroup>
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
            </Box>

            {/* Подразделы */}
            <Typography variant="h5" gutterBottom>
                Подполки
            </Typography>
            {viewType === 'grid' ? (
                <Grid container spacing={2}>
                    {subsections.map((subsection) => (
                        <Grid item xs={12} sm={6} md={4} key={subsection.id}>
                            <ShelfCard
                                name={subsection.name}
                                description={subsection.description}
                                onClick={() => navigate(`/sections/${subsection.id}`)} // Добавлена интерактивность
                            />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <ShelfList
                    books={subsections.map((subsection) => ({
                        id: subsection.id,
                        title: subsection.name,
                    }))}
                    onClick={(id) => navigate(`/sections/${id}`)} // Добавлена интерактивность
                />
            )}

            {/* Книги */}
            <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
                Книги
            </Typography>
            {viewType === 'grid' ? (
                <Grid container spacing={2}>
                    {articles.map((article) => (
                        <Grid item xs={12} sm={6} md={4} key={article.id}>
                            <BookCard
                                title={article.title}
                                description={article.content?.substring(0, 100)}
                                onClick={() => navigate(`/articles/${article.id}`)} // Добавлена интерактивность
                            />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <BookSpineList
                    books={articles.map((article) => ({
                        id: article.id,
                        title: article.title,
                    }))}
                    onClick={(id) => navigate(`/articles/${id}`)} // Добавлена интерактивность
                />
            )}

            {/* Модальное окно для добавления книги */}
            <Dialog open={openNewBook} onClose={() => setOpenNewBook(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить новую книгу</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Название книги"
                        value={newBook.title}
                        onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Содержание книги"
                        value={newBook.content}
                        onChange={(e) => setNewBook({ ...newBook, content: e.target.value })}
                        multiline
                        rows={4}
                        fullWidth
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewBook(false)} color="secondary">
                        Отмена
                    </Button>
                    <Button onClick={handleCreateBook} variant="contained" color="primary">
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Модальное окно для добавления полки */}
            <Dialog open={openNewShelf} onClose={() => setOpenNewShelf(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить новую полку</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Название полки"
                        value={newShelf.name}
                        onChange={(e) => setNewShelf({ ...newShelf, name: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Описание"
                        value={newShelf.description}
                        onChange={(e) => setNewShelf({ ...newShelf, description: e.target.value })}
                        multiline
                        rows={4}
                        fullWidth
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewShelf(false)} color="secondary">
                        Отмена
                    </Button>
                    <Button onClick={handleCreateShelf} variant="contained" color="primary">
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default SectionDetailsPage;
