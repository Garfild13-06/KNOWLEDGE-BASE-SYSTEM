import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { api } from "../services/api";
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
} from "@mui/material";
import RichTextEditor from "../components/RichTextEditor";
import Divider from '@mui/material/Divider';

const ArticleDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState("");
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

    useEffect(() => {
        const fetchArticleData = async () => {
            try {
                const articleResponse = await api.get(`/articles/${id}/`);
                setArticle(articleResponse.data);
                setEditedContent(articleResponse.data.content);

                const fetchBreadcrumbs = async (sectionId, breadcrumbs = []) => {
                    const sectionResponse = await api.get(`/sections/${sectionId}/`);
                    breadcrumbs.unshift({ id: sectionResponse.data.id, name: sectionResponse.data.name });
                    if (sectionResponse.data.parent) {
                        return fetchBreadcrumbs(sectionResponse.data.parent, breadcrumbs);
                    }
                    return breadcrumbs;
                };

                const breadcrumbsPath = await fetchBreadcrumbs(articleResponse.data.section);
                setBreadcrumbs(breadcrumbsPath);
            } catch (error) {
                console.error("Ошибка при загрузке данных книги:", error);
            }
        };

        fetchArticleData();
    }, [id]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditedContent(article.content);
    };

    const handleSave = async () => {
        try {
            const response = await api.put(`/articles/${id}/`, { ...article, content: editedContent });
            setArticle(response.data);
            setIsEditing(false);
        } catch (error) {
            console.error("Ошибка при сохранении изменений:", error);
            alert("Не удалось сохранить изменения.");
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/articles/${id}/`);
            navigate(`/sections/${article.section}`);
        } catch (error) {
            console.error("Ошибка при удалении книги:", error);
            alert("Не удалось удалить книгу.");
        }
    };

    if (!article) {
        return <Typography>Загрузка...</Typography>;
    }

    return (
        <div>
            {/* Хлебные крошки */}
            <Breadcrumbs aria-label="breadcrumb" style={{ marginBottom: "20px" }}>
                <Link component={RouterLink} to="/" style={{ cursor: "pointer" }}>
                    Главная
                </Link>
                {breadcrumbs.map((breadcrumb) => (
                    <Link
                        key={breadcrumb.id}
                        component={RouterLink}
                        to={`/sections/${breadcrumb.id}`}
                        style={{ cursor: "pointer" }}
                    >
                        {breadcrumb.name}
                    </Link>
                ))}
                <Typography color="text.primary">{article.title}</Typography>
            </Breadcrumbs>

            {isEditing ? (
                <div>
                    {/* Редактируемый режим */}
                    <Typography variant="h5" gutterBottom>
                        Редактирование: {article.title}
                    </Typography>
                    <RichTextEditor value={editedContent} onChange={setEditedContent} />
                    <Box display="flex" justifyContent="left" mt={2}>
                        <Button variant="contained" color="primary" onClick={handleSave}>
                            Сохранить
                        </Button>
                        <Button variant="outlined" color="secondary" onClick={handleCancelEdit}>
                            Отменить
                        </Button>
                    </Box>
                </div>
            ) : (
                <div>
                    {/* Обычный режим */}
                    <Typography variant="h4" gutterBottom>
                        {article.title}
                    </Typography>
                    <Box display="flex" justifyContent="left" mt={2}>
                        <Button variant="contained" color="primary" onClick={handleEdit}>
                            Изменить
                        </Button>
                        <Button variant="outlined" color="error" onClick={() => setOpenDeleteDialog(true)}>
                            Удалить
                        </Button>
                    </Box>

                    <Divider></Divider>
                    <div dangerouslySetInnerHTML={{ __html: article.content }} /> {/* Отображаем HTML-контент */}
                </div>
            )}

            {/* Диалог подтверждения удаления */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>Удалить книгу</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы действительно хотите удалить книгу "{article.title}"? <br />
                        Полный путь: Главная / {breadcrumbs.map((breadcrumb) => breadcrumb.name).join(" / ")}
                    </Typography>
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