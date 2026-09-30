import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050';

export const api = axios.create({
  baseURL: `${apiBaseUrl.replace(/\/$/, '')}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
