import axios from 'axios';
import { API_URL } from './config';
import { getAdminToken } from './storage';

const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

adminApi.interceptors.request.use(
  async (config) => {
    const token = await getAdminToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const adminLogin = (phone: string, password: string) =>
  adminApi.post('/admin/login', { phone, password });

export const getAdminStats = () => adminApi.get('/admin/stats');

export const listAllJobs = () => adminApi.get('/admin/jobs');

export const listAllContractors = () => adminApi.get('/admin/contractors');
