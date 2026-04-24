import axios, { type InternalAxiosRequestConfig } from 'axios';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');
const normalizedConfiguredApiUrl = configuredApiUrl.replace(/\/api$/, '');
const isBrowser = typeof window !== 'undefined';
const isLocalBrowser =
  isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Local dev -> localhost backend. Hosted frontend -> same-origin /api when no explicit backend URL.
// Normalizing '/api' suffix on configured URLs prevents accidental '/api/api/*' style mismatches.
export const API_BASE_URL = normalizedConfiguredApiUrl || (isLocalBrowser ? 'http://localhost:8000' : '/api');
export const AUTH_INVALID_EVENT = 'nebula:auth-invalid';

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

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  config.headers.set('Bypass-Tunnel-Reminder', 'true');
  config.headers.set('ngrok-skip-browser-warning', 'true');

  return config;
});


export default api;
