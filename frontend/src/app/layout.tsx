import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chowk — Labor Marketplace",
  description: "Connecting daily wage workers and contractors across Andhra Pradesh",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
