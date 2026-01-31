import { cn } from "@/lib/utils";
import { Label as RadixLabel } from "@/components/ui/label";

interface PremiumLabelProps extends React.ComponentProps<typeof RadixLabel> {
  className?: string;
  required?: boolean;
}

export function PremiumLabel({ className, required, children, ...props }: PremiumLabelProps) {
  return (
    <RadixLabel 
      className={cn(
        "text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block",
        className
      )} 
      {...props} 
    >
      {children}
      {required && <span className="text-red-500 ml-1 text-xs">*</span>}
    </RadixLabel>
  );
}