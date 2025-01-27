import React from 'react';

const ArticleList = ({ articles }) => {
    return (
        <ul className="list-group">
            {articles.map((article) => (
                <li key={article.id} className="list-group-item">
                    {article.title}
                </li>
            ))}
        </ul>
    );
};

export default ArticleList;
