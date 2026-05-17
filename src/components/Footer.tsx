import { Link } from "react-router-dom";
import { Instagram, Facebook, Music, Mail } from "lucide-react";
import { Logo } from "./Logo";

// Official Kichana social channels.
export const SOCIAL = {
  instagram: "https://www.instagram.com/kichana.app/",
  tiktok: "https://www.tiktok.com/@kichana.official",
  facebook: "https://web.facebook.com/kichana.co.ke",
  email: "mailto:hello@kichana.co.ke",
};

export function Footer() {
  return (
    <footer className="border-t border-line bg-cream">
      <div className="container-wide py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="text-sm text-mute mt-4 max-w-xs">
            Hair, brilliantly booked. Built in Nairobi for Nairobi — and growing across East Africa.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <Social href={SOCIAL.instagram} label="Instagram"><Instagram className="h-4 w-4" /></Social>
            <Social href={SOCIAL.tiktok} label="TikTok"><Music className="h-4 w-4" /></Social>
            <Social href={SOCIAL.facebook} label="Facebook"><Facebook className="h-4 w-4" /></Social>
            <Social href={SOCIAL.email} label="Email"><Mail className="h-4 w-4" /></Social>
          </div>
        </div>

        <Column title="Product">
          <FooterLink to="/discover">Discover stylists</FooterLink>
          <FooterLink to="/auth?role=stylist">For stylists</FooterLink>
          <FooterLink to="/how-it-works">How it works</FooterLink>
          <FooterLink to="/faqs">FAQs</FooterLink>
        </Column>

        <Column title="Company">
          <FooterLink to="/about">About</FooterLink>
          <FooterLink to="/contact">Contact</FooterLink>
          <FooterLink to="/privacy">Privacy</FooterLink>
          <FooterLink to="/terms">Terms</FooterLink>
          <FooterLink to="/cookies">Cookies</FooterLink>
        </Column>
      </div>

      <div className="border-t border-line">
        <div className="container-wide py-5 flex flex-col md:flex-row gap-2 items-center justify-between text-xs text-mute">
          <span>© {new Date().getFullYear()} Kichana. All rights reserved.</span>
          <span>Made in Nairobi 🇰🇪 · M-Pesa ready</span>
        </div>
      </div>
    </footer>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-ink mb-3">{title}</div>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}
function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li><Link to={to} className="text-sm text-mute hover:text-terracotta-600 transition">{children}</Link></li>
  );
}
function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-line text-mute hover:text-terracotta-600 hover:border-terracotta-300 transition"
    >{children}</a>
  );
}
