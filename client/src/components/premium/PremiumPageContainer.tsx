import { cn } from "@/lib/utils";

interface PremiumPageContainerProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  maxWidth?: "5xl" | "7xl" | "full";
}

export function PremiumPageContainer({
  children,
  className,
  innerClassName,
  maxWidth = "7xl",
}: PremiumPageContainerProps) {
  const maxWidthClass = {
    "5xl": "max-w-5xl",
    "7xl": "max-w-7xl",
    "full": "max-w-full",
  }[maxWidth];

  return (
    <div className={cn("min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 p-4 md:p-8", className)}>
      <div className={cn(maxWidthClass, "mx-auto w-full", innerClassName)}>
        {children}
      </div>
    </div>
  );
}
