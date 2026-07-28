// Quy tắc chuẩn hóa hồ sơ — KHỚP với BE (ProfileValidation.java).
// FPT: SE/SS/SA + 6 số; SĐT: số di động VN; External code: linh hoạt 3-50 ký tự.

export const FPT_CODE_REGEX = /^(SE|SS|SA)\d{6}$/;
export const EXTERNAL_CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]{2,49}$/;
export const VN_PHONE_REGEX = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

export const MSG_FPT_CODE = "Mã sinh viên FPT phải có dạng SE/SS/SA + 6 số (ví dụ SE123456).";
export const MSG_EXTERNAL_CODE = "Mã sinh viên (ngoài trường) chưa hợp lệ (3–50 ký tự chữ/số, cho . _ -).";
export const MSG_PHONE = "Số điện thoại phải là số di động Việt Nam hợp lệ (vd 0912345678).";
export const MSG_HTTP_URL = "URL phải bắt đầu bằng http:// hoặc https:// (ví dụ https://github.com/username).";

export function isValidFptStudentCode(value: string): boolean {
  return FPT_CODE_REGEX.test(value.trim());
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

