import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, CreditCard, Phone, Send, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function Support() {
  const [supportMethod, setSupportMethod] = useState<"bank" | "momo" | null>(null);
  const [amount, setAmount] = useState("");

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
                  onClick={() => setSupportMethod("bank")}
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
                  onClick={() => setSupportMethod("momo")}
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
                  <h3 className="font-display text-xl font-bold text-foreground mb-6">Bank Account Details</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-primary/10">
                      <span className="text-muted-foreground">Bank Name</span>
                      <span className="text-foreground font-semibold text-lg">Equity Bank Rwanda</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-primary/10">
                      <span className="text-muted-foreground">Account Name</span>
                      <span className="text-foreground font-semibold text-lg">Irakoze Alysee, Niyomutabazi Jimmy & Nikwigize Aimable</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-primary/10">
                      <span className="text-muted-foreground">Account Number</span>
                      <span className="text-foreground font-semibold font-mono text-lg">4024212955253</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-muted-foreground">Branch</span>
                      <span className="text-foreground font-semibold text-lg">All Branches</span>
                    </div>
                  </div>
                </div>
              )}

              {/* MoMo Form */}
              {supportMethod === "momo" && (
                <div className="card-glass rounded-3xl p-8 mb-8 animate-fade-in-up">
                  <h3 className="font-display text-xl font-bold text-foreground mb-6">MTN MoMo Payment</h3>
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
                    <Button variant="gold" size="lg" className="w-full" disabled={!amount}>
                      <Phone className="w-4 h-4 mr-2" />
                      Pay with MTN MoMo
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      You will receive a prompt on your phone to complete the transaction.
                    </p>
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
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Your Name</Label>
                      <Input id="name" placeholder="Enter your name" className="mt-1 bg-secondary border-primary/20" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email (optional)</Label>
                      <Input id="email" type="email" placeholder="your@email.com" className="mt-1 bg-secondary border-primary/20" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Write your supporting message..."
                      className="mt-1 bg-secondary border-primary/20"
                      rows={4}
                    />
                  </div>
                  <Button variant="gold" className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
