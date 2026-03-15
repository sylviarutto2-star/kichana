import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Phone, Trash2, Star, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethod {
  id: string;
  phone_number: string;
  label: string;
  is_default: boolean;
}

const formatKenyanPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254")) return "+" + digits.slice(0, 12);
  if (digits.startsWith("0")) return "+254" + digits.slice(1, 10);
  return "+254" + digits.slice(0, 9);
};

const isValidKenyanPhone = (phone: string) => /^\+254[17]\d{8}$/.test(phone);

const PaymentMethods = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newLabel, setNewLabel] = useState("M-Pesa");
  const [saving, setSaving] = useState(false);

  const fetchMethods = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    setMethods((data as PaymentMethod[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMethods();
  }, [user]);

  const handleAdd = async () => {
    if (!user) return;
    const formatted = formatKenyanPhone(newPhone);
    if (!isValidKenyanPhone(formatted)) {
      toast({ title: "Invalid number", description: "Enter a valid Kenyan phone number (07xx or 01xx)", variant: "destructive" });
      return;
    }

    setSaving(true);
    const isFirst = methods.length === 0;
    const { error } = await supabase
      .from("payment_methods")
      .insert({
        user_id: user.id,
        phone_number: formatted,
        label: newLabel.trim() || "M-Pesa",
        is_default: isFirst,
      });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payment method added" });
      setNewPhone("");
      setNewLabel("M-Pesa");
      setShowAdd(false);
      fetchMethods();
    }
    setSaving(false);
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    // Unset all defaults, then set the selected one
    await supabase
      .from("payment_methods")
      .update({ is_default: false })
      .eq("user_id", user.id);
    await supabase
      .from("payment_methods")
      .update({ is_default: true })
      .eq("id", id);
    fetchMethods();
    toast({ title: "Default updated" });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed" });
      fetchMethods();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background pb-24"
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-[24px] font-semibold tracking-tight flex-1">Payment Methods</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="h-9 w-9 rounded-full bg-primary flex items-center justify-center"
        >
          <Plus className="h-4 w-4 text-primary-foreground" />
        </button>
      </div>

      {/* Methods list */}
      <div className="px-5 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-inner bg-muted animate-pulse" />
            ))}
          </div>
        ) : methods.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-7 w-7 text-primary" />
            </div>
            <p className="font-display font-semibold text-lg">No payment methods</p>
            <p className="text-sm text-muted-foreground mt-1">Add your M-Pesa number to get started</p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAdd(true)}
              className="mt-6 h-12 px-6 rounded-outer bg-primary text-primary-foreground font-display font-semibold text-sm"
            >
              Add M-Pesa Number
            </motion.button>
          </div>
        ) : (
          methods.map((method) => (
            <motion.div
              key={method.id}
              layout
              className="bg-card border border-border rounded-inner p-4 flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-medium truncate">{method.phone_number}</p>
                  {method.is_default && (
                    <span className="text-[10px] font-semibold bg-accent/15 text-accent px-1.5 py-0.5 rounded">
                      DEFAULT
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{method.label}</p>
              </div>
              <div className="flex items-center gap-1">
                {!method.is_default && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-accent transition-colors"
                    title="Set as default"
                  >
                    <Star className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(method.id)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-t-[20px] p-5 pb-8"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display text-lg font-semibold">Add M-Pesa Number</h2>
                <button onClick={() => setShowAdd(false)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="0712 345 678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    maxLength={13}
                    className="w-full h-12 px-4 mt-1 rounded-inner border border-border bg-background text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Safaricom or Airtel Money number</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Personal, Business"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    maxLength={30}
                    className="w-full h-12 px-4 mt-1 rounded-inner border border-border bg-background text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAdd}
                  disabled={saving || !newPhone.trim()}
                  className="w-full h-14 rounded-outer bg-primary text-primary-foreground font-display font-semibold text-base disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Payment Method"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PaymentMethods;
