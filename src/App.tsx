import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomBar from "@/components/MobileBottomBar";
import BackToTop from "@/components/BackToTop";
import ChatBot from "@/components/ChatBot";
import Index from "./pages/Index";
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

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
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
          <Route path="/for-car-owners" element={<ForCarOwners />} />
          <Route path="/for-shops" element={<ForShops />} />
          <Route path="/vehicle-insights" element={<VehicleInsights />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/garage" element={<Garage />} />
          <Route path="/investors" element={<Investors />} />
          <Route path="/get-quote" element={<GetQuote />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <AnimatedRoutes />
          <Footer />
          <MobileBottomBar />
          <BackToTop />
          <ChatBot />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
