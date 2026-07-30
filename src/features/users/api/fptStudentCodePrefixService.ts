import { api } from "@/lib/api/apiClient";

export interface FptStudentCodePrefix {
  prefix: string;
  englishName: string;
  vietnameseName: string;
  majorGroup: string;
  majorCode?: string | null;
  note?: string | null;
  active: boolean;
  /** Số tài khoản đang dùng prefix này. Chỉ có ở endpoint /admin. */
  usageCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface FptStudentCodePrefixRequest {
  prefix: string;
  englishName: string;
  vietnameseName: string;
  majorGroup: string;
  majorCode?: string;
  note?: string;
  active?: boolean;
}

export const fptStudentCodePrefixService = {
  list: () =>
    api.get<FptStudentCodePrefix[]>("/api/v1/fpt-student-code-prefixes", false),

  listForAdmin: (includeInactive = true) =>
    api.get<FptStudentCodePrefix[]>(
      `/api/v1/fpt-student-code-prefixes/admin?includeInactive=${includeInactive}`,
    ),

  // POST = tạo mới, backend trả 409 nếu prefix đã tồn tại (không còn ghi đè âm thầm).
  create: (payload: FptStudentCodePrefixRequest) =>
    api.post<FptStudentCodePrefix>("/api/v1/fpt-student-code-prefixes", payload),

  // PUT = sửa prefix đã có. Prefix nằm ở path và KHÔNG đổi được (nó là khoá chính, đổi sẽ
  // làm mọi MSSV đang dùng bị mồ côi).
  update: (prefix: string, payload: FptStudentCodePrefixRequest) =>
    api.put<FptStudentCodePrefix>(
      `/api/v1/fpt-student-code-prefixes/${encodeURIComponent(prefix)}`,
      payload,
    ),

  setActive: (prefix: string, active: boolean) =>
    api.patch<FptStudentCodePrefix>(
      `/api/v1/fpt-student-code-prefixes/${encodeURIComponent(prefix)}/active?active=${active}`,
      {},
    ),
};
