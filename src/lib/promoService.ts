// Promo Code Service - manages discount codes

import { dbGetAll, dbGetById, dbInsert, dbUpdate, dbDelete, generateId } from './supabaseDB';

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

// Generate unique code (pure computation - stays sync)
function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "SOP";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get all promo codes
export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const codes = await dbGetAll<PromoCode>(PROMO_KEY);
  return codes || [];
}

// Create new promo code
export async function createPromoCode(
  data: Omit<PromoCode, "id" | "code" | "usedCount" | "createdAt">
): Promise<PromoCode> {
  const codes = await getAllPromoCodes();

  // Generate unique code
  let code = generateCode();
  while (codes.some((c) => c.code === code)) {
    code = generateCode();
  }

  const newCode: Omit<PromoCode, "id" | "createdAt"> = {
    ...data,
    code,
    usedCount: 0,
  };

  return dbInsert<PromoCode>(PROMO_KEY, newCode);
}

// Update promo code
export async function updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<PromoCode | null> {
  try {
    return await dbUpdate<PromoCode>(PROMO_KEY, id, updates);
  } catch {
    return null;
  }
}

// Delete promo code
export async function deletePromoCode(id: string): Promise<boolean> {
  try {
    await dbDelete(PROMO_KEY, id);
    return true;
  } catch {
    return false;
  }
}

// Validate and apply promo code
export interface PromoValidation {
  valid: boolean;
  code?: PromoCode;
  discount: number;
  message: string;
}

export async function validatePromoCode(
  codeStr: string,
  subtotal: number,
  eventId?: string
): Promise<PromoValidation> {
  const codes = await getAllPromoCodes();
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
export async function redeemPromoCode(codeStr: string): Promise<boolean> {
  const codes = await getAllPromoCodes();
  const code = codes.find((c) => c.code.toUpperCase() === codeStr.toUpperCase());

  if (!code) return false;

  try {
    await dbUpdate<PromoCode>(PROMO_KEY, code.id, {
      usedCount: code.usedCount + 1,
    });
    return true;
  } catch {
    return false;
  }
}

// Get promo code stats
export async function getPromoStats(): Promise<{
  total: number;
  active: number;
  totalUses: number;
}> {
  const codes = await getAllPromoCodes();
  const active = codes.filter((c) => c.isActive && new Date(c.validUntil) >= new Date());

  return {
    total: codes.length,
    active: active.length,
    totalUses: codes.reduce((sum, c) => sum + c.usedCount, 0),
  };
}
