import React, { useState, useEffect } from 'react';
import SectionList from '../components/SectionList';
import { api } from '../services/api';

const SectionPage = () => {
    const [sections, setSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState(null);

    // Загрузка разделов
    useEffect(() => {
        const loadSections = async () => {
            const response = await api.get('/sections/');
            setSections(response.data);
        };

        loadSections();
    }, []);

    // Обработчик выбора раздела
    const handleSelectSection = (section) => {
        console.log('Выбранный раздел:', section);
        setSelectedSection(section);
    };

    return (
        <div>
            <h2>Разделы</h2>
            <SectionList sections={sections} onSelect={handleSelectSection} />
            {selectedSection && (
                <div className="mt-3">
                    <h4>Вы выбрали:</h4>
                    <p>{selectedSection.name}</p>
                </div>
            )}
        </div>
    );
};

export default SectionPage;
