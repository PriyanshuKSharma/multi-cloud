import axios, { type InternalAxiosRequestConfig } from 'axios';

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const isBrowser = typeof window !== 'undefined';
const isLocalBrowser =
  isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// Local dev -> localhost backend. Hosted frontend -> default to same-origin /api (use platform rewrite/proxy).
export const API_BASE_URL = configuredApiUrl || (isLocalBrowser ? 'http://localhost:8000' : '/api');
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url ?? '');
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/me');

    if (status === 401 && !isAuthEndpoint && isBrowser) {
      localStorage.removeItem('token');
      window.dispatchEvent(new CustomEvent(AUTH_INVALID_EVENT));
    }

    return Promise.reject(error);
  }
);

export default api;
