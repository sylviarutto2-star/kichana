import { MarketingShell } from "@/components/MarketingShell";

export default function About() {
  return (
    <MarketingShell title="About Kichana" eyebrow="Our story">
      <p>
        Kichana was built in Nairobi, for Nairobi. We started with a simple frustration — finding a
        great stylist usually meant scrolling Instagram for hours, sliding into DMs, exchanging
        numbers, sending M-Pesa screenshots, and still showing up unsure what you'd get.
      </p>
      <p>
        We believed it could be simpler — and more beautiful. So we built one place to discover the
        city's best hairstylists, see real work from real bookings, save inspirations, book in
        seconds and pay safely with M-Pesa.
      </p>

      <h2>What makes us different</h2>
      <ul>
        <li><strong>Built for Nairobi.</strong> Browse by neighbourhood. Pay in KES on M-Pesa. Kiswahili first-class.</li>
        <li><strong>Verified, not faked.</strong> Every stylist is ID-checked. Portfolios build from completed bookings — no Pinterest borrowing.</li>
        <li><strong>The Hair Vault.</strong> Save looks you love. Your stylist sees them before you arrive.</li>
        <li><strong>Group bookings.</strong> The girlies, the wedding party, the holiday crew — all booked in one go.</li>
      </ul>

      <h2>Our mission</h2>
      <p>
        Make every Kenyan woman's next hair appointment the easiest, most confident booking she's
        ever made — and give every stylist the tools to run a thriving independent business.
      </p>

      <h2>Want to join?</h2>
      <p>
        We're always looking for great stylists, and we're hiring across product, design and
        community. <a href="mailto:hello@kichana.app">hello@kichana.app</a>.
      </p>
    </MarketingShell>
  );
}
