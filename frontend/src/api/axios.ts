import axios, { type InternalAxiosRequestConfig } from 'axios';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const isBrowser = typeof window !== 'undefined';
const isLocalBrowser =
  isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Local dev -> localhost backend. Hosted frontend -> default to same-origin /api (use platform rewrite/proxy).
export const API_BASE_URL = configuredApiUrl || (isLocalBrowser ? 'http://localhost:8000' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
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
