import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // Открываем доступ извне
        port: 3000, // Порт для фронтенда
        proxy: {
            '/api': {
                target: 'http://localhost:8000', // Бэкенд
                changeOrigin: true, // Меняем origin запроса на адрес бэкенда
                rewrite: (path) => path.replace(/^\/api/, ''), // Убираем префикс /api
            },
        },
    },
});
