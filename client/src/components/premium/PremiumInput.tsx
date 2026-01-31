import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  iconClassName?: string;
}

export const PremiumInput = React.forwardRef<HTMLInputElement, PremiumInputProps>(
  ({ className, icon: Icon, iconClassName, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {Icon && (
          <Icon className={cn("absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400", iconClassName)} />
        )}
        <Input
          ref={ref}
          className={cn(
            "h-14 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-base transition-all focus:border-cyan-500 focus:ring-0",
            Icon && "pl-12",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

PremiumInput.displayName = "PremiumInput";
