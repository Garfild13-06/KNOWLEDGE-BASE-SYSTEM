/**
 * Базовый URL API. Пустое значение = относительные пути (nginx / vite proxy).
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

/** JWT всегда на /api/token/ от корня приложения. */
export const AUTH_TOKEN_URL = '/api/token/';
export const AUTH_REFRESH_URL = '/api/token/refresh/';
