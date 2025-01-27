import React, { useState, useEffect } from 'react';
import ToggleViewList from '../components/ToggleViewList';
import { api } from '../services/api';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    ButtonGroup,
    Box,
    Typography,
} from '@mui/material';
import { ViewModule, ViewList } from '@mui/icons-material';
import { useViewType } from '../contexts/ViewTypeContext';

const SectionPage = () => {
    const [sections, setSections] = useState([]);
    const [open, setOpen] = useState(false); // Состояние модального окна
    const [newSection, setNewSection] = useState({ name: '', description: '' }); // Новая полка
    const { viewType, setViewType } = useViewType(); // Глобальное состояние переключателя вида

    useEffect(() => {
        const loadSections = async () => {
            const response = await api.get('/sections/'); // Загружаем корневые полки
            setSections(response.data);
        };

        loadSections();
    }, []);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setNewSection({ name: '', description: '' });
    };

    const handleCreateSection = async () => {
        try {
            // Если создаётся корневая полка, указываем `parent` как null
            const payload = { ...newSection, parent: null };
            const response = await api.post('/sections/', payload); // API для создания полки
            setSections((prev) => [...prev, response.data]); // Обновляем список
            handleClose();
        } catch (error) {
            console.error('Ошибка при создании полки:', error.response?.data || error.message);
            alert('Ошибка при добавлении полки. Проверьте данные.');
        }
    };

    const handleNavigate = (id) => {
        window.location.href = `/sections/${id}`; // Переход на страницу выбранной полки
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Полки
            </Typography>

            {/* Кнопки и переключатель */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                {/* Кнопка добавления полки */}
                <Button variant="contained" color="primary" onClick={handleOpen}>
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

            {/* Список полок */}
            <ToggleViewList items={sections} viewType={viewType} onClick={handleNavigate} />

            {/* Модальное окно для создания полки */}
            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Создать новую полку</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Название полки"
                        value={newSection.name}
                        onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Описание"
                        value={newSection.description}
                        onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
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
                    <Button onClick={handleCreateSection} variant="contained" color="primary">
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default SectionPage;
