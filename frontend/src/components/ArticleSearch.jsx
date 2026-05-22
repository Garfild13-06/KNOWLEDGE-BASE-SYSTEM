import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField, Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { searchArticles } from '../services/articles';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 350;

const ArticleSearch = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const trimmed = inputValue.trim();
        if (trimmed.length < MIN_QUERY_LENGTH) {
            setOptions([]);
            return undefined;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const results = await searchArticles(trimmed);
                setOptions(results);
            } catch (error) {
                console.error('Ошибка поиска статей:', error);
                setOptions([]);
            } finally {
                setLoading(false);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [inputValue]);

    return (
        <Autocomplete
            sx={{ width: 320, mr: 2 }}
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
    );
};

export default ArticleSearch;
