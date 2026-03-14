import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, Shield, Heart, Share2 } from "lucide-react";
import { mockStylists } from "@/data/mockData";

const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

const StylistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"services" | "portfolio" | "reviews">("services");

  const stylist = mockStylists.find((s) => s.id === id);
  if (!stylist) return <div className="page-container">Stylist not found</div>;

  return (
    <motion.div {...pageTransition} className="min-h-screen bg-background pb-28">
      {/* Hero Image */}
      <div className="relative h-[45vh]">
        <img src={stylist.image} alt={stylist.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />

        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div className="flex gap-2">
            <button className="h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
              <Heart className="h-5 w-5 text-foreground" />
            </button>
            <button className="h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center">
              <Share2 className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-5 -mt-10 relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[24px] font-semibold tracking-tight">{stylist.name}</h1>
              {stylist.verified && (
                <Shield className="h-5 w-5 text-accent fill-accent" />
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-foreground">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-semibold tabular-nums">{stylist.rating}</span>
                <span className="text-sm text-muted-foreground">({stylist.reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm">{stylist.location}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-[15px] leading-[1.6] text-muted-foreground mt-4">{stylist.bio}</p>

        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 bg-secondary rounded-inner p-3 text-center">
            <p className="font-display font-bold text-lg tabular-nums">{stylist.yearsExperience}</p>
            <p className="text-xs text-muted-foreground">Years Exp.</p>
          </div>
          <div className="flex-1 bg-secondary rounded-inner p-3 text-center">
            <p className="font-display font-bold text-lg tabular-nums">{stylist.reviews}</p>
            <p className="text-xs text-muted-foreground">Reviews</p>
          </div>
          <div className="flex-1 bg-secondary rounded-inner p-3 text-center">
            <p className="font-display font-bold text-lg tabular-nums">{stylist.services.length}</p>
            <p className="text-xs text-muted-foreground">Services</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 bg-secondary rounded-inner p-1">
          {(["services", "portfolio", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-sm text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "services" && (
            <div className="space-y-3">
              {stylist.services.map((service) => (
                <motion.div
                  key={service.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/booking/${stylist.id}/${service.id}`)}
                  className="bg-card border border-border rounded-inner p-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-display font-medium text-[15px]">{service.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">{service.duration}</span>
                      </div>
                    </div>
                    <p className="font-display font-bold text-[15px] tabular-nums">
                      KES {service.price.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === "portfolio" && (
            <motion.div
              initial="initial"
              animate="animate"
              variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
              className="grid grid-cols-2 gap-2"
            >
              {stylist.portfolio.map((img, i) => (
                <motion.div
                  key={i}
                  variants={{
                    initial: { opacity: 0, y: 10 },
                    animate: { opacity: 1, y: 0 },
                  }}
                  className="aspect-[4/5] rounded-inner overflow-hidden"
                >
                  <img src={img} alt={`Portfolio ${i + 1}`} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-4">
              {[
                { name: "Sarah M.", rating: 5, text: "Amina did the most beautiful knotless braids! Will definitely rebook.", date: "2 weeks ago" },
                { name: "Grace W.", rating: 5, text: "Professional, on time, and amazing results. My go-to stylist!", date: "1 month ago" },
                { name: "Joy K.", rating: 4, text: "Great work, took a little longer than expected but the results were worth it.", date: "2 months ago" },
              ].map((review, i) => (
                <div key={i} className="bg-card border border-border rounded-inner p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{review.name}</p>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: review.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="sticky-action-bar">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Starting from</p>
            <p className="font-display font-bold text-lg tabular-nums">
              KES {stylist.startingPrice.toLocaleString()}
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(`/booking/${stylist.id}/${stylist.services[0].id}`)}
            className="h-12 px-8 rounded-outer bg-primary text-primary-foreground font-display font-semibold text-[15px]"
          >
            Book Now
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default StylistProfile;
