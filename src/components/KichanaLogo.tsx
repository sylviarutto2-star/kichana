import { Scissors } from "lucide-react";

const KichanaLogo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeMap = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-[32px]",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="bg-primary rounded-inner p-2">
        <Scissors className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className={`font-display font-bold tracking-tight ${sizeMap[size]}`}>
        KICHANA
      </span>
    </div>
  );
};

export default KichanaLogo;
