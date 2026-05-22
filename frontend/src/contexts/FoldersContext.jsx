import React, { createContext, useCallback, useContext, useState } from 'react';

const FoldersContext = createContext(null);

export const FoldersProvider = ({ children }) => {
    const [foldersVersion, setFoldersVersion] = useState(0);

    const refreshFolders = useCallback(() => {
        setFoldersVersion((version) => version + 1);
    }, []);

    return (
        <FoldersContext.Provider value={{ foldersVersion, refreshFolders }}>
            {children}
        </FoldersContext.Provider>
    );
};

export const useFoldersRefresh = () => {
    const context = useContext(FoldersContext);
    if (!context) {
        throw new Error('useFoldersRefresh must be used within FoldersProvider');
    }
    return context;
};
