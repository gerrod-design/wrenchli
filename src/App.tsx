import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { VoiceChatProvider } from "@/contexts/VoiceChatContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomBar from "@/components/MobileBottomBar";
import BackToTop from "@/components/BackToTop";
import ChatBot from "@/components/ChatBot";
import SitePasswordGate from "@/components/SitePasswordGate";
import ScrollToTop from "@/components/ScrollToTop";

// Password gate disabled for public access
// function SitePasswordGateWrapper() {
//   return <SitePasswordGate><AppLayout /></SitePasswordGate>;
// }
import CookieConsent from "@/components/CookieConsent";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Owners from "./pages/Owners";
import Shops from "./pages/Shops";
import ForCarOwners from "./pages/ForCarOwners";
import ForShops from "./pages/ForShops";
import VehicleInsights from "./pages/VehicleInsights";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Garage from "./pages/Garage";
import Investors from "./pages/Investors";
import GetQuote from "./pages/GetQuote";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotificationSettings from "./pages/NotificationSettings";
import Developers from "./pages/Developers";
import CustomGPTGuide from "./pages/CustomGPTGuide";
import Pilot from "./pages/Pilot";
import FindShops from "./pages/FindShops";
import DamageDiagnosis from "./pages/DamageDiagnosis";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Accessibility from "./pages/Accessibility";
import FinancingOptions from "./pages/FinancingOptions";
import MILoanEligibility from "./pages/MILoanEligibility";
import MILoanApplication from "./pages/MILoanApplication";
import MILoanApproved from "./pages/MILoanApproved";
import MILoanDenied from "./pages/MILoanDenied";
import MIAffordableLoan from "./pages/MIAffordableLoan";
import DIYTutorials from "./pages/DIYTutorials";
import DIYTutorialDetail from "./pages/DIYTutorialDetail";
import ResetPassword from "./pages/ResetPassword";
import RepairGuide, { RepairGuidesIndex } from "./pages/RepairGuide";
import ReferralPackage from "./pages/ReferralPackage";
import FindNearbyShops from "./pages/FindNearbyShops";
import AgentDiagnosisFlow from "./pages/AgentDiagnosisFlow";
import ShopLogin from "./pages/ShopLogin";
import ShopPortal from "./pages/ShopPortal";
import DesignPreview from "./pages/DesignPreview";
import ForShopsPreview from "./pages/ForShopsPreview";
const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  const isAdmin =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/reset-password");
  const isDesignPreview = location.pathname === "/design-preview" || location.pathname.startsWith("/design-preview/");

  if (isAdmin) {
    return (
      <Routes location={location}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0.95, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/home" element={<Home />} />
          <Route path="/owners" element={<Owners />} />
          <Route path="/shops" element={<Shops />} />
          <Route path="/for-car-owners" element={<ForCarOwners />} />
          <Route path="/for-shops" element={<ForShops />} />
          <Route path="/vehicle-insights" element={<VehicleInsights />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/garage" element={<Garage />} />
          <Route path="/investors" element={<Investors />} />
          <Route path="/get-quote" element={<GetQuote />} />
          <Route path="/settings/notifications" element={<NotificationSettings />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/developers/gpt-actions" element={<CustomGPTGuide />} />
          <Route path="/pilot" element={<Pilot />} />
          <Route path="/find-shops" element={<FindShops />} />
          <Route path="/damage-diagnosis" element={<DamageDiagnosis />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/financing-options" element={<FinancingOptions />} />
          <Route path="/mi-affordable-loan" element={<MIAffordableLoan />} />
          <Route path="/mi-loan-eligibility" element={<MILoanEligibility />} />
          <Route path="/mi-loan-application" element={<MILoanApplication />} />
          <Route path="/mi-loan/approved" element={<MILoanApproved />} />
          <Route path="/mi-loan/denied" element={<MILoanDenied />} />
          <Route path="/diy" element={<DIYTutorials />} />
          <Route path="/diy/:slug" element={<DIYTutorialDetail />} />
          <Route path="/repairs" element={<RepairGuidesIndex />} />
          <Route path="/repairs/:slug" element={<RepairGuide />} />
          <Route path="/referral/:token" element={<ReferralPackage />} />
          <Route path="/find-nearby-shops" element={<FindNearbyShops />} />
          <Route path="/agent-diagnosis" element={<AgentDiagnosisFlow />} />
          <Route path="/shop-login" element={<ShopLogin />} />
          <Route path="/shop-portal" element={<ShopPortal />} />
          <Route path="/design-preview" element={<DesignPreview />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppLayout() {
  const location = useLocation();
  const isAdmin =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/reset-password");
  const isDesignPreview = location.pathname === "/design-preview";
  const hideChrome = isAdmin || isDesignPreview;

  useEffect(() => {
    import("@/lib/analytics").then(({ trackPagePerformance }) => {
      trackPagePerformance();
    });
  }, []);

  return (
    <>
      <ScrollToTop />
      {!hideChrome && <Navbar />}
      <AnimatedRoutes />
      {!hideChrome && <Footer />}
      {!hideChrome && <MobileBottomBar />}
      {!hideChrome && <BackToTop />}
      {!isAdmin && <ChatBot />}
      {!hideChrome && <CookieConsent />}
    </>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <LocationProvider>
            <VoiceChatProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppLayout />
              </BrowserRouter>
            </VoiceChatProvider>
          </LocationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
