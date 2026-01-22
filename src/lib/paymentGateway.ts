// Payment Gateway Service - Flutterwave
// Supports: MTN Mobile Money, Airtel Money, Credit/Debit Cards (Visa, MC, Amex)

// ============ CONFIGURATION ============

export const FLUTTERWAVE_PUBLIC_KEY = 
  import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || "";

// ============ TYPES ============

export type PaymentMethod = 
  | 'mtn_momo' 
  | 'airtel_money' 
  | 'card' 
  | 'bank_transfer';

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'successful' 
  | 'failed' 
  | 'cancelled';

export interface PaymentTransaction {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: 'flutterwave' | 'manual';
  providerRef?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface PaymentRequest {
  amount: number;
  currency?: string;
  method: PaymentMethod;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  description: string;
  metadata?: Record<string, any>;
  redirectUrl?: string;
}

export interface PaymentResult {
  success: boolean;
  transaction?: PaymentTransaction;
  redirectUrl?: string;
  error?: string;
}

// ============ HELPER FUNCTIONS ============

export function generateReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SOP-${timestamp}-${random}`;
}

export function formatCurrency(amount: number, currency: string = 'RWF'): string {
  if (currency === 'RWF') {
    return new Intl.NumberFormat('en-RW', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' RWF';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatRwandaPhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('07')) {
    cleaned = '250' + cleaned.substring(1);
  } else if (cleaned.startsWith('7')) {
    cleaned = '250' + cleaned;
  } else if (!cleaned.startsWith('250')) {
    cleaned = '250' + cleaned;
  }
  
  return cleaned;
}

export function detectMobileProvider(phone: string): 'mtn' | 'airtel' | 'unknown' {
  const cleaned = formatRwandaPhone(phone);
  const prefix = cleaned.substring(3, 5);
  
  // MTN Rwanda: 78, 79
  if (['78', '79'].includes(prefix)) return 'mtn';
  
  // Airtel Rwanda: 72, 73
  if (['72', '73'].includes(prefix)) return 'airtel';
  
  return 'unknown';
}

// ============ CONFIGURATION CHECK ============

export function isFlutterwaveConfigured(): boolean {
  return FLUTTERWAVE_PUBLIC_KEY.startsWith('FLWPUBK');
}

export function getAvailableMethods(): PaymentMethod[] {
  if (isFlutterwaveConfigured()) {
    return ['mtn_momo', 'airtel_money', 'card', 'bank_transfer'];
  }
  return [];
}

// ============ FLUTTERWAVE INTEGRATION ============

interface FlutterwaveConfig {
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
  callback: (response: any) => void;
  onclose: () => void;
}

function getFlutterwavePaymentOption(method: PaymentMethod): string {
  switch (method) {
    case 'mtn_momo':
    case 'airtel_money':
      return 'mobilemoneyrwanda';
    case 'card':
      return 'card';
    case 'bank_transfer':
      return 'banktransfer';
    default:
      return 'card,mobilemoneyrwanda';
  }
}

export async function initiateFlutterwavePayment(
  request: PaymentRequest
): Promise<PaymentResult> {
  if (!isFlutterwaveConfigured()) {
    return { success: false, error: 'Flutterwave is not configured' };
  }

  const FlutterwaveCheckout = (window as any).FlutterwaveCheckout;
  
  if (!FlutterwaveCheckout) {
    return { success: false, error: 'Flutterwave SDK not loaded. Please refresh the page.' };
  }

  const reference = generateReference();
  
  // Create pending transaction
  const transaction: PaymentTransaction = {
    id: reference,
    reference,
    amount: request.amount,
    currency: request.currency || 'RWF',
    method: request.method,
    status: 'pending',
    provider: 'flutterwave',
    customerName: request.customer.name,
    customerEmail: request.customer.email,
    customerPhone: request.customer.phone,
    description: request.description,
    metadata: request.metadata,
    createdAt: new Date().toISOString(),
  };

  // Save pending transaction
  await saveTransaction(transaction);

  return new Promise((resolve) => {
    const config: FlutterwaveConfig = {
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: reference,
      amount: request.amount,
      currency: request.currency || 'RWF',
      payment_options: getFlutterwavePaymentOption(request.method),
      customer: {
        email: request.customer.email,
        phone_number: request.customer.phone ? formatRwandaPhone(request.customer.phone) : '',
        name: request.customer.name,
      },
      customizations: {
        title: 'Serenades of Praise Choir',
        description: request.description,
        logo: `${window.location.origin}/favicon.svg`,
      },
      meta: {
        ...request.metadata,
        source: 'choir_web',
      },
      callback: async (response: any) => {
        const updatedTransaction: Partial<PaymentTransaction> = {
          status: response.status === 'successful' ? 'successful' : 'failed',
          providerRef: response.flw_ref || response.transaction_id?.toString(),
          completedAt: new Date().toISOString(),
        };
        
        await updateTransaction(reference, updatedTransaction);
        
        resolve({
          success: response.status === 'successful',
          transaction: { ...transaction, ...updatedTransaction } as PaymentTransaction,
        });
      },
      onclose: async () => {
        // Check if payment was completed
        const savedTx = await getTransaction(reference);
        if (savedTx?.status === 'pending') {
          await updateTransaction(reference, { status: 'cancelled' });
          resolve({ success: false, error: 'Payment cancelled' });
        }
      },
    };

    FlutterwaveCheckout(config);
  });
}

// ============ UNIFIED PAYMENT FUNCTION ============

export async function initiatePayment(request: PaymentRequest): Promise<PaymentResult> {
  // All payments go through Flutterwave
  return initiateFlutterwavePayment(request);
}

// ============ TRANSACTION STORAGE ============

const TRANSACTIONS_KEY = 'choir_payment_transactions';

async function saveTransaction(transaction: PaymentTransaction): Promise<void> {
  if (isSupabaseConfigured()) {
    // Save to Supabase (you'd need to create a payment_transactions table)
    // For now, use localStorage
  }
  
  const transactions = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
  transactions.unshift(transaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions.slice(0, 1000)));
}

async function updateTransaction(
  reference: string,
  updates: Partial<PaymentTransaction>
): Promise<void> {
  const transactions = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
  const index = transactions.findIndex((t: PaymentTransaction) => t.reference === reference);
  
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates };
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  }
}

export async function getTransaction(reference: string): Promise<PaymentTransaction | null> {
  const transactions = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
  return transactions.find((t: PaymentTransaction) => t.reference === reference) || null;
}

export async function getAllTransactions(): Promise<PaymentTransaction[]> {
  return JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
}

export async function getTransactionsByStatus(status: PaymentStatus): Promise<PaymentTransaction[]> {
  const transactions = await getAllTransactions();
  return transactions.filter(t => t.status === status);
}

// ============ PAYMENT STATS ============

export async function getPaymentStats(): Promise<{
  total: number;
  successful: number;
  pending: number;
  failed: number;
  totalAmount: number;
  byMethod: Record<PaymentMethod, number>;
}> {
  const transactions = await getAllTransactions();
  
  const successful = transactions.filter(t => t.status === 'successful');
  
  const byMethod: Record<PaymentMethod, number> = {
    mtn_momo: 0,
    airtel_money: 0,
    card: 0,
    bank_transfer: 0,
  };
  
  successful.forEach(t => {
    byMethod[t.method] = (byMethod[t.method] || 0) + t.amount;
  });
  
  return {
    total: transactions.length,
    successful: successful.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    failed: transactions.filter(t => t.status === 'failed').length,
    totalAmount: successful.reduce((sum, t) => sum + t.amount, 0),
    byMethod,
  };
}

// ============ MANUAL PAYMENT RECORDING ============

export async function recordManualPayment(
  request: Omit<PaymentRequest, 'redirectUrl'> & { 
    providerRef?: string;
  }
): Promise<PaymentTransaction> {
  const reference = generateReference();
  
  const transaction: PaymentTransaction = {
    id: reference,
    reference,
    amount: request.amount,
    currency: request.currency || 'RWF',
    method: request.method,
    status: 'successful',
    provider: 'manual',
    providerRef: request.providerRef,
    customerName: request.customer.name,
    customerEmail: request.customer.email,
    customerPhone: request.customer.phone,
    description: request.description,
    metadata: request.metadata,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  await saveTransaction(transaction);
  return transaction;
}
