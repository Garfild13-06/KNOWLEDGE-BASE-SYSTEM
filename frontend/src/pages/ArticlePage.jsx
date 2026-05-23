import { useState, useEffect } from 'react';
import { Typography, ButtonGroup, Button } from '@mui/material';
import { ViewModule, ViewList } from '@mui/icons-material';
import ToggleViewList from '../components/ToggleViewList';
import { fetchArticles } from '../services/articles';
import { useNavigate } from 'react-router-dom';
import { useViewType } from '../contexts/ViewTypeContext';

const ArticlePage = () => {
    const [articles, setArticles] = useState([]);
    const { viewType, setViewType } = useViewType();
    const navigate = useNavigate();

    useEffect(() => {
        const loadArticles = async () => {
            try {
                const data = await fetchArticles();
                setArticles(data);
            } catch (error) {
                console.error('Ошибка загрузки статей:', error);
            }
        };
        loadArticles();
    }, []);

    const handleNavigate = (id) => {
        navigate(`/articles/${id}`);
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Все статьи
            </Typography>

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

            <ToggleViewList items={articles} viewType={viewType} onClick={handleNavigate} />
        </div>
    );
};

export default ArticlePage;
