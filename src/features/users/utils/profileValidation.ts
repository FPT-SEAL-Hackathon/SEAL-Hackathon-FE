import type { FptStudentCodePrefix } from "@/features/users/api/fptStudentCodePrefixService";

export const FPT_CODE_REGEX = /^[A-Za-z]{2}\d{6}$/;
export const EXTERNAL_CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]{2,49}$/;
export const VN_PHONE_REGEX = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

export const MSG_FPT_CODE = "FPT student code must start with an active FPT major prefix and be followed by 6 digits (e.g. SE123456).";
export const MSG_EXTERNAL_CODE = "External student code is invalid (3-50 letters/digits, dot, underscore or hyphen).";
export const MSG_PHONE = "Enter a valid Vietnamese mobile number (e.g. 0912345678).";
export const MSG_UNIVERSITY = "External students must provide their university name.";
export const MSG_HTTP_URL = "URL phải bắt đầu bằng http:// hoặc https:// (ví dụ https://github.com/username).";

export function normalizeFptStudentCode(value: string): string {
  return value.trim().toUpperCase();
}

export function getFptStudentCodePrefixInfo(
  value: string,
  prefixes: FptStudentCodePrefix[] = [],
): FptStudentCodePrefix | null {
  const normalized = normalizeFptStudentCode(value);
  if (normalized.length < 2) return null;
  const prefix = normalized.slice(0, 2);
  return prefixes.find(item => item.active && item.prefix.toUpperCase() === prefix) ?? null;
}

export function isValidFptStudentCode(value: string, prefixes?: FptStudentCodePrefix[]): boolean {
  const normalized = normalizeFptStudentCode(value);
  if (!FPT_CODE_REGEX.test(normalized)) return false;
  if (!prefixes) return true;
  return !!getFptStudentCodePrefixInfo(normalized, prefixes);
}

export function isValidExternalStudentCode(value: string): boolean {
  return EXTERNAL_CODE_REGEX.test(value.trim());
}

export function isValidVietnamesePhone(value: string): boolean {
  const normalized = value.trim().replace(/[\s.()\-]/g, "");
  return VN_PHONE_REGEX.test(normalized);
}

export function isOptionalHttpUrl(value?: string | null): boolean {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return true;
  if (!/^https?:\/\/\S+$/i.test(trimmed)) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

