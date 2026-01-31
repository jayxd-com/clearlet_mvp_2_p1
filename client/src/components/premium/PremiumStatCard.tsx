import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PremiumStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  bg?: string;
  className?: string;
}

export function PremiumStatCard({
  label,
  value,
  icon: Icon,
  color = "text-cyan-500",
  bg = "bg-cyan-50 dark:bg-cyan-900/20",
  className,
}: PremiumStatCardProps) {
  return (
    <Card className={cn(
      "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-md gap-0 py-0 overflow-hidden transition-all hover:shadow-lg",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white capitalize">{value}</p>
          </div>
          <div className={cn("p-3 rounded-2xl shadow-inner", bg, color)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
