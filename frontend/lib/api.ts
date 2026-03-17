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

export function setAuthToken(token: string | null, type: 'customer' | 'admin' = 'customer') {
  if (token) {
    medusaApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (typeof window !== 'undefined') {
      if (type === 'admin') {
        localStorage.setItem('medusa_admin_token', token);
        localStorage.removeItem('medusa_token'); // Clear customer token
      } else {
        localStorage.setItem('medusa_token', token);
        localStorage.removeItem('medusa_admin_token'); // Clear admin token
      }
    }
  } else {
    delete medusaApi.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('medusa_token');
      localStorage.removeItem('medusa_admin_token');
    }
  }
}

// AUTO-RESTORE TOKEN ON LOAD (Check both Admin and Customer)
if (typeof window !== 'undefined') {
  const adminToken = localStorage.getItem('medusa_admin_token');
  const customerToken = localStorage.getItem('medusa_token');
  
  const activeToken = adminToken || customerToken;
  if (activeToken) {
    medusaApi.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
  }
}

export function getApiErrorMessage(error: unknown, fallback = 'Terjadi kesalahan.'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return fallback;
}
