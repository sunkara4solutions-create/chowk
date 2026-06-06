"use client";
import { useEffect, useState } from "react";
import { getAdminStats, listAllJobs, listAllContractors, adminLogin } from "@/lib/api";
import { SKILL_LABELS } from "@/lib/types";
import { format } from "date-fns";

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [jobs, setJobs] = useState<unknown[]>([]);
  const [contractors, setContractors] = useState<unknown[]>([]);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("chowk_admin_token");
    if (t) { setToken(t); loadData(t); }
  }, []);

  const loadData = (t: string) => {
    localStorage.setItem("chowk_token", t);
    getAdminStats().then((r) => setStats(r.data)).catch(() => {});
    listAllJobs().then((r) => setJobs(r.data)).catch(() => {});
    listAllContractors().then((r) => setContractors(r.data)).catch(() => {});
  };

  const handleLogin = async () => {
    setLoginError("");
    try {
      const res = await adminLogin(phone, password);
      const t = res.data.access_token;
      localStorage.setItem("chowk_admin_token", t);
      setToken(t);
      loadData(t);
    } catch {
      setLoginError("Invalid credentials");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white border rounded-xl p-8 w-80">
          <h1 className="text-xl font-bold mb-6 text-brand-600">Chowk Admin</h1>
          <div className="space-y-3">
            <input
              type="tel" placeholder="Admin phone" value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <button
              onClick={handleLogin}
              className="w-full py-2 bg-brand-600 text-white rounded-lg text-sm font-medium"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Chowk Admin</h1>
          <button
            onClick={() => { localStorage.removeItem("chowk_admin_token"); setToken(null); }}
            className="text-sm text-gray-500"
          >
            Logout
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            {[
              ["Workers", stats.total_workers],
              ["Contractors", stats.total_contractors],
              ["Total Jobs", stats.total_jobs],
              ["Jobs Today", stats.jobs_today],
              ["Available Now", stats.workers_available],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-white border rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border rounded-xl">
            <div className="px-5 py-4 border-b font-semibold">Recent Jobs ({jobs.length})</div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {(jobs as { job_id: string; skill: string; city: string; required_count: number; confirmed_count: number; status: string; job_date: string }[]).map((j) => (
                <div key={j.job_id} className="px-5 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{SKILL_LABELS[j.skill as keyof typeof SKILL_LABELS]}</span>
                    <span className="text-xs text-gray-400">{j.confirmed_count}/{j.required_count}</span>
                  </div>
                  <p className="text-gray-400 text-xs">{j.city} • {format(new Date(j.job_date), "dd MMM")} • {j.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border rounded-xl">
            <div className="px-5 py-4 border-b font-semibold">Contractors ({contractors.length})</div>
            <div className="divide-y max-h-96 overflow-y-auto">
              {(contractors as { contractor_id: string; name: string; company_name?: string; city: string; phone: string }[]).map((c) => (
                <div key={c.contractor_id} className="px-5 py-3 text-sm">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-gray-400 text-xs">{c.company_name} • {c.city} • {c.phone}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
