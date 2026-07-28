// Quy tắc chuẩn hóa hồ sơ — KHỚP với BE (ProfileValidation.java).
// FPT: SE/SS/SA + 6 số; SĐT: số di động VN; External code: linh hoạt 3-50 ký tự.

export const FPT_CODE_REGEX = /^(SE|SS|SA)\d{6}$/;
export const EXTERNAL_CODE_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]{2,49}$/;
export const VN_PHONE_REGEX = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

// Giữ ĐỒNG BỘ từng chữ với ProfileValidation.java — MyProfileSection render
// profileIssues trả về từ backend, nên hai bên lệch là người dùng thấy 2 giọng khác nhau.
export const MSG_FPT_CODE = "FPT student code must be SE/SS/SA followed by 6 digits (e.g. SE123456).";
export const MSG_EXTERNAL_CODE = "External student code is invalid (3–50 letters/digits, dot, underscore or hyphen).";
export const MSG_PHONE = "Enter a valid Vietnamese mobile number (e.g. 0912345678).";
export const MSG_UNIVERSITY = "External students must provide their university name.";

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
