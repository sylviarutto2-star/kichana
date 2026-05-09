import { MarketingShell } from "@/components/MarketingShell";
import { Mail, MessageCircle, Instagram, MapPin } from "lucide-react";

export default function Contact() {
  return (
    <MarketingShell title="Contact us" eyebrow="We're here">
      <p>The fastest way to reach us is WhatsApp. We aim to reply within 2 hours during the day.</p>

      <div className="not-prose grid sm:grid-cols-2 gap-3 mt-6">
        <Card icon={<MessageCircle className="h-5 w-5" />} title="WhatsApp" href="https://wa.me/254700000000" subtitle="+254 700 000 000" />
        <Card icon={<Mail className="h-5 w-5" />} title="Email" href="mailto:hello@kichana.app" subtitle="hello@kichana.app" />
        <Card icon={<Instagram className="h-5 w-5" />} title="Instagram" href="https://instagram.com/kichana" subtitle="@kichana" />
        <Card icon={<MapPin className="h-5 w-5" />} title="Office" subtitle="Westlands, Nairobi, Kenya" />
      </div>

      <h2>Press</h2>
      <p>For press enquiries: <a href="mailto:press@kichana.app">press@kichana.app</a>.</p>

      <h2>Partnerships</h2>
      <p>For events, brand partnerships and B2B group bookings: <a href="mailto:partners@kichana.app">partners@kichana.app</a>.</p>

      <h2>Security</h2>
      <p>To report a vulnerability: <a href="mailto:security@kichana.app">security@kichana.app</a>. We respond within 24 hours.</p>
    </MarketingShell>
  );
}

function Card({ icon, title, subtitle, href }: { icon: React.ReactNode; title: string; subtitle: string; href?: string }) {
  const inner = (
    <div className="card p-5 hover:border-terracotta-300 transition">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-terracotta-50 text-terracotta-600">{icon}</div>
      <div className="font-semibold mt-3">{title}</div>
      <div className="text-sm text-mute mt-1">{subtitle}</div>
    </div>
  );
  return href ? <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a> : inner;
}
