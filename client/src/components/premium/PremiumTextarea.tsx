import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PremiumTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const PremiumTextarea = React.forwardRef<HTMLTextAreaElement, PremiumTextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <Textarea
        ref={ref}
        className={cn(
          "bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-medium text-base transition-all focus:border-cyan-500 focus:ring-0 p-4",
          className
        )}
        {...props}
      />
    );
  }
);

PremiumTextarea.displayName = "PremiumTextarea";
