import axios from 'axios';

const rawBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

/** Absolute or relative base; relative ("/api") relies on the Vite dev proxy. */
export const API_BASE = `${rawBase}/api`;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20_000,
});

// Attach Bearer token if present in localStorage as a fallback for cross-site cookie blocking.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to /login when the session is gone (but not for auth endpoints,
// which handle 401 themselves).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem('token');
      const url = error.config?.url || '';
      const onAuthPage = /^\/(login|register)/.test(window.location.pathname);
      if (!url.includes('/auth/') && !onAuthPage) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

/** Download a CSV export through the authenticated API client. */
export async function downloadCsv(path: string, filename: string): Promise<void> {
  const res = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default api;
