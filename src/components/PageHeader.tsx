import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PageHeader({ title, subtitle, right, back = false }: { title?: string; subtitle?: string; right?: React.ReactNode; back?: boolean }) {
  const nav = useNavigate();
  return (
    <header className="container-app pt-6 pb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        {back && (
          <button onClick={() => nav(-1)} className="mt-1 -ml-1 grid h-9 w-9 place-items-center rounded-full hover:bg-line">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          {title && <h1 className="font-display text-3xl leading-none">{title}</h1>}
          {subtitle && <p className="text-sm text-mute mt-1">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}
