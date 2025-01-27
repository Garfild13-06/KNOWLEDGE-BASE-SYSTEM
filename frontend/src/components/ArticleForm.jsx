import React, { useState } from 'react';

const ArticleForm = ({ onSubmit }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ title, content });
        setTitle('');
        setContent('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label className="form-label">Заголовок</label>
                <input
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Содержание</label>
                <textarea
                    className="form-control"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>
            <button type="submit" className="btn btn-primary">Сохранить</button>
        </form>
    );
};

export default ArticleForm;
