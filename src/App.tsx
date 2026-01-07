import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { trackPageView, trackSession } from "@/lib/analyticsService";
import Index from "./pages/Index";
import About from "./pages/About";
import Events from "./pages/Events";
import Ministry from "./pages/Ministry";
import Releases from "./pages/Releases";
import Gallery from "./pages/Gallery";
import Join from "./pages/Join";
import Support from "./pages/Support";
import Donate from "./pages/Donate";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import Scanner from "./pages/Scanner";

const queryClient = new QueryClient();

// Analytics tracker component
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track session on app load
    trackSession();
  }, []);

  useEffect(() => {
    // Track page views on route change
    const title = document.title || "Serenades of Praise";
    trackPageView(location.pathname, title);
  }, [location]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AnalyticsTracker />
            <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/events" element={<Events />} />
                <Route path="/ministry" element={<Ministry />} />
                <Route path="/releases" element={<Releases />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/join" element={<Join />} />
                <Route path="/support" element={<Support />} />
                <Route path="/donate" element={<Donate />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
