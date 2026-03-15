import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Image, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PortfolioItem {
  id: string;
  image_url: string;
  media_type: string;
}

const DashboardPortfolio = ({ stylistId }: { stylistId: string }) => {
  const { toast } = useToast();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("portfolio_images")
        .select("*")
        .eq("stylist_id", stylistId)
        .order("created_at", { ascending: false });
      if (data) setItems(data as PortfolioItem[]);
    };
    fetch();
  }, [stylistId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const isVideo = file.type.startsWith("video/");
    const ext = file.name.split(".").pop();
    const path = `${stylistId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("portfolio").getPublicUrl(path);
    const { data: row } = await supabase
      .from("portfolio_images")
      .insert({
        stylist_id: stylistId,
        image_url: urlData.publicUrl,
        media_type: isVideo ? "video" : "image",
      })
      .select()
      .single();

    if (row) setItems((prev) => [row as PortfolioItem, ...prev]);
    toast({ title: isVideo ? "Video uploaded" : "Image uploaded" });
    setUploading(false);
  };

  const handleDelete = async (item: PortfolioItem) => {
    await supabase.from("portfolio_images").delete().eq("id", item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    toast({ title: "Removed from portfolio" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-display font-semibold">Portfolio</p>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-sm font-medium text-primary"
        >
          <Plus className="h-4 w-4" /> {uploading ? "Uploading..." : "Upload"}
        </motion.button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <Image className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No portfolio items yet</p>
          <p className="text-xs text-muted-foreground mt-1">Upload photos and videos of your work</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div key={item.id} className="relative aspect-[4/5] rounded-inner overflow-hidden group">
              {item.media_type === "video" ? (
                <video src={item.image_url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={item.image_url} alt="" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                <button
                  onClick={() => handleDelete(item)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-10 w-10 rounded-full bg-destructive/80 flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4 text-destructive-foreground" />
                </button>
              </div>
              {item.media_type === "video" && (
                <div className="absolute top-2 left-2">
                  <Video className="h-4 w-4 text-primary-foreground drop-shadow-md" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardPortfolio;
