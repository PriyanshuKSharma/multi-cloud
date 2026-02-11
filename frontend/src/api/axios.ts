import axios, { type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  // Bypass localtunnel warning page
  config.headers.set('Bypass-Tunnel-Reminder', 'true');
  config.headers.set('ngrok-skip-browser-warning', 'true'); // Also good for ngrok
  return config;
});

export default api;
