export type MomoCollectionStatus =
  | "pending"
  | "processing"
  | "successful"
  | "failed";

const RWANDA_COUNTRY_CODE = "250";
const MTN_PREFIXES = new Set(["78", "79"]);
const AIRTEL_PREFIXES = new Set(["72", "73"]);

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeRwandaMsisdn(phone: string): string {
  const cleaned = digitsOnly(phone);

  if (!cleaned) return "";
  if (cleaned.startsWith(`${RWANDA_COUNTRY_CODE}0`)) {
    return `${RWANDA_COUNTRY_CODE}${cleaned.slice(4)}`;
  }
  if (cleaned.startsWith("0")) {
    return `${RWANDA_COUNTRY_CODE}${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith(RWANDA_COUNTRY_CODE)) {
    return cleaned;
  }
  if (cleaned.length === 9) {
    return `${RWANDA_COUNTRY_CODE}${cleaned}`;
  }
  return cleaned;
}

export function getRwandaNetwork(phone: string): "mtn" | "airtel" | "unknown" {
  const normalized = normalizeRwandaMsisdn(phone);
  if (!normalized.startsWith(RWANDA_COUNTRY_CODE) || normalized.length < 5) {
    return "unknown";
  }

  const prefix = normalized.slice(3, 5);
  if (MTN_PREFIXES.has(prefix)) return "mtn";
  if (AIRTEL_PREFIXES.has(prefix)) return "airtel";
  return "unknown";
}

export function isValidRwandaMsisdn(phone: string): boolean {
  const normalized = normalizeRwandaMsisdn(phone);
  return /^2507\d{8}$/.test(normalized);
}

export function isValidMtnRwandaMsisdn(phone: string): boolean {
  return getRwandaNetwork(phone) === "mtn";
}

export function mapMomoCollectionStatus(status?: string | null): MomoCollectionStatus {
  const normalized = (status || "").trim().toUpperCase();

  if (["SUCCESSFUL", "SUCCESS", "COMPLETED", "FULFILLED"].includes(normalized)) {
    return "successful";
  }

  if (["FAILED", "REJECTED", "TIMEOUT", "CANCELLED", "CANCELED", "EXPIRED"].includes(normalized)) {
    return "failed";
  }

  if (["PENDING", "PENDING_APPROVAL", "ONGOING", "PROCESSING", "IN_PROGRESS"].includes(normalized)) {
    return "processing";
  }

  return "pending";
}

export function getMomoFeatureFlag(): boolean {
  return String(import.meta.env.VITE_ENABLE_MTN_MOMO || "").toLowerCase() === "true";
}

