import React, { useState, useEffect } from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, IconButton, TextField } from '@mui/material';
import { Home, Menu, Close } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import FolderTree from './FolderTree';
import { fetchFolders } from '../services/api';

const Sidebar = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Состояние для поиска

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const data = await fetchFolders();
        const rootFolders = data.filter((folder) => folder.parent === null);
        setFolders(rootFolders);
      } catch (error) {
        console.error('Ошибка загрузки папок:', error);
      }
    };
    loadFolders();
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Функция фильтрации папок
  const filterFolders = (folders, term) => {
    if (!term) return folders;
    const lowerTerm = term.toLowerCase();
    const filterRecursive = (folderList) =>
      folderList
        .map((folder) => {
          const matches = folder.name.toLowerCase().includes(lowerTerm);
          const filteredChildren = folder.children ? filterRecursive(folder.children) : [];
          if (matches || filteredChildren.length > 0) {
            return { ...folder, children: filteredChildren };
          }
          return null;
        })
        .filter(Boolean);
    return filterRecursive(folders);
  };

  const filteredFolders = filterFolders(folders, searchTerm);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isCollapsed ? 60 : 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isCollapsed ? 60 : 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <List>
        <ListItem button onClick={toggleSidebar}>
          <ListItemIcon>
            {isCollapsed ? <Menu /> : <Close />}
          </ListItemIcon>
          {!isCollapsed && <ListItemText primary="Свернуть" />}
        </ListItem>
        {!isCollapsed && (
          <>
            <ListItem button onClick={() => navigate('/')}>
              <ListItemIcon>
                <Home />
              </ListItemIcon>
              <ListItemText primary="Главная" />
            </ListItem>
            <Divider />
            <TextField
              label="Поиск папок"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ margin: '10px' }}
            />
            <FolderTree folders={filteredFolders} currentSectionId={id} />
          </>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;