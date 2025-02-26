import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, Box } from '@mui/material';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import LoginPage from "./pages/LoginPage.jsx";
import ArticlePage from './pages/ArticlePage';
import SectionPage from './pages/SectionPage';
import SectionDetailsPage from './pages/SectionDetailsPage';
import ArticleDetailsPage from './pages/ArticleDetailsPage';
import { AuthProvider } from "./contexts/AuthContext.jsx";

// Создаем кастомную тему
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
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
        <AuthProvider>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <Header />
                <Box display="flex">
                    <Sidebar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3, pb: 8 }}> {/* Отступ снизу */}
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/" element={<SectionPage />} />
                            <Route path="/articles" element={<ArticlePage />} />
                            <Route path="/sections/:id" element={<SectionDetailsPage />} />
                            <Route path="/articles/:id" element={<ArticleDetailsPage />} />
                        </Routes>
                    </Box>
                </Box>
                <Footer />
            </ThemeProvider>
        </AuthProvider>
    );
};

export default App;