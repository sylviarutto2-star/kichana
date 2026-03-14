import { motion } from "framer-motion";

interface CategoryChipProps {
  label: string;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}

const CategoryChip = ({ label, active, onClick }: CategoryChipProps) => {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-5 py-2.5 border text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border hover:border-primary/30"
      }`}
    >
      <span>{label}</span>
    </motion.button>
  );
};

export default CategoryChip;
