import { MarketingShell } from "@/components/MarketingShell";

export default function Privacy() {
  return (
    <MarketingShell title="Privacy Policy" eyebrow="Last updated 9 May 2026">
      <p>
        Kichana Limited ("Kichana", "we", "us") respects your privacy. This Policy explains what
        personal data we collect, why we collect it, how we use it, and your rights — under the
        Kenya Data Protection Act, 2019 and (where applicable) the GDPR.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Kichana is a hair and beauty booking platform headquartered in Nairobi, Kenya. Data
        Controller: Kichana Limited, Nairobi. Data Protection contact:
        <a href="mailto:privacy@kichana.app"> privacy@kichana.app</a>.
      </p>

      <h2>2. What we collect</h2>
      <ul>
        <li><strong>Account info</strong> — name, email, phone (M-Pesa).</li>
        <li><strong>Profile info</strong> — neighbourhood, hair type, allergies, birthday (optional).</li>
        <li><strong>Booking data</strong> — services booked, times, addresses if home-visit, notes.</li>
        <li><strong>Payment data</strong> — M-Pesa receipt numbers via Safaricom Daraja. We do not store full card or M-Pesa PIN data.</li>
        <li><strong>Content</strong> — feed posts, vault saves, reviews, photos you upload.</li>
        <li><strong>Device/usage</strong> — IP, browser, pages viewed, error logs.</li>
      </ul>

      <h2>3. Why we use it</h2>
      <ul>
        <li>To provide bookings, payments and the community feed.</li>
        <li>To improve the product and prevent fraud.</li>
        <li>To send service messages (booking confirmations, receipts, reminders).</li>
        <li>With your consent: marketing on WhatsApp / email.</li>
      </ul>

      <h2>4. Sharing</h2>
      <p>
        We share booking and contact data with the stylist you book. We use processors we trust:
        Supabase (database & storage), Vercel (hosting), Safaricom Daraja (payments), and
        Africa's Talking / WhatsApp Business (messaging). We never sell your data.
      </p>

      <h2>5. Retention</h2>
      <ul>
        <li>Account data — kept while your account is active.</li>
        <li>Booking and payment records — 7 years (tax / accounting).</li>
        <li>Feed posts — auto-deleted after 90 days.</li>
        <li>Vault items — until you delete them.</li>
      </ul>

      <h2>6. Your rights</h2>
      <p>
        Under the Kenya DPA you have the right to access, correct, delete or object to processing
        of your personal data, and to withdraw consent at any time. Email
        <a href="mailto:privacy@kichana.app"> privacy@kichana.app</a> and we'll respond within 30 days.
      </p>

      <h2>7. Children</h2>
      <p>Kichana is for users 18+. We do not knowingly collect data from children under 18.</p>

      <h2>8. Security</h2>
      <p>
        We use TLS in transit, row-level security in our database, and least-privilege access
        controls. No system is bulletproof — please report suspected vulnerabilities to
        <a href="mailto:security@kichana.app"> security@kichana.app</a>.
      </p>

      <h2>9. Changes</h2>
      <p>We'll update this page when our practices change. Material changes are notified by email.</p>
    </MarketingShell>
  );
}
