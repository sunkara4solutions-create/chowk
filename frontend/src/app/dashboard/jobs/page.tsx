"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listJobs, cancelJob } from "@/lib/api";
import type { Job } from "@/lib/types";
import { SKILL_LABELS } from "@/lib/types";
import { format } from "date-fns";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listJobs()
      .then((r) => setJobs(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (jobId: string) => {
    if (!confirm("Cancel this job?")) return;
    await cancelJob(jobId);
    setJobs((prev) => prev.map((j) => j.job_id === jobId ? { ...j, status: "cancelled" } : j));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Jobs</h1>
        <Link
          href="/dashboard/jobs/new"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          + Post New Job
        </Link>
      </div>

      {loading && <p className="text-gray-400 text-sm">Loading...</p>}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.job_id} className="bg-white border rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold text-lg">{SKILL_LABELS[job.skill]}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    job.status === "filled" ? "bg-green-100 text-green-700" :
                    job.status === "open" ? "bg-blue-100 text-blue-700" :
                    job.status === "cancelled" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {job.location}, {job.city} • {format(new Date(job.job_date), "dd MMM yyyy")}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">Rs.{job.rate}/day</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {job.confirmed_count}/{job.required_count}
                </p>
                <p className="text-xs text-gray-400">workers</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    job.fill_percentage >= 80 ? "bg-green-500" :
                    job.fill_percentage >= 50 ? "bg-yellow-500" : "bg-brand-500"
                  }`}
                  style={{ width: `${job.fill_percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-600">{job.fill_percentage}%</span>
            </div>

            <div className="mt-4 flex gap-2">
              <Link
                href={`/dashboard/jobs/${job.job_id}`}
                className="text-sm text-brand-600 font-medium hover:underline"
              >
                View Workers
              </Link>
              {job.status === "open" && (
                <button
                  onClick={() => handleCancel(job.job_id)}
                  className="text-sm text-red-500 hover:underline ml-4"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No jobs posted yet</p>
            <Link href="/dashboard/jobs/new" className="text-brand-600 hover:underline text-sm">
              Post your first job
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
