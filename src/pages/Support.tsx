import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, CreditCard, Phone, Send, CheckCircle, Loader2, Zap, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { FlutterwavePayment } from "@/components/FlutterwavePayment";

export default function Support() {
  useDocumentTitle("Support Our Ministry");
  const [paymentMode, setPaymentMode] = useState<"online" | "manual">("online");
  const [supportMethod, setSupportMethod] = useState<"bank" | "momo" | null>(null);
  const [amount, setAmount] = useState("");
  const [momoStep, setMomoStep] = useState<"amount" | "instructions">("amount");
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

    // Simulate submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmittingMessage(false);
    setMessageSubmitted(true);

    toast({
      title: "Message Sent!",
      description: "Thank you for your encouraging words. God bless you!",
    });

    // Reset after delay
    setTimeout(() => {
      setMessageSubmitted(false);
      (e.target as HTMLFormElement).reset();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal to-background" />
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gold-gradient opacity-5" />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-gold-gradient mx-auto mb-8 flex items-center justify-center animate-pulse-gold">
                <Heart className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
                Support Our <span className="gold-text">Ministry</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Your generosity enables us to spread the gospel through music, reaching more hearts across Rwanda and beyond.
              </p>
            </div>
          </div>
        </section>

        {/* Support Options */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl font-bold text-center mb-8">
                Choose How to <span className="gold-text">Give</span>
              </h2>

              {/* Payment Mode Toggle */}
              <div className="flex justify-center mb-10">
                <div className="inline-flex bg-secondary rounded-xl p-1">
                  <button
                    onClick={() => setPaymentMode("online")}
                    className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      paymentMode === "online"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    Pay Online
                  </button>
                  <button
                    onClick={() => setPaymentMode("manual")}
                    className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      paymentMode === "manual"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Manual Transfer
                  </button>
                </div>
              </div>

              {/* Online Payment (Flutterwave) */}
              {paymentMode === "online" && (
                <div className="card-glass rounded-3xl p-8 mb-8 animate-fade-in-up">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground mb-2">
                      Quick & Secure Payment
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Pay instantly with MTN MoMo or Card
                    </p>
                  </div>
                  <FlutterwavePayment />
                </div>
              )}

              {/* Manual Payment Options */}
              {paymentMode === "manual" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Bank Transfer Card */}
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

                    {/* Mobile Money Card */}
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

                      {/* MTN MoMo */}
                      <div className="bg-secondary/50 rounded-xl p-4 mb-4">
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
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notify Us Form */}
                  <div className="card-glass rounded-2xl p-6">
                    <h4 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-primary" />
                      Let Us Know About Your Donation
                    </h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      After making a manual transfer, please notify us so we can acknowledge your gift.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input placeholder="Your Name" className="bg-secondary border-primary/20" />
                      <Input type="email" placeholder="Your Email" className="bg-secondary border-primary/20" />
                    </div>
                    <Button
                      variant="gold"
                      className="mt-4"
                      onClick={() => {
                        toast({
                          title: "Thank You! 🙏",
                          description: "We've received your notification. God bless you!",
                        });
                      }}
                    >
                      I've Made a Donation
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Leave a Message */}
        <section className="py-16 bg-charcoal">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl font-bold mb-4">
                  Leave a <span className="gold-text">Supportive Message</span>
                </h2>
                <p className="text-muted-foreground">
                  Share your words of encouragement with our choir family.
                </p>
              </div>

              <div className="card-glass rounded-3xl p-8">
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
                  <form onSubmit={handleMessageSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter your name"
                          required
                          className="mt-1 bg-secondary border-primary/20"
                          disabled={isSubmittingMessage}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email (optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          className="mt-1 bg-secondary border-primary/20"
                          disabled={isSubmittingMessage}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="message">Your Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Write your supporting message..."
                        className="mt-1 bg-secondary border-primary/20"
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
