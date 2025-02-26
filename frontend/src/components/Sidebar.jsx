import React, { useState, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Home } from '@mui/icons-material';
import {useNavigate, useParams} from 'react-router-dom';
import FolderTree from './FolderTree';
import { fetchFolders } from '../services/api';

const Sidebar = () => {
    const navigate = useNavigate();
    const [folders, setFolders] = useState([]);
    const { id } = useParams(); // Получаем id из URL (например, "3" из "/sections/3")

    // Загрузка данных при монтировании компонента
    useEffect(() => {
        const loadFolders = async () => {
            try {
                const data = await fetchFolders();
                // Отображаем только корневые папки (без родителя)
                const rootFolders = data.filter((folder) => folder.parent === null);
                setFolders(rootFolders);
            } catch (error) {
                console.error('Ошибка загрузки папок:', error);
            }
        };
        loadFolders();
    }, []);

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: 240,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: 240,
                    boxSizing: 'border-box',
                },
            }}
        >
            <List>
                <ListItem button onClick={() => navigate('/')}>
                    <ListItemIcon>
                        <Home/>
                    </ListItemIcon>
                    <ListItemText primary="Главная"/>
                </ListItem>
            </List>
            <Divider/>
            <div>
                <FolderTree folders={folders} currentSectionId={id}/>
            </div>
        </Drawer>
    );
};

export default Sidebar;