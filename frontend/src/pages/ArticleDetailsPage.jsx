import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import JoditTextEditor from "../components/JoditEditor";
import {
    Breadcrumbs,
    Link,
    Typography,
    Button,
    Box,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@mui/material';

const ArticleDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState("");
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    useEffect(() => {
        const fetchArticle = async () => {
            const response = await api.get(`/articles/${id}/`);
            setArticle(response.data);
            setEditedContent(response.data.content);
        };
        fetchArticle();
    }, [id]);

    const handleSave = async () => {
        await api.put(`/articles/${id}/`, { ...article, content: editedContent });
        setArticle({ ...article, content: editedContent });
        setIsEditing(false);
    };

    const handleDelete = async () => {
        await api.delete(`/articles/${id}/`);
        navigate(`/sections/${article.section}`);
    };

    if (!article) return <Typography>Загрузка...</Typography>;

    return (
        <div>
            <Breadcrumbs aria-label="breadcrumb" style={{ marginBottom: "20px" }}>
                <Link underline="hover" color="inherit" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
                    Главная
                </Link>
                <Typography color="text.primary">{article.title}</Typography>
            </Breadcrumbs>

            {isEditing ? (
                <div>
                    <JoditTextEditor value={editedContent} onChange={setEditedContent} />
                    <Box display="flex" justifyContent="space-between" mt={2}>
                        <Button variant="contained" color="primary" onClick={handleSave}>
                            Сохранить
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={() => setIsEditing(false)}>
                            Отменить
                        </Button>
                    </Box>
                </div>
            ) : (
                <div>
                    <Typography variant="h4" gutterBottom>
                        {article.title}
                    </Typography>
                    <div dangerouslySetInnerHTML={{ __html: article.content }} />
                    <Box display="flex" justifyContent="space-between" mt={2}>
                        <Button variant="contained" color="primary" onClick={() => setIsEditing(true)}>
                            Изменить
                        </Button>
                        <Button variant="outlined" color="error" onClick={() => setOpenDeleteDialog(true)}>
                            Удалить
                        </Button>
                    </Box>
                </div>
            )}

            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Удалить книгу</DialogTitle>
                <DialogContent>
                    <Typography>Вы уверены, что хотите удалить "{article.title}"?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} color="secondary">
                        Отмена
                    </Button>
                    <Button onClick={handleDelete} color="error">
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};


export default ArticleDetailsPage;
