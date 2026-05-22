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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ViewModule, ViewList } from '@mui/icons-material';
import { useViewType } from '../contexts/ViewTypeContext';
import ShelfCard from '../components/ShelfCard';
import ShelfList from '../components/ShelfList';
import BookCard from '../components/BookCard';
import BookSpineList from '../components/BookSpineList';
import RequireAuth from '../components/RequireAuth';
import RichTextEditor from '../components/RichTextEditor';
import { useFoldersRefresh } from '../contexts/FoldersContext';

const SectionDetailsPage = () => {
  const { id } = useParams();
  const parentId = parseInt(id, 10);
  const navigate = useNavigate();
  const { viewType, setViewType } = useViewType();
  const { refreshFolders } = useFoldersRefresh();
  const [section, setSection] = useState(null);
  const [subsections, setSubsections] = useState([]);
  const [articles, setArticles] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [openNewBook, setOpenNewBook] = useState(false);
  const [openNewShelf, setOpenNewShelf] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    content: '',
    section: id,
    template_key: 'blank',
    status: 'draft',
  });
  const [templates, setTemplates] = useState([]);
  const [newShelf, setNewShelf] = useState({ name: '', description: '', parent: parentId });

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
    api.get('/api/templates/')
      .then((r) => setTemplates(r.data.templates || []))
      .catch(() => setTemplates([]));
  }, [id]);

  if (!section) {
    return <Typography>Загрузка...</Typography>;
  }

  const resetNewBook = () => {
    setNewBook({
      title: '',
      content: '',
      section: id,
      template_key: 'blank',
      status: 'draft',
    });
  };

  const applyTemplate = (key) => {
    const tpl = templates.find((t) => t.key === key);
    setNewBook((prev) => ({
      ...prev,
      template_key: key,
      content: tpl?.content || prev.content,
    }));
  };

  const handleCreateBook = async () => {
    try {
      const response = await api.post('/articles/', {
        ...newBook,
        section: Number(id),
        is_published: newBook.status === 'published',
      });
      setArticles((prev) => [...prev, response.data]);
      setOpenNewBook(false);
      resetNewBook();
    } catch (error) {
      console.error('Ошибка при добавлении файла:', error.response?.data || error.message);
    }
  };

  const handleCreateShelf = async () => {
    try {
      const response = await api.post('/sections/', newShelf);
      setSubsections((prev) => [...prev, response.data]);
      setOpenNewShelf(false);
      refreshFolders();
    } catch (error) {
      console.error('Ошибка при добавлении папки:', error.response?.data || error.message);
    }
  };

  return (
    <div>
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

      <Typography variant="h4" gutterBottom>{section.name}</Typography>
      <Typography variant="body1" gutterBottom>{section.description}</Typography>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <RequireAuth>
          <Button variant="contained" color="primary" onClick={() => setOpenNewBook(true)}>
            Новый файл
          </Button>
          <Button variant="contained" color="secondary" onClick={() => setOpenNewShelf(true)} sx={{ ml: 1 }}>
            Новая подпапка
          </Button>
        </RequireAuth>
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

      <Typography variant="h5" gutterBottom>Подпапки</Typography>
      {viewType === 'grid' ? (
        <Grid container spacing={2}>
          {subsections.map((subsection) => (
            <Grid item xs={12} sm={6} md={4} key={subsection.id}>
              <ShelfCard
                name={subsection.name}
                description={subsection.description}
                onClick={() => navigate(`/sections/${subsection.id}`)}
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
          onClick={(id) => navigate(`/sections/${id}`)}
        />
      )}

      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Файлы
      </Typography>
      {viewType === 'grid' ? (
        <Grid container spacing={2}>
          {articles.map((article) => (
            <Grid item xs={12} sm={6} md={4} key={article.id}>
              <BookCard
                title={article.title}
                description={article.content?.substring(0, 100)}
                onClick={() => navigate(`/articles/${article.id}`)}
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
          onClick={(id) => navigate(`/articles/${id}`)}
        />
      )}

      <Dialog
        open={openNewBook}
        onClose={() => {
          setOpenNewBook(false);
          resetNewBook();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Добавить новую статью</DialogTitle>
        <DialogContent>
          <TextField
            label="Название"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            fullWidth
            margin="normal"
          />
          {templates.length > 0 && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Шаблон</InputLabel>
              <Select
                value={newBook.template_key}
                label="Шаблон"
                onChange={(e) => applyTemplate(e.target.value)}
              >
                {templates.map((t) => (
                  <MenuItem key={t.key} value={t.key}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl fullWidth margin="normal">
            <InputLabel>Статус</InputLabel>
            <Select
              value={newBook.status}
              label="Статус"
              onChange={(e) => setNewBook({ ...newBook, status: e.target.value })}
            >
              <MenuItem value="draft">Черновик</MenuItem>
              <MenuItem value="published">Опубликовано</MenuItem>
            </Select>
          </FormControl>
          <RichTextEditor
            value={newBook.content}
            onChange={(content) => setNewBook({ ...newBook, content })}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenNewBook(false);
              resetNewBook();
            }}
            color="secondary"
          >
            Отмена
          </Button>
          <Button onClick={handleCreateBook} variant="contained" color="primary" disabled={!newBook.title.trim()}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openNewShelf} onClose={() => setOpenNewShelf(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить новую подпапку</DialogTitle>
        <DialogContent>
          <TextField
            label="Название подпапки"
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