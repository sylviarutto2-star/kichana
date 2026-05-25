import { useState } from "react";
import { MarketingShell } from "@/components/MarketingShell";
import { Plus, Minus } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  { q: "How do I book?", a: "Sign up, browse Discover, pick a stylist, choose a service and time, and pay your deposit. The whole flow takes about 30 seconds." },
  { q: "How does payment work?", a: "You pay a 30% deposit (minimum KES 500) to confirm. We accept M-Pesa or card through our payment partner, Paystack. The balance is paid directly to the stylist on completion." },
  { q: "Can I cancel?", a: "Yes — from \"My bookings\". You get an automatic full deposit refund if you cancel within 1 hour of booking (change of mind grace), or more than 4 hours before the appointment. Cancel closer than that and the booking is cancelled but the deposit isn't auto-refunded. You can file a dispute on the same screen if something's wrong." },
  { q: "What if my stylist doesn't show up, or the service goes wrong?", a: "File a dispute from the cancelled booking. Pick a reason, tell us what happened, add up to four photos. We review every dispute within 48 hours and refund the deposit when the situation warrants it." },
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
