import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import { Folder, ExpandLess, ExpandMore } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FolderTree = ({ folders, currentSectionId }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState({});

  // Функция для получения пути до текущей папки
  const getParentPath = (folderId, foldersMap) => {
    const path = [];
    let current = foldersMap[folderId];
    while (current && current.parent) {
      path.push(current.parent);
      current = foldersMap[current.parent];
    }
    return path;
  };

  // Автоматическое раскрытие папок при загрузке или изменении currentSectionId
  useEffect(() => {
    if (currentSectionId) {
      // Создаём карту папок для быстрого доступа по id
      const foldersMap = {};
      const buildMap = (folderList) => {
        folderList.forEach((folder) => {
          foldersMap[folder.id] = folder;
          if (folder.children) {
            buildMap(folder.children);
          }
        });
      };
      buildMap(folders);

      // Получаем путь до активной папки
      const pathToOpen = getParentPath(currentSectionId, foldersMap);
      // Раскрываем все папки на пути
      const newOpenState = { ...open };
      pathToOpen.forEach((id) => {
        newOpenState[id] = true;
      });
      setOpen(newOpenState);
    }
  }, [currentSectionId, folders]);

  // Переключение состояния открытия/закрытия папки
  const handleToggle = (id) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Рекурсивная функция для отрисовки дерева
  const renderTree = (folder, level = 0) => {
    const isActive = folder.id === currentSectionId;

    return (
      <React.Fragment key={folder.id}>
        <ListItem
          button
          onClick={() => navigate(`/sections/${folder.id}`)}
          sx={{
            paddingLeft: `${level * 20}px`,
            backgroundColor: isActive ? '#e0e0e0' : 'inherit',
            '&:hover': {
              backgroundColor: isActive ? '#e0e0e0' : '#f5f5f5',
            },
          }}
        >
          <ListItemIcon>
            <Folder />
          </ListItemIcon>
          <ListItemText primary={folder.name} />
          {folder.children.length > 0 && (
            <span onClick={(e) => { e.stopPropagation(); handleToggle(folder.id); }}>
              {open[folder.id] ? <ExpandLess /> : <ExpandMore />}
            </span>
          )}
        </ListItem>
        {folder.children.length > 0 && (
          <Collapse in={open[folder.id]} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {folder.children.map((child) => renderTree(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <List sx={{ padding: 0 }}>
      {folders.map((folder) => renderTree(folder))}
    </List>
  );
};

export default FolderTree;