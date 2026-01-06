// Promo Code Service - manages discount codes

export interface PromoCode {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number; // Percentage (0-100) or fixed amount in RWF
  minPurchase: number; // Minimum purchase amount to apply
  maxUses: number; // 0 = unlimited
  usedCount: number;
  validFrom: string;
  validUntil: string;
  eventId?: string; // Optional: limit to specific event
  isActive: boolean;
  createdAt: string;
}

const PROMO_KEY = "sop_promo_codes";

// Get all promo codes
export function getAllPromoCodes(): PromoCode[] {
  try {
    const stored = localStorage.getItem(PROMO_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save promo codes
function savePromoCodes(codes: PromoCode[]): void {
  localStorage.setItem(PROMO_KEY, JSON.stringify(codes));
}

// Generate unique code
function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "SOP";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create new promo code
export function createPromoCode(
  data: Omit<PromoCode, "id" | "code" | "usedCount" | "createdAt">
): PromoCode {
  const codes = getAllPromoCodes();
  
  // Generate unique code
  let code = generateCode();
  while (codes.some((c) => c.code === code)) {
    code = generateCode();
  }

  const newCode: PromoCode = {
    ...data,
    id: Date.now().toString(),
    code,
    usedCount: 0,
    createdAt: new Date().toISOString(),
  };

  codes.push(newCode);
  savePromoCodes(codes);
  return newCode;
}

// Update promo code
export function updatePromoCode(id: string, updates: Partial<PromoCode>): PromoCode | null {
  const codes = getAllPromoCodes();
  const index = codes.findIndex((c) => c.id === id);
  if (index === -1) return null;

  codes[index] = { ...codes[index], ...updates };
  savePromoCodes(codes);
  return codes[index];
}

// Delete promo code
export function deletePromoCode(id: string): boolean {
  const codes = getAllPromoCodes();
  const filtered = codes.filter((c) => c.id !== id);
  if (filtered.length === codes.length) return false;
  savePromoCodes(filtered);
  return true;
}

// Validate and apply promo code
export interface PromoValidation {
  valid: boolean;
  code?: PromoCode;
  discount: number;
  message: string;
}

export function validatePromoCode(
  codeStr: string,
  subtotal: number,
  eventId?: string
): PromoValidation {
  const codes = getAllPromoCodes();
  const code = codes.find((c) => c.code.toUpperCase() === codeStr.toUpperCase());

  if (!code) {
    return { valid: false, discount: 0, message: "Invalid promo code" };
  }

  if (!code.isActive) {
    return { valid: false, discount: 0, message: "This promo code is no longer active" };
  }

  const now = new Date();
  if (new Date(code.validFrom) > now) {
    return { valid: false, discount: 0, message: "This promo code is not yet valid" };
  }

  if (new Date(code.validUntil) < now) {
    return { valid: false, discount: 0, message: "This promo code has expired" };
  }

  if (code.maxUses > 0 && code.usedCount >= code.maxUses) {
    return { valid: false, discount: 0, message: "This promo code has reached its usage limit" };
  }

  if (subtotal < code.minPurchase) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum purchase of ${code.minPurchase.toLocaleString()} RWF required`,
    };
  }

  if (code.eventId && code.eventId !== eventId) {
    return { valid: false, discount: 0, message: "This promo code is not valid for this event" };
  }

  // Calculate discount
  let discount = 0;
  if (code.discountType === "percentage") {
    discount = Math.round((subtotal * code.discountValue) / 100);
  } else {
    discount = Math.min(code.discountValue, subtotal); // Can't discount more than subtotal
  }

  const discountText =
    code.discountType === "percentage"
      ? `${code.discountValue}% off`
      : `${code.discountValue.toLocaleString()} RWF off`;

  return {
    valid: true,
    code,
    discount,
    message: `${discountText} applied!`,
  };
}

// Mark promo code as used (increment usage count)
export function usePromoCode(codeStr: string): boolean {
  const codes = getAllPromoCodes();
  const index = codes.findIndex((c) => c.code.toUpperCase() === codeStr.toUpperCase());
  
  if (index === -1) return false;
  
  codes[index].usedCount++;
  savePromoCodes(codes);
  return true;
}

// Get promo code stats
export function getPromoStats() {
  const codes = getAllPromoCodes();
  const active = codes.filter((c) => c.isActive && new Date(c.validUntil) >= new Date());
  
  return {
    total: codes.length,
    active: active.length,
    totalUses: codes.reduce((sum, c) => sum + c.usedCount, 0),
  };
}

