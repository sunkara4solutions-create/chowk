export type Skill =
  | "painter"
  | "mason"
  | "electrician"
  | "plumber"
  | "carpenter"
  | "welder"
  | "tiles_worker"
  | "helper"
  | "construction_laborer";

export type JobStatus = "open" | "filled" | "cancelled" | "completed";
export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface Contractor {
  contractor_id: string;
  name: string;
  phone: string;
  company_name?: string;
  city: string;
  business_type?: string;
  created_at: string;
}

export interface Worker {
  worker_id: string;
  name: string;
  phone: string;
  skill: Skill;
  city: string;
  village?: string;
  experience: number;
  daily_rate: number;
  is_available: boolean;
  created_at: string;
}

export interface Job {
  job_id: string;
  contractor_id: string;
  skill: Skill;
  required_count: number;
  confirmed_count: number;
  job_date: string;
  rate: number;
  location: string;
  city: string;
  start_time?: string;
  description?: string;
  status: JobStatus;
  fill_percentage: number;
  created_at: string;
}

export interface Application {
  application_id: string;
  job_id: string;
  worker_id: string;
  status: ApplicationStatus;
  worker?: Worker;
  created_at: string;
  updated_at: string;
}

export interface JobWithApplications extends Job {
  applications: Application[];
}

export interface DashboardStats {
  total_jobs: number;
  active_jobs: number;
  total_workers_notified: number;
  total_confirmed: number;
  avg_fill_rate: number;
}

export const SKILL_LABELS: Record<Skill, string> = {
  painter: "Painter",
  mason: "Mason",
  electrician: "Electrician",
  plumber: "Plumber",
  carpenter: "Carpenter",
  welder: "Welder",
  tiles_worker: "Tiles Worker",
  helper: "Helper",
  construction_laborer: "Construction Laborer",
};

export const AP_CITIES = [
  "Vijayawada",
  "Guntur",
  "Visakhapatnam",
  "Tirupati",
  "Kakinada",
  "Rajahmundry",
  "Nellore",
  "Kurnool",
  "Kadapa",
  "Anantapur",
  "Ongole",
  "Eluru",
  "Machilipatnam",
  "Tenali",
  "Proddatur",
  "Chittoor",
  "Bhimavaram",
  "Srikakulam",
  "Vizianagaram",
  "Hindupur",
];
