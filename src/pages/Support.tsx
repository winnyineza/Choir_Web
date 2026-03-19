import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, CreditCard, Phone, Send, CheckCircle, Loader2, Zap, Copy,
  Music, Users, Globe, Mic2, Shield, Lock, Smartphone, Banknote, Wallet, QrCode
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { DonationCheckout } from "@/components/payments/DonationCheckout";

const impactAreas = [
  {
    icon: Music,
    title: "Music Production",
    description: "Recording albums & spreading the gospel through music",
    color: "text-purple-500",
    bg: "bg-purple-500/20",
  },
  {
    icon: Users,
    title: "Community Outreach",
    description: "Ministry trips & community service programs",
    color: "text-blue-500",
    bg: "bg-blue-500/20",
  },
  {
    icon: Globe,
    title: "Digital Ministry",
    description: "Expanding online presence to reach more souls",
    color: "text-green-500",
    bg: "bg-green-500/20",
  },
  {
    icon: Mic2,
    title: "Equipment & Training",
    description: "Instruments, sound systems & vocal training",
    color: "text-orange-500",
    bg: "bg-orange-500/20",
  },
];

export default function Support() {
  useDocumentTitle("Support Our Ministry");
  const [paymentMode, setPaymentMode] = useState<"online" | "manual">("online");
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [messageSubmitted, setMessageSubmitted] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingMessage(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmittingMessage(false);
    setMessageSubmitted(true);

    toast({
      title: "Message Sent!",
      description: "Thank you for your encouraging words. God bless you!",
    });

    setTimeout(() => {
      setMessageSubmitted(false);
      (e.target as HTMLFormElement).reset();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal to-background" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-semibold mb-6">
                <Heart className="w-4 h-4" />
                Partner With Us
              </div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                Support Our <span className="gold-text">Ministry</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                Your generosity enables us to spread the gospel through music, 
                reaching more hearts across Rwanda and beyond.
              </p>
            </div>
          </div>
        </section>

        {/* Impact Areas */}
        <section className="py-12 bg-charcoal/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {impactAreas.map((area, index) => (
                <div
                  key={index}
                  className="card-glass rounded-2xl p-4 md:p-6 text-center hover:border-primary/30 transition-all group"
                >
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${area.bg} flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                    <area.icon className={`w-6 h-6 md:w-7 md:h-7 ${area.color}`} />
                  </div>
                  <h3 className="font-display text-sm md:text-base font-semibold mb-1 md:mb-2">{area.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">{area.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Payment Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-8">
                Choose How to <span className="gold-text">Give</span>
              </h2>

              {/* Accepted Payment Methods */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-muted-foreground">
                  <Smartphone className="w-3.5 h-3.5" />
                  MTN MoMo
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-muted-foreground">
                  <Smartphone className="w-3.5 h-3.5" />
                  Airtel Money
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-muted-foreground">
                  <CreditCard className="w-3.5 h-3.5" />
                  Visa / Mastercard
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-xs font-medium text-muted-foreground">
                  <Banknote className="w-3.5 h-3.5" />
                  Bank Transfer
                </div>
              </div>

              {/* Payment Mode Toggle */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex bg-secondary rounded-xl p-1 w-full max-w-md">
                  <button
                    onClick={() => setPaymentMode("online")}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                      paymentMode === "online"
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    Pay Online
                  </button>
                  <button
                    onClick={() => setPaymentMode("manual")}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                      paymentMode === "manual"
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    Manual Transfer
                  </button>
                </div>
              </div>

              {/* Online Payment */}
              {paymentMode === "online" && (
                <div className="card-glass rounded-3xl p-6 sm:p-8 animate-fade-in-up">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 mx-auto mb-4 flex items-center justify-center shadow-lg">
                      <Zap className="w-8 h-8 text-black" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">
                      Quick & Secure Payment
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Pay instantly with MTN MoMo or Card
                    </p>
                  </div>
                  
                  <DonationCheckout />
                  
                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-primary/10">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>Secure</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="w-4 h-4 text-green-500" />
                      <span>Encrypted</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Payment */}
              {paymentMode === "manual" && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bank Transfer */}
                    <div className="card-glass rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-semibold">Bank Transfer</h3>
                          <p className="text-sm text-muted-foreground">Equity Bank Rwanda</p>
                        </div>
                      </div>

                      <div className="space-y-3 bg-secondary/50 rounded-xl p-4 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Account Name</span>
                          <span className="font-medium">Serenades of Praise</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Account No.</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">4024212955253</span>
                            <button
                              onClick={() => handleCopy("4024212955253", "Account number")}
                              className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors"
                            >
                              {copied === "Account number" ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Swift Code</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">EABORWRW</span>
                            <button
                              onClick={() => handleCopy("EABORWRW", "Swift code")}
                              className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors"
                            >
                              {copied === "Swift code" ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Money */}
                    <div className="card-glass rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <Phone className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-semibold">Mobile Money</h3>
                          <p className="text-sm text-muted-foreground">MTN MoMo / Airtel</p>
                        </div>
                      </div>

                      {/* MTN */}
                      <div className="bg-secondary/50 rounded-xl p-4 mb-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center">
                            <span className="text-white font-bold text-[10px]">MTN</span>
                          </div>
                          <span className="font-semibold text-sm">MTN MoMo</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">0780 623 144</span>
                            <button
                              onClick={() => handleCopy("0780623144", "MTN number")}
                              className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors"
                            >
                              {copied === "MTN number" ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Airtel */}
                      <div className="bg-secondary/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                            <span className="text-white font-bold text-[10px]">A</span>
                          </div>
                          <span className="font-semibold text-sm">Airtel Money</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Number</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">0730 623 144</span>
                            <button
                              onClick={() => handleCopy("0730623144", "Airtel number")}
                              className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors"
                            >
                              {copied === "Airtel number" ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notify Form */}
                  <div className="card-glass rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold">Notify Us</h4>
                        <p className="text-xs text-muted-foreground">So we can acknowledge your gift</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input placeholder="Your Name" className="bg-secondary border-primary/20" />
                      <Input type="email" placeholder="Email" className="bg-secondary border-primary/20" />
                      <Button
                        variant="gold"
                        className="whitespace-nowrap"
                        onClick={() => {
                          toast({
                            title: "Thank You! 🙏",
                            description: "We've received your notification. God bless you!",
                          });
                        }}
                      >
                        I've Donated
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Bible Verse */}
        <section className="py-12 bg-charcoal/50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <blockquote className="font-display text-xl sm:text-2xl md:text-3xl italic text-foreground mb-4">
                "Each of you should give what you have decided in your heart to give, 
                not reluctantly or under compulsion, for God loves a cheerful giver."
              </blockquote>
              <cite className="text-primary font-semibold">— 2 Corinthians 9:7</cite>
            </div>
          </div>
        </section>

        {/* Leave a Message */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">
                  Leave a <span className="gold-text">Message</span>
                </h2>
                <p className="text-muted-foreground">
                  Share words of encouragement with our choir family
                </p>
              </div>

              <div className="card-glass rounded-3xl p-6 sm:p-8">
                {messageSubmitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-muted-foreground">
                      Thank you for your encouraging words. God bless you!
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleMessageSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter your name"
                          required
                          className="mt-1.5 bg-secondary border-primary/20"
                          disabled={isSubmittingMessage}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email (optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          className="mt-1.5 bg-secondary border-primary/20"
                          disabled={isSubmittingMessage}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="message">Your Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Write your message of support..."
                        className="mt-1.5 bg-secondary border-primary/20"
                        rows={4}
                        required
                        disabled={isSubmittingMessage}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="gold"
                      className="w-full"
                      disabled={isSubmittingMessage}
                    >
                      {isSubmittingMessage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
