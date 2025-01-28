import React, { useState, useEffect } from 'react';
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
    Grid,
} from '@mui/material';
import { ViewModule, ViewList } from '@mui/icons-material';
import { useViewType } from '../contexts/ViewTypeContext';
import ShelfCard from '../components/ShelfCard';
import ShelfList from '../components/ShelfList';

const SectionPage = () => {
    const [sections, setSections] = useState([]);
    const [open, setOpen] = useState(false);
    const [newSection, setNewSection] = useState({ name: '', description: '' });
    const { viewType, setViewType } = useViewType();

    useEffect(() => {
        const loadSections = async () => {
            try {
                const response = await api.get('/sections/');
                const rootSections = response.data.filter((section) => section.parent === null);
                setSections(rootSections);
            } catch (error) {
                console.error('Ошибка при загрузке полок:', error.response?.data || error.message);
            }
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
            const payload = { ...newSection, parent: null };
            const response = await api.post('/sections/', payload);
            setSections((prev) => [...prev, response.data]);
            handleClose();
        } catch (error) {
            console.error('Ошибка при создании папки:', error.response?.data || error.message);
        }
    };

    const handleNavigate = (id) => {
        window.location.href = `/sections/${id}`;
    };

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Папки
            </Typography>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Button variant="contained" color="primary" onClick={handleOpen}>
                    Новая папка
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

            {viewType === 'grid' ? (
                <Grid container spacing={2}>
                    {sections.map((section) => (
                        <Grid item xs={12} sm={6} md={4} key={section.id}>
                            <ShelfCard
                                name={section.name}
                                description={section.description}
                                onClick={() => handleNavigate(section.id)} // Добавлена интерактивность
                            />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <ShelfList
                    books={sections.map((section) => ({
                        id: section.id,
                        title: section.name,
                    }))}
                    onClick={(id) => handleNavigate(id)} // Добавлена интерактивность
                />
            )}

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Создать новую папку</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Название папки"
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
