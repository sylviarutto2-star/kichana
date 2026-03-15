import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { StylistData } from "@/pages/StylistDashboard";

interface Props {
  stylistData: StylistData;
  onUpdate: (data: StylistData) => void;
}

const DashboardSettings = ({ stylistData, onUpdate }: Props) => {
  const { toast } = useToast();
  const [bufferMinutes, setBufferMinutes] = useState(stylistData.buffer_minutes);
  const [transportFee, setTransportFee] = useState(stylistData.transport_fee);
  const [depositPercentage, setDepositPercentage] = useState(stylistData.deposit_percentage);
  const [homeServiceEnabled, setHomeServiceEnabled] = useState(stylistData.home_service_enabled);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      buffer_minutes: bufferMinutes,
      transport_fee: transportFee,
      deposit_percentage: depositPercentage,
      home_service_enabled: homeServiceEnabled,
    };

    const { error } = await supabase
      .from("stylists")
      .update(updates)
      .eq("id", stylistData.id);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      onUpdate({ ...stylistData, ...updates });
      toast({ title: "Settings saved" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Buffer Time */}
      <div>
        <label className="label-text">Buffer Time Between Bookings</label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">Minutes between appointments for prep</p>
        <div className="flex gap-2">
          {[15, 30, 45, 60].map((min) => (
            <button
              key={min}
              onClick={() => setBufferMinutes(min)}
              className={`flex-1 py-2.5 rounded-inner border text-sm font-medium transition-colors ${
                bufferMinutes === min
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground"
              }`}
            >
              {min} min
            </button>
          ))}
        </div>
      </div>

      {/* Deposit Percentage */}
      <div>
        <label className="label-text">Deposit Percentage</label>
        <p className="text-xs text-muted-foreground mt-1 mb-2">How much customers pay upfront</p>
        <div className="flex gap-2">
          {[30, 40, 50, 100].map((pct) => (
            <button
              key={pct}
              onClick={() => setDepositPercentage(pct)}
              className={`flex-1 py-2.5 rounded-inner border text-sm font-medium transition-colors ${
                depositPercentage === pct
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-foreground"
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Home Service */}
      <div>
        <label className="label-text">Home Service</label>
        <div className="flex items-center justify-between mt-2 bg-card border border-border rounded-inner p-4">
          <div>
            <p className="text-sm font-medium">Enable home visits</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stylistData.completed_bookings_count >= 3
                ? "You're eligible for home service"
                : `Need ${3 - stylistData.completed_bookings_count} more bookings to unlock`}
            </p>
          </div>
          <button
            onClick={() => setHomeServiceEnabled(!homeServiceEnabled)}
            disabled={stylistData.completed_bookings_count < 3}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              homeServiceEnabled ? "bg-accent" : "bg-secondary"
            } ${stylistData.completed_bookings_count < 3 ? "opacity-50" : ""}`}
          >
            <div
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-card shadow transition-transform ${
                homeServiceEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Transport Fee */}
      {homeServiceEnabled && (
        <div>
          <label className="label-text">Transport Fee (KES)</label>
          <input
            type="number"
            value={transportFee}
            onChange={(e) => setTransportFee(parseInt(e.target.value) || 0)}
            className="w-full h-12 px-4 mt-2 rounded-inner border border-border bg-card text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-xs text-muted-foreground mt-1">Charged to customers for home visits</p>
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleSave}
        disabled={saving}
        className="w-full h-14 rounded-outer bg-primary text-primary-foreground font-display font-semibold text-base"
      >
        {saving ? "Saving..." : "Save Settings"}
      </motion.button>
    </div>
  );
};

export default DashboardSettings;
