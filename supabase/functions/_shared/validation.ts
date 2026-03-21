// ── Helpers ──────────────────────────────────────────────────────────

const HTML_TAG_RE = /<\/?[^>]+(>|$)/g;
const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};
const ESCAPE_RE = /[&<>"'/]/g;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const US_PHONE_RE = /^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i;
const OBD2_RE = /^[PBCU][0-9A-F]{4}$/i;
const URL_RE = /^https?:\/\/.+/i;

const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|TRUNCATE)\b)/i,
  /(--|;|\/\*|\*\/)/,
  /('|")\s*(OR|AND)\s*('|")/i,
  /\b(1\s*=\s*1|0\s*=\s*0)\b/,
];

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// ── Public API ──────────────────────────────────────────────────────

export function sanitizeHtml(input: string): string {
  return input.replace(HTML_TAG_RE, "").replace(ESCAPE_RE, (c) => ESCAPE_MAP[c] ?? c);
}

export function isValidEmail(email: string): boolean {
  return typeof email === "string" && email.length <= 255 && EMAIL_RE.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return typeof phone === "string" && US_PHONE_RE.test(phone.trim());
}

export function isValidZipCode(zip: string): boolean {
  return typeof zip === "string" && ZIP_RE.test(zip.trim());
}

export function isValidVin(vin: string): boolean {
  return typeof vin === "string" && VIN_RE.test(vin.trim());
}

export function isValidYear(year: number): boolean {
  const max = new Date().getFullYear() + 1;
  return Number.isInteger(year) && year >= 1900 && year <= max;
}

export function isValidObd2Code(code: string): boolean {
  return typeof code === "string" && OBD2_RE.test(code.trim());
}

export function isValidUrl(url: string): boolean {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidImageUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  try {
    const { hostname } = new URL(url.trim());
    return (
      hostname.endsWith("wrenchli.net") ||
      hostname.endsWith("supabase.co") ||
      hostname.endsWith("supabase.com")
    );
  } catch {
    return false;
  }
}

export function sanitizeString(
  input: unknown,
  maxLength = 500,
  allowHtml = false,
): string {
  if (typeof input !== "string") return "";
  let result = input.trim().slice(0, maxLength);
  if (!allowHtml) result = sanitizeHtml(result);
  return result;
}

export function sanitizeNumber(
  input: unknown,
  min = -Infinity,
  max = Infinity,
): number | null {
  const num = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

export interface FileUploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
}

export interface FileUploadResult {
  valid: boolean;
  error?: string;
}

export function validateFileUpload(
  file: { type: string; size: number },
  options: FileUploadOptions = {},
): FileUploadResult {
  const maxSize = options.maxSizeBytes ?? DEFAULT_MAX_FILE_SIZE;
  const allowed = options.allowedTypes ?? ALLOWED_IMAGE_TYPES;

  if (!allowed.includes(file.type)) {
    return { valid: false, error: `File type "${file.type}" is not allowed.` };
  }
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the ${(maxSize / 1024 / 1024).toFixed(0)}MB limit.`,
    };
  }
  return { valid: true };
}

export function containsSqlInjection(input: string): boolean {
  if (typeof input !== "string") return false;
  return SQL_PATTERNS.some((p) => p.test(input));
}

export interface SchemaField {
  type: "string" | "number" | "boolean" | "email" | "phone" | "zip" | "vin" | "year" | "obd2" | "url";
  required?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  sanitized: Record<string, unknown>;
}

export function validateRequestBody(
  body: Record<string, unknown>,
  schema: Record<string, SchemaField>,
): ValidationResult {
  const errors: Record<string, string> = {};
  const sanitized: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(schema)) {
    const raw = body[key];

    if (raw === undefined || raw === null || raw === "") {
      if (field.required) errors[key] = `${key} is required.`;
      continue;
    }

    switch (field.type) {
      case "string": {
        const s = sanitizeString(raw, field.maxLength);
        if (containsSqlInjection(s)) { errors[key] = `${key} contains invalid characters.`; break; }
        sanitized[key] = s;
        break;
      }
      case "number": {
        const n = sanitizeNumber(raw, field.min, field.max);
        if (n === null) { errors[key] = `${key} is not a valid number.`; break; }
        sanitized[key] = n;
        break;
      }
      case "boolean":
        sanitized[key] = Boolean(raw);
        break;
      case "email":
        if (!isValidEmail(String(raw))) { errors[key] = `${key} is not a valid email.`; break; }
        sanitized[key] = String(raw).trim();
        break;
      case "phone":
        if (!isValidPhone(String(raw))) { errors[key] = `${key} is not a valid US phone number.`; break; }
        sanitized[key] = String(raw).trim();
        break;
      case "zip":
        if (!isValidZipCode(String(raw))) { errors[key] = `${key} is not a valid ZIP code.`; break; }
        sanitized[key] = String(raw).trim();
        break;
      case "vin":
        if (!isValidVin(String(raw))) { errors[key] = `${key} is not a valid VIN.`; break; }
        sanitized[key] = String(raw).trim().toUpperCase();
        break;
      case "year": {
        const y = sanitizeNumber(raw);
        if (y === null || !isValidYear(y)) { errors[key] = `${key} is not a valid year.`; break; }
        sanitized[key] = y;
        break;
      }
      case "obd2":
        if (!isValidObd2Code(String(raw))) { errors[key] = `${key} is not a valid OBD-II code.`; break; }
        sanitized[key] = String(raw).trim().toUpperCase();
        break;
      case "url":
        if (!isValidUrl(String(raw))) { errors[key] = `${key} is not a valid URL.`; break; }
        sanitized[key] = String(raw).trim();
        break;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, sanitized };
}
