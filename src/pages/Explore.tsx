import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import CategoryChip from "@/components/CategoryChip";
import StylistCard from "@/components/StylistCard";
import { categories, mockStylists } from "@/data/mockData";
import { useState } from "react";

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.2, 0, 0, 1] },
};

const Explore = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = mockStylists.filter((s) => {
    const matchesCategory = activeCategory === "All" || s.category === activeCategory;
    const matchesSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-24">
      <div className="px-5 pt-6 pb-4">
        <h1 className="font-display text-[24px] font-semibold tracking-tight">Explore</h1>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stylists, services..."
            className="w-full h-12 pl-11 pr-4 rounded-inner border border-border bg-card text-foreground text-[15px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="px-5 overflow-x-auto scrollbar-hide">
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

      {/* Results */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        {filtered.map((stylist) => (
          <StylistCard
            key={stylist.id}
            name={stylist.name}
            image={stylist.image}
            rating={stylist.rating}
            reviews={stylist.reviews}
            category={stylist.category}
            startingPrice={stylist.startingPrice}
            onClick={() => navigate(`/stylist/${stylist.id}`)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="px-5 py-16 text-center">
          <p className="text-muted-foreground">No stylists found</p>
        </div>
      )}
    </motion.div>
  );
};

export default Explore;
