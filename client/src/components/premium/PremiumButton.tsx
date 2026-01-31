import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PremiumButtonProps extends ButtonProps {
  isLoading?: boolean;
}

export function PremiumButton({ className, variant = "default", size, isLoading, children, disabled, ...props }: PremiumButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "font-bold uppercase tracking-wider transition-all active:scale-95",
        // Default styling when no size is provided
        !size && "h-12 px-6 rounded-xl",
        // Explicit size overrides for Premium look
        size === "sm" && "h-10 px-4 rounded-lg text-xs",
        size === "lg" && "h-14 px-8 rounded-2xl text-base",
        
        // Default styles for 'default' variant
        variant === "default" && "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-cyan-500 dark:hover:bg-cyan-400 shadow-xl",
        // Styles for 'outline' variant
        variant === "outline" && "border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
        // Styles for 'ghost' variant
        variant === "ghost" && "hover:bg-slate-100 dark:hover:bg-slate-800",
        
        isLoading && "opacity-70 cursor-not-allowed",
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {children}
    </Button>
  );
}