import { Bell, Clock, FileText, CheckCircle, AlertCircle, Key, ClipboardCheck } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

export function NotificationBell() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: unreadCount = 0, refetch: refetchUnread } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const { data: recentNotifications = [], refetch: refetchList } = trpc.notifications.list.useQuery(
    { isRead: false },
    { enabled: isOpen && isAuthenticated }
  );
  
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetchUnread();
      refetchList();
    }
  });
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);
  
  const handleNotificationClick = (notificationId: number, link?: string | null) => {
    markAsReadMutation.mutate({ notificationId });
    setIsOpen(false);
    if (link) {
      setLocation(link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "contract": return <FileText className="h-4 w-4 text-green-500" />;
      case "payment": return <Clock className="h-4 w-4 text-yellow-500" />;
      case "maintenance": return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "application": return <ClipboardCheck className="h-4 w-4 text-blue-500" />;
      case "key_collection": return <Key className="h-4 w-4 text-cyan-500" />;
      default: return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold border-2 border-white dark:border-slate-800">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50">
          <div className="p-4 border-b-2 border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Notifications</h3>
            <button
              onClick={() => {
                setIsOpen(false);
                const path = user?.role === "admin" 
                  ? "/admin/notifications" 
                  : user?.userType === "landlord" 
                    ? "/landlord/notifications" 
                    : "/tenant/notifications";
                setLocation(path);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors cursor-pointer font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-600 dark:text-slate-400 text-sm">
                No new notifications
              </div>
            ) : (
              recentNotifications.slice(0, 5).map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.link)}
                  className="w-full p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-medium">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => {
                setIsOpen(false);
                const path = user?.role === "admin" 
                  ? "/admin/notifications" 
                  : user?.userType === "landlord" 
                    ? "/landlord/notifications" 
                    : "/tenant/notifications";
                setLocation(path);
              }}
              className="w-full py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-cyan-400 dark:hover:text-cyan-400 transition-colors"
            >
              Check all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}