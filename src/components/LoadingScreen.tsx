import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export function LoadingScreen({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        <Logo />
        <div className="flex items-center gap-2 text-mute text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          {label}
        </div>
      </div>
    </div>
  );
}
