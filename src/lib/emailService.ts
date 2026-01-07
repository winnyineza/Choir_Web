// Email Service using EmailJS
// To set up: Create account at https://www.emailjs.com/
// Get your Service ID, Template ID, and Public Key

// EmailJS Configuration - Update these with your actual values
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || "YOUR_SERVICE_ID",
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "YOUR_TEMPLATE_ID",
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY",
};

export interface ContactFormData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface EmailResult {
  success: boolean;
  message: string;
}

// Check if EmailJS is configured
export function isEmailConfigured(): boolean {
  return (
    EMAILJS_CONFIG.serviceId !== "YOUR_SERVICE_ID" &&
    EMAILJS_CONFIG.templateId !== "YOUR_TEMPLATE_ID" &&
    EMAILJS_CONFIG.publicKey !== "YOUR_PUBLIC_KEY"
  );
}

// Send email using EmailJS
export async function sendContactEmail(data: ContactFormData): Promise<EmailResult> {
  // If not configured, simulate success for demo
  if (!isEmailConfigured()) {
    console.log("EmailJS not configured. Form data:", data);
    
    // Store in localStorage for demo/testing
    const submissions = JSON.parse(localStorage.getItem("sop_contact_submissions") || "[]");
    submissions.push({
      ...data,
      timestamp: new Date().toISOString(),
      id: `contact_${Date.now()}`,
    });
    localStorage.setItem("sop_contact_submissions", JSON.stringify(submissions));
    
    return {
      success: true,
      message: "Message received! (Demo mode - EmailJS not configured)",
    };
  }

  try {
    // Dynamically import EmailJS
    const emailjs = await import("@emailjs/browser");
    
    const templateParams = {
      from_name: data.name,
      from_email: data.email,
      subject: data.subject || "Contact Form Message",
      message: data.message,
      to_name: "Serenades of Praise",
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      templateParams,
      EMAILJS_CONFIG.publicKey
    );

    if (response.status === 200) {
      return {
        success: true,
        message: "Message sent successfully! We'll get back to you soon.",
      };
    } else {
      throw new Error("Failed to send message");
    }
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      message: "Failed to send message. Please try again or email us directly.",
    };
  }
}

// Newsletter subscription (similar approach)
export async function subscribeNewsletter(email: string): Promise<EmailResult> {
  // Store in localStorage
  const subscribers = JSON.parse(localStorage.getItem("sop_newsletter_subscribers") || "[]");
  
  if (subscribers.includes(email)) {
    return {
      success: false,
      message: "You're already subscribed!",
    };
  }
  
  subscribers.push(email);
  localStorage.setItem("sop_newsletter_subscribers", JSON.stringify(subscribers));
  
  return {
    success: true,
    message: "Successfully subscribed to our newsletter!",
  };
}

// Get all contact submissions (for admin)
export function getContactSubmissions(): (ContactFormData & { timestamp: string; id: string })[] {
  return JSON.parse(localStorage.getItem("sop_contact_submissions") || "[]");
}

// Get all newsletter subscribers (for admin)
export function getNewsletterSubscribers(): string[] {
  return JSON.parse(localStorage.getItem("sop_newsletter_subscribers") || "[]");
}

