import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Footer } from "./Footer";

export function MarketingShell({ title, eyebrow, children }: { title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="container-wide py-6 flex items-center justify-between">
        <Link to="/"><Logo /></Link>
        <Link to="/auth" className="btn-ghost text-sm">Sign in</Link>
      </header>
      <main className="container-wide flex-1 py-10 max-w-3xl mx-auto">
        {eyebrow && <p className="h-eyebrow mb-3">{eyebrow}</p>}
        <h1 className="font-display text-4xl md:text-5xl tracking-tight">{title}</h1>
        <div className="prose mt-8 max-w-none text-ink/90 leading-relaxed
            [&_h2]:font-display [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-3
            [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_li]:mb-1
            [&_a]:text-terracotta-600 [&_a]:underline">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
