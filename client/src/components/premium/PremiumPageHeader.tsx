import { LucideIcon, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { PremiumButton } from "./PremiumButton";

interface PremiumPageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function PremiumPageHeader({
  title,
  subtitle,
  icon: Icon,
  action,
  className,
}: PremiumPageHeaderProps) {
  const ActionIcon = action?.icon || ArrowLeft;

  return (
    <div className={cn(
      "bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl p-6 md:p-8 mb-8 shadow-xl",
      className
    )}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <Icon className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-lg text-purple-100 opacity-90 font-medium">{subtitle}</p>
            )}
          </div>
        </div>
        
        {action && (
          <PremiumButton
            onClick={action.onClick}
            variant="outline"
            className="bg-white dark:bg-slate-100 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 text-slate-900 shadow-lg h-12 px-6 rounded-xl border-none transition-all hover:scale-105 active:scale-95"
          >
            <ActionIcon className="h-5 w-5 mr-2" />
            {action.label}
          </PremiumButton>
        )}
      </div>
    </div>
  );
}
