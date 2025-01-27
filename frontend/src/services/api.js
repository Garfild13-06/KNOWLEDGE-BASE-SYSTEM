import axios from 'axios';

const BASE_URL = '/api'; // Указываем прокси, а не прямой адрес

export const api = axios.create({
    baseURL: BASE_URL,
});
