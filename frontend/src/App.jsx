import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import Header from './components/Header';
import Footer from './components/Footer';
import ArticlePage from './pages/ArticlePage';
import SectionPage from './pages/SectionPage';
import SectionDetailsPage from './pages/SectionDetailsPage';
import ArticleDetailsPage from './pages/ArticleDetailsPage';

// Создаем кастомную тему
const theme = createTheme({
    palette: {
        mode: 'light', // Для темной темы укажи 'dark'
        primary: {
            main: '#1976d2', // Основной цвет
        },
        secondary: {
            main: '#9c27b0',
        },
    },
    typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
    },
});

const App = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline /> {/* Сбрасывает стили для более современного вида */}
            <Header />
            <div style={{ padding: '20px' }}>
                <Routes>
                    <Route path="/" element={<SectionPage />} />
                    <Route path="/articles" element={<ArticlePage />} />
                    <Route path="/sections/:id" element={<SectionDetailsPage />} />
                    <Route path="/articles/:id" element={<ArticleDetailsPage />} />
                </Routes>
            </div>
            <Footer />
        </ThemeProvider>
    );
};

export default App;
