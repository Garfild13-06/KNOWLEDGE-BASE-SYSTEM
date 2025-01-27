import React, { createContext, useContext, useState, useEffect } from 'react';

const ViewTypeContext = createContext();

export const useViewType = () => useContext(ViewTypeContext);

export const ViewTypeProvider = ({ children }) => {
    const [viewType, setViewType] = useState(() => {
        // Загружаем из localStorage при первой загрузке
        return localStorage.getItem('viewType') || 'grid';
    });

    // Сохраняем в localStorage при изменении вида
    useEffect(() => {
        localStorage.setItem('viewType', viewType);
    }, [viewType]);

    return (
        <ViewTypeContext.Provider value={{ viewType, setViewType }}>
            {children}
        </ViewTypeContext.Provider>
    );
};
