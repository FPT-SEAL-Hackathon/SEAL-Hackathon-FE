import { api } from "@/lib/api/apiClient";

export interface FptStudentCodePrefix {
  prefix: string;
  englishName: string;
  vietnameseName: string;
  majorGroup: string;
  majorCode?: string | null;
  note?: string | null;
  active: boolean;
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

  save: (payload: FptStudentCodePrefixRequest) =>
    api.post<FptStudentCodePrefix>("/api/v1/fpt-student-code-prefixes", payload),

  setActive: (prefix: string, active: boolean) =>
    api.patch<FptStudentCodePrefix>(
      `/api/v1/fpt-student-code-prefixes/${encodeURIComponent(prefix)}/active?active=${active}`,
      {},
    ),
};
