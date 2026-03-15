import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ServiceRow {
  id: string;
  name: string;
  price: number;
  duration: string | null;
  description: string | null;
  category: string | null;
}

const DashboardServices = ({ stylistId }: { stylistId: string }) => {
  const { toast } = useToast();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "", description: "", category: "" });

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("services").select("*").eq("stylist_id", stylistId);
      if (data) setServices(data as ServiceRow[]);
    };
    fetch();
  }, [stylistId]);

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    const payload = {
      stylist_id: stylistId,
      name: form.name,
      price: parseInt(form.price),
      duration: form.duration || null,
      description: form.description || null,
      category: form.category || null,
    };

    if (editId) {
      await supabase.from("services").update(payload).eq("id", editId);
      setServices((prev) => prev.map((s) => (s.id === editId ? { ...s, ...payload } : s)));
      toast({ title: "Service updated" });
    } else {
      const { data } = await supabase.from("services").insert(payload).select().single();
      if (data) setServices((prev) => [...prev, data as ServiceRow]);
      toast({ title: "Service added" });
    }
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", price: "", duration: "", description: "", category: "" });
  };

  const handleDelete = async (id: string) => {
    await supabase.from("services").delete().eq("id", id);
    setServices((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Service deleted" });
  };

  const handleEdit = (s: ServiceRow) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      price: s.price.toString(),
      duration: s.duration || "",
      description: s.description || "",
      category: s.category || "",
    });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-display font-semibold">Your Services</p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", price: "", duration: "", description: "", category: "" }); }}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <Plus className="h-4 w-4" /> Add
        </motion.button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-inner p-4 mb-4 space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Service name"
            className="w-full h-10 px-3 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Price (KES)"
              type="number"
              className="h-10 px-3 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <input
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="Duration (e.g. 2 hrs)"
              className="h-10 px-3 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full h-10 px-3 rounded-sm border border-border bg-background text-sm focus:outline-none"
          >
            <option value="">Select category</option>
            {["Braids", "Wig Install", "Natural Hair", "Protective Styles", "Treatments", "Barber", "Nails", "Hair Products", "Makeup"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            rows={2}
            className="w-full px-3 py-2 rounded-sm border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave} className="flex-1 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-medium">
              {editId ? "Update" : "Save"}
            </motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2.5 rounded-sm bg-secondary text-foreground text-sm font-medium">
              Cancel
            </motion.button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {services.length === 0 && !showForm ? (
          <p className="text-center py-12 text-muted-foreground">No services yet. Add your first service above.</p>
        ) : (
          services.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-inner p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                  <div className="flex gap-2 mt-1.5">
                    {s.duration && <span className="text-xs text-muted-foreground">{s.duration}</span>}
                    {s.category && <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{s.category}</span>}
                  </div>
                </div>
                <p className="font-display font-bold tabular-nums text-sm">KES {s.price.toLocaleString()}</p>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <button onClick={() => handleEdit(s)} className="flex items-center gap-1 text-xs text-primary font-medium">
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => handleDelete(s.id)} className="flex items-center gap-1 text-xs text-destructive font-medium">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DashboardServices;
