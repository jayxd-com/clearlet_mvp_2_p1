import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Sun,
  Moon,
  Settings,
  Languages,
  Wallet,
  ShoppingBag,
  User,
  ShieldCheck,
  ChevronRight,
  Badge
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationBell } from "./NotificationBell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DashboardSidebar } from "./DashboardSidebar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {Label} from "@/components/ui/label";

export function Navbar() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLangConfirmOpen, setIsLangConfirmOpen] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<"en" | "es" | null>(null);

  const updateLanguageMutation = trpc.profile.updateLanguage.useMutation({
    onSuccess: () => {
      if (pendingLanguage) {
        setLanguage(pendingLanguage);
        toast.success(t("preferredLanguageChanged"));
      }
      setIsLangConfirmOpen(false);
      setPendingLanguage(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update language preference");
      setIsLangConfirmOpen(false);
      setPendingLanguage(null);
    }
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleLanguageChange = (value: string) => {
    const newLang = value as "en" | "es";
    if (newLang === language) return;

    if (isAuthenticated) {
      setPendingLanguage(newLang);
      setIsLangConfirmOpen(true);
    } else {
      setLanguage(newLang);
      toast.success(t("languageChanged"));
    }
  };

  const confirmLanguageChange = () => {
    if (pendingLanguage) {
      updateLanguageMutation.mutate({ language: pendingLanguage });
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 backdrop-blur shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">

          {/* Mobile Left: Sidebar Trigger (Only for Dashboard routes) */}
          <div className="flex lg:hidden items-center flex-1">
            {isAuthenticated && (user?.userType === 'landlord' || user?.userType === 'tenant' || user?.role === 'admin') && (
              <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" className="hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl active:scale-90 transition-all h-10 w-10 p-0 flex items-center justify-center">
                    <Menu 
                      size={32} 
                      className="text-slate-700 dark:text-slate-200 !size-8" 
                      strokeWidth={2.5} 
                    />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 border-none">
                  <DashboardSidebar
                    userType={user.userType === 'admin' || user.role === 'admin' ? 'admin' : user.userType as any}
                    onItemClick={() => setIsMobileSidebarOpen(false)}
                    className="w-full h-full"
                  />
                </SheetContent>
              </Sheet>
            )}
          </div>

          {/* Logo: Center on mobile, Left on desktop */}
          <div className={cn(
            "flex items-center",
            "absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 lg:flex-none"
          )}>
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/clearlet-logo.png"
                alt="ClearLet"
                className="h-8 md:h-9 w-auto object-contain"
              />
            </button>
          </div>

          {/* Desktop Navigation - Center Links (Public) */}
          {!isAuthenticated && (
            <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              <button onClick={() => setLocation("/")} className="text-slate-600 dark:text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium cursor-pointer">{t("home")}</button>
              <button onClick={() => setLocation("/for-tenants")} className="text-slate-600 dark:text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium cursor-pointer">{t("forTenants")}</button>
              <button onClick={() => setLocation("/for-landlords")} className="text-slate-600 dark:text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium cursor-pointer">{t("forLandlords")}</button>
              <button onClick={() => setLocation("/features")} className="text-slate-600 dark:text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium cursor-pointer">{t("features")}</button>
              <button onClick={() => setLocation("/pricing")} className="text-slate-600 dark:text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium cursor-pointer">Pricing</button>
              <button onClick={() => setLocation("/about")} className="text-slate-600 dark:text-slate-400 hover:text-cyan-400 transition-colors text-sm font-medium cursor-pointer">{t("about")}</button>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center justify-end gap-2 md:gap-4 flex-1">

            {/* Desktop-only Controls (Always separate on Desktop) */}
            <div className="hidden lg:flex items-center gap-4">
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-[120px] h-9 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2">
                  <SelectItem value="en" className="font-bold">English</SelectItem>
                  <SelectItem value="es" className="font-bold">Español</SelectItem>
                </SelectContent>
              </Select>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {isAuthenticated && <NotificationBell />}
            </div>

            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-1 h-auto hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-2 group">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="hidden md:block text-left mr-1">
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1">{user.name || user.email.split('@')[0]}</p>
                      <p className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-tight leading-none">
                        {user.userType || user.role}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-data-[state=open]:rotate-90 transition-transform hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-2">
                  <DropdownMenuLabel className="px-4 py-3">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{user.name || "User"}</p>
                    <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

                  {/* Dashboard Links (Mobile only) */}
                  <div className="lg:hidden">
                    <DropdownMenuItem onClick={() => setLocation(`/${(user.userType === 'admin' || user.role === 'admin') ? 'admin' : user.userType}/settings`)} className="rounded-xl px-4 py-3 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                      <Settings className="h-4 w-4 mr-3 text-slate-400" /> {t("settings")}
                    </DropdownMenuItem>
                    {(user.userType === "tenant" || user.userType === "landlord") && (
                      <DropdownMenuItem onClick={() => setLocation(user.userType === "landlord" ? "/landlord/wallet" : "/tenant/wallet")} className="rounded-xl px-4 py-3 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                        <Wallet className="h-4 w-4 mr-3 text-cyan-500" /> Wallet
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                  </div>

                  {/* Settings - Desktop visible inside menu too */}
                  <div className="hidden lg:block">
                    <DropdownMenuItem onClick={() => setLocation(`/${(user.userType === 'admin' || user.role === 'admin') ? 'admin' : user.userType}/settings`)} className="rounded-xl px-4 py-3 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                      <Settings className="h-4 w-4 mr-3 text-slate-400" /> Account Settings
                    </DropdownMenuItem>
                  </div>

                  {/* Theme Toggle Item (Mobile focus) */}
                  <DropdownMenuItem
                    onSelect={(e) => { e.preventDefault(); toggleTheme(); }}
                    className="rounded-xl px-4 py-3 cursor-pointer font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      {theme === 'dark' ? <Moon className="h-4 w-4 mr-3 text-blue-400" /> : <Sun className="h-4 w-4 mr-3 text-yellow-500" />}
                      Dark Mode
                    </div>
                    <Switch checked={theme === 'dark'} />
                  </DropdownMenuItem>

                  {/* Language Selector (Mobile focus) */}
                  <div className="px-4 py-3 space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Languages className="h-3 w-3" />
                      Language
                    </Label>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="h-10 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        <SelectItem value="en" className="font-bold">English</SelectItem>
                        <SelectItem value="es" className="font-bold">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl px-4 py-3 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20 font-bold text-red-600">
                    <LogOut className="h-4 w-4 mr-3" /> {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => setLocation("/signin")} className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors text-sm font-medium cursor-pointer">{t("signIn")}</button>
                <button onClick={() => setLocation("/signup")} className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-black uppercase text-xs tracking-widest transition-all shadow-md active:scale-95 cursor-pointer">Sign Up</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Language Change Confirmation */}
      <AlertDialog open={isLangConfirmOpen} onOpenChange={setIsLangConfirmOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t("changeLanguageTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400 font-medium">{t("changeLanguageDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLanguageChange} disabled={updateLanguageMutation.isPending} className="bg-cyan-600 hover:bg-cyan-700 text-white font-black uppercase tracking-widest rounded-xl px-8">
              {updateLanguageMutation.isPending ? t("saving") : t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}
