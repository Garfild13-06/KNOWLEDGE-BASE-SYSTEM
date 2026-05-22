import React, { useEffect, useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
} from '@mui/material';
import DOMPurify from 'dompurify';
import { fetchArticleVersions, restoreArticleVersion } from '../services/articles';
import { formatDateTime } from '../utils/formatDate';
import { useAuth } from '../contexts/AuthContext';

const ArticleVersionHistory = ({ articleId, onRestored }) => {
    const [open, setOpen] = useState(false);
    const [versions, setVersions] = useState([]);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const { canEdit } = useAuth();

    const loadVersions = async () => {
        setLoading(true);
        try {
            const data = await fetchArticleVersions(articleId);
            setVersions(data);
        } catch (error) {
            console.error('Ошибка загрузки версий:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadVersions();
        }
    }, [open, articleId]);

    const handleRestore = async (versionId) => {
        if (!window.confirm('Восстановить эту версию? Текущее содержимое будет сохранено в истории.')) {
            return;
        }
        try {
            const article = await restoreArticleVersion(articleId, versionId);
            setOpen(false);
            onRestored(article);
        } catch (error) {
            console.error('Ошибка отката:', error);
            alert('Не удалось восстановить версию.');
        }
    };

    return (
        <>
            <Button variant="outlined" onClick={() => setOpen(true)} sx={{ ml: 1 }}>
                История версий
            </Button>
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>История версий</DialogTitle>
                <DialogContent dividers>
                    {loading && <Typography>Загрузка…</Typography>}
                    {!loading && versions.length === 0 && (
                        <Typography color="text.secondary">Версий пока нет.</Typography>
                    )}
                    <List>
                        {versions.map((version) => (
                            <ListItem
                                key={version.id}
                                secondaryAction={
                                    <Box>
                                        <Button size="small" onClick={() => setPreview(version)}>
                                            Просмотр
                                        </Button>
                                        {canEdit && (
                                            <Button
                                                size="small"
                                                color="primary"
                                                onClick={() => handleRestore(version.id)}
                                                sx={{ ml: 1 }}
                                            >
                                                Восстановить
                                            </Button>
                                        )}
                                    </Box>
                                }
                            >
                                <ListItemText
                                    primary={`v${version.version_number}: ${version.title}`}
                                    secondary={
                                        <>
                                            {formatDateTime(version.created_at)}
                                            {version.created_by_username
                                                ? ` · ${version.created_by_username}`
                                                : ''}
                                            {version.change_summary
                                                ? ` · ${version.change_summary}`
                                                : ''}
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                    {preview && (
                        <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
                            <Typography variant="subtitle2" gutterBottom>
                                Просмотр v{preview.version_number}
                            </Typography>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(preview.content || ''),
                                }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ArticleVersionHistory;
