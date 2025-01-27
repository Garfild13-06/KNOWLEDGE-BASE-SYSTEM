import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">Knowledge Base</Link>
                <div>
                    <Link className="nav-link" to="/articles">Статьи</Link>
                    <Link className="nav-link" to="/">Разделы</Link>
                </div>
            </div>
        </nav>
    );
};

export default Header;
