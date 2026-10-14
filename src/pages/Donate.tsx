import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Reveal, Stagger, StaggerItem, TiltCard } from "@/components/motion";
import { useState } from "react";
import { DonationCheckout } from "@/components/payments/DonationCheckout";
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
import { PageHero } from "@/components/editorial";

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
        <PageHero
          eyebrow="Give"
          title={<>Every gift <span className="italic text-primary">sings</span></>}
          lede="Your donation keeps the ministry singing. Every contribution, large or small, makes a difference."
        />

        {/* Impact Areas */}
        <section className="py-12 bg-charcoal">
          <div className="container mx-auto px-4">
            <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1}>
              {impactAreas.map((area, index) => (
                <StaggerItem key={index}>
                  <TiltCard
                    maxTilt={6}
                    className="card-glass rounded-2xl p-6 text-center h-full group hover:border-primary/30 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-[1.03]">
                      <area.icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display text-lg font-semibold mb-2">{area.title}</h3>
                    <p className="text-sm text-muted-foreground">{area.description}</p>
                  </TiltCard>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        {/* Donation Methods */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Reveal>
                <h2 className="font-display text-3xl font-bold text-center mb-10">
                  Ways to <span className="gold-text">Give</span>
                </h2>
              </Reveal>

              <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-8" stagger={0.12}>
                <StaggerItem className="md:col-span-2">
                  <div className="card-glass rounded-2xl p-6">
                    <div className="mb-6 text-center">
                      <h3 className="font-display text-2xl font-semibold">Give Online</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Pay directly with MTN MoMo, or by card through Flutterwave.
                      </p>
                    </div>
                    <DonationCheckout layout="compact" />
                  </div>
                </StaggerItem>

                {/* Bank Transfer */}
                <StaggerItem direction="right">
                <div className="card-glass rounded-2xl p-6 h-full">
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
                </StaggerItem>

                {/* Mobile Money */}
                <StaggerItem direction="left">
                <div className="card-glass rounded-2xl p-6 h-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-semibold">Mobile Money</h3>
                      <p className="text-sm text-muted-foreground">MTN MoMo</p>
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
                            <span className="font-mono font-medium">(+250) 798 254 683</span>
                            <button
                              onClick={() => handleCopy("0798254683", "MTN number")}
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
                          <span className="font-medium">Irakoze Alysee</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                </StaggerItem>
              </Stagger>

              {/* Notify Us Form */}
              <Reveal className="mt-12 card-glass rounded-2xl p-8">
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
              </Reveal>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-16 bg-charcoal">
          <div className="container mx-auto px-4">
            <Stagger className="max-w-3xl mx-auto text-center" stagger={0.12}>
              <StaggerItem>
                <blockquote className="font-display text-2xl md:text-3xl italic text-foreground mb-6">
                  "Each of you should give what you have decided in your heart to give, not
                  reluctantly or under compulsion, for God loves a cheerful giver."
                </blockquote>
              </StaggerItem>
              <StaggerItem>
                <cite className="text-primary font-semibold">— 2 Corinthians 9:7</cite>
              </StaggerItem>
            </Stagger>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

