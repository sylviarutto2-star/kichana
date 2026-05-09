import { cn, initials } from "@/lib/utils";

export function Avatar({ src, name, size = 40, className }: { src?: string | null; name?: string | null; size?: number; className?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || ""}
        style={{ width: size, height: size }}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={cn("grid place-items-center rounded-full bg-aubergine-700 text-cream font-semibold", className)}
    >
      {initials(name)}
    </div>
  );
}
