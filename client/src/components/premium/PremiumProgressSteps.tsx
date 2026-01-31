import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface PremiumProgressStepsProps {
  steps: readonly (string | { label: string; status?: string })[];
  currentIdx: number;
  className?: string;
}

export function PremiumProgressSteps({
  steps,
  currentIdx,
  className,
}: PremiumProgressStepsProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-slate-800 p-6 rounded-[2rem] border-2 border-slate-200 dark:border-slate-700 shadow-sm",
      className
    )}>
      <div className="flex items-center justify-between w-full">
        {steps.map((stepItem, i) => {
          const label = typeof stepItem === 'string' ? stepItem : stepItem.label;
          
          return (
          <div key={label} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
            <div className="flex items-center gap-3">
              <div 
                className={cn(
                  "h-11 w-11 shrink-0 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500",
                  i === currentIdx ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/40 scale-110" : 
                  i < currentIdx ? "bg-green-500 text-white" : 
                  "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-2"
                )}
              >
                {i < currentIdx ? <Check className="h-5 w-5" strokeWidth={3} /> : i + 1}
              </div>
              <span className={cn(
                "hidden md:block text-sm font-black transition-colors duration-500",
                i === currentIdx ? "text-slate-900 dark:text-white" :
                i < currentIdx ? "text-green-600 dark:text-green-400" :
                "text-slate-400 dark:text-slate-600"
              )}>
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-1 mx-4 md:mx-8 rounded-full transition-all duration-500",
                i < currentIdx ? "bg-green-500" : "bg-slate-100 dark:bg-slate-700"
              )} />
            )}
          </div>
        )})}
      </div>
    </div>
  );
}
