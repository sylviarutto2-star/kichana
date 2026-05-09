import { MarketingShell } from "@/components/MarketingShell";

export default function Terms() {
  return (
    <MarketingShell title="Terms of Service" eyebrow="Last updated 9 May 2026">
      <p>These Terms govern your use of Kichana. By creating an account you agree to them.</p>

      <h2>1. The platform</h2>
      <p>
        Kichana is a marketplace connecting customers with independent hairstylists and salons in
        Kenya. We facilitate discovery, bookings and payments. Stylists are independent
        contractors — not Kichana employees.
      </p>

      <h2>2. Bookings & payments</h2>
      <ul>
        <li>A booking is confirmed when the deposit is received via M-Pesa.</li>
        <li>Deposit is typically 30% of the service price (minimum KES 500). Balance is paid to the stylist on completion.</li>
        <li>Kichana takes a 10% commission on the booking value to operate the platform.</li>
      </ul>

      <h2>3. Cancellations & refunds</h2>
      <ul>
        <li><strong>Customer cancels &gt; 24h before:</strong> deposit refunded minus M-Pesa fees.</li>
        <li><strong>Customer cancels &lt; 24h before:</strong> deposit forfeited to stylist.</li>
        <li><strong>Stylist cancels:</strong> full deposit refund + KES 200 inconvenience credit.</li>
        <li><strong>No-shows:</strong> no refund.</li>
      </ul>

      <h2>4. User conduct</h2>
      <p>You agree not to: harass others, post content that's illegal, infringing, sexually explicit, hateful, or misleading; impersonate anyone; or use the platform for fraudulent transactions.</p>

      <h2>5. Stylist obligations</h2>
      <ul>
        <li>Provide accurate service, pricing and availability information.</li>
        <li>Hold valid ID for verification.</li>
        <li>Operate professionally, hygienically, and respectfully.</li>
        <li>Honour confirmed bookings.</li>
      </ul>

      <h2>6. Content & licence</h2>
      <p>You retain ownership of photos and posts you upload. You grant Kichana a worldwide, non-exclusive licence to display them within the platform and in marketing related to your service or profile.</p>

      <h2>7. Liability</h2>
      <p>Kichana is not liable for the quality of services performed by independent stylists, nor for any indirect or consequential damages, to the maximum extent permitted by Kenyan law.</p>

      <h2>8. Account termination</h2>
      <p>We may suspend or terminate accounts that violate these Terms. You may close your account at any time from Profile settings.</p>

      <h2>9. Governing law</h2>
      <p>These Terms are governed by the laws of Kenya. Disputes are subject to the exclusive jurisdiction of the courts of Nairobi.</p>

      <h2>10. Changes</h2>
      <p>We may update these Terms. Material changes will be notified via email at least 14 days before they take effect.</p>
    </MarketingShell>
  );
}
