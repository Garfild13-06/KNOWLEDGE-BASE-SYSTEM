import React, { useState, useEffect } from 'react';
import { List, ListItem, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import { Folder, ExpandLess, ExpandMore } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const FolderTree = ({ folders, currentSectionId }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState({});

  const getParentPath = (folderId, foldersMap) => {
    const path = [];
    let current = foldersMap[folderId];
    while (current && current.parent) {
      path.push(current.parent);
      current = foldersMap[current.parent];
    }
    return path;
  };

  useEffect(() => {
    if (currentSectionId && folders.length > 0) { // Добавлена проверка folders
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

      const pathToOpen = getParentPath(currentSectionId, foldersMap);
      const newOpenState = { ...open };
      pathToOpen.forEach((id) => {
        newOpenState[id] = true;
      });
      setOpen(newOpenState);
    }
  }, [currentSectionId, folders]); // folders добавлен в зависимости

  const handleToggle = (id) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTree = (folder, level = 0) => {
    const isActive = folder.id === currentSectionId;
    const hasChildren = folder.children && folder.children.length > 0;

    return (
      <React.Fragment key={folder.id}>
        <ListItem
          button
          onClick={() => navigate(`/sections/${folder.id}`)}
          sx={{
            paddingLeft: `${level * 20}px`,
            backgroundColor: isActive ? '#d0d0d0' : 'inherit', // Чуть темнее для контраста
            '&:hover': {
              backgroundColor: isActive ? '#d0d0d0' : '#f5f5f5',
            },
          }}
        >
          <ListItemIcon>
            <Folder />
          </ListItemIcon>
          <ListItemText primary={folder.name} />
          {hasChildren && (
            <span onClick={(e) => { e.stopPropagation(); handleToggle(folder.id); }}>
              {open[folder.id] ? <ExpandLess /> : <ExpandMore />}
            </span>
          )}
        </ListItem>
        {hasChildren && (
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