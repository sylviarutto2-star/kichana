import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name, phone, location })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      navigate("/profile");
    }
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background pb-24"
    >
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-[24px] font-semibold tracking-tight">Edit Profile</h1>
      </div>

      <div className="px-5 space-y-5">
        <div className="flex justify-center">
          <div className="relative h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            {profile?.profile_photo ? (
              <img src={profile.profile_photo} className="h-24 w-24 rounded-full object-cover" alt="" />
            ) : (
              <Camera className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-4 mt-1 rounded-inner border border-border bg-card text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-12 px-4 mt-1 rounded-inner border border-border bg-card text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Location</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-12 px-4 mt-1 rounded-inner border border-border bg-card text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 rounded-outer bg-primary text-primary-foreground font-display font-semibold text-base"
        >
          {saving ? "Saving..." : "Save Changes"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default EditProfile;
