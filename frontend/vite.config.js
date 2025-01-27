import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        host: true, // Разрешает доступ извне
        port: 3000, // Порт для запуска фронтенда
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000', // Адрес бэкенда
                changeOrigin: true, // Меняет Origin для запросов
                rewrite: (path) => path.replace(/^\/api/, ''), // Убираем "/api" из пути
            },
        },
    },
});
