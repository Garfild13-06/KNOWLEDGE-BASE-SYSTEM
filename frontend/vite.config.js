/* eslint-env node */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const proxyRoutes = [
    '/api',
    '/sections',
    '/articles',
    '/tree_sections',
    '/uploads',
    '/media',
    '/admin',
];

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const backendTarget = env.VITE_DEV_BACKEND || 'http://localhost:8000';
    const devProxy = Object.fromEntries(
        proxyRoutes.map((route) => [
            route,
            { target: backendTarget, changeOrigin: true },
        ])
    );

    return {
        plugins: [react()],
        server: {
            host: true,
            port: 3000,
            proxy: devProxy,
        },
    };
});
