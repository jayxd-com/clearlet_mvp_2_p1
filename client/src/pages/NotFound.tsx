import { Link } from "wouter";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PremiumButton } from "@/components/premium/PremiumButton";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="text-center space-y-6 max-w-md mx-auto">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-12 h-12 text-red-500 dark:text-red-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {t("pageNotFound")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {t("pageNotFoundDesc")}
          </p>
        </div>

        <div className="pt-4">
          <Link href="/">
            <PremiumButton className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("goHome")}
            </PremiumButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
