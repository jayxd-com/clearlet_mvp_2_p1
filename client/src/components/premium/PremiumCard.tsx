import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PremiumCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  cta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function PremiumCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-cyan-500",
  cta,
  children,
  className,
  headerClassName,
  contentClassName,
}: PremiumCardProps) {
  return (
    <Card className={cn("border-2 border-slate-200 dark:border-slate-700 rounded-3xl shadow-xl overflow-hidden bg-white dark:bg-slate-800/50 py-0 gap-0", className)}>
      <CardHeader className={cn(
        "bg-slate-50 dark:bg-slate-900/50 border-b-2 border-slate-100 dark:border-slate-800 py-4 px-6 flex flex-row items-center justify-between gap-4",
        headerClassName
      )}>
        <div className="space-y-1">
          <CardTitle className="text-sm font-bold uppercase text-slate-900 dark:text-white flex items-center gap-3">
            {Icon && <Icon className={cn("h-4 w-4", iconColor)} />}
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-slate-500">
              {description}
            </CardDescription>
          )}
        </div>
        {cta && <div className="shrink-0">{cta}</div>}
      </CardHeader>
      <CardContent className={cn("py-8 px-4 flex flex-col gap-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
