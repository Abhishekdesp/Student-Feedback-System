import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050';
if (rawUrl && !rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
  rawUrl = `https://${rawUrl}`;
}

export const api = axios.create({
  baseURL: `${rawUrl.replace(/\/$/, '')}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
