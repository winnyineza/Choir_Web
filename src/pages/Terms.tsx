import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FileText } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function Terms() {
  useDocumentTitle("Terms of Service");
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal to-background" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-gold-gradient mx-auto mb-6 flex items-center justify-center">
                <FileText className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-5xl md:text-6xl font-bold mb-6">
                Terms of <span className="gold-text">Service</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Last updated: January 2025
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="card-glass rounded-3xl p-8 md:p-12 space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    1. Acceptance of Terms
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    By accessing and using the Serenades of Praise Choir website, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    2. Use of Website
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    You agree to use this website only for lawful purposes and in a way that does not infringe the rights of others or restrict their use of the website. Prohibited activities include:
                  </p>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                    <li>Attempting to gain unauthorized access to the website or its systems</li>
                    <li>Using the website to transmit harmful or malicious content</li>
                    <li>Copying or distributing content without permission</li>
                    <li>Using automated systems to access the website without our consent</li>
                  </ul>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    3. Intellectual Property
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    All content on this website, including but not limited to text, images, music, videos, logos, and graphics, is the property of Serenades of Praise Choir or its content suppliers and is protected by copyright laws. You may not reproduce, distribute, or create derivative works without explicit written permission.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    4. Media Usage
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Photos and videos displayed on this website are the property of Serenades of Praise Choir. Permission must be requested and granted before using any media for personal or commercial purposes. Please contact us for media usage requests.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    5. Donations
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Donations made through our website are voluntary contributions to support our ministry. All donations are non-refundable unless made in error. We will provide acknowledgment for donations as requested.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    6. Event Bookings
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Event bookings are subject to availability. We reserve the right to modify, reschedule, or cancel events due to unforeseen circumstances. Registered attendees will be notified of any changes.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    7. Disclaimer
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    This website is provided "as is" without warranties of any kind. We do not guarantee that the website will be error-free or uninterrupted. We are not liable for any damages arising from your use of the website.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    8. External Links
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our website contains links to external sites (YouTube, Spotify, social media platforms). We are not responsible for the content or practices of these external sites.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    9. Modifications
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of the website constitutes acceptance of the modified terms.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    10. Contact
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    For questions about these Terms of Service, please contact us:
                  </p>
                  <div className="mt-4 p-4 rounded-xl bg-secondary/50">
                    <p className="text-foreground font-semibold">Serenades of Praise Choir</p>
                    <p className="text-muted-foreground">Email: theserenadeschoir@gmail.com</p>
                    <p className="text-muted-foreground">Phone: +250 780 623 144</p>
                    <p className="text-muted-foreground">Location: Kacyiru SDA Church, Kigali, Rwanda</p>
                  </div>
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
