import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Music2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const NotFound = () => {
  useDocumentTitle("Page Not Found");
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-lg mx-auto">
        {/* Logo */}
        <div className="w-20 h-20 rounded-full bg-gold-gradient mx-auto mb-8 flex items-center justify-center animate-pulse-gold">
          <Music2 className="w-10 h-10 text-primary-foreground" />
        </div>

        {/* 404 Number */}
        <h1 className="font-display text-8xl md:text-9xl font-bold gold-text mb-4">
          404
        </h1>

        {/* Message */}
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-4">
          Page Not Found
        </h2>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Oops! The page you're looking for doesn't exist or has been moved. 
          Don't worry, let's get you back on track.
        </p>

        {/* Attempted path */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-primary/10 mb-8">
          <Search className="w-4 h-4 text-muted-foreground" />
          <code className="text-sm text-muted-foreground">{location.pathname}</code>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="gold" size="lg" asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Go to Homepage
            </Link>
          </Button>
          <Button variant="gold-outline" size="lg" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-primary/10">
          <p className="text-sm text-muted-foreground mb-4">Or try one of these pages:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["About", "Events", "Releases", "Gallery", "Contact"].map((page) => (
              <Link
                key={page}
                to={`/${page.toLowerCase()}`}
                className="px-3 py-1.5 rounded-lg bg-secondary text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              >
                {page}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
