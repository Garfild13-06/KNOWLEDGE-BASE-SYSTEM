import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ViewTypeProvider } from './contexts/ViewTypeContext';
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ViewTypeProvider>
                <App />
            </ViewTypeProvider>
        </BrowserRouter>
    </React.StrictMode>
);
