import React, { useState, useEffect } from 'react';
import ArticleList from '../components/ArticleList'; // Список статей
import ArticleForm from '../components/ArticleForm'; // Форма для добавления статей
import { fetchArticles, createArticle } from '../services/articles'; // Работа с API

const ArticlePage = () => {
    const [articles, setArticles] = useState([]);

    // Загружаем статьи при первом рендере
    useEffect(() => {
        const loadArticles = async () => {
            const data = await fetchArticles();
            setArticles(data);
        };

        loadArticles();
    }, []);

    // Обрабатываем создание новой статьи
    const handleArticleCreated = async (newArticle) => {
        const createdArticle = await createArticle(newArticle);
        setArticles((prev) => [...prev, createdArticle]);
    };

    return (
        <div>
            <h2>Статьи</h2>
            <ArticleForm onSubmit={handleArticleCreated} /> {/* Форма добавления */}
            <ArticleList articles={articles} /> {/* Список статей */}
        </div>
    );
};

export default ArticlePage;
