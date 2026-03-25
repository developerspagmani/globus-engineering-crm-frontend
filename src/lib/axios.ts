import axios from 'axios';

import { getCookie } from './cookies';

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

export default api;
