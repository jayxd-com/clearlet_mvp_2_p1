import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {CheckCircle, Clock, Eye, EyeOff, XCircle, AlertTriangle, UserCheck, Edit} from "lucide-react";

export type StatusType =
  | "active"
  | "inactive"
  | "rented"
  | "pending"
  | "pending_verification"
  | "verified"
  | "unverified"
  | "rejected"
  | "accepted"
  | "draft"
  | "sent_to_tenant"
  | "tenant_signed"
  | "fully_signed"
  | "expired"
  | "terminated";

interface StatusConfig {
  label: string;
  className: string;
  icon?: any;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Property Statuses
  active: {
    label: "Active",
    className: "bg-green-500 text-white",
    icon: Eye
  },
  inactive: {
    label: "Inactive",
    className: "bg-slate-500 text-white",
    icon: EyeOff
  },
  rented: {
    label: "Rented",
    className: "bg-blue-500 text-white",
    icon: UserCheck
  },
  pending_verification: {
    label: "Pending Verification",
    className: "bg-yellow-500 text-white",
    icon: Clock
  },
  verified: {
    label: "Verified Listing",
    className: "bg-cyan-500 text-white",
    icon: CheckCircle
  },
  unverified: {
    label: "Unverified",
    className: "bg-slate-400 text-white",
    icon: AlertTriangle
  },

  // Application/General Statuses
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
    icon: Clock
  },
  accepted: {
    label: "Accepted",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    icon: CheckCircle
  },
  approved: { // Alias for accepted sometimes used
    label: "Approved",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    icon: CheckCircle
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
    icon: XCircle
  },

  // Contract Statuses
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    icon: Edit
  },
  sent_to_tenant: {
    label: "Sent to Tenant",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock
  },
  tenant_signed: {
    label: "Tenant Signed",
    className: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Edit
  },
  fully_signed: {
    label: "Fully Signed",
    className: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle
  }
};

interface PropertyStatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export function PropertyStatusBadge({ status, className, showIcon = true }: PropertyStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status?.replace("_", " ") || "Unknown",
    className: "bg-slate-100 text-slate-600",
    icon: null
  };

  const Icon = config.icon;

  return (
    <Badge
      className={cn(
        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-transparent shadow-sm flex items-center gap-1.5 w-fit",
        config.className,
        className
      )}
    >
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}
