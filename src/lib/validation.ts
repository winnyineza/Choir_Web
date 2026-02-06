// Input Validation & Sanitization Utilities
// Security-focused validation for all user inputs

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// Phone number regex (international format)
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

// Password strength requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// XSS prevention - dangerous patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /data:/gi,
];

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/gi,
  /(--|;|\/\*|\*\/|')/g,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: string;
}

/**
 * Sanitize string input - removes XSS and dangerous patterns
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  
  let sanitized = input.trim();
  
  // Remove XSS patterns
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, "");
  });
  
  // Encode HTML entities
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
  
  return sanitized;
}

/**
 * Sanitize for display (decode back for UI)
 */
export function decodeHtmlEntities(input: string): string {
  if (typeof input !== "string") return "";
  
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  const trimmed = email?.trim().toLowerCase() || "";
  
  if (!trimmed) {
    errors.push("Email is required");
  } else if (trimmed.length > 254) {
    errors.push("Email is too long (max 254 characters)");
  } else if (!EMAIL_REGEX.test(trimmed)) {
    errors.push("Invalid email format");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: trimmed,
  };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password) {
    errors.push("Password is required");
  } else {
    if (password.length < PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain a lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain an uppercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain a number");
    }
    if (!/[@$!%*?&]/.test(password)) {
      errors.push("Password must contain a special character (@$!%*?&)");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  const trimmed = phone?.trim() || "";
  
  if (trimmed && !PHONE_REGEX.test(trimmed)) {
    errors.push("Invalid phone number format");
  }
  
  if (trimmed.length > 20) {
    errors.push("Phone number is too long");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: trimmed.replace(/[^\d+\-\s()]/g, ""),
  };
}

/**
 * Validate name (no numbers or special chars except hyphens and apostrophes)
 */
export function validateName(name: string, fieldName = "Name"): ValidationResult {
  const errors: string[] = [];
  const trimmed = name?.trim() || "";
  
  if (!trimmed) {
    errors.push(`${fieldName} is required`);
  } else if (trimmed.length < 2) {
    errors.push(`${fieldName} must be at least 2 characters`);
  } else if (trimmed.length > 100) {
    errors.push(`${fieldName} is too long (max 100 characters)`);
  } else if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    errors.push(`${fieldName} contains invalid characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: sanitizeString(trimmed),
  };
}

/**
 * Validate amount (positive number)
 */
export function validateAmount(amount: number | string, fieldName = "Amount"): ValidationResult {
  const errors: string[] = [];
  const numValue = typeof amount === "string" ? parseFloat(amount) : amount;
  
  if (isNaN(numValue)) {
    errors.push(`${fieldName} must be a valid number`);
  } else if (numValue < 0) {
    errors.push(`${fieldName} cannot be negative`);
  } else if (numValue > 999999999) {
    errors.push(`${fieldName} is too large`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: isNaN(numValue) ? undefined : String(numValue),
  };
}

/**
 * Validate URL
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];
  const trimmed = url?.trim() || "";
  
  if (trimmed) {
    try {
      const parsed = new URL(trimmed);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        errors.push("URL must use HTTP or HTTPS protocol");
      }
    } catch {
      errors.push("Invalid URL format");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: trimmed,
  };
}

/**
 * Validate date string
 */
export function validateDate(dateStr: string, fieldName = "Date"): ValidationResult {
  const errors: string[] = [];
  
  if (!dateStr) {
    errors.push(`${fieldName} is required`);
  } else {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      errors.push(`Invalid ${fieldName.toLowerCase()} format`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: dateStr,
  };
}

/**
 * Check for potential SQL injection
 */
export function hasSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Check for potential XSS
 */
export function hasXss(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Rate limiting helper - tracks attempts per key
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remainingAttempts: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // Clean up expired entries
  if (entry && entry.resetTime < now) {
    rateLimitStore.delete(key);
  }
  
  const current = rateLimitStore.get(key);
  
  if (!current) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remainingAttempts: config.maxAttempts - 1, resetIn: config.windowMs };
  }
  
  if (current.count >= config.maxAttempts) {
    return { allowed: false, remainingAttempts: 0, resetIn: current.resetTime - now };
  }
  
  current.count++;
  return { allowed: true, remainingAttempts: config.maxAttempts - current.count, resetIn: current.resetTime - now };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// Login rate limit config: 5 attempts per 15 minutes
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

// API rate limit config: 100 requests per minute
export const API_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minute
};
