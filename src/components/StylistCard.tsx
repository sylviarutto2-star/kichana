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
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group flex w-full flex-col text-left"
    >
      <div
        className={`relative w-full overflow-hidden bg-secondary ${
          compact ? "aspect-[4/4.8] rounded-inner" : "aspect-[4/5] rounded-2xl"
        }`}
      >
        <img
          src={image}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-2 top-2 rounded-full bg-background/92 px-2 py-1 text-[10px] font-medium text-foreground backdrop-blur-sm">
          {category}
        </span>
      </div>
      <div className={`px-0.5 ${compact ? "mt-2 space-y-1" : "mt-2.5 space-y-1.5"}`}>
        <p className={`font-display font-semibold leading-tight text-foreground ${compact ? "min-h-[2rem] text-[12.5px]" : "text-[14px]"}`}>
          {name}
        </p>
        <div className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted-foreground ${compact ? "text-[10.5px]" : "text-[11.5px]"}`}>
          <div className="flex items-center gap-1">
            <Star className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} fill-primary text-primary`} />
            <span className="font-medium text-foreground tabular-nums">{rating.toFixed(1)}</span>
            <span className="tabular-nums">({reviews})</span>
          </div>
          {distance !== undefined && (
            <div className="flex items-center gap-1">
              <span>·</span>
              <MapPin className={`${compact ? "h-2.5 w-2.5" : "h-3 w-3"}`} />
              <span className="tabular-nums">{distance.toFixed(1)} km</span>
            </div>
          )}
        </div>
        <p className={`${compact ? "text-[10.5px]" : "text-[11.5px]"} text-muted-foreground`}>
          From <span className="font-semibold text-foreground">KES {startingPrice.toLocaleString()}</span>
        </p>
      </div>
    </motion.button>
  );
};

export default StylistCard;
