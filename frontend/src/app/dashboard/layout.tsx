"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Contractor } from "@/lib/types";
import clsx from "clsx";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem("chowk_contractor");
    if (!stored) { window.location.href = "/login"; return; }
    setContractor(JSON.parse(stored));
  }, []);

  const logout = () => {
    localStorage.removeItem("chowk_token");
    localStorage.removeItem("chowk_contractor");
    window.location.href = "/login";
  };

  const nav = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/jobs", label: "My Jobs" },
    { href: "/dashboard/jobs/new", label: "Post Job" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-xl font-bold text-brand-600">Chowk</Link>
          <nav className="flex gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm font-medium",
                  pathname === item.href
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{contractor?.name}</span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900">
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  );
}
