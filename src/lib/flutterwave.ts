// Flutterwave Payment Integration
// Add your key to .env: VITE_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxx

export const FLUTTERWAVE_PUBLIC_KEY = 
  import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "FLWPUBK_TEST-PLACEHOLDER";

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

