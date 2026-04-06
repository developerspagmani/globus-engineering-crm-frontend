import axios from 'axios';

import { getCookie, deleteCookie } from './cookies';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Interceptor for Token
api.interceptors.request.use((config) => {
  const token = getCookie('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log('--- AXIOS OUTGOING ---');
  console.log('Method:', config.method?.toUpperCase());
  console.log('URL:', config.url);
  console.log('Auth Header:', config.headers.Authorization ? 'Bearer [HIDDEN]' : 'MISSING');
  console.log('Payload:', config.data);
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add Interceptor for Response (Handle 401 Unauthorized - Token Expired)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Auto-Logout mechanism
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        
        // Prevent infinite loop if already on login page
        if (!currentPath.includes('/login')) {
          localStorage.removeItem('globus_auth');
          deleteCookie('token');
          
          // Clear entire state and redirect
          window.location.href = `/login?msg=session_expired&redirect=${encodeURIComponent(currentPath)}`;
          
          // Return a pending promise to stop any further execution in components/thunks
          // This prevents "Token verification failed" errors from showing up in the UI
          return new Promise(() => {});
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
