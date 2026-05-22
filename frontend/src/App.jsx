import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import LoginPage from "./pages/LoginPage.jsx";
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import ArticlePage from './pages/ArticlePage';
import SectionPage from './pages/SectionPage';
import SectionDetailsPage from './pages/SectionDetailsPage';
import ArticleDetailsPage from './pages/ArticleDetailsPage';
import GraphPage from './pages/GraphPage';
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { AppThemeProvider } from './contexts/ThemeContext';

const App = () => {
    return (
        <AuthProvider>
            <AppThemeProvider>
                <CssBaseline />
                <Header />
                <Box display="flex">
                    <Sidebar />
                    <Box component="main" sx={{ flexGrow: 1, p: 3, pb: 8 }}>
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                            <Route path="/" element={<SectionPage />} />
                            <Route path="/articles" element={<ArticlePage />} />
                            <Route path="/graph" element={<GraphPage />} />
                            <Route path="/sections/:id" element={<SectionDetailsPage />} />
                            <Route path="/articles/:id" element={<ArticleDetailsPage />} />
                        </Routes>
                    </Box>
                </Box>
                <Footer />
            </AppThemeProvider>
        </AuthProvider>
    );
};

export default App;
