import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface StylistCardProps {
  name: string;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  startingPrice: number;
  onClick?: () => void;
}

const StylistCard = ({ name, image, rating, reviews, category, startingPrice, onClick }: StylistCardProps) => {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative aspect-[4/5] rounded-outer overflow-hidden cursor-pointer stylist-card-shadow"
    >
      <img src={image} alt={name} className="object-cover w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <p className="font-display font-bold text-lg text-primary-foreground">{name}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-primary-foreground/90">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-sm font-medium tabular-nums">{rating}</span>
            <span className="text-sm opacity-70">({reviews})</span>
          </div>
          <span className="text-sm font-medium text-primary-foreground/80">{category}</span>
        </div>
        <p className="text-xs text-primary-foreground/70 mt-1">From KES {startingPrice.toLocaleString()}</p>
      </div>
    </motion.div>
  );
};

export default StylistCard;
