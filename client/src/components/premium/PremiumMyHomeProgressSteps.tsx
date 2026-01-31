import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface PremiumMyHomeProgressStepsProps {
  steps: readonly (string | { label: string; status?: string })[];
  currentIdx: number;
  className?: string;
}

export function PremiumMyHomeProgressSteps({
  steps,
  currentIdx,
  className,
}: PremiumMyHomeProgressStepsProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-[2rem] border-2 border-slate-200 dark:border-slate-700 shadow-sm",
      className
    )}>
      {/* Desktop View */}
      <div className="hidden lg:flex items-center justify-between w-full">
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
                "text-sm font-black transition-colors duration-500 whitespace-nowrap",
                i === currentIdx ? "text-slate-900 dark:text-white" :
                i < currentIdx ? "text-green-600 dark:text-green-400" :
                "text-slate-400 dark:text-slate-600"
              )}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-1 mx-4 rounded-full transition-all duration-500",
                i < currentIdx ? "bg-green-500" : "bg-slate-100 dark:bg-slate-700"
              )} />
            )}
          </div>
        )})}
      </div>

      {/* Mobile View (Stacked or Compact) */}
      <div className="lg:hidden space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Step {Math.min(currentIdx + 1, steps.length)} of {steps.length}</span>
          <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">
            {Math.round((currentIdx / steps.length) * 100)}% Complete
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
            style={{ width: `${(currentIdx / steps.length) * 100}%` }}
          />
        </div>

        {/* Current Step Label */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border-2 border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {Math.min(currentIdx + 1, steps.length)}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-0.5">Current Step</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {currentIdx < steps.length 
                ? (typeof steps[currentIdx] === 'string' ? steps[currentIdx] : (steps[currentIdx] as any).label)
                : "All Steps Completed!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
