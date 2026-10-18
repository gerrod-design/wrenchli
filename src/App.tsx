import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
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
import ScrollToTop from "@/components/ScrollToTop";

import CookieConsent from "@/components/CookieConsent";
// Index page replaced by DesignPreview promotion
import Home from "./pages/Home";
import Owners from "./pages/Owners";
import Shops from "./pages/Shops";
import ForCarOwners from "./pages/ForCarOwners";
import ForShops from "./pages/ForShops";
import ForDealers from "./pages/ForDealers";
import VehicleInsights from "./pages/VehicleInsights";
import About from "./pages/About";
import PartnersJourney from "./pages/PartnersJourney";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Garage from "./pages/Garage";
import VehicleRecord from "./pages/VehicleRecord";
import VehicleBaseline from "./pages/VehicleBaseline";
import Investors from "./pages/Investors";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAudit from "./pages/AdminAudit";
import AdminDigestSpec from "./pages/AdminDigestSpec";
import NotificationSettings from "./pages/NotificationSettings";
import Developers from "./pages/Developers";
import CustomGPTGuide from "./pages/CustomGPTGuide";
import FindShops from "./pages/FindShops";
import DamageDiagnosis from "./pages/DamageDiagnosis";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Accessibility from "./pages/Accessibility";
import FinancingOptions from "./pages/FinancingOptions";
// MI Affordable Loan pages disabled per Financial Services 7-Gate Protocol
// (no financing copy live until all gates close). Routes redirect to /financing-options.
import DIYTutorials from "./pages/DIYTutorials";
import DIYTutorialDetail from "./pages/DIYTutorialDetail";
import ResetPassword from "./pages/ResetPassword";
import RepairGuide, { RepairGuidesIndex } from "./pages/RepairGuide";
import ReferralPackage from "./pages/ReferralPackage";
import FindNearbyShops from "./pages/FindNearbyShops";
import DesignPreview from "./pages/DesignPreview";
import ForShopsPreview from "./pages/ForShopsPreview";
import ShopOnboardingPreview from "./pages/ShopOnboardingPreview";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import WarrantyGuide from "./pages/WarrantyGuide";
import Subprocessors from "./pages/Subprocessors";
import VerifiedScore from "./pages/VerifiedScore";
const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  const isAdmin =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/reset-password");
  const isDesignPreview = location.pathname === "/" || location.pathname.startsWith("/design-preview/");

  if (isAdmin) {
    return (
      <Routes location={location}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/audit" element={<ProtectedRoute><AdminAudit /></ProtectedRoute>} />
        <Route path="/admin/digest-spec" element={<ProtectedRoute><AdminDigestSpec /></ProtectedRoute>} />
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
          <Route path="/" element={<DesignPreview />} />
          <Route path="/home" element={<Home />} />
          <Route path="/owners" element={<Owners />} />
          <Route path="/shops" element={<Shops />} />
          <Route path="/for-car-owners" element={<ForCarOwners />} />
          <Route path="/for-shops" element={<ForShops />} />
          <Route path="/for-dealers" element={<ForDealers />} />
          <Route path="/vehicle-insights" element={<VehicleInsights />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/garage" element={<Garage />} />
          <Route path="/garage/vehicles/:vehicleId" element={<VehicleRecord />} />
          <Route path="/garage/vehicles/:vehicleId/baseline" element={<VehicleBaseline />} />
          <Route path="/partners/journey" element={<PartnersJourney />} />
          <Route path="/investors" element={<Investors />} />
          {/* Paused 2026-09-17: shop quote requests imply partner shops that don't exist — not offered */}
          <Route path="/get-quote" element={<PreserveNavigate to="/#quote" />} />
          <Route path="/settings/notifications" element={<NotificationSettings />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/developers/gpt-actions" element={<CustomGPTGuide />} />
          {/* Retired 2026-10-18 (audit R-19): the Michigan-only paid pilot page contradicted the live national free referral pilot — one offer only, at /for-shops */}
          <Route path="/pilot" element={<PreserveNavigate to="/for-shops" />} />
          <Route path="/find-shops" element={<FindShops />} />
          <Route path="/damage-assessment" element={<DamageDiagnosis />} />
          <Route path="/damage-diagnosis" element={<PreserveNavigate to="/damage-assessment" />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/financing-options" element={<FinancingOptions />} />
          <Route path="/mi-affordable-loan" element={<PreserveNavigate to="/financing-options" />} />
          <Route path="/mi-loan-eligibility" element={<PreserveNavigate to="/financing-options" />} />
          <Route path="/mi-loan-application" element={<PreserveNavigate to="/financing-options" />} />
          <Route path="/mi-loan/approved" element={<PreserveNavigate to="/financing-options" />} />
          <Route path="/mi-loan/denied" element={<PreserveNavigate to="/financing-options" />} />
          <Route path="/diy" element={<DIYTutorials />} />
          <Route path="/diy/:slug" element={<DIYTutorialDetail />} />
          <Route path="/repairs" element={<RepairGuidesIndex />} />
          <Route path="/repairs/:slug" element={<RepairGuide />} />
          <Route path="/referral/:token" element={<ReferralPackage />} />
          <Route path="/find-nearby-shops" element={<FindNearbyShops />} />
          {/* Paused 2026-09-17: experimental agent booking flow with shop selection — not offered */}
          <Route path="/agent-diagnosis" element={<PreserveNavigate to="/" />} />
          {/* Shop track paused 2026-09-17: onboarding/login/portal redirect to the paused notice */}
          <Route path="/for-shops/onboarding" element={<PreserveNavigate to="/for-shops" />} />
          <Route path="/shop-login" element={<PreserveNavigate to="/for-shops" />} />
          <Route path="/shop-portal" element={<PreserveNavigate to="/for-shops" />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/warranty-guide" element={<WarrantyGuide />} />
          <Route path="/subprocessors" element={<Subprocessors />} />
          <Route path="/verified-score" element={<VerifiedScore />} />
          <Route path="/diagnose" element={<PreserveNavigate to="/" />} />
          <Route path="/design-preview" element={<PreserveNavigate to="/" />} />
          <Route path="/design-preview/for-shops" element={<ForShopsPreview />} />
          <Route path="/design-preview/for-shops/onboarding" element={<ShopOnboardingPreview />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const DEFAULT_DESCRIPTION =
  "Describe your car symptom in plain English — get a free instant assessment of likely causes, cost ranges, and exactly what to ask your shop. Free, no account required.";

// Site-wide default description metas. Page-level <SEO> overrides these
// (react-helmet-async dedupes to a single tag), so every route carries
// exactly one description — the static shell tags that used to duplicate
// the page-injected ones were removed from index.html.
function DefaultMeta() {
  return (
    <Helmet>
      <meta name="description" content={DEFAULT_DESCRIPTION} />
      <meta property="og:description" content={DEFAULT_DESCRIPTION} />
      <meta name="twitter:description" content={DEFAULT_DESCRIPTION} />
    </Helmet>
  );
}

/** Redirect that preserves the incoming query string and hash (audit R-65). */
function PreserveNavigate({ to }: { to: string }) {
  const location = useLocation();
  const [path, existingHash] = to.split("#");
  const hash = existingHash ? `#${existingHash}` : location.hash;
  return <Navigate to={`${path}${location.search}${hash}`} replace />;
}

function AppLayout() {
  const location = useLocation();
  const isAdmin =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/reset-password");
  const isDesignPreview = location.pathname === "/" || location.pathname.startsWith("/design-preview/");
  const hideChrome = isAdmin || isDesignPreview;

  useEffect(() => {
    import("@/lib/analytics").then(({ trackPagePerformance }) => {
      trackPagePerformance();
    });
  }, []);

  return (
    <>
      <DefaultMeta />
      <ScrollToTop />
      {!hideChrome && <Navbar />}
      <AnimatedRoutes />
      {!hideChrome && <Footer />}
      {!hideChrome && <MobileBottomBar />}
      {!hideChrome && <BackToTop />}
      {!isAdmin && location.pathname !== "/for-shops" && <ChatBot />}
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
