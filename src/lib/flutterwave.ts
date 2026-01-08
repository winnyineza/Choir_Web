// Flutterwave Payment Integration
// Add your key to .env: VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxx
// For production: VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_PROD-xxxxx

export const FLUTTERWAVE_PUBLIC_KEY = 
  import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "FLWPUBK_TEST-PLACEHOLDER";

// Payment settings from localStorage (can be configured in admin)
const PAYMENT_SETTINGS_KEY = "choir_payment_settings";

export interface PaymentSettings {
  flutterwaveEnabled: boolean;
  momoEnabled: boolean;
  bankEnabled: boolean;
  demoEnabled: boolean;
  momoInstructions: {
    mtn: string;
    airtel: string;
  };
  bankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
}

export const defaultPaymentSettings: PaymentSettings = {
  flutterwaveEnabled: true,
  momoEnabled: true,
  bankEnabled: true,
  demoEnabled: true, // For testing
  momoInstructions: {
    mtn: "*182*8*1*029281# then follow instructions",
    airtel: "Dial *182*8*1*029281# and enter amount",
  },
  bankDetails: {
    bankName: "Bank of Kigali",
    accountName: "Serenades of Praise Choir",
    accountNumber: "00012345678901",
  },
};

export function getPaymentSettings(): PaymentSettings {
  const data = localStorage.getItem(PAYMENT_SETTINGS_KEY);
  if (!data) return defaultPaymentSettings;
  return { ...defaultPaymentSettings, ...JSON.parse(data) };
}

export function updatePaymentSettings(settings: Partial<PaymentSettings>): void {
  const current = getPaymentSettings();
  localStorage.setItem(PAYMENT_SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
}

export interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: {
    email: string;
    phone_number: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
  meta?: Record<string, string>;
  callback: (response: FlutterwaveResponse) => void;
  onclose: () => void;
}

export interface FlutterwaveResponse {
  status: "successful" | "cancelled" | "failed";
  transaction_id: number;
  tx_ref: string;
  flw_ref: string;
  amount: number;
  currency: string;
  charged_amount: number;
  customer: {
    name: string;
    email: string;
    phone_number: string;
  };
}

// Generate unique transaction reference
export function generateTxRef(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SOP-${timestamp}-${random}`;
}

// Check if Flutterwave is properly configured
export function isFlutterwaveConfigured(): boolean {
  return (
    FLUTTERWAVE_PUBLIC_KEY !== "FLWPUBK_TEST-PLACEHOLDER" &&
    FLUTTERWAVE_PUBLIC_KEY.startsWith("FLWPUBK")
  );
}

// Format amount for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-RW", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " RWF";
}

// Format phone number for Rwanda
export function formatRwandaPhone(phone: string): string {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, "");
  
  // Add Rwanda country code if missing
  if (cleaned.startsWith("07")) {
    cleaned = "250" + cleaned.substring(1);
  } else if (cleaned.startsWith("7")) {
    cleaned = "250" + cleaned;
  } else if (!cleaned.startsWith("250")) {
    cleaned = "250" + cleaned;
  }
  
  return cleaned;
}

// Detect mobile money provider from phone number
export function detectMomoProvider(phone: string): "mtn" | "airtel" | "unknown" {
  const cleaned = formatRwandaPhone(phone);
  const prefix = cleaned.substring(3, 5); // Get 2 digits after 250
  
  // MTN Rwanda prefixes: 78, 79
  if (["78", "79"].includes(prefix)) {
    return "mtn";
  }
  
  // Airtel Rwanda prefixes: 72, 73
  if (["72", "73"].includes(prefix)) {
    return "airtel";
  }
  
  return "unknown";
}

// Initialize Flutterwave payment
export function initializePayment(config: Omit<FlutterwaveConfig, "public_key">) {
  // This will be called when Flutterwave script is loaded
  const FlutterwaveCheckout = (window as any).FlutterwaveCheckout;
  
  if (!FlutterwaveCheckout) {
    console.error("Flutterwave SDK not loaded");
    return null;
  }

  return FlutterwaveCheckout({
    ...config,
    public_key: FLUTTERWAVE_PUBLIC_KEY,
  });
}

// Get payment options based on method
export function getPaymentOptions(method: "card" | "momo" | "bank"): string {
  switch (method) {
    case "card":
      return "card";
    case "momo":
      return "mobilemoneyrwanda";
    case "bank":
      return "banktransfer";
    default:
      return "card,mobilemoneyrwanda";
  }
}

