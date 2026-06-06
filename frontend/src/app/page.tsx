import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b">
        <span className="text-2xl font-bold text-brand-600">Chowk</span>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-brand-600">
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Register as Contractor
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-block bg-brand-50 text-brand-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          Andhra Pradesh — Pilot Launch
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Find skilled workers.<br />Get work done.
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Chowk connects contractors with daily wage workers via WhatsApp.
          Post a job, workers confirm via WhatsApp. Simple.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/register"
            className="px-8 py-3 bg-brand-600 text-white rounded-lg font-medium text-lg hover:bg-brand-700"
          >
            Post a Job
          </Link>
          <a
            href="https://wa.me/91XXXXXXXXXX?text=Hi"
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-lg hover:border-brand-500"
          >
            Register as Worker
          </a>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How Chowk Works</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-brand-600">For Contractors</h3>
              <ol className="space-y-3">
                {[
                  "Register on Chowk portal",
                  "Post job: skill, location, date, rate",
                  "Chowk finds matching workers and notifies them on WhatsApp",
                  "Watch your dashboard fill up in real time",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-brand-600 text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-600">For Workers</h3>
              <ol className="space-y-3">
                {[
                  "Send 'Hi' on WhatsApp to Chowk",
                  "Register: name, skill, city, daily rate",
                  "Receive job notifications when work is available",
                  "Reply 1 to accept, 2 to skip — that's it",
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-green-600 text-white text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Skills on Chowk</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {["Painter", "Mason", "Electrician", "Plumber", "Carpenter", "Welder", "Tiles Worker", "Helper", "Construction Laborer"].map((s) => (
              <span key={s} className="px-4 py-2 bg-brand-50 text-brand-700 rounded-full font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-gray-500">
        Chowk — Andhra Pradesh Labor Marketplace
      </footer>
    </main>
  );
}
