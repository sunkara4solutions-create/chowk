import axios from 'axios';
import { API_URL } from './config';
import { getToken, removeAll } from './storage';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let _redirectToAuth: (() => void) | null = null;

export function setAuthRedirect(fn: () => void) {
  _redirectToAuth = fn;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await removeAll();
      if (_redirectToAuth) {
        _redirectToAuth();
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const sendOtp = (phone: string) =>
  api.post('/auth/send-otp', { phone });

export const verifyOtp = (phone: string, otp: string) =>
  api.post('/auth/verify-otp', { phone, otp });

export const registerWorker = (data: {
  name: string;
  skills: string[];
  city: string;
  experience: number;
  daily_rate: number;
}) => api.post('/auth/register/worker', data);

export const registerContractor = (data: {
  name: string;
  company_name?: string;
  city: string;
}) => api.post('/auth/register/contractor', data);

// Worker
export const getWorkerMe = () => api.get('/mobile/worker/me');

export const updateWorkerMe = (data: {
  name?: string;
  skills?: string[];
  city?: string;
  experience?: number;
  daily_rate?: number;
  is_available?: boolean;
}) => api.patch('/mobile/worker/me', data);

export const updateWorkerLocation = (latitude: number, longitude: number, city_verified = false) =>
  api.patch('/mobile/worker/location', { latitude, longitude, city_verified });

export const updateContractorLocation = (latitude: number, longitude: number, city_verified = false) =>
  api.patch('/mobile/contractor/location', { latitude, longitude, city_verified });

export const setWorkerPreferences = (data: { whatsapp_primary?: boolean; referral_source?: string }) =>
  api.patch('/mobile/worker/preferences', data);

export const setContractorPreferences = (data: { whatsapp_primary?: boolean; referral_source?: string }) =>
  api.patch('/mobile/contractor/preferences', data);

export const getJobs = (params?: { skill?: string; city?: string; page?: number }) =>
  api.get('/mobile/jobs', { params });

export const getNearbyJobs = (lat: number, lng: number, radius_km = 10) =>
  api.get('/mobile/jobs/nearby', { params: { lat, lng, radius_km } });

export const applyToJob = (job_id: string) =>
  api.post(`/mobile/jobs/${job_id}/apply`);

export const getWorkerApplications = () => api.get('/mobile/worker/applications');

// Contractor
export const getContractorMe = () => api.get('/mobile/contractor/me');

export const updateContractorMe = (data: {
  name?: string;
  company_name?: string;
  city?: string;
}) => api.patch('/mobile/contractor/me', data);

export const getContractorJobs = () => api.get('/mobile/contractor/jobs');

export const postJob = (data: {
  skill: string;
  required_count: number;
  job_date: string;
  rate: number;
  location: string;
  city: string;
  start_time?: string;
}) => api.post('/mobile/contractor/jobs', data);

export const getJobApplicants = (job_id: string) =>
  api.get(`/mobile/contractor/jobs/${job_id}/applicants`);

export const updateApplication = (app_id: string, status: 'accepted' | 'rejected') =>
  api.patch(`/mobile/contractor/applications/${app_id}`, { status });

export const getNearbyWorkers = (lat: number, lng: number, radius_km = 10, skill?: string) =>
  api.get('/mobile/workers/nearby', { params: { lat, lng, radius_km, skill } });

export const registerDeviceToken = (token: string, platform: 'android' | 'ios') =>
  api.post('/auth/device-token', { token, platform });

// Aadhaar OKYC
export const aadhaarInitiate = () =>
  api.post('/mobile/aadhaar/initiate', {});

export const aadhaarVerifyNumber = (request_id: string, aadhaar_number: string, captcha_code: string) =>
  api.post('/mobile/aadhaar/verify-number', { request_id, aadhaar_number, captcha_code });

export const aadhaarComplete = (request_id: string, otp: string, share_code = '1234') =>
  api.post('/mobile/aadhaar/complete', { request_id, otp, share_code });

export const deleteAccount = () => api.delete('/mobile/account');

// Individual jobs
export const postIndividualJob = (data: {
  title: string;
  skill: string;
  job_date: string;
  rate?: number;
  location: string;
  city: string;
  description?: string;
}) => api.post('/mobile/individual/jobs', data);

export const getIndividualJobs = (params?: { skill?: string; city?: string; page?: number }) =>
  api.get('/mobile/individual/jobs', { params });

export const getMyPostedJobs = () => api.get('/mobile/individual/my-jobs');

export const getIndividualJob = (job_id: string) =>
  api.get(`/mobile/individual/jobs/${job_id}`);

export const placeBid = (job_id: string, amount: number, message?: string) =>
  api.post(`/mobile/individual/jobs/${job_id}/bid`, { amount, message });

export const acceptBid = (job_id: string, bid_id: string) =>
  api.post(`/mobile/individual/jobs/${job_id}/bids/${bid_id}/accept`);

export const markJobComplete = (job_id: string) =>
  api.post(`/mobile/individual/jobs/${job_id}/complete`);

export const leaveReview = (job_id: string, rating: number, comment?: string) =>
  api.post(`/mobile/individual/jobs/${job_id}/review`, { rating, comment });

export const getWorkerReviews = (worker_id: string) =>
  api.get(`/mobile/individual/workers/${worker_id}/reviews`);
