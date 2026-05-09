import { cn } from "@/lib/utils";

export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  if (mark) {
    return (
      <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-terracotta-600 text-cream font-display font-bold", className)}>
        K
      </div>
    );
  }
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div className="h-8 w-8 rounded-xl bg-terracotta-600 text-cream grid place-items-center font-display font-bold">K</div>
      <span className="font-display text-2xl tracking-tight">kichana</span>
    </div>
  );
}
