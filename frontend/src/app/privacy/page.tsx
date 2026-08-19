export const metadata = {
  title: "Privacy Policy — Chowk",
  description: "Privacy policy for Chowk labor marketplace",
};

export default function PrivacyPolicy() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: August 2025</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">1. About Chowk</h2>
        <p>
          Chowk is a labor marketplace that connects daily wage workers and
          contractors across Andhra Pradesh, India. We operate via WhatsApp and
          a mobile application. Our registered contact is{" "}
          <a href="mailto:sunkara4solutions@gmail.com" className="text-blue-600 underline">
            sunkara4solutions@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Workers:</strong> Name, mobile number, skills, years of
            experience, daily rate, and city.
          </li>
          <li>
            <strong>Contractors:</strong> Name, company name (optional), mobile
            number, and city.
          </li>
          <li>
            <strong>Location:</strong> GPS coordinates (only when you verify
            your location in the app; never tracked in the background).
          </li>
          <li>
            <strong>WhatsApp messages:</strong> Conversation data exchanged with
            the Chowk WhatsApp bot, processed via Meta's WhatsApp Business API.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Match workers to relevant job postings in their city and skill area.</li>
          <li>Notify workers of new jobs via WhatsApp.</li>
          <li>Allow contractors to post jobs and confirm worker attendance.</li>
          <li>Verify that a worker's GPS location matches their registered city.</li>
          <li>Improve our matching algorithm and product experience.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">4. Data Sharing</h2>
        <p className="mb-2">
          We do <strong>not</strong> sell your personal information. We share
          data only as necessary:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Contractors and workers:</strong> When a worker is confirmed
            for a job, the contractor sees the worker's name and phone number,
            and vice versa.
          </li>
          <li>
            <strong>Service providers:</strong> Twilio (OTP verification), Meta
            (WhatsApp messaging). These providers process data under their own
            privacy policies.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
        <p>
          We retain your profile information for as long as your account is
          active. You may request deletion at any time by messaging{" "}
          <strong>STOP</strong> to our WhatsApp number or emailing us at{" "}
          <a href="mailto:sunkara4solutions@gmail.com" className="text-blue-600 underline">
            sunkara4solutions@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate information.</li>
          <li>Request deletion of your account and data.</li>
          <li>Opt out of WhatsApp notifications by sending STOP to our bot.</li>
        </ul>
        <p className="mt-2">
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:sunkara4solutions@gmail.com" className="text-blue-600 underline">
            sunkara4solutions@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">7. Security</h2>
        <p>
          We use industry-standard security practices including password hashing,
          HTTPS-only communication, and access controls. No system is completely
          secure; please contact us immediately if you suspect a breach.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
        <p>
          Chowk is intended for adults (18+). We do not knowingly collect data
          from minors.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">9. Changes to This Policy</h2>
        <p>
          We may update this policy as our product evolves. We will notify
          active users via WhatsApp of significant changes.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">10. Contact</h2>
        <p>
          Chowk — Labor Marketplace
          <br />
          Andhra Pradesh, India
          <br />
          <a href="mailto:sunkara4solutions@gmail.com" className="text-blue-600 underline">
            sunkara4solutions@gmail.com
          </a>
        </p>
      </section>
    </main>
  );
}
