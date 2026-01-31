import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
  label?: string;
}

export function BackButton({ fallbackPath = "/", className = "", label = "Back" }: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    // Try to go back in history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to specified path if no history
      setLocation(fallbackPath);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium ${className}`}
    >
      <ChevronLeft className="h-5 w-5" />
      {label}
    </button>
  );
}
