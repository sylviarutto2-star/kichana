import { useState } from "react";
import { cn } from "@/lib/utils";
import { gradientFor } from "@/lib/imagery";

type Props = {
  src?: string | null;
  alt?: string;
  fallbackKey?: string;
  fallbackLabel?: string;
  className?: string;
  imgClassName?: string;
};

// Renders an image with a branded gradient fallback. If the photo URL fails
// to load (or no src is given), shows the gradient with optional label.
export function SmartImage({ src, alt = "", fallbackKey = "kichana", fallbackLabel, className, imgClassName }: Props) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const grad = gradientFor(fallbackKey);

  if (!src || failed) {
    return (
      <div className={cn("relative overflow-hidden bg-gradient-to-br text-cream", grad, className)}>
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.5),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(216,168,90,0.55),transparent_50%)]" />
        {fallbackLabel && (
          <span className="absolute bottom-3 left-4 font-display italic text-cream/95 text-lg drop-shadow">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && <div className={cn("absolute inset-0 bg-gradient-to-br", grad)} />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn("h-full w-full object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0", imgClassName)}
      />
    </div>
  );
}
