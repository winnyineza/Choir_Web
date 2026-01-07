import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useState } from "react";
import {
  Heart,
  CreditCard,
  Phone,
  Copy,
  CheckCircle,
  Gift,
  Music,
  Users,
  Globe,
  Sparkles,
} from "lucide-react";

export default function Donate() {
  useDocumentTitle("Support Our Ministry - Donate");
  const [copied, setCopied] = useState<string | null>(null);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [message, setMessage] = useState("");
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

  const handleNotify = () => {
    if (!donorEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email so we can acknowledge your donation.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Thank You! 🙏",
      description: "We'll send you a confirmation once your donation is received.",
    });

    // In production, this would send an email or notification
    setDonorName("");
    setDonorEmail("");
    setMessage("");
  };

  const impactAreas = [
    {
      icon: Music,
      title: "Music Production",
      description: "Help us record and produce new albums to spread the gospel",
    },
    {
      icon: Users,
      title: "Community Outreach",
      description: "Support our ministry trips and community service programs",
    },
    {
      icon: Globe,
      title: "Digital Ministry",
      description: "Expand our online presence to reach more souls worldwide",
    },
    {
      icon: Gift,
      title: "Equipment & Resources",
      description: "Invest in instruments, robes, and ministry materials",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal to-background" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-semibold mb-6">
                <Heart className="w-4 h-4" />
                Support Our Ministry
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
                Partner With <span className="gold-text">Us</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Your generous donation helps us continue spreading the gospel through music.
                Every contribution, big or small, makes a difference in our ministry.
              </p>
            </div>
          </div>
        </section>

        {/* Impact Areas */}
        <section className="py-12 bg-charcoal">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {impactAreas.map((area, index) => (
                <div
                  key={index}
                  className="card-glass rounded-2xl p-6 text-center hover:border-primary/30 transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <area.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">{area.title}</h3>
                  <p className="text-sm text-muted-foreground">{area.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Donation Methods */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-center mb-10">
                Ways to <span className="gold-text">Give</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bank Transfer */}
                <div className="card-glass rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold">Bank Transfer</h3>
                      <p className="text-sm text-muted-foreground">Equity Bank Rwanda</p>
                    </div>
                  </div>

                  <div className="space-y-4 bg-secondary/50 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Bank Name</span>
                      <span className="font-medium">Equity Bank Rwanda</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Name</span>
                      <span className="font-medium">Serenades of Praise</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Account Number</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">4024212955253</span>
                        <button
                          onClick={() => handleCopy("4024212955253", "Account number")}
                          className="p-1 hover:bg-primary/20 rounded transition-colors"
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
                      <span className="text-muted-foreground">Branch</span>
                      <span className="font-medium">Kigali</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Swift Code</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">EABORWRW</span>
                        <button
                          onClick={() => handleCopy("EABORWRW", "Swift code")}
                          className="p-1 hover:bg-primary/20 rounded transition-colors"
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold">Mobile Money</h3>
                      <p className="text-sm text-muted-foreground">MTN MoMo / Airtel Money</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* MTN MoMo */}
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">MTN</span>
                        </div>
                        <span className="font-semibold">MTN Mobile Money</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Dial</span>
                          <span className="font-mono font-medium">*182*8*1#</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Send to</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">0780623144</span>
                            <button
                              onClick={() => handleCopy("0780623144", "MTN number")}
                              className="p-1 hover:bg-primary/20 rounded transition-colors"
                            >
                              {copied === "MTN number" ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">Serenades of Praise</span>
                        </div>
                      </div>
                    </div>

                    {/* Airtel Money */}
                    <div className="bg-secondary/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                          <span className="text-white font-bold text-xs">A</span>
                        </div>
                        <span className="font-semibold">Airtel Money</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Dial</span>
                          <span className="font-mono font-medium">*182*8*1#</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Send to</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium">0730623144</span>
                            <button
                              onClick={() => handleCopy("0730623144", "Airtel number")}
                              className="p-1 hover:bg-primary/20 rounded transition-colors"
                            >
                              {copied === "Airtel number" ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 text-primary" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">Serenades of Praise</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notify Us Form */}
              <div className="mt-12 card-glass rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h3 className="font-display text-xl font-semibold">
                    Let Us Know About Your Donation
                  </h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  After making your donation, please fill this form so we can properly acknowledge
                  your generous gift and send you a thank you note.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="donorName">Your Name (Optional)</Label>
                    <Input
                      id="donorName"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-1 bg-secondary border-primary/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="donorEmail">Email Address *</Label>
                    <Input
                      id="donorEmail"
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="mt-1 bg-secondary border-primary/20"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="message">Message (Optional)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Share a note or prayer request with us..."
                      className="mt-1 bg-secondary border-primary/20"
                      rows={3}
                    />
                  </div>
                </div>

                <Button variant="gold" size="lg" className="mt-6" onClick={handleNotify}>
                  <Heart className="w-4 h-4 mr-2" />
                  I've Made a Donation
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-16 bg-charcoal">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <blockquote className="font-display text-2xl md:text-3xl italic text-foreground mb-6">
                "Each of you should give what you have decided in your heart to give, not
                reluctantly or under compulsion, for God loves a cheerful giver."
              </blockquote>
              <cite className="text-primary font-semibold">— 2 Corinthians 9:7</cite>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

