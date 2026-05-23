import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material';

const STORAGE_KEY = 'kb_theme_mode';

const ThemeModeContext = createContext({
    mode: 'light',
    toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

export const AppThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => localStorage.getItem(STORAGE_KEY) || 'light');

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, mode);
    }, [mode]);

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: { main: '#1976d2' },
                    secondary: { main: '#9c27b0' },
                },
                typography: {
                    fontFamily: 'Roboto, Arial, sans-serif',
                },
            }),
        [mode]
    );

    const toggleMode = () => setMode((m) => (m === 'light' ? 'dark' : 'light'));

    return (
        <ThemeModeContext.Provider value={{ mode, toggleMode }}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </ThemeModeContext.Provider>
    );
};
