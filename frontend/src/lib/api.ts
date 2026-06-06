import axios from "axios";
import type { Contractor, Job, JobWithApplications, DashboardStats, Worker } from "./types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("chowk_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("chowk_token");
      localStorage.removeItem("chowk_contractor");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const registerContractor = (data: {
  name: string;
  phone: string;
  password: string;
  company_name?: string;
  city: string;
  business_type?: string;
}) => api.post<{ access_token: string; contractor: Contractor }>("/contractors/register", data);

export const loginContractor = (phone: string, password: string) =>
  api.post<{ access_token: string; contractor: Contractor }>("/contractors/login", { phone, password });

export const getMe = () => api.get<Contractor>("/contractors/me");

// Jobs
export const createJob = (data: {
  skill: string;
  required_count: number;
  job_date: string;
  rate: number;
  location: string;
  city: string;
  start_time?: string;
  description?: string;
}) => api.post<Job>("/jobs", data);

export const listJobs = () => api.get<Job[]>("/jobs");

export const getJob = (id: string) => api.get<JobWithApplications>(`/jobs/${id}`);

export const cancelJob = (id: string) => api.post(`/jobs/${id}/cancel`);

export const getDashboardStats = () => api.get<DashboardStats>("/jobs/dashboard-stats");

// Admin
export const adminLogin = (phone: string, password: string) =>
  api.post<{ access_token: string }>("/admin/login", { phone, password });

export const getAdminStats = () => api.get("/admin/stats");

export const listWorkers = (params?: { city?: string; skill?: string; available?: boolean }) =>
  api.get<Worker[]>("/workers", { params });

export const listAllContractors = () => api.get<Contractor[]>("/admin/contractors");

export const listAllJobs = () => api.get<Job[]>("/admin/jobs");

export default api;
