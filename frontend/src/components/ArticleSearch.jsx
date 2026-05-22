import React, { useEffect, useState } from 'react';
import {
    Autocomplete,
    TextField,
    Box,
    Typography,
    IconButton,
    Popover,
    Stack,
    Button,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';
import { searchArticles } from '../services/articles';
import { api } from '../services/api';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 350;

const ArticleSearch = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterAnchor, setFilterAnchor] = useState(null);
    const [sections, setSections] = useState([]);
    const [filters, setFilters] = useState({
        section: '',
        author: '',
        date_from: '',
        date_to: '',
    });

    useEffect(() => {
        const loadSections = async () => {
            try {
                const response = await api.get('/sections/');
                setSections(response.data);
            } catch (error) {
                console.error('Ошибка загрузки разделов:', error);
            }
        };
        loadSections();
    }, []);

    useEffect(() => {
        const trimmed = inputValue.trim();
        if (trimmed.length < MIN_QUERY_LENGTH) {
            setOptions([]);
            return undefined;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const params = {};
                if (filters.section) params.section = filters.section;
                if (filters.author) params.author = filters.author;
                if (filters.date_from) params.date_from = filters.date_from;
                if (filters.date_to) params.date_to = filters.date_to;
                const results = await searchArticles(trimmed, params);
                setOptions(results);
            } catch (error) {
                console.error('Ошибка поиска статей:', error);
                setOptions([]);
            } finally {
                setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [inputValue, filters]);

    const activeFiltersCount = Object.values(filters).filter(Boolean).length;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', width: 360, mr: 2 }}>
            <Autocomplete
                sx={{ flexGrow: 1 }}
                freeSolo
                loading={loading}
                options={options}
                getOptionLabel={(option) => (typeof option === 'string' ? option : option.title)}
                filterOptions={(x) => x}
                inputValue={inputValue}
                onInputChange={(_, value) => setInputValue(value)}
                onChange={(_, value) => {
                    if (value && value.id) {
                        navigate(`/articles/${value.id}`);
                        setInputValue('');
                        setOptions([]);
                    }
                }}
                renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                        <Box>
                            <Typography variant="body2">{option.title}</Typography>
                            <Typography variant="caption" color="text.secondary">
                                {option.section_name}
                                {option.snippet ? ` — ${option.snippet}` : ''}
                            </Typography>
                        </Box>
                    </Box>
                )}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        size="small"
                        placeholder="Поиск статей…"
                        variant="outlined"
                        sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 1 }}
                    />
                )}
                noOptionsText={
                    inputValue.trim().length < MIN_QUERY_LENGTH
                        ? 'Введите минимум 2 символа'
                        : 'Ничего не найдено'
                }
            />
            <IconButton
                color="inherit"
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                title="Фильтры поиска"
            >
                <FilterListIcon />
                {activeFiltersCount > 0 && (
                    <Box
                        component="span"
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 8,
                            height: 8,
                            bgcolor: 'secondary.main',
                            borderRadius: '50%',
                        }}
                    />
                )}
            </IconButton>
            <Popover
                open={Boolean(filterAnchor)}
                anchorEl={filterAnchor}
                onClose={() => setFilterAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Stack spacing={2} sx={{ p: 2, minWidth: 280 }}>
                    <Typography variant="subtitle2">Расширенный поиск</Typography>
                    <TextField
                        select
                        label="Раздел"
                        value={filters.section}
                        onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                        SelectProps={{ native: true }}
                        size="small"
                    >
                        <option value="">Все</option>
                        {sections.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </TextField>
                    <TextField
                        label="Автор"
                        size="small"
                        value={filters.author}
                        onChange={(e) => setFilters({ ...filters, author: e.target.value })}
                    />
                    <TextField
                        label="Дата от"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={filters.date_from}
                        onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                    />
                    <TextField
                        label="Дата до"
                        type="date"
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        value={filters.date_to}
                        onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                    />
                    <Button
                        size="small"
                        onClick={() =>
                            setFilters({ section: '', author: '', date_from: '', date_to: '' })
                        }
                    >
                        Сбросить фильтры
                    </Button>
                </Stack>
            </Popover>
        </Box>
    );
};

export default ArticleSearch;
