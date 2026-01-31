import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { 
  LayoutDashboard, 
  Home,
  Building2, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  FileSignature,
  Wrench,
  DollarSign,
  Heart,
  FolderOpen,
  CreditCard,
  Users,
  ClipboardList,
  Settings,
  ShieldCheck,
  MessageCircle,
  Wallet,
  ShoppingBag,
  Key,
  Plus,
  Calendar
} from "lucide-react";

interface SidebarItem {
  icon: any;
  labelKey: string;
  path: string;
  category?: string;
}

interface SidebarItemWithLabel extends SidebarItem {
  label: string;
}

interface DashboardSidebarProps {
  userType: "landlord" | "tenant" | "admin" | "clearbnb_host" | "agency";
  onItemClick?: () => void;
  className?: string;
}

const landlordItems: SidebarItem[] = [
  { icon: LayoutDashboard, labelKey: "sidebar.landlord.dashboard", path: "/landlord/dashboard", category: "General" },
  // { icon: ShoppingBag, labelKey: "marketplaceTitle", path: "/marketplace" }, // Disabled for Phase 1
  { icon: Building2, labelKey: "sidebar.landlord.properties", path: "/landlord/properties", category: "Assets" },
  { icon: FileText, labelKey: "sidebar.landlord.applications", path: "/landlord/applications", category: "Management" },
  { icon: FileSignature, labelKey: "sidebar.landlord.contracts", path: "/landlord/contracts", category: "Management" },
  { icon: Calendar, labelKey: "sidebar.landlord.viewings", path: "/landlord/viewings", category: "Management" },
  { icon: Key, labelKey: "sidebar.landlord.keyManagement", path: "/landlord/keys", category: "Management" },
  { icon: Wrench, labelKey: "sidebar.landlord.maintenance", path: "/landlord/maintenance", category: "Management" },
  { icon: MessageSquare, labelKey: "sidebar.landlord.messages", path: "/landlord/messages", category: "Communication" },
  // { icon: MessageCircle, labelKey: "sidebar.landlord.messageTemplates", path: "/landlord/message-templates", category: "Communication" },
  { icon: FileText, labelKey: "sidebar.landlord.contractTemplates", path: "/landlord/contract-templates", category: "Tools" },
  { icon: ClipboardList, labelKey: "sidebar.landlord.checklistTemplates", path: "/landlord/checklist-templates", category: "Tools" },
  { icon: DollarSign, labelKey: "sidebar.landlord.earnings", path: "/landlord/earnings", category: "Finance" },
  { icon: Wallet, labelKey: "walletTitle", path: "/landlord/wallet", category: "Finance" },
];

const tenantItems: SidebarItem[] = [
  { icon: LayoutDashboard, labelKey: "sidebar.tenant.dashboard", path: "/tenant/dashboard", category: "General" },
  // { icon: ShoppingBag, labelKey: "marketplaceTitle", path: "/marketplace" }, // Disabled for Phase 1
  { icon: Home, labelKey: "sidebar.tenant.myHome", path: "/tenant/my-home", category: "My Living" },
  { icon: Building2, labelKey: "sidebar.tenant.browseProperties", path: "/tenant/listings", category: "Search" }, 
  { icon: Heart, labelKey: "sidebar.tenant.savedProperties", path: "/tenant/saved-properties", category: "Search" }, 
  { icon: FileText, labelKey: "sidebar.tenant.myApplications", path: "/tenant/applications", category: "Process" },
  { icon: Calendar, labelKey: "sidebar.tenant.viewings", path: "/tenant/viewings", category: "Process" },
  { icon: FileSignature, labelKey: "sidebar.tenant.contracts", path: "/tenant/contracts", category: "Process" },
  { icon: FolderOpen, labelKey: "sidebar.tenant.documents", path: "/tenant/documents", category: "Process" },
  { icon: MessageSquare, labelKey: "sidebar.tenant.messages", path: "/tenant/messages", category: "Communication" },
  { icon: Key, labelKey: "sidebar.tenant.keyManagement", path: "/tenant/keys", category: "Services" },
  { icon: CreditCard, labelKey: "sidebar.tenant.payments", path: "/tenant/payments", category: "Finance" },
  { icon: Wallet, labelKey: "walletTitle", path: "/tenant/wallet", category: "Finance" },
];

const adminItems: SidebarItem[] = [
  { icon: LayoutDashboard, labelKey: "sidebar.admin.dashboard", path: "/admin/dashboard", category: "General" },
  { icon: Users, labelKey: "sidebar.admin.crm", path: "/admin/crm", category: "Management" },
  { icon: Users, labelKey: "sidebar.admin.userManagement", path: "/admin/users", category: "Management" },
  { icon: Building2, labelKey: "sidebar.admin.properties", path: "/admin/properties", category: "Management" },
  { icon: ShieldCheck, labelKey: "sidebar.admin.adminUsers", path: "/admin/admin-users", category: "Management" },
  { icon: Settings, labelKey: "sidebar.admin.roles", path: "/admin/roles", category: "Management" },
  { icon: MessageSquare, labelKey: "sidebar.admin.salesFunnel", path: "/admin/sales-funnel", category: "Growth" },
  { icon: BarChart3, labelKey: "sidebar.admin.analytics", path: "/admin/analytics", category: "Growth" },
  { icon: FolderOpen, labelKey: "sidebar.admin.documents", path: "/admin/documents", category: "Compliance" },
  { icon: ClipboardList, labelKey: "sidebar.admin.audit-logs", path: "/admin/audit-logs", category: "System" },
];

const clearbnbHostItems: SidebarItem[] = [
  { icon: LayoutDashboard, labelKey: "sidebar.clearbnb.dashboard", path: "/clearbnb/host", category: "General" },
  { icon: Building2, labelKey: "sidebar.clearbnb.properties", path: "/clearbnb/properties", category: "Assets" },
  { icon: Plus, labelKey: "sidebar.clearbnb.addProperty", path: "/clearbnb/host/create-property", category: "Assets" },
  { icon: FileText, labelKey: "sidebar.clearbnb.manageBookings", path: "/clearbnb/host/bookings", category: "Operations" },
  { icon: ClipboardList, labelKey: "sidebar.clearbnb.calendar", path: "/clearbnb/calendar", category: "Operations" },
  { icon: Wrench, labelKey: "sidebar.clearbnb.cleaningSchedule", path: "/clearbnb/cleaning", category: "Operations" },
  { icon: MessageSquare, labelKey: "sidebar.clearbnb.messages", path: "/clearbnb/messages", category: "Communication" },
  { icon: BarChart3, labelKey: "sidebar.clearbnb.analytics", path: "/clearbnb/analytics", category: "Insights" },
  { icon: DollarSign, labelKey: "sidebar.clearbnb.earnings", path: "/clearbnb/earnings", category: "Finance" },
];

const agencyItems: SidebarItem[] = [
  { icon: LayoutDashboard, labelKey: "sidebar.agency.dashboard", path: "/agency/dashboard", category: "General" },
  { icon: Building2, labelKey: "sidebar.agency.properties", path: "/agency/properties", category: "Portfolio" },
  { icon: Users, labelKey: "sidebar.agency.clients", path: "/agency/clients", category: "Relations" },
  { icon: Users, labelKey: "sidebar.agency.team", path: "/agency/team", category: "Agency" },
  { icon: FileText, labelKey: "sidebar.agency.applications", path: "/agency/applications", category: "Process" },
  { icon: FileSignature, labelKey: "sidebar.agency.contracts", path: "/agency/contracts", category: "Process" },
  { icon: MessageSquare, labelKey: "sidebar.agency.messages", path: "/agency/messages", category: "Communication" },
  { icon: DollarSign, labelKey: "sidebar.agency.commissions", path: "/agency/commissions", category: "Finance" },
  { icon: BarChart3, labelKey: "sidebar.agency.analytics", path: "/agency/analytics", category: "Insights" },
];

export function DashboardSidebar({ userType, onItemClick, className }: DashboardSidebarProps) {
  const [location] = useLocation();
  const { t } = useLanguage();
  
  const { data: unreadMessagesCount } = trpc.messages.getUnreadCount.useQuery(undefined, { 
    refetchInterval: 10000 
  });
  
  // Get base items
  let baseItems = userType === "landlord" 
    ? landlordItems 
    : userType === "tenant" 
    ? tenantItems 
    : userType === "clearbnb_host"
    ? clearbnbHostItems
    : userType === "agency"
    ? agencyItems
    : adminItems;

  // Map items with translated labels
  const items: SidebarItemWithLabel[] = baseItems.map(item => ({
    ...item,
    label: t(item.labelKey as any) || item.labelKey.split('.').pop() || item.labelKey,
  }));

  return (
    <div className={cn(
      "w-64 bg-white dark:bg-slate-800 border-r-2 border-slate-200 dark:border-slate-700 flex flex-col h-[calc(100vh-4rem)] sticky top-16 shadow-lg",
      className
    )}>
      {/* Logo/Header */}
      <div className="p-6 border-b-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <img 
              src="/clearlet-icon.png" 
              alt="ClearLet" 
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">ClearLet</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{userType}</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isActive = location === item.path || location.startsWith(item.path + "/");
          const prevItem = items[index - 1];
          const showCategory = item.category && (!prevItem || prevItem.category !== item.category);
          const isMessages = item.path.includes("/messages");
          
          return (
            <div key={item.path}>
              {showCategory && (
                <p className="px-4 mt-6 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {item.category}
                </p>
              )}
              <Link
                href={item.path}
                onClick={onItemClick}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all cursor-pointer mb-1",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4",
                  isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
                )} />
                <span className="text-sm">{item.label}</span>
                {isMessages && !!unreadMessagesCount && unreadMessagesCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadMessagesCount}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t-2 border-slate-200 dark:border-slate-700">
        <Link
          href={`/${userType === "agency" ? "agency" : userType === "clearbnb_host" ? "clearbnb" : userType}/settings`}
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer",
            location.includes("/settings")
              ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
          )}
        >
          <Settings className={cn(
            "h-5 w-5",
            location.includes("/settings")
              ? "text-white"
              : "text-slate-500 dark:text-slate-400"
          )} />
          <span className="font-medium">{t("settings")}</span>
        </Link>
      </div>
    </div>
  );
}
