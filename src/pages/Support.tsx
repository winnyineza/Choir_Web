import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, CreditCard, Phone, Send, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Support() {
  useDocumentTitle("Support Our Ministry");
  const [supportMethod, setSupportMethod] = useState<"bank" | "momo" | null>(null);
  const [amount, setAmount] = useState("");
  const [momoStep, setMomoStep] = useState<"amount" | "instructions">("amount");
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [messageSubmitted, setMessageSubmitted] = useState(false);
  const { toast } = useToast();

  const handleMoMoProceed = () => {
    if (!amount || parseInt(amount) < 100) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount (minimum 100 RWF).",
        variant: "destructive",
      });
      return;
    }
    setMomoStep("instructions");
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
              <h2 className="font-display text-3xl font-bold text-center mb-12">
                Choose How to <span className="gold-text">Give</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Bank Transfer */}
                <button
                  onClick={() => {
                    setSupportMethod("bank");
                    setMomoStep("amount");
                  }}
                  className={`card-glass rounded-3xl p-8 text-left transition-all duration-300 ${
                    supportMethod === "bank" ? "border-primary/50 gold-glow" : "hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gold-gradient flex items-center justify-center">
                      <CreditCard className="w-7 h-7 text-primary-foreground" />
                    </div>
                    {supportMethod === "bank" && (
                      <CheckCircle className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    Equity Bank Transfer
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Direct bank transfer for larger contributions. Ideal for organizations and corporate sponsors.
                  </p>
                </button>

                {/* MTN MoMo */}
                <button
                  onClick={() => {
                    setSupportMethod("momo");
                    setMomoStep("amount");
                  }}
                  className={`card-glass rounded-3xl p-8 text-left transition-all duration-300 ${
                    supportMethod === "momo" ? "border-primary/50 gold-glow" : "hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gold-gradient flex items-center justify-center">
                      <Phone className="w-7 h-7 text-primary-foreground" />
                    </div>
                    {supportMethod === "momo" && (
                      <CheckCircle className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-2">
                    MTN Mobile Money
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Quick and easy mobile money support. Instant and secure transactions.
                  </p>
                </button>
              </div>

              {/* Bank Details */}
              {supportMethod === "bank" && (
                <div className="card-glass rounded-3xl p-8 mb-8 animate-fade-in-up">
                  <h3 className="font-display text-xl font-bold text-foreground mb-6">Bank Transfer</h3>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="bankEmail">Your Email Address</Label>
                      <Input
                        id="bankEmail"
                        type="email"
                        placeholder="your@email.com"
                        className="mt-1 bg-secondary border-primary/20"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Bank account details will be sent to this email
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="bankAmount">Amount (RWF)</Label>
                      <Input
                        id="bankAmount"
                        type="number"
                        placeholder="Enter amount"
                        className="mt-1 bg-secondary border-primary/20"
                        min="1000"
                      />
                    </div>
                    <Button 
                      variant="gold" 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "Request Submitted!",
                          description: "Bank account details will be sent to your email shortly.",
                        });
                      }}
                    >
                      Get Bank Details
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      You'll receive our Equity Bank account details via email within minutes.
                    </p>
                  </div>
                </div>
              )}

              {/* MoMo Flow */}
              {supportMethod === "momo" && momoStep === "amount" && (
                <div className="card-glass rounded-3xl p-8 mb-8 animate-fade-in-up">
                  <h3 className="font-display text-xl font-bold text-foreground mb-6">Select Amount</h3>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="amount">Amount (RWF)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 bg-secondary border-primary/20 text-lg"
                        min="100"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {[1000, 5000, 10000, 25000, 50000].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setAmount(preset.toString())}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            amount === preset.toString()
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:bg-primary/20"
                          }`}
                        >
                          {preset.toLocaleString()} RWF
                        </button>
                      ))}
                    </div>
                    <Button variant="gold" size="lg" className="w-full" onClick={handleMoMoProceed}>
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* MoMo Email Collection */}
              {supportMethod === "momo" && momoStep === "instructions" && (
                <div className="card-glass rounded-3xl p-8 mb-8 animate-fade-in-up">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#FFCC00]/20 mx-auto mb-4 flex items-center justify-center">
                      <Phone className="w-8 h-8 text-[#FFCC00]" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      Donate {parseInt(amount).toLocaleString()} RWF
                    </h3>
                    <p className="text-muted-foreground text-sm mt-2">
                      Almost there! Enter your email to receive payment instructions.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="momoEmail">Your Email Address</Label>
                      <Input
                        id="momoEmail"
                        type="email"
                        placeholder="your@email.com"
                        className="mt-1 bg-secondary border-primary/20"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        MoMo payment instructions will be sent to this email
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="momoName">Your Name (optional)</Label>
                      <Input
                        id="momoName"
                        placeholder="For acknowledgment purposes"
                        className="mt-1 bg-secondary border-primary/20"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/50 border border-primary/10">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Donation Amount</span>
                        <span className="font-semibold gold-text">{parseInt(amount).toLocaleString()} RWF</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Payment instructions including the MoMo number will be sent to your email for security.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setMomoStep("amount")}
                      >
                        Change Amount
                      </Button>
                      <Button
                        variant="gold"
                        className="flex-1"
                        onClick={() => {
                          toast({
                            title: "Instructions Sent! 📧",
                            description: "Check your email for MoMo payment instructions. God bless you!",
                          });
                        }}
                      >
                        Send Instructions
                      </Button>
                    </div>
                  </div>
                </div>
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
