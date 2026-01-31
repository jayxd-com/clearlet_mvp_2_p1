import { ViewingManagementDashboard } from "@/components/ViewingManagementDashboard";

export default function LandlordViewingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <ViewingManagementDashboard />
      </div>
    </div>
  );
}
