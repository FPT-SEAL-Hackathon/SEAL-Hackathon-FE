/**
 * Lớp thứ nhất của mô hình xử lý lỗi 2 tầng.
 *
 *  - NGƯỜI DÙNG CUỐI: chỉ thấy câu trong file này — tiếng người, nói rõ phải làm gì.
 *  - LẬP TRÌNH VIÊN: xem chi tiết kỹ thuật (status, code, message gốc của backend,
 *    fieldErrors, stack) qua console.error mà apiClient ghi ra — mở DevTools là thấy.
 *
 * Nguyên tắc: KHÔNG bao giờ hiển thị message thô của backend nếu đã có mapping,
 * vì message đó có thể chứa tên class, tên bảng/cột hoặc mảnh SQL.
 * Backend trả `error` (mã máy đọc) trong ErrorResponse — đó là khoá tra ở đây.
 */

/** Map mã lỗi backend -> câu cho người dùng cuối. Khoá khớp `ErrorResponse.error`. */
const MESSAGE_BY_CODE: Record<string, string> = {
  // ── Auth / phiên đăng nhập ──────────────────────────────────────────────
  INVALID_CREDENTIALS: "Incorrect email or password.",
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  ACCOUNT_DISABLED: "This account has been deactivated. Please contact the organizers.",
  EMAIL_NOT_VERIFIED: "Please verify your email address before signing in.",
  ACCOUNT_REMOVED: "This account has been removed. Please create a new account.",
  ACCOUNT_LINK_REQUIRED: "An account with this email already exists. Verify your identity to link them.",
  ACCESS_DENIED: "You do not have permission to do this.",
  PROFILE_INCOMPLETE: "Please complete your profile before continuing.",

  // ── Dữ liệu / xác thực đầu vào ──────────────────────────────────────────
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  BAD_REQUEST: "That request could not be processed. Please review your input.",
  NOT_FOUND: "We could not find what you were looking for.",
  DUPLICATE_RESOURCE: "This already exists. Please use a different value.",
  DATA_INTEGRITY_VIOLATION: "This change conflicts with existing data.",
  REGISTRATION_CONFLICT: "This conflicts with the current state. Please refresh and try again.",
  PROFILE_CONFLICT: "Some of this information is already used by another account.",
  MERGE_BLOCKED: "These accounts cannot be linked automatically. Please contact the organizers.",
  CONCURRENT_MODIFICATION: "Someone else just changed this. Please refresh and try again.",

  // ── Tích hợp GitHub ─────────────────────────────────────────────────────
  REPOSITORY_SYNC_ALREADY_RUNNING: "A sync is already running for this submission. Please wait a moment.",
  GITHUB_REPOSITORY_NOT_FOUND: "That GitHub repository could not be found. Check the URL.",
  PRIVATE_REPOSITORY_NOT_SUPPORTED: "Private repositories are not supported. Please make it public.",
  GITHUB_RATE_LIMITED: "GitHub is rate-limiting us right now. Please try again in a few minutes.",
  GITHUB_TIMEOUT: "GitHub did not respond in time. Please try again.",
  GITHUB_UPSTREAM_ERROR: "GitHub is unavailable right now. Please try again later.",
  INVALID_GITHUB_REPOSITORY_URL: "That does not look like a valid GitHub repository URL.",

  // ── Lỗi hệ thống ────────────────────────────────────────────────────────
  INTERNAL_SERVER_ERROR: "Something went wrong on our side. Please try again later.",
};

/** Dự phòng theo HTTP status khi không có mã lỗi nào khớp. */
const MESSAGE_BY_STATUS: Record<number, string> = {
  400: "That request could not be processed. Please review your input.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to do this.",
  404: "We could not find what you were looking for.",
  409: "This conflicts with the current state. Please refresh and try again.",
  413: "That file is too large.",
  429: "Too many requests. Please slow down and try again shortly.",
  500: "Something went wrong on our side. Please try again later.",
  502: "The server is unreachable right now. Please try again later.",
  503: "The service is temporarily unavailable. Please try again later.",
  504: "The server took too long to respond. Please try again.",
};

const GENERIC_FALLBACK = "Something went wrong. Please try again.";

/**
 * Chọn câu hiển thị cho người dùng.
 *
 * Thứ tự CỐ Ý: mã lỗi -> status -> message của backend -> câu chung.
 * Trước đây thứ tự bị ngược (`backendMessage || "friendly"`) nên chuỗi kỹ thuật của
 * backend luôn thắng và các câu thân thiện thành code chết.
 *
 * `backendMessage` chỉ dùng khi không có mapping nào — thường là các thông báo nghiệp
 * vụ do chính chúng ta viết (vd "Min team size cannot be greater than max team size").
 */
export function friendlyMessage(
  status?: number,
  code?: string,
  backendMessage?: string,
): string {
  if (code && MESSAGE_BY_CODE[code]) return MESSAGE_BY_CODE[code];
  if (backendMessage && backendMessage.trim() && !looksTechnical(backendMessage)) {
    return backendMessage.trim();
  }
  if (status && MESSAGE_BY_STATUS[status]) return MESSAGE_BY_STATUS[status];
  return GENERIC_FALLBACK;
}

/**
 * Chặn lưới cuối: nhận diện chuỗi rõ ràng là của máy hoặc chuỗi fallback mặc định
 * để không đẩy ra UI (tên class Java, package, dấu vết SQL/JDBC, stack trace, Request failed).
 */
function looksTechnical(message: string): boolean {
  const trimmed = message.trim();
  return (
    /^Request failed \(\d+\)$/i.test(trimmed) ||
    /^Request failed$/i.test(trimmed) ||
    /(^|\s)(java|jakarta|org)\.[a-z]+\./i.test(trimmed) ||
    /Exception\b|Throwable\b/.test(trimmed) ||
    /\bat [\w.$]+\([\w.]+:\d+\)/.test(trimmed) ||
    /\b(SELECT|INSERT|UPDATE|DELETE)\b.*\b(FROM|INTO|SET|WHERE)\b/i.test(trimmed) ||
    /SQLState|JDBC|Hibernate/i.test(trimmed)
  );
}
