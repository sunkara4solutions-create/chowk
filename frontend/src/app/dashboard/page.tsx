"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats, listJobs } from "@/lib/api";
import type { DashboardStats, Job } from "@/lib/types";
import { SKILL_LABELS } from "@/lib/types";
import { format } from "date-fns";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function FillBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-brand-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-10 text-right">{pct}%</span>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  useEffect(() => {
    getDashboardStats().then((r) => setStats(r.data)).catch(() => {});
    listJobs().then((r) => setRecentJobs(r.data.slice(0, 5))).catch(() => {});
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/dashboard/jobs/new"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + Post New Job
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Jobs" value={stats.total_jobs} />
          <StatCard label="Active Jobs" value={stats.active_jobs} />
          <StatCard label="Workers Notified" value={stats.total_workers_notified} />
          <StatCard label="Avg Fill Rate" value={`${stats.avg_fill_rate}%`} />
        </div>
      )}

      <div className="bg-white border rounded-xl">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Jobs</h2>
          <Link href="/dashboard/jobs" className="text-sm text-brand-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y">
          {recentJobs.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No jobs posted yet.{" "}
              <Link href="/dashboard/jobs/new" className="text-brand-600 hover:underline">Post your first job</Link>
            </div>
          )}
          {recentJobs.map((job) => (
            <Link key={job.job_id} href={`/dashboard/jobs/${job.job_id}`} className="block px-5 py-4 hover:bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium">{SKILL_LABELS[job.skill]}</span>
                  <span className="text-sm text-gray-500 ml-2">— {job.city}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  job.status === "filled" ? "bg-green-100 text-green-700" :
                  job.status === "open" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {job.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {format(new Date(job.job_date), "dd MMM yyyy")} • {job.confirmed_count}/{job.required_count} workers • Rs.{job.rate}/day
              </div>
              <FillBar pct={job.fill_percentage} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
