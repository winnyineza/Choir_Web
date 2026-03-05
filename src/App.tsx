import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { trackPageView, trackSession } from "@/lib/analyticsService";
import Index from "./pages/Index";

const About = lazy(() => import("./pages/About"));
const Events = lazy(() => import("./pages/Events"));
const Ministry = lazy(() => import("./pages/Ministry"));
const Releases = lazy(() => import("./pages/Releases"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Join = lazy(() => import("./pages/Join"));
const Support = lazy(() => import("./pages/Support"));
const Donate = lazy(() => import("./pages/Donate"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Scanner = lazy(() => import("./pages/Scanner"));
const MemberPortal = lazy(() => import("./pages/MemberPortal"));

const queryClient = new QueryClient();

// Analytics tracker component
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track session on app load
    void trackSession();
  }, []);

  useEffect(() => {
    // Track page views on route change
    const title = document.title || "Serenades of Praise";
    void trackPageView(location.pathname, title);
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
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AnalyticsTracker />
            <Suspense fallback={null}>
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
                <Route path="/member-portal" element={<MemberPortal />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
