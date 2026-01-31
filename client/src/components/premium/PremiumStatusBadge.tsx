import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon, Circle, CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type StatusVariant = "default" | "success" | "warning" | "destructive" | "outline" | "secondary" | "neutral";

interface PremiumStatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  icon?: LucideIcon;
  className?: string;
  showIcon?: boolean;
  label?: string; // Optional override for status text
}

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/80",
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  destructive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  outline: "text-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

const defaultIcons: Record<StatusVariant, LucideIcon> = {
  default: Circle,
  success: CheckCircle,
  warning: Clock,
  destructive: XCircle,
  outline: Circle,
  secondary: Circle,
  neutral: Circle,
};

// Helper to auto-detect variant from common status strings
export function getStatusVariant(status: string): StatusVariant {
  const s = status.toLowerCase();
  if (['verified', 'active', 'completed', 'paid', 'approved', 'success', 'fully_signed', 'accepted'].includes(s)) return 'success';
  if (['pending', 'processing', 'review', 'waiting', 'pending_verification', 'sent_to_tenant', 'tenant_signed'].includes(s)) return 'warning';
  if (['rejected', 'cancelled', 'failed', 'overdue', 'banned', 'blocked', 'inactive'].includes(s)) return 'destructive';
  if (['unverified', 'draft', 'new', 'rented'].includes(s)) return 'neutral';
  return 'secondary';
}

export function PremiumStatusBadge({
  status,
  variant,
  icon,
  className,
  showIcon = true,
  label,
}: PremiumStatusBadgeProps) {
  const { t } = useLanguage();
  const finalVariant = variant || getStatusVariant(status);
  const Icon = icon || defaultIcons[finalVariant];

  const getTranslatedLabel = (s: string) => {
    if (label) return label;
    const keyMap: Record<string, string> = {
      fully_signed: "fullySigned",
      tenant_signed: "signedByMe", // or pendingSignature depending on role, but generic translation is hard context-free
      sent_to_tenant: "pendingSignature",
      active: "active",
      draft: "draft",
      pending: "pending",
      verified: "verified",
      unverified: "unverified",
      accepted: "applicationAccepted",
      rejected: "applicationRejected",
      completed: "completed",
      cancelled: "cancelled",
      paid: "paymentComplete",
    };
    const key = keyMap[s.toLowerCase()];
    if (key) return t(key as any);
    
    // Fallback: Title Case
    return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5 px-2.5 py-0.5 capitalize font-medium border shadow-sm transition-colors",
        variantStyles[finalVariant],
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span>{getTranslatedLabel(status)}</span>
    </Badge>
  );
}
