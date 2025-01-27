import axios from 'axios';

const BASE_URL = 'http://localhost:8000'; // URL бэкенда

export const api = axios.create({
    baseURL: BASE_URL,
});
