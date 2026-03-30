import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export const fetcher = (url: string) => api.get(url).then(res => res.data);
