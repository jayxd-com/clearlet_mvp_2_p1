import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { 
  Home, 
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { MyHomePropertyCard } from "@/components/premium/MyHomePropertyCard";

export default function TenantMyHomePage() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Use the new plural query
  const { data: rentals, isLoading } = trpc.tenant.getAllActiveRentals.useQuery();

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading home...</div>;

  if (!rentals || rentals.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center shadow-md mt-8">
          <Home className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Active Tenancy</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            You don't have an active rental contract yet. Browse properties to find your new home and start your journey with ClearLet.
          </p>
          <Button onClick={() => setLocation("/tenant/listings")} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-cyan-500/20">
            Browse Properties
          </Button>
        </div>
      </div>
    );
  }

  // Show the grid of rentals
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 rounded-2xl p-8 mb-8 shadow-xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <LayoutGrid className="h-10 w-10" />
                My Homes
              </h1>
              <p className="text-lg text-purple-100">Select a property to manage</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rentals.map((rental) => (
            <MyHomePropertyCard 
              key={rental.id} 
              property={rental.property}
              showActions={false}
              onClickOverride={() => setLocation(`/tenant/my-home/${rental.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
