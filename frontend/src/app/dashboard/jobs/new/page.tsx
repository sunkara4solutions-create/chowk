"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/api";
import { AP_CITIES, SKILL_LABELS, type Skill } from "@/lib/types";

type Inputs = {
  skill: Skill;
  required_count: number;
  job_date: string;
  rate: number;
  location: string;
  city: string;
  start_time: string;
  description: string;
};

export default function NewJobPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Inputs>();

  const onSubmit = async (data: Inputs) => {
    setError("");
    try {
      const payload = {
        ...data,
        required_count: Number(data.required_count),
        rate: Number(data.rate),
        start_time: data.start_time || undefined,
        description: data.description || undefined,
      };
      const res = await createJob(payload);
      router.push(`/dashboard/jobs/${res.data.job_id}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(msg || "Failed to post job. Try again.");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Post a New Job</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skill Required *</label>
          <select
            {...register("skill", { required: true })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select skill</option>
            {(Object.keys(SKILL_LABELS) as Skill[]).map((s) => (
              <option key={s} value={s}>{SKILL_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Workers *</label>
            <input
              type="number"
              min={1}
              max={200}
              placeholder="e.g. 10"
              {...register("required_count", { required: true, min: 1 })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (Rs.) *</label>
            <input
              type="number"
              min={200}
              placeholder="e.g. 900"
              {...register("rate", { required: true, min: 200 })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Date *</label>
            <input
              type="date"
              min={today}
              {...register("job_date", { required: true })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
            <input
              type="time"
              {...register("start_time")}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
          <select
            {...register("city", { required: true })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select city</option>
            {AP_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location / Address *</label>
          <input
            placeholder="e.g. MG Road, near Collector Office"
            {...register("location", { required: true })}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
          <textarea
            rows={3}
            placeholder="Any specific requirements, tools needed, etc."
            {...register("description")}
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? "Posting and notifying workers..." : "Post Job & Notify Workers"}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Workers in {"{city}"} matching the skill will be notified via WhatsApp instantly.
          </p>
        </div>
      </form>
    </div>
  );
}
