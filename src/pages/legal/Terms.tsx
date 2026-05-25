import { MarketingShell } from "@/components/MarketingShell";

export default function Terms() {
  return (
    <MarketingShell title="Terms of Service" eyebrow="Last updated 25 May 2026">
      <p>These Terms govern your use of Kichana. By creating an account you agree to them.</p>

      <h2>1. The platform</h2>
      <p>
        Kichana is a marketplace connecting customers with independent hairstylists and salons in
        Kenya. We facilitate discovery, bookings and payments. Stylists are independent
        contractors — not Kichana employees.
      </p>

      <h2>2. Bookings & payments</h2>
      <ul>
        <li>A booking is confirmed when the deposit is received. We accept M-Pesa or card through our payment partner, Paystack.</li>
        <li>Deposit is 30% of the service price (minimum KES 500). The balance is paid directly to the stylist on completion.</li>
        <li>Kichana takes a 10% commission on the booking value to operate the platform.</li>
      </ul>

      <h2>3. Cancellations & refunds</h2>
      <p>You can cancel a booking from "My bookings" at any time. Whether the deposit is auto-refunded depends on when you cancel:</p>
      <ul>
        <li><strong>Within 1 hour of booking:</strong> automatic full deposit refund. Change of mind grace period.</li>
        <li><strong>More than 4 hours before the appointment:</strong> automatic full deposit refund.</li>
        <li><strong>Less than 4 hours before (and outside the 1-hour grace):</strong> the booking is cancelled but the deposit is not auto-refunded. You can file a dispute from the same screen.</li>
      </ul>
      <p>Refunds land back on the card or M-Pesa account you paid with, usually within 5 business days.</p>

      <h2>4. Disputes</h2>
      <p>If your stylist didn't show up, the service wasn't delivered as agreed, you had a health or family emergency, or anything else went wrong, file a dispute on the cancelled booking. Add a short description and up to four photos. We review every dispute within 48 hours and refund the deposit when the situation warrants it. Decisions are made by the Kichana team and are final.</p>

      <h2>5. User conduct</h2>
      <p>You agree not to: harass others, post content that's illegal, infringing, sexually explicit, hateful, or misleading; impersonate anyone; or use the platform for fraudulent transactions.</p>

      <h2>6. Stylist obligations</h2>
      <ul>
        <li>Provide accurate service, pricing and availability information.</li>
        <li>Hold valid ID for verification.</li>
        <li>Operate professionally, hygienically, and respectfully.</li>
        <li>Honour confirmed bookings.</li>
      </ul>

      <h2>7. Content & licence</h2>
      <p>You retain ownership of photos and posts you upload. You grant Kichana a worldwide, non-exclusive licence to display them within the platform and in marketing related to your service or profile.</p>

      <h2>8. Liability</h2>
      <p>Kichana is not liable for the quality of services performed by independent stylists, nor for any indirect or consequential damages, to the maximum extent permitted by Kenyan law.</p>

      <h2>9. Account termination</h2>
      <p>We may suspend or terminate accounts that violate these Terms. You may close your account at any time from Profile settings.</p>

      <h2>10. Governing law</h2>
      <p>These Terms are governed by the laws of Kenya. Disputes are subject to the exclusive jurisdiction of the courts of Nairobi.</p>

      <h2>11. Changes</h2>
      <p>We may update these Terms. Material changes will be notified via email at least 14 days before they take effect.</p>
    </MarketingShell>
  );
}
