import { MarketingShell } from "@/components/MarketingShell";
import { Search, Calendar, Smartphone, Sparkles } from "lucide-react";

export default function HowItWorks() {
  return (
    <MarketingShell title="How Kichana works" eyebrow="3 minutes to your next great hair day">
      <p>Whether you're booking your first appointment or running a salon — here's how it goes.</p>

      <h2>For customers</h2>
      <ol className="not-prose space-y-3 mt-4">
        <Step n={1} icon={<Search className="h-4 w-4" />} title="Discover">Browse stylists by neighbourhood, service or rating. Save looks you love to your Hair Vault.</Step>
        <Step n={2} icon={<Calendar className="h-4 w-4" />} title="Book">Pick a service and time. Choose at-the-salon or come-to-me. Add notes. Done in 30 seconds.</Step>
        <Step n={3} icon={<Smartphone className="h-4 w-4" />} title="Pay">Confirm your booking with a 10% deposit on M-Pesa. Pay the 90% balance to your stylist on completion.</Step>
        <Step n={4} icon={<Sparkles className="h-4 w-4" />} title="Show up & glow up">Your stylist already has your Vault. You both know exactly what to expect.</Step>
      </ol>

      <h2>For stylists</h2>
      <ol className="not-prose space-y-3 mt-4">
        <Step n={1} icon={<Sparkles className="h-4 w-4" />} title="Sign up free">Set up your studio in 5 minutes. No subscription, no setup fee.</Step>
        <Step n={2} icon={<Search className="h-4 w-4" />} title="Get discovered">Customers find you by neighbourhood and service. Featured slots available for top performers.</Step>
        <Step n={3} icon={<Calendar className="h-4 w-4" />} title="Manage bookings">Today's calendar in one place. Confirm, complete, mark no-shows in a tap.</Step>
        <Step n={4} icon={<Smartphone className="h-4 w-4" />} title="Get paid">You collect the 90% balance from the customer directly at the appointment. Kichana keeps the 10% deposit as its platform fee — no payouts to wait for.</Step>
      </ol>
    </MarketingShell>
  );
}

function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="card p-5 flex gap-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-terracotta-50 text-terracotta-600 shrink-0">{icon}</div>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-terracotta-600">Step {n}</div>
        <div className="font-semibold mt-0.5">{title}</div>
        <p className="text-sm text-mute mt-1">{children}</p>
      </div>
    </li>
  );
}
