"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { registerContractor } from "@/lib/api";
import { AP_CITIES } from "@/lib/types";

type Inputs = {
  name: string;
  phone: string;
  password: string;
  company_name: string;
  city: string;
  business_type: string;
};

export default function RegisterPage() {
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Inputs>();

  const onSubmit = async (data: Inputs) => {
    setError("");
    try {
      const res = await registerContractor(data);
      localStorage.setItem("chowk_token", res.data.access_token);
      localStorage.setItem("chowk_contractor", JSON.stringify(res.data.contractor));
      window.location.href = "/dashboard";
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(msg || "Registration failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border p-8">
        <div className="mb-8">
          <Link href="/" className="text-2xl font-bold text-brand-600">Chowk</Link>
          <h1 className="text-xl font-semibold mt-4 text-gray-900">Contractor Registration</h1>
          <p className="text-sm text-gray-500 mt-1">Start finding workers today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
            <input
              placeholder="Full name"
              {...register("name", { required: true })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              placeholder="e.g. Raju Constructions"
              {...register("company_name")}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              {...register("phone", { required: true })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
            <input
              placeholder="e.g. Construction, Renovation"
              {...register("business_type")}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              placeholder="Create a password"
              {...register("password", { required: true, minLength: 6 })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-500">
          Already registered?{" "}
          <Link href="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
