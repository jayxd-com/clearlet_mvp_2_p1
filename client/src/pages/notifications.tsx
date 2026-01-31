import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Check, CheckCheck, Filter, Clock, FileText, AlertCircle, Key, ClipboardCheck, ArrowRight } from "lucide-react";
import { PremiumPageContainer } from "@/components/premium/PremiumPageContainer";
import { PremiumPageHeader } from "@/components/premium/PremiumPageHeader";
import { PremiumCard } from "@/components/premium/PremiumCard";
import { PremiumButton } from "@/components/premium/PremiumButton";
import { PremiumStatusBadge } from "@/components/premium/PremiumStatusBadge";
import { TenantLayout } from "@/components/TenantLayout";
import { LandlordLayout } from "@/components/LandlordLayout";
import { AdminLayout } from "@/components/AdminLayout";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [filterType, setFilterType] = useState<any>("all");
  const [filterRead, setFilterRead] = useState<"all" | "unread" | "read">("all");
  
  const { data: notifications = [], refetch } = trpc.notifications.list.useQuery({
    type: filterType === "all" ? undefined : filterType,
    isRead: filterRead === "all" ? undefined : filterRead === "read",
  }, {
    enabled: isAuthenticated,
  });
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });
  
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });
  
  const handleNotificationClick = (notificationId: number, isRead: boolean, link?: string | null) => {
    if (!isRead) {
      markAsReadMutation.mutate({ notificationId });
    }
    if (link) {
      setLocation(link);
    }
  };

  const Layout = useMemo(() => {
    if (!user) return ({ children }: { children: React.ReactNode }) => <div className="pt-20">{children}</div>;
    if (user.role === "admin") return AdminLayout;
    if (user.userType === "landlord") return LandlordLayout;
    if (user.userType === "tenant") return TenantLayout;
    return ({ children }: { children: React.ReactNode }) => <div className="pt-20">{children}</div>;
  }, [user]);
  
  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">Please sign in to view notifications</p>
      </div>
    );
  }
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "contract": return <FileText className="h-5 w-5 text-green-500" />;
      case "payment": return <Clock className="h-5 w-5 text-yellow-500" />;
      case "maintenance": return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "application": return <ClipboardCheck className="h-5 w-5 text-blue-500" />;
      case "key_collection": return <Key className="h-5 w-5 text-cyan-500" />;
      default: return <Bell className="h-5 w-5 text-slate-400" />;
    }
  };
  
  return (
    <Layout>
      <PremiumPageContainer>
        <PremiumPageHeader
          title="Notifications"
          subtitle={unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "You're all caught up!"}
          icon={Bell}
          action={unreadCount > 0 ? {
            label: "Mark all as read",
            icon: CheckCheck,
            onClick: () => markAllAsReadMutation.mutate(),
          } : undefined}
        />
        
        <PremiumCard
          title="Filter Notifications"
          icon={Filter}
          className="mb-8"
          contentClassName="py-6"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="text-sm font-medium text-slate-500">Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="contract">Contracts</option>
                <option value="payment">Payments</option>
                <option value="maintenance">Maintenance</option>
                <option value="application">Applications</option>
                <option value="key_collection">Key Collections</option>
              </select>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 border-2 border-slate-200 dark:border-slate-800">
              {["all", "unread", "read"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilterRead(opt as any)}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-bold uppercase tracking-wider transition-all",
                    filterRead === opt 
                      ? "bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </PremiumCard>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 mx-auto mb-6 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <Bell className="h-10 w-10 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No notifications found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {filterType !== "all" || filterRead !== "all" 
                  ? "Try adjusting your filters to see more results."
                  : "We'll notify you when something important happens."}
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.isRead, notification.link)}
                className={cn(
                  "relative group bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 transition-all cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]",
                  notification.isRead 
                    ? "border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100" 
                    : "border-cyan-200 dark:border-cyan-800 bg-gradient-to-r from-white to-cyan-50/30 dark:from-slate-900 dark:to-cyan-900/10 shadow-md"
                )}
              >
                {!notification.isRead && (
                  <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse"></div>
                )}
                
                <div className="flex items-start gap-6">
                  <div className={cn(
                    "p-4 rounded-2xl transition-transform group-hover:scale-110",
                    notification.isRead 
                      ? "bg-slate-100 dark:bg-slate-800" 
                      : "bg-white dark:bg-slate-800 shadow-md ring-4 ring-cyan-50 dark:ring-cyan-900/20"
                  )}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3">
                        <PremiumStatusBadge 
                          status={notification.type.replace('_', ' ')} 
                          variant="secondary"
                          className="text-[10px] font-bold tracking-widest uppercase py-0.5 px-2"
                        />
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <h3 className={cn(
                      "font-bold text-lg leading-tight mb-2 pr-8",
                      notification.isRead ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"
                    )}>
                      {notification.title}
                    </h3>
                    
                    <p className={cn(
                      "text-sm leading-relaxed max-w-3xl",
                      notification.isRead ? "text-slate-500 dark:text-slate-400" : "text-slate-600 dark:text-slate-300"
                    )}>
                      {notification.message}
                    </p>
                    
                    <div className="mt-4 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsReadMutation.mutate({ notificationId: notification.id });
                          }}
                          className="text-xs font-bold text-slate-500 hover:text-cyan-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Mark as read
                        </button>
                      )}
                      {notification.link && (
                        <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 px-3 py-1.5">
                          View details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PremiumPageContainer>
    </Layout>
  );
}
