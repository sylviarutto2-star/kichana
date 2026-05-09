import { useState } from "react";
import { MarketingShell } from "@/components/MarketingShell";
import { Plus, Minus } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  { q: "How do I book?", a: "Sign up, browse Discover, pick a stylist, choose a service and time, and pay your deposit on M-Pesa. The whole flow takes about 30 seconds." },
  { q: "How does payment work?", a: "You pay a 30% deposit (minimum KES 500) on M-Pesa to confirm. The balance is paid directly to the stylist on completion. We never store your M-Pesa PIN." },
  { q: "Can I cancel?", a: "Cancel for free up to 24 hours before your appointment. Within 24 hours, the deposit goes to the stylist for the time held." },
  { q: "What if my stylist cancels?", a: "Full refund of your deposit, plus a KES 200 inconvenience credit applied to your next booking." },
  { q: "Are stylists verified?", a: "Yes. Every stylist on Kichana is ID-verified before going live, and their portfolio builds from real completed bookings — not stock photos." },
  { q: "What's the Hair Vault?", a: "Your saved inspirations. Tap Save on any look in the feed and it lands in your Vault. When you book, your stylist can see your Vault — so they know exactly what you want before you arrive." },
  { q: "What's a group booking?", a: "Book the whole crew at once for a wedding, birthday or holiday. The host creates a group, shares the code, and everyone pays their own deposit." },
  { q: "Can I book at home?", a: "Yes — many stylists offer home visits. Just pick \"Come to me\" in the booking wizard and add your address." },
  { q: "How do loyalty points work?", a: "You earn 1 point for every KES 100 spent. Points unlock perks: free upgrades, monthly giveaways, priority booking with featured stylists." },
  { q: "I'm a stylist — how much does Kichana cost me?", a: "We take a 10% commission on bookings made through Kichana. No monthly fees, no setup costs. Free service additions, free profile, free portfolio hosting." },
  { q: "Do you ship outside Nairobi?", a: "Right now Kichana serves Nairobi neighbourhoods. Mombasa, Kisumu and Nakuru rollouts are next." },
  { q: "Is my data safe?", a: "Yes. We use TLS encryption, row-level security, and only store what we need to run the service. Read our Privacy Policy for full detail." },
];

export default function FAQs() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <MarketingShell title="Frequently asked questions" eyebrow="Help">
      <div className="not-prose space-y-2 mt-4">
        {FAQS.map((f, i) => {
          const isOpen = i === open;
          return (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-cream"
              >
                <span className="font-semibold">{f.q}</span>
                {isOpen ? <Minus className="h-5 w-5 text-mute shrink-0" /> : <Plus className="h-5 w-5 text-mute shrink-0" />}
              </button>
              {isOpen && <div className="px-5 pb-5 text-mute leading-relaxed">{f.a}</div>}
            </div>
          );
        })}
      </div>
    </MarketingShell>
  );
}
