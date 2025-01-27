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
    const [sections, setSections] = useState([]); // Список корневых полок
    const [open, setOpen] = useState(false); // Состояние модального окна
    const [newSection, setNewSection] = useState({ name: '', description: '' }); // Новая полка
    const { viewType, setViewType } = useViewType(); // Глобальное состояние переключателя вида

    // Загрузка корневых полок
    useEffect(() => {
        const loadSections = async () => {
            try {
                const response = await api.get('/sections/'); // Загружаем все полки
                const rootSections = response.data.filter((section) => section.parent === null); // Фильтруем только корневые
                setSections(rootSections);
            } catch (error) {
                console.error('Ошибка при загрузке полок:', error.response?.data || error.message);
                alert('Ошибка при загрузке полок. Попробуйте обновить страницу.');
            }
        };

        loadSections();
    }, []);

    // Открытие и закрытие модального окна
    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setNewSection({ name: '', description: '' });
    };

    // Создание новой корневой полки
    const handleCreateSection = async () => {
        try {
            const payload = { ...newSection, parent: null }; // Корневая полка всегда имеет parent = null
            const response = await api.post('/sections/', payload); // Создаём полку через API
            setSections((prev) => [...prev, response.data]); // Добавляем полку в список
            handleClose(); // Закрываем модальное окно
        } catch (error) {
            console.error('Ошибка при создании полки:', error.response?.data || error.message);
            alert('Ошибка при создании полки. Проверьте введённые данные.');
        }
    };

    // Переход к подполкам
    const handleNavigate = (id) => {
        window.location.href = `/sections/${id}`;
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Полки
            </Typography>

            {/* Кнопки для добавления и переключения вида */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Button variant="contained" color="primary" onClick={handleOpen}>
                    Новая полка
                </Button>

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

            {/* Список корневых полок */}
            <ToggleViewList items={sections} viewType={viewType} onClick={handleNavigate} />

            {/* Модальное окно для добавления новой полки */}
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
