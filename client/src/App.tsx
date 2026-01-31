import {Route, Switch} from "wouter";
import Home from "./pages/Home";
import ForLandlordsPage from "./pages/ForLandlords";
import ForTenantsPage from "./pages/ForTenants";
import FeaturesPage from "./pages/Features";
import AboutPage from "./pages/About";
import PricingPage from "./pages/Pricing";
import FAQPage from "./pages/FAQ";
import ContactPage from "./pages/Contact";
import TrustAndSafetyPage from "./pages/TrustAndSafety";
import ComparePropertiesPage from "./pages/tenant/compare";
import MarketplacePage from "./pages/Marketplace";
import WalletPage from "./pages/Wallet";
import SignInPage from "./pages/auth/SignIn";

import NotFound from "./pages/NotFound";

// Landlord Pages
import SignUpPage from "./pages/auth/SignUp";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagementDashboard from "./pages/admin/user-management";
import AdminCRMPage from "./pages/admin/crm";
import SalesFunnelPage from "./pages/admin/sales-funnel";
import AdminAnalyticsPage from "./pages/admin/analytics";
import RolesPermissionsPage from "./pages/admin/roles-permissions";
import AdminUsersPage from "./pages/admin/admin-users";
import AdminDocumentsPage from "./pages/admin/documents";
import AdminPropertiesPage from "./pages/admin/properties";
import AuditLogsPage from "./pages/admin/audit-logs";
import LandlordDashboard from "./pages/landlord/Dashboard";
import LandlordPropertiesPage from "./pages/landlord/properties";
import LandlordPropertyDetailPage from "./pages/landlord/property-detail";
import LandlordApplicationsPage from "./pages/landlord/applications";
import LandlordApplicationDetailPage from "./pages/landlord/application-detail";
import CreateListingPage from "./pages/landlord/create-listing";
import EditPropertyPage from "./pages/landlord/edit-property";
import ContractEditorPage from "./pages/landlord/contract-editor";
import ContractTemplatesPage from "./pages/landlord/contract-templates";
import CreateContractTemplatePage from "./pages/landlord/create-contract-template";
import ChecklistTemplatesPage from "./pages/landlord/checklist-templates";
import LandlordChecklistPage from "./pages/landlord/checklist";
import MessageTemplatesPage from "./pages/landlord/message-templates";
import LandlordContractsPage from "./pages/landlord/contracts";
import LandlordViewingsPage from "./pages/landlord/viewings";
import LandlordKeysPage from "./pages/landlord/keys";
import LandlordMaintenancePage from "./pages/landlord/maintenance";
import LandlordEarningsPage from "./pages/landlord/earnings";
import TenantDashboard from "./pages/tenant/Dashboard";
import TenantViewingsPage from "./pages/tenant/viewings";

import ListingsPage from "./pages/tenant/listings";
import SavedPropertiesPage from "./pages/tenant/saved-properties"; // Import SavedPropertiesPage
import ListingDetailPage from "./pages/tenant/listing-detail";
import TenantApplicationsPage from "./pages/tenant/applications"; // Import TenantApplicationsPage
import TenantDocumentsPage from "./pages/tenant/documents"; // Import TenantDocumentsPage
import TenantPaymentsPage from "./pages/tenant/payments"; // Import TenantPaymentsPage
import TenantContractsPage from "./pages/tenant/contracts"; // Import TenantContractsPage
import MessagesPage from "./pages/Messages"; // Import shared MessagesPage
import TenantKeysPage from "./pages/tenant/keys"; // Import TenantKeysPage
import TenantInformationRequestsPage from "./pages/tenant/information-requests"; // Import TenantInformationRequestsPage
import TenantMaintenancePage from "./pages/tenant/maintenance"; // Import TenantMaintenancePage
import MoveInChecklistPage from "./pages/tenant/checklist"; // Import MoveInChecklistPage
import TenantMyHomePage from "./pages/tenant/my-home"; // Import TenantMyHomePage
import TenantMyHomeDetailPage from "./pages/tenant/my-home-detail"; // Import TenantMyHomeDetailPage
import ProfileSettingsPage from "./pages/profile/settings"; // Import ProfileSettingsPage
import NotificationsPage from "./pages/notifications"; // Import NotificationsPage
import TenantNotificationsPage from "./pages/tenant/notifications";
import LandlordNotificationsPage from "./pages/landlord/notifications";
import AdminNotificationsPage from "./pages/admin/notifications";
// import ApplyForPropertyPage from "./pages/apply-for-property"; // Removed old import
import ApplicationPage from "./pages/tenant/application/apply"; // Import new ApplicationPage
import {Navbar} from "./components/Navbar";
import {Footer} from "./components/Footer";
import ChatbotWidget from "./components/ChatbotWidget";
import ScrollToTop from "./components/ScrollToTop";
import {Toaster} from "@/components/ui/sonner";
import {TenantLayout} from "@/components/TenantLayout";
import {LandlordLayout} from "@/components/LandlordLayout";
import {AdminLayout} from "@/components/AdminLayout";
import { useLocation } from "wouter";
import { RedirectToRoleSettings } from "./components/RedirectToRoleSettings";
import { useAuth } from "@/hooks/useAuth";

function App() {
    const [location] = useLocation();
    const { isAuthenticated, loading } = useAuth();
    
    // Hide footer on dashboard/management pages
    const isDashboardPage = location.startsWith("/tenant") || 
                           location.startsWith("/landlord") || 
                           location.startsWith("/admin") || 
                           location.startsWith("/profile") ||
                           location === "/dashboard";

  return (
        <div className="flex flex-col min-h-screen">
            <Navbar/>
            <main className="flex-grow">
                <ScrollToTop />
                <Switch>
                    <Route path="/" component={Home}/>
                    <Route path="/for-landlords" component={ForLandlordsPage}/>
                    <Route path="/for-tenants" component={ForTenantsPage}/>
                    <Route path="/features" component={FeaturesPage}/>
                    <Route path="/about" component={AboutPage}/>
                    <Route path="/pricing" component={PricingPage}/>
                    <Route path="/faq" component={FAQPage}/>
                    <Route path="/contact" component={ContactPage}/>
                    <Route path="/trust-and-safety" component={TrustAndSafetyPage}/>
                    <Route path="/marketplace" component={MarketplacePage}/>
                    <Route path="/listings" component={ListingsPage}/>
                    <Route path="/search" component={ListingsPage}/>
                    <Route path="/property/:id" component={ListingDetailPage}/>
                    <Route path="/tenant/wallet">
                        <TenantLayout>
                            <WalletPage />
                        </TenantLayout>
                    </Route>
                    <Route path="/landlord/wallet">
                        <LandlordLayout>
                            <WalletPage />
                        </LandlordLayout>
                    </Route>
                    <Route path="/signin" component={SignInPage}/>
                    <Route path="/signup" component={SignUpPage}/>

                    {/* Generic Dashboard (Router) */}
                    <Route path="/dashboard" component={Dashboard}/>

                    {/* Role-specific Dashboards */}
                    <Route path="/admin/dashboard">
                        <AdminLayout>
                            <AdminDashboard/>
                        </AdminLayout>
                    </Route>
                    <Route path="/admin/admin-users">
                        <AdminLayout>
                            <AdminUsersPage/>
                        </AdminLayout>
                    </Route>
                    <Route path="/admin/roles">
                        <AdminLayout>
                            <RolesPermissionsPage/>
                        </AdminLayout>
                    </Route>
                    <Route path="/admin/users">
                        <AdminLayout>
                            <UserManagementDashboard/>
                        </AdminLayout>
                    </Route>
                    <Route path="/admin/crm">
                        <AdminLayout>
                            <AdminCRMPage/>
                        </AdminLayout>
                    </Route>
                    <Route path="/admin/sales-funnel">
                        <AdminLayout>
                            <SalesFunnelPage/>
                        </AdminLayout>
                    </Route>
                    <Route path="/admin/analytics">
                        <AdminLayout>
                            <AdminAnalyticsPage/>
                        </AdminLayout>
                    </Route>
                    <Route path="/admin/documents">
                        <AdminLayout>
                            <AdminDocumentsPage/>
                        </AdminLayout>
                    </Route>
                    <Route path="/admin/properties">
                        <AdminLayout>
                            <AdminPropertiesPage/>
                        </AdminLayout>
                    </Route>
                    <Route path="/admin/audit-logs">
                        <AdminLayout>
                            <AuditLogsPage/>
                        </AdminLayout>
                    </Route>
                    <Route path="/admin/notifications">
                        <AdminLayout>
                            <AdminNotificationsPage/>
                        </AdminLayout>
                    </Route>
                    <Route path="/landlord/dashboard">
                        <LandlordLayout>
                            <LandlordDashboard/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/properties">
                        <LandlordLayout>
                            <LandlordPropertiesPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/properties/:id">
                        <LandlordLayout>
                            <LandlordPropertyDetailPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/create-listing">
                        <LandlordLayout>
                            <CreateListingPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/edit-property/:id">
                        <LandlordLayout>
                            <EditPropertyPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/applications">
                        <LandlordLayout>
                            <LandlordApplicationsPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/applications/:id">
                        <LandlordLayout>
                            <LandlordApplicationDetailPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/checklist/:contractId">
                        <LandlordLayout>
                            <LandlordChecklistPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/contracts">
                        <LandlordLayout>
                            <LandlordContractsPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/contract/:id/edit">
                        <LandlordLayout>
                            <ContractEditorPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/contract-templates">
                        <LandlordLayout>
                            <ContractTemplatesPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/contract-templates/create">
                        <LandlordLayout>
                            <CreateContractTemplatePage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/contract-templates/edit/:id">
                        <LandlordLayout>
                            <CreateContractTemplatePage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/checklist-templates">
                        <LandlordLayout>
                            <ChecklistTemplatesPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/message-templates">
                        <LandlordLayout>
                            <MessageTemplatesPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/messages">
                        <LandlordLayout>
                            <MessagesPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/viewings">
                        <LandlordLayout>
                            <LandlordViewingsPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/keys">
                        <LandlordLayout>
                            <LandlordKeysPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/maintenance">
                        <LandlordLayout>
                            <LandlordMaintenancePage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/earnings">
                        <LandlordLayout>
                            <LandlordEarningsPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/landlord/notifications">
                        <LandlordLayout>
                            <LandlordNotificationsPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/tenant/compare">
                        <TenantLayout>
                            <ComparePropertiesPage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/dashboard">
                        <TenantLayout>
                            <TenantDashboard/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/my-home">
                        <TenantLayout>
                            <TenantMyHomePage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/my-home/:contractId">
                        <TenantLayout>
                            <TenantMyHomeDetailPage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/viewings">
                        <TenantLayout>
                            <TenantViewingsPage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/listings">
                        <TenantLayout>
                            <ListingsPage/>
                        </TenantLayout>
                    </Route>
                  <Route path="/tenant/listings/:id">
                    <TenantLayout>
                      <ListingDetailPage/>
                    </TenantLayout>
                  </Route>
                  <Route path="/tenant/applications">
                    <TenantLayout>
                      <TenantApplicationsPage/>
                    </TenantLayout>
                  </Route>
                    {/*<Route path="/tenant/listings/:id" component={ListingDetailPage}/>*/}
                    {/*<Route path="/tenant/applications" component={TenantApplicationsPage}/>*/}
                    <Route path="/tenant/documents">
                        <TenantLayout>
                            <TenantDocumentsPage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/payments">
                        <TenantLayout>
                            <TenantPaymentsPage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/contracts">
                        <TenantLayout>
                            <TenantContractsPage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/messages">
                        <TenantLayout>
                            <MessagesPage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/keys">
                        <TenantLayout>
                            <TenantKeysPage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/information-requests">
                        <TenantLayout>
                            <TenantInformationRequestsPage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/maintenance">
                        <TenantLayout>
                            <TenantMaintenancePage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/checklist/:contractId">
                        <TenantLayout>
                            <MoveInChecklistPage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/tenant/settings">
                        <TenantLayout>
                            <ProfileSettingsPage/>
                        </TenantLayout>
                    </Route>
                    <Route path="/landlord/settings">
                        <LandlordLayout>
                            <ProfileSettingsPage/>
                        </LandlordLayout>
                    </Route>
                    <Route path="/admin/settings">
                        <AdminLayout>
                            <ProfileSettingsPage/>
                        </AdminLayout>
                    </Route>
                    <Route path="/profile/settings" component={RedirectToRoleSettings}/>
                    <Route path="/notifications" component={NotificationsPage}/> {/* Kept as fallback/redirect? Or should strictly remove? Keeping for safety for now but won't be used by dashboards */}
                    <Route path="/tenant/notifications">
                        <TenantLayout>
                            <TenantNotificationsPage/>
                        </TenantLayout>
                    </Route>
                    {/* <Route path="/apply-for-property/:id" component={ApplyForPropertyPage} /> Removed old route */}
                    <Route path="/tenant/application/apply/:id" component={ApplicationPage}/> {/* New route */}
                    <Route path="/tenant/saved-properties">
                        <TenantLayout>
                            <SavedPropertiesPage/>
                        </TenantLayout>
                    </Route>
                    <Route component={NotFound} />
                </Switch>
            </main>
            {!isDashboardPage && <Footer/>}
            {!loading && <ChatbotWidget/>}
            <Toaster position="top-right" />
        </div>
    );
}

export default App;
