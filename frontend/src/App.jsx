import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ArticlePage from './pages/ArticlePage';
import SectionPage from './pages/SectionPage';
import SectionDetailsPage from './pages/SectionDetailsPage'; // Новый компонент

const App = () => {
    return (
        <div>
            <Header />
            <div className="container mt-4">
                <Routes>
                    <Route path="/" element={<SectionPage />} />
                    <Route path="/articles" element={<ArticlePage />} />
                    <Route path="/sections/:id" element={<SectionDetailsPage />} /> {/* Новый маршрут */}
                </Routes>
            </div>
            <Footer />
        </div>
    );
};

export default App;
