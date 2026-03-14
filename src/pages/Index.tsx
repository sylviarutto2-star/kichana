import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Bell } from "lucide-react";
import KichanaLogo from "@/components/KichanaLogo";
import CategoryChip from "@/components/CategoryChip";
import StylistCard from "@/components/StylistCard";
import { categories, mockStylists } from "@/data/mockData";

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.2, 0, 0, 1] as const } },
};

const Index = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? mockStylists
    : mockStylists.filter((s) => s.category === activeCategory);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background pb-24"
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <KichanaLogo size="sm" />
          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Nairobi, Kenya</span>
          </div>
        </div>
        <button className="relative h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <Bell className="h-5 w-5 text-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>
      </div>

      {/* Greeting */}
      <div className="px-5 mt-2">
        <h1 className="font-display text-[28px] font-semibold tracking-tight leading-[1.1]">
          Find your <span className="text-primary">stylist</span>
        </h1>
        <p className="text-[15px] text-muted-foreground mt-1.5 leading-[1.6]">
          Hand-picked stylists in Kilimani and beyond
        </p>
      </div>

      {/* Categories */}
      <div className="mt-6 px-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <CategoryChip
              key={cat.label}
              label={cat.label}
              icon={cat.icon}
              active={activeCategory === cat.label}
              onClick={() => setActiveCategory(cat.label)}
            />
          ))}
        </div>
      </div>

      {/* Stylists Grid */}
      <motion.div variants={stagger} initial="initial" animate="animate" className="px-5 mt-6 grid grid-cols-2 gap-3">
        {filtered.map((stylist) => (
          <motion.div key={stylist.id} variants={fadeUp}>
            <StylistCard
              name={stylist.name}
              image={stylist.image}
              rating={stylist.rating}
              reviews={stylist.reviews}
              category={stylist.category}
              startingPrice={stylist.startingPrice}
              onClick={() => navigate(`/stylist/${stylist.id}`)}
            />
          </motion.div>
        ))}
      </motion.div>

      {filtered.length > 4 && (
        <div className="px-5 mt-6">
          <button className="w-full py-3 rounded-inner border border-border text-sm font-medium text-foreground bg-card">
            Show More
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default Index;
