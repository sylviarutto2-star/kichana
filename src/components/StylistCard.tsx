import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";

interface StylistCardProps {
  name: string;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  startingPrice: number;
  distance?: number;
  onClick?: () => void;
  compact?: boolean;
}

const StylistCard = ({
  name,
  image,
  rating,
  reviews,
  category,
  startingPrice,
  distance,
  onClick,
  compact = false,
}: StylistCardProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group flex flex-col text-left w-full"
    >
      <div className={`relative w-full ${compact ? "aspect-square" : "aspect-[4/5]"} overflow-hidden rounded-2xl bg-secondary`}>
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/90 text-[10px] font-medium text-foreground backdrop-blur-sm">
          {category}
        </span>
      </div>
      <div className="mt-2 px-0.5">
        <p className="font-display font-semibold text-[13px] leading-tight truncate">{name}</p>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <Star className="h-3 w-3 fill-primary text-primary" />
          <span className="font-medium text-foreground tabular-nums">{rating}</span>
          <span className="tabular-nums">({reviews})</span>
          {distance !== undefined && (
            <>
              <span className="mx-1">·</span>
              <MapPin className="h-2.5 w-2.5" />
              <span className="tabular-nums">{distance.toFixed(1)} km</span>
            </>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          From <span className="text-foreground font-medium">KES {startingPrice.toLocaleString()}</span>
        </p>
      </div>
    </motion.button>
  );
};

export default StylistCard;
