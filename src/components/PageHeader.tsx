import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PageHeader({
  title,
  subtitle,
  right,
  back = false,
  backTo = "/home",
}: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  back?: boolean;
  backTo?: string;
}) {
  const nav = useNavigate();

  const goBack = () => {
    // When the page was opened directly (deep link / refresh) there is no
    // in-app history to pop — nav(-1) would leave the SPA. Fall back to backTo.
    const idx = (window.history.state as any)?.idx;
    if (typeof idx === "number" && idx > 0) nav(-1);
    else nav(backTo, { replace: true });
  };

  return (
    <header className="container-app pt-6 pb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        {back && (
          <button onClick={goBack} className="mt-1 -ml-1 grid h-9 w-9 place-items-center rounded-full hover:bg-line">
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
