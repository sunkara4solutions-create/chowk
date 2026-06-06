"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getJob } from "@/lib/api";
import type { JobWithApplications } from "@/lib/types";
import { SKILL_LABELS } from "@/lib/types";
import { format } from "date-fns";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobWithApplications | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getJob(id)
      .then((r) => setJob(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  // Auto-refresh every 10s while job is open
  useEffect(() => {
    if (!job || job.status !== "open") return;
    const timer = setInterval(() => {
      getJob(id).then((r) => setJob(r.data)).catch(() => {});
    }, 10000);
    return () => clearInterval(timer);
  }, [id, job?.status]);

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>;
  if (!job) return <p className="text-red-500">Job not found.</p>;

  const fillPct = job.fill_percentage;
  const accepted = job.applications.filter((a) => a.status === "accepted");
  const rejected = job.applications.filter((a) => a.status === "rejected");
  const pending = job.applications.filter((a) => a.status === "pending");

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/jobs" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Jobs
        </Link>
      </div>

      <div className="bg-white border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{SKILL_LABELS[job.skill]}</h1>
            <p className="text-gray-600 mt-1">{job.location}, {job.city}</p>
          </div>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            job.status === "filled" ? "bg-green-100 text-green-700" :
            job.status === "open" ? "bg-blue-100 text-blue-700" :
            "bg-gray-100 text-gray-600"
          }`}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5 text-sm">
          <div>
            <p className="text-gray-400">Date</p>
            <p className="font-medium">{format(new Date(job.job_date), "dd MMM yyyy")}</p>
          </div>
          <div>
            <p className="text-gray-400">Rate</p>
            <p className="font-medium">Rs.{job.rate}/day</p>
          </div>
          <div>
            <p className="text-gray-400">Start Time</p>
            <p className="font-medium">{job.start_time ?? "—"}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Fill Status</span>
            <span className="text-sm font-bold">{job.confirmed_count} / {job.required_count} workers</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all ${
                fillPct >= 80 ? "bg-green-500" :
                fillPct >= 50 ? "bg-yellow-500" : "bg-brand-500"
              }`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>{job.confirmed_count} confirmed</span>
            <span>{job.required_count - job.confirmed_count} remaining</span>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">Worker Responses</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {accepted.length} accepted • {rejected.length} rejected • {pending.length} pending
          </p>
        </div>

        {job.applications.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            Notifications are being sent to matching workers...
            {job.status === "open" && <span> Page refreshes every 10s.</span>}
          </div>
        ) : (
          <div className="divide-y">
            {job.applications.map((app) => (
              <div key={app.application_id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{app.worker?.name ?? "Worker"}</p>
                  <p className="text-xs text-gray-500">
                    {app.worker?.city} • {app.worker?.experience}y exp • Rs.{app.worker?.daily_rate}/day
                  </p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  app.status === "accepted" ? "bg-green-100 text-green-700" :
                  app.status === "rejected" ? "bg-red-100 text-red-600" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {app.status === "accepted" ? "Confirmed" :
                   app.status === "rejected" ? "Not Available" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
