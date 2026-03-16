import axios from 'axios';

const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
const MEDUSA_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

export const medusaApi = axios.create({
  baseURL: MEDUSA_BACKEND_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'x-publishable-key': MEDUSA_PUBLISHABLE_KEY,
    'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
  },
});

export function setAuthToken(token: string | null) {
  if (token) {
    medusaApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (typeof window !== 'undefined') {
       localStorage.setItem('medusa_token', token);
    }
  } else {
    delete medusaApi.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
       localStorage.removeItem('medusa_token');
    }
  }
}

// AUTO-RESTORE TOKEN ON LOAD (CRITICAL!)
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('medusa_token');
  if (token) {
    medusaApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan.'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return fallback;
}
