import { MarketingShell } from "@/components/MarketingShell";

export default function Cookies() {
  return (
    <MarketingShell title="Cookie Policy" eyebrow="Last updated 9 May 2026">
      <p>
        Kichana uses minimal cookies and similar storage to keep you signed in and to improve the
        product. We do not use third-party advertising trackers.
      </p>

      <h2>What we set</h2>
      <ul>
        <li><strong>Essential</strong> — Supabase auth tokens (keeps you logged in). Always on.</li>
        <li><strong>Functional</strong> — language preference, last-selected neighbourhood. Always on.</li>
        <li><strong>Analytics</strong> — anonymous page-view counts. Off by default; opt-in via the cookie banner.</li>
      </ul>

      <h2>Managing cookies</h2>
      <p>You can clear cookies in your browser at any time. Doing so will sign you out.</p>

      <h2>Contact</h2>
      <p>Questions: <a href="mailto:privacy@kichana.app">privacy@kichana.app</a>.</p>
    </MarketingShell>
  );
}
