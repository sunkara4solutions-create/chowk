export interface Worker {
  worker_id: string;
  name: string;
  phone: string;
  skills: string[];
  city: string;
  experience: number;
  daily_rate: number;
  is_available: boolean;
  phone_verified: boolean;
  location_verified: boolean;
  aadhaar_verified: boolean;
  aadhaar_last4?: string;
  whatsapp_primary: boolean;
  average_rating?: number;
  review_count: number;
  created_at: string;
}

export interface ContractorProfile {
  contractor_id: string;
  name: string;
  phone: string;
  company_name?: string;
  city: string;
  phone_verified: boolean;
  location_verified: boolean;
  aadhaar_verified: boolean;
  aadhaar_last4?: string;
  whatsapp_primary: boolean;
  created_at: string;
}


export interface Job {
  job_id: string;
  contractor_id: string;
  skill: string;
  required_count: number;
  confirmed_count: number;
  job_date: string;
  rate: number;
  location: string;
  city: string;
  start_time?: string;
  status: 'open' | 'filled' | 'closed' | 'cancelled';
  created_at: string;
  contractor?: {
    name: string;
    phone: string;
  };
}

export interface Application {
  application_id: string;
  job_id: string;
  worker_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  job: Job;
  created_at: string;
}

export interface Applicant {
  application_id: string;
  worker: Worker;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface IndividualJob {
  job_id: string;
  job_type: 'individual';
  poster_name?: string;
  title?: string;
  skill: string;
  job_date: string;
  rate: number;
  location: string;
  city: string;
  description?: string;
  status: 'open' | 'filled' | 'cancelled' | 'completed';
  bid_count: number;
  created_at: string;
}

export interface WorkerBrief {
  worker_id: string;
  name: string;
  city: string;
  skills: string[];
  experience: number;
  average_rating?: number;
  review_count: number;
}

export interface Bid {
  bid_id: string;
  job_id: string;
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  worker: WorkerBrief;
}

export interface IndividualJobDetail extends IndividualJob {
  bids: Bid[];
  is_poster: boolean;
}
