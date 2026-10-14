import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Loader2, CheckCircle } from "lucide-react";

interface NewsletterFormProps {
  variant?: "default" | "inline";
  className?: string;
}

export function NewsletterForm({ variant = "default", className = "" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setIsSubmitting(false);
    setIsSubscribed(true);
    
    toast({
      title: "Successfully Subscribed! 🎉",
      description: "Thank you for subscribing. You'll receive updates about our events and releases.",
    });

    // Reset after delay
    setTimeout(() => {
      setIsSubscribed(false);
      setEmail("");
    }, 5000);
  };

  if (isSubscribed) {
    return (
      <div className={`flex items-center justify-center gap-2 py-3 ${className}`}>
        <CheckCircle className="w-5 h-5 text-green-500" />
        <span className="text-green-500 font-medium">Subscribed successfully!</span>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <form
        onSubmit={handleSubmit}
        className={`group flex items-end gap-4 border-b border-foreground/20 transition-colors focus-within:border-primary ${className}`}
      >
        <label className="flex-1">
          <span className="sr-only">Email address</span>
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-none border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isSubmitting}
            required
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="link-luxe h-12 shrink-0 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Subscribing
            </>
          ) : (
            <>
              Subscribe
              <span className="link-luxe-rule" />
            </>
          )}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10 bg-secondary border-primary/20"
          disabled={isSubmitting}
          required
        />
      </div>
      <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Subscribing...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4 mr-2" />
            Subscribe to Newsletter
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        We respect your privacy. Unsubscribe anytime.
      </p>
    </form>
  );
}


