import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

const SectionDetailsPage = () => {
    const { id } = useParams(); // Получаем ID раздела из URL
    const [section, setSection] = useState(null); // Данные раздела
    const [articles, setArticles] = useState([]); // Список статей раздела

    useEffect(() => {
        const fetchSectionDetails = async () => {
            try {
                // Получаем данные о разделе
                const sectionResponse = await api.get(`/sections/${id}/`); // Проверяем этот запрос
                setSection(sectionResponse.data);

                // Получаем статьи, связанные с этим разделом
                const articlesResponse = await api.get(`/articles/?section=${id}`); // Проверяем этот запрос
                setArticles(articlesResponse.data);
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            }
        };

        fetchSectionDetails();
    }, [id]);

    if (!section) {
        return <div>Загрузка...</div>;
    }

    return (
        <div>
            <h2>{section.name}</h2>
            <p>{section.description}</p>

            <h3>Статьи в этом разделе:</h3>
            <ul className="list-group">
                {articles.length > 0 ? (
                    articles.map((article) => (
                        <li key={article.id} className="list-group-item">
                            {article.title}
                        </li>
                    ))
                ) : (
                    <li className="list-group-item">Нет статей в этом разделе.</li>
                )}
            </ul>
        </div>
    );
};

export default SectionDetailsPage;
