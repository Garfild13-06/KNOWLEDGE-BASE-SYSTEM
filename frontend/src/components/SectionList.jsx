import React from 'react';
import { useNavigate } from 'react-router-dom';

const SectionList = ({ sections }) => {
    const navigate = useNavigate();

    return (
        <ul className="list-group">
            {sections.map((section) => (
                <li
                    key={section.id}
                    className="list-group-item"
                    onClick={() => navigate(`/sections/${section.id}`)} // Переход на страницу раздела
                    style={{ cursor: 'pointer' }} // Добавим указатель мыши для наглядности
                >
                    {section.name}
                </li>
            ))}
        </ul>
    );
};

export default SectionList;
