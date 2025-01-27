import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
    Breadcrumbs,
    Link,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    ButtonGroup,
    Box,
} from '@mui/material';
import { ViewModule, ViewList } from '@mui/icons-material';
import ToggleViewList from '../components/ToggleViewList';
import { useViewType } from '../contexts/ViewTypeContext';

const SectionDetailsPage = () => {
    const { id } = useParams(); // ID текущей полки
    const navigate = useNavigate();
    const { viewType, setViewType } = useViewType(); // Глобальное состояние переключателя вида
    const [section, setSection] = useState(null); // Данные текущей полки
    const [subsections, setSubsections] = useState([]); // Подразделы текущей полки
    const [articles, setArticles] = useState([]); // Книги текущей полки
    const [breadcrumbs, setBreadcrumbs] = useState([]); // Хлебные крошки

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Получаем данные о текущей полке
                const sectionResponse = await api.get(`/sections/${id}/`);
                setSection(sectionResponse.data);

                // Получаем дочерние подразделы
                const subsectionsResponse = await api.get(`/sections/?parent=${id}`);
                setSubsections(subsectionsResponse.data);

                // Получаем книги текущей полки
                const articlesResponse = await api.get(`/articles/?section=${id}`);
                setArticles(articlesResponse.data);

                // Собираем хлебные крошки
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

            {/* Переключатель вида */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                {/* Переключатель представления */}
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
            {subsections.length > 0 ? (
                <ToggleViewList items={subsections} viewType={viewType} onClick={(id) => navigate(`/sections/${id}`)} />
            ) : (
                <Typography variant="body2" color="text.secondary">
                    Нет подразделов.
                </Typography>
            )}

            {/* Книги */}
            <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
                Книги
            </Typography>
            {articles.length > 0 ? (
                <ToggleViewList items={articles} viewType={viewType} onClick={(id) => navigate(`/articles/${id}`)} />
            ) : (
                <Typography variant="body2" color="text.secondary">
                    Нет книг в этой полке.
                </Typography>
            )}
        </div>
    );
};

export default SectionDetailsPage;
