import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { createContactSubmission } from "@/lib/contactService";
import { PageHero } from "@/components/editorial";

export default function Contact() {
  useDocumentTitle("Contact Us");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Always save to Supabase for admin panel viewing (works locally and in production)
    await createContactSubmission({
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      subject: formData.subject || "General Inquiry",
      message: formData.message,
    });

    // Try to submit to Netlify Forms (only works on deployed site)
    const form = e.currentTarget;
    const formDataObj = new FormData(form);

    try {
      // Only attempt Netlify submission in production
      const isProduction = window.location.hostname !== "localhost" && 
                          !window.location.hostname.includes("127.0.0.1");
      
      if (isProduction) {
        await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(formDataObj as any).toString(),
        });
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
      toast({
        title: "Message Sent! ✉️",
        description: "We'll get back to you within 24-48 hours.",
      });

      // Reset form after delay
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      }, 3000);
    } catch (error) {
      // Even if Netlify submission fails, the message is saved locally
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast({
        title: "Message Received! ✉️",
        description: "We'll get back to you within 24-48 hours.",
      });

      // Reset form after delay
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PageHero
          eyebrow="Contact"
          title={<>Get in <span className="italic text-primary">touch</span></>}
          lede="We would love to hear from you, whether it's a question, an invitation or a prayer request."
        />

        {/* Contact Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Contact Form */}
              <Reveal direction="right" className="card-glass rounded-3xl p-8">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                  Send a Message
                </h2>

                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-muted-foreground">
                      Thank you for reaching out. We'll get back to you soon.
                    </p>
                  </div>
                ) : (
                  <form
                    name="contact"
                    method="POST"
                    data-netlify="true"
                    netlify-honeypot="bot-field"
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {/* Netlify Forms hidden fields */}
                    <input type="hidden" name="form-name" value="contact" />
                    <div hidden>
                      <input name="bot-field" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="bg-secondary border-primary/20"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="bg-secondary border-primary/20"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="bg-secondary border-primary/20"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (Optional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+250 7XX XXX XXX"
                        value={formData.phone}
                        onChange={handleChange}
                        className="bg-secondary border-primary/20"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Select 
                        disabled={isSubmitting}
                        name="subject"
                        onValueChange={(value) => setFormData({ ...formData, subject: value })}
                      >
                        <SelectTrigger className="bg-secondary border-primary/20">
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="booking">Event Booking</SelectItem>
                          <SelectItem value="join">Join the Choir</SelectItem>
                          <SelectItem value="support">Support/Donation</SelectItem>
                          <SelectItem value="media">Media Request</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {/* Hidden input for Netlify to capture select value */}
                      <input type="hidden" name="subject" value={formData.subject} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Write your message here..."
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        required
                        className="bg-secondary border-primary/20 resize-none"
                        disabled={isSubmitting}
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="gold"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
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
              </Reveal>

              {/* Contact Info */}
              <Reveal direction="left" delay={0.1} className="space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    Contact Information
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Feel free to reach out through any of these channels. We typically respond within 24-48 hours.
                  </p>

                  <Stagger className="space-y-6" stagger={0.1}>
                    <StaggerItem className="flex items-start gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.03]">
                        <MapPin className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Location</h3>
                        <p className="text-muted-foreground">
                          Kacyiru SDA Church<br />
                          Kigali, Rwanda
                        </p>
                      </div>
                    </StaggerItem>

                    <StaggerItem className="flex items-start gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.03]">
                        <Mail className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Email</h3>
                        <a
                          href="mailto:theserenadeschoir@gmail.com"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          theserenadeschoir@gmail.com
                        </a>
                      </div>
                    </StaggerItem>

                    <StaggerItem className="flex items-start gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.03]">
                        <Phone className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                        <a
                          href="tel:+250780623144"
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          +250 780 623 144
                        </a>
                      </div>
                    </StaggerItem>

                    <StaggerItem className="flex items-start gap-4 group">
                      <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-[1.03]">
                        <Clock className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Practice Schedule</h3>
                        <p className="text-muted-foreground">
                          Every Saturday<br />
                          3:00 PM - 6:00 PM
                        </p>
                      </div>
                    </StaggerItem>
                  </Stagger>
                </div>

                {/* Map Placeholder */}
                <div className="card-glass rounded-2xl overflow-hidden">
                  <div className="aspect-video bg-secondary flex items-center justify-center">
                    <div className="text-center p-8">
                      <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">Find Us</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Kacyiru SDA Church, Kigali
                      </p>
                      <Button variant="gold-outline" size="sm" asChild>
                        <a
                          href="https://www.google.com/maps/search/Kacyiru+SDA+Church+Kigali"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open in Google Maps
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
