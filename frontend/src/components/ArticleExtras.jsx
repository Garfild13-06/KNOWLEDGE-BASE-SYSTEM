import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    TextField,
    Alert,
    Chip,
    Link,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ArticleExtras = ({ articleId, article, features, onDraftGenerated }) => {
    const { canEdit, isAuthenticated } = useAuth();
    const [similar, setSimilar] = useState([]);
    const [backlinks, setBacklinks] = useState([]);
    const [comments, setComments] = useState([]);
    const [commentBody, setCommentBody] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [aiError, setAiError] = useState('');
    const [lintIssues, setLintIssues] = useState([]);
    const [bookmarked, setBookmarked] = useState(article?.is_bookmarked);

    useEffect(() => {
        setBookmarked(article?.is_bookmarked);
    }, [article?.is_bookmarked]);

    useEffect(() => {
        if (features?.enable_semantic_search) {
            api.get(`/articles/${articleId}/similar/`)
                .then((r) => setSimilar(r.data))
                .catch(() => setSimilar([]));
        }
        api.get(`/articles/${articleId}/backlinks/`)
            .then((r) => {
                setBacklinks(r.data.backlinks || []);
            })
            .catch(() => setBacklinks([]));
        api.get(`/articles/${articleId}/comments/`)
            .then((r) => setComments(r.data))
            .catch(() => setComments([]));
    }, [articleId, features?.enable_semantic_search]);

    const handleExport = (format) => {
        window.open(`/articles/${articleId}/export/?format=${format}`, '_blank');
    };

    const handlePublish = async () => {
        const res = await api.post(`/articles/${articleId}/publish/`);
        window.location.reload();
        return res;
    };

    const handleSubmitReview = async () => {
        await api.post(`/articles/${articleId}/submit-review/`);
        window.location.reload();
    };

    const handleBookmark = async () => {
        const res = await api.post(`/articles/${articleId}/bookmark/`, {
            bookmarked: !bookmarked,
        });
        setBookmarked(res.data.is_bookmarked);
    };

    const handleAddComment = async () => {
        if (!commentBody.trim()) return;
        const res = await api.post(`/articles/${articleId}/comments/`, { body: commentBody });
        setComments((prev) => [...prev, res.data]);
        setCommentBody('');
    };

    const handleAiSummarize = async () => {
        setAiError('');
        try {
            const res = await api.post('/api/ai/', { action: 'summarize', article_id: Number(articleId) });
            if (res.data.error) setAiError(res.data.error);
            else setAiSummary(res.data.summary || '');
        } catch (e) {
            setAiError(e.response?.data?.error || 'AI недоступен');
        }
    };

    const handleAiLint = async () => {
        try {
            const res = await api.post('/api/ai/', {
                action: 'lint',
                content_plain: article?.content?.replace(/<[^>]+>/g, ' ') || '',
            });
            setLintIssues(res.data.issues || []);
        } catch {
            setLintIssues([]);
        }
    };

    return (
        <Box mt={4}>
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                {canEdit && article?.status === 'draft' && (
                    <Button variant="contained" size="small" onClick={handlePublish}>
                        Опубликовать
                    </Button>
                )}
                {canEdit && article?.status === 'draft' && (
                    <Button variant="outlined" size="small" onClick={handleSubmitReview}>
                        На ревью
                    </Button>
                )}
                {isAuthenticated && (
                    <Button variant="outlined" size="small" onClick={handleBookmark}>
                        {bookmarked ? 'Убрать закладку' : 'В закладки'}
                    </Button>
                )}
                <Button variant="outlined" size="small" onClick={() => handleExport('markdown')}>
                    Экспорт MD
                </Button>
                <Button variant="outlined" size="small" onClick={() => handleExport('html')}>
                    Экспорт HTML
                </Button>
                {features?.enable_ai && canEdit && (
                    <>
                        <Button variant="outlined" size="small" onClick={handleAiSummarize}>
                            Кратко (AI)
                        </Button>
                        <Button variant="outlined" size="small" onClick={handleAiLint}>
                            Проверка качества
                        </Button>
                    </>
                )}
            </Box>

            {article?.status && article.status !== 'published' && (
                <Chip label={`Статус: ${article.status}`} color="warning" sx={{ mb: 2 }} />
            )}

            {aiSummary && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', m: 0 }}>
                        {aiSummary}
                    </Typography>
                </Alert>
            )}
            {aiError && <Alert severity="warning" sx={{ mb: 2 }}>{aiError}</Alert>}
            {lintIssues.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    {lintIssues.join(' · ')}
                </Alert>
            )}

            {similar.length > 0 && (
                <Box mb={2}>
                    <Typography variant="subtitle1">Похожие статьи</Typography>
                    <List dense>
                        {similar.map((s) => (
                            <ListItem key={s.id} disablePadding>
                                <Link component={RouterLink} to={`/articles/${s.id}`}>
                                    {s.title}
                                </Link>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            {backlinks.length > 0 && (
                <Box mb={2}>
                    <Typography variant="subtitle1">Обратные ссылки</Typography>
                    <List dense>
                        {backlinks.map((b) => (
                            <ListItem key={b.id} disablePadding>
                                <Link component={RouterLink} to={`/articles/${b.id}`}>
                                    {b.title}
                                </Link>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            <Typography variant="subtitle1" gutterBottom>
                Комментарии
            </Typography>
            <List dense>
                {comments.map((c) => (
                    <ListItem key={c.id}>
                        <ListItemText
                            primary={c.body}
                            secondary={`${c.author_username || 'Аноним'} · ${new Date(c.created_at).toLocaleString()}`}
                        />
                    </ListItem>
                ))}
            </List>
            {isAuthenticated && (
                <Box display="flex" gap={1} mt={1}>
                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Комментарий..."
                        value={commentBody}
                        onChange={(e) => setCommentBody(e.target.value)}
                    />
                    <Button variant="contained" onClick={handleAddComment}>
                        Отправить
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default ArticleExtras;
