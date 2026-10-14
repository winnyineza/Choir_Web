import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Shield } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { PageHero } from "@/components/editorial";

export default function Privacy() {
  useDocumentTitle("Privacy Policy");
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PageHero
          eyebrow="Legal · Last updated January 2025"
          title={<>Privacy <span className="italic text-primary">policy</span></>}
        />

        {/* Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto prose prose-invert prose-gold">
              <div className="card-glass rounded-3xl p-8 md:p-12 space-y-8">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    1. Information We Collect
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We collect information you provide directly to us, such as when you fill out a form to join our choir, subscribe to our newsletter, make a donation, or contact us. This may include your name, email address, phone number, and any other information you choose to provide.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    2. How We Use Your Information
                  </h2>
                  <ul className="text-muted-foreground space-y-2 list-disc list-inside">
                    <li>To process membership applications and choir-related communications</li>
                    <li>To send you updates about events, concerts, and ministry activities</li>
                    <li>To process donations and provide receipts</li>
                    <li>To respond to your inquiries and provide support</li>
                    <li>To improve our website and services</li>
                  </ul>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    3. Information Sharing
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We do not sell, trade, or otherwise transfer your personal information to outside parties. This does not include trusted third parties who assist us in operating our website, conducting our ministry, or servicing you, as long as those parties agree to keep this information confidential.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    4. Data Security
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    5. Cookies
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our website may use cookies to enhance your experience. You can choose to disable cookies through your browser settings, but this may affect some features of the website.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    6. Third-Party Links
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Our website may contain links to third-party sites (YouTube, Spotify, social media). We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    7. Children's Privacy
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We do not knowingly collect personal information from children under 13. If you are a parent and believe your child has provided us with personal information, please contact us.
                  </p>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                    8. Contact Us
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    If you have questions about this Privacy Policy, please contact us at:
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
