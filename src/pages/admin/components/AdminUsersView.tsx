import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { AlertTriangle, Edit, Loader, PlusCircle, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router";
import { parseApiError } from "@/lib/api/apiClient";
import { isValidVietnamesePhone } from "@/features/users/utils/profileValidation";
import { Button, Card, COLORS, SectionHeader, StatusBadge } from "@/components/shared/UIComponents";
import { FacetGroup, FacetOptionRow, FilterChip, FilterSortButton, FilterSortPanel } from "@/components/shared/FilterSortPanel";
import {
  userService,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserFacetsResponse,
  type UserManagementUser,
  type UserQueryParams,
} from "@/features/users/api/userService";

const ROLE_OPTIONS = [
  { label: "FPT Student", value: "FPT_STUDENT" },
  { label: "External Student", value: "EXTERNAL_STUDENT" },
  { label: "Admin", value: "ADMIN" },
  { label: "Organizer", value: "ORGANIZER" },
  { label: "Internal Judge", value: "INTERNAL_JUDGE" },
  { label: "Guest Judge", value: "GUEST_JUDGE" },
  { label: "Mentor", value: "MENTOR" },
  { label: "Expert", value: "EXPERT" },
];

const STATUS_OPTIONS = [
  // "Pending Approval" đã bỏ: duyệt nay ở cấp TEAM (team status PENDING), không duyệt từng học sinh.
  { label: "Active", value: "ACTIVE" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Suspended", value: "SUSPENDED" },
  { label: "Temporary", value: "TEMPORARY" },
  { label: "Unverified", value: "UNVERIFIED" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];

type UserFormState = {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  accountStatus: string;
  password: string;
  fptStudentCode: string;
  externalStudentCode: string;
  universityName: string;
  accountExpiresAt: string;
};

type UserModalState =
  | { mode: "create"; user?: undefined }
  | { mode: "edit"; user: UserManagementUser }
  | null;

const emptyForm: UserFormState = {
  fullName: "",
  email: "",
  phone: "",
  role: "FPT_STUDENT",
  accountStatus: "UNVERIFIED",
  password: "",
  fptStudentCode: "",
  externalStudentCode: "",
  universityName: "FPT University",
  accountExpiresAt: "",
};

function normalizeBadgeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/^role_/, "");
}

function labelValue(value?: string) {
  if (!value) return "-";
  return value.replace(/^ROLE_/, "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value: string) {
  // SĐT optional; nếu có thì phải là số di động VN (khớp BE ProfileValidation).
  return !value || isValidVietnamesePhone(value);
}

function normalizeRoleValue(role?: string) {
  return (role ?? "").replace(/^ROLE_/, "").toUpperCase();
}

function defaultStatusForRole(role: string) {
  const normalized = normalizeRoleValue(role);
  if (normalized === "FPT_STUDENT" || normalized === "EXTERNAL_STUDENT") return "UNVERIFIED";
  if (normalized === "GUEST_JUDGE") return "TEMPORARY";
  return "ACTIVE";
}

function isFptStudentRole(role: string) {
  return normalizeRoleValue(role) === "FPT_STUDENT";
}

function isExternalStudentRole(role: string) {
  return normalizeRoleValue(role) === "EXTERNAL_STUDENT";
}

function isStudentRole(role: string) {
  return isFptStudentRole(role) || isExternalStudentRole(role);
}

function compactPayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ""),
  ) as T;
}

function studentCodeFor(user: UserManagementUser) {
  const role = normalizeRoleValue(user.role);
  if (role === "FPT_STUDENT") return user.fptStudentCode || "N/A";
  if (role === "EXTERNAL_STUDENT") return user.externalStudentCode || "N/A";
  return "N/A";
}

function universityFor(user: UserManagementUser) {
  return normalizeRoleValue(user.role) === "EXTERNAL_STUDENT" ? user.universityName || "N/A" : "N/A";
}

function teamLabelFor(user: UserManagementUser) {
  return isStudentRole(user.role) ? user.teamName || "No team" : "N/A";
}

// "FPT_STUDENT,ORGANIZER" (URL) <-> ["FPT_STUDENT","ORGANIZER"] (state)
function parseCsvParam(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").map(item => item.trim()).filter(Boolean);
}

export function AdminUsersView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState<UserManagementUser[]>([]);
  // Khởi tạo từ URL: share link / F5 / back-forward khôi phục đúng bộ lọc.
  const [filters, setFilters] = useState<UserQueryParams>(() => ({
    search: searchParams.get("q") ?? "",
    teamName: searchParams.get("team") ?? "",
    joinedFrom: searchParams.get("from") ?? "",
    joinedTo: searchParams.get("to") ?? "",
    page: Math.max(Number(searchParams.get("page") ?? 0) || 0, 0),
    size: Number(searchParams.get("size") ?? 10) || 10,
    sortBy: searchParams.get("sortBy") ?? "createdAt",
    sortDir: searchParams.get("sortDir") === "asc" ? "asc" : "desc",
  }));
  // Facet multi-select: OR trong nhóm, AND giữa nhóm (mã canonical trong URL).
  const [selectedRoles, setSelectedRoles] = useState<string[]>(() => parseCsvParam(searchParams.get("role")));
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => parseCsvParam(searchParams.get("status")));
  const [facets, setFacets] = useState<UserFacetsResponse | null>(null);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<{ role: boolean; status: boolean; date: boolean; sort: boolean }>({
    role: true,
    status: true,
    date: false,
    sort: false,
  });
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParams.get("q") ?? "");
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<UserModalState>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const lastWrittenQs = useRef<string>(searchParams.toString());

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search ?? "");
      setFilters(prev => ({ ...prev, page: 0 }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  // Serialize trạng thái filter -> query string (bỏ giá trị mặc định cho URL gọn).
  const serializeToParams = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (selectedRoles.length > 0) params.set("role", selectedRoles.join(","));
    if (selectedStatuses.length > 0) params.set("status", selectedStatuses.join(","));
    if (filters.teamName) params.set("team", String(filters.teamName));
    if (filters.joinedFrom) params.set("from", String(filters.joinedFrom));
    if (filters.joinedTo) params.set("to", String(filters.joinedTo));
    if ((filters.page ?? 0) > 0) params.set("page", String(filters.page));
    if ((filters.size ?? 10) !== 10) params.set("size", String(filters.size));
    if (filters.sortBy && filters.sortBy !== "createdAt") params.set("sortBy", String(filters.sortBy));
    if (filters.sortDir && filters.sortDir !== "desc") params.set("sortDir", String(filters.sortDir));
    return params;
  };

  // Ghi trạng thái vào URL (History API, replace để không spam lịch sử).
  useEffect(() => {
    const params = serializeToParams();
    const qs = params.toString();
    if (qs !== searchParams.toString()) {
      lastWrittenQs.current = qs;
      setSearchParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    selectedRoles,
    selectedStatuses,
    filters.teamName,
    filters.joinedFrom,
    filters.joinedTo,
    filters.page,
    filters.size,
    filters.sortBy,
    filters.sortDir,
  ]);

  // Đọc lại khi URL đổi từ bên ngoài (back/forward) — guard tránh vòng lặp.
  useEffect(() => {
    const qs = searchParams.toString();
    if (qs === lastWrittenQs.current) return;
    lastWrittenQs.current = qs;
    setFilters({
      search: searchParams.get("q") ?? "",
      teamName: searchParams.get("team") ?? "",
      joinedFrom: searchParams.get("from") ?? "",
      joinedTo: searchParams.get("to") ?? "",
      page: Math.max(Number(searchParams.get("page") ?? 0) || 0, 0),
      size: Number(searchParams.get("size") ?? 10) || 10,
      sortBy: searchParams.get("sortBy") ?? "createdAt",
      sortDir: searchParams.get("sortDir") === "asc" ? "asc" : "desc",
    });
    setSelectedRoles(parseCsvParam(searchParams.get("role")));
    setSelectedStatuses(parseCsvParam(searchParams.get("status")));
    setDebouncedSearch(searchParams.get("q") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const buildQuery = (): UserQueryParams => ({
    ...filters,
    search: debouncedSearch || undefined,
    role: selectedRoles.length > 0 ? selectedRoles : undefined,
    status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    accountStatus: undefined,
    teamName: filters.teamName || undefined,
    joinedFrom: filters.joinedFrom || undefined,
    joinedTo: filters.joinedTo || undefined,
    // Admin xem cả account soft-deleted (hiển thị mờ, readonly, chỉ cho Delete Forever).
    includeDeleted: true,
  });

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const page = await userService.getUsers(buildQuery());
      setUsers(page.content);
      setTotalElements(page.totalElements);
      setTotalPages(Math.max(page.totalPages, 1));
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else if (parsed.status === 403) {
        setError("You do not have permission to manage users.");
      } else {
        setError(parsed.message || "Failed to load users.");
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    selectedRoles,
    selectedStatuses,
    filters.teamName,
    filters.joinedFrom,
    filters.joinedTo,
    filters.page,
    filters.size,
    filters.sortBy,
    filters.sortDir,
  ]);

  // Facet counts (drill-down) cập nhật theo bộ lọc — dùng cho số cạnh option + preview CTA.
  useEffect(() => {
    let cancelled = false;
    userService.getUserFacets(buildQuery())
      .then(data => {
        if (!cancelled) setFacets(data);
      })
      .catch(() => {
        if (!cancelled) setFacets(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedRoles, selectedStatuses, filters.teamName, filters.joinedFrom, filters.joinedTo]);

  const setFilter = (key: keyof UserQueryParams, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === "page" ? Number(value) : 0 }));
  };

  // Tick/untick một option trong nhóm facet — reset page về 0 như đổi filter.
  const toggleRole = (code: string) => {
    setSelectedRoles(prev => prev.includes(code) ? prev.filter(item => item !== code) : [...prev, code]);
    setFilters(prev => ({ ...prev, page: 0 }));
  };

  const toggleStatus = (code: string) => {
    setSelectedStatuses(prev => prev.includes(code) ? prev.filter(item => item !== code) : [...prev, code]);
    setFilters(prev => ({ ...prev, page: 0 }));
  };

  const clearAllFacets = () => {
    setSelectedRoles([]);
    setSelectedStatuses([]);
    setFilters(prev => ({ ...prev, page: 0 }));
  };

  const facetCount = (group: "roles" | "statuses", code: string): number | null => {
    const option = facets?.[group]?.find(item => item.code === code);
    return option ? option.count : null;
  };

  const activeFilterCount = selectedRoles.length
    + selectedStatuses.length
    + (filters.joinedFrom ? 1 : 0)
    + (filters.joinedTo ? 1 : 0);

  const openCreate = () => {
    setFieldErrors({});
    setForm(emptyForm);
    setModal({ mode: "create" });
  };

  const openEdit = (user: UserManagementUser) => {
    setFieldErrors({});
    setForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? "",
      role: normalizeRoleValue(user.role),
      accountStatus: user.accountStatus || defaultStatusForRole(user.role),
      password: "",
      fptStudentCode: user.fptStudentCode ?? "",
      externalStudentCode: user.externalStudentCode ?? "",
      universityName: user.universityName ?? "",
      accountExpiresAt: "",
    });
    setModal({ mode: "edit", user });
  };

  const closeModal = () => {
    if (mutating) return;
    setModal(null);
    setFieldErrors({});
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    else if (!isValidEmail(form.email.trim())) nextErrors.email = "Invalid email address.";
    if (!form.role.trim()) nextErrors.role = "Role is required.";
    if (!form.accountStatus.trim()) nextErrors.accountStatus = "Status is required.";
    if (modal?.mode === "create" && !form.password.trim()) nextErrors.password = "Password is required.";
    if (!isValidPhone(form.phone.trim())) nextErrors.phone = "Invalid phone number.";
    if (isFptStudentRole(form.role) && !form.fptStudentCode.trim()) {
      nextErrors.fptStudentCode = "FPT student code is required.";
    }
    if (isExternalStudentRole(form.role) && (!form.externalStudentCode.trim() || !form.universityName.trim())) {
      const message = "External student code and university name are required.";
      if (!form.externalStudentCode.trim()) nextErrors.externalStudentCode = message;
      if (!form.universityName.trim()) nextErrors.universityName = message;
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildCreatePayload = (): CreateUserRequest => {
    const role = normalizeRoleValue(form.role);
    const base = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      role,
      accountStatus: form.accountStatus,
      password: form.password,
    };
    if (role === "FPT_STUDENT") {
      return compactPayload({ ...base, fptStudentCode: form.fptStudentCode.trim(), universityName: "FPT University" });
    }
    if (role === "EXTERNAL_STUDENT") {
      return compactPayload({
        ...base,
        externalStudentCode: form.externalStudentCode.trim(),
        universityName: form.universityName.trim(),
      });
    }
    if (role === "GUEST_JUDGE") {
      return compactPayload({ ...base, accountExpiresAt: form.accountExpiresAt.trim() || undefined });
    }
    return compactPayload(base);
  };

  const buildUpdatePayload = (): UpdateUserRequest => {
    const role = normalizeRoleValue(form.role);
    const base = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || undefined,
      role,
      accountStatus: form.accountStatus,
    };
    if (role === "FPT_STUDENT") {
      return compactPayload({ ...base, fptStudentCode: form.fptStudentCode.trim(), universityName: "FPT University" });
    }
    if (role === "EXTERNAL_STUDENT") {
      return compactPayload({
        ...base,
        externalStudentCode: form.externalStudentCode.trim(),
        universityName: form.universityName.trim(),
      });
    }
    if (role === "GUEST_JUDGE") {
      return compactPayload({ ...base, accountExpiresAt: form.accountExpiresAt.trim() || undefined });
    }
    return compactPayload(base);
  };

  const submitForm = async () => {
    if (!modal || !validateForm()) return;
    setMutating(true);
    setFieldErrors({});
    try {
      if (modal.mode === "create") {
        await userService.createUser(buildCreatePayload());
        toast.success("User created successfully.");
      } else {
        await userService.updateUser(modal.user.userId, buildUpdatePayload());
        toast.success("User updated successfully.");
      }
      setModal(null);
      await loadUsers();
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldErrors({ ...(parsed.fieldErrors ?? {}), message: parsed.message });
      toast.error(parsed.message || "User save failed.");
    } finally {
      setMutating(false);
    }
  };

  // Deactivate (reversible): BE khóa đăng nhập (status Suspended) + thu hồi session,
  // GIỮ ghế trong team và tự chuyển quyền leader nếu cần để team không bị đóng băng.
  // Bật lại bằng Edit → Status → Active. Hiện tóm tắt tác động (team chuyển leader,
  // cảnh báo judge/organizer) cho organizer nắm.
  const deleteUser = async (user: UserManagementUser) => {
    if (!window.confirm(
      `Deactivate ${user.fullName}?\n\n` +
      "The account is locked from logging in but stays on the team (seat kept). " +
      "If this user is a team leader, leadership is transferred automatically so the " +
      "team can keep competing. Reactivate anytime via Edit → Status → Active.",
    )) return;
    setMutating(true);
    try {
      const result = await userService.deleteUser(user.userId);
      toast.success("User deactivated. Reactivate via Edit → Status → Active.");
      (result?.transferredTeams ?? []).forEach(t => toast.info(`Leader transferred: ${t}`));
      (result?.warnings ?? []).forEach(w => toast.warning(w));
      await loadUsers();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setMutating(false);
    }
  };

  // Quét account có hồ sơ chưa chuẩn (mã SV/SĐT sai định dạng) và gửi notification nhắc.
  // KHÔNG khóa/chặn account nào — chỉ nhắc để họ tự cập nhật cho đồng bộ dữ liệu.
  const notifyNonCompliant = async () => {
    if (!window.confirm("Gửi thông báo nhắc cập nhật hồ sơ cho tất cả tài khoản có dữ liệu chưa chuẩn?")) return;
    setMutating(true);
    try {
      const result = await userService.notifyNonCompliant();
      toast.success(`Đã nhắc ${result.notifiedCount} tài khoản cập nhật hồ sơ.`);
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setMutating(false);
    }
  };

  // Mở khóa account Suspended: đổi status về Active qua endpoint sẵn có.
  const reactivateUser = async (user: UserManagementUser) => {
    if (!window.confirm(`Reactivate ${user.fullName}? The account will be able to log in again.`)) return;
    setMutating(true);
    try {
      await userService.updateUserStatus(user.userId, { status: "ACTIVE" });
      toast.success("User reactivated.");
      await loadUsers();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setMutating(false);
    }
  };

  // Hard delete ("Delete Forever") đã gỡ khỏi UI — chức năng còn ở backend nhưng
  // tạm không dùng. Deactivate (reversible) là thao tác vô hiệu hóa tài khoản chính.

  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col gap-3">
      <div className="flex-shrink-0">
        <SectionHeader
          title="User Management"
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={loading ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />} onClick={loadUsers} disabled={loading}>
                Refresh
              </Button>
              <Button variant="outline" size="sm" disabled={mutating} onClick={notifyNonCompliant}>
                Quét & nhắc chuẩn hóa
              </Button>
              <Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={openCreate}>
                Add User
              </Button>
            </div>
          }
        />
      </div>

      <Card className="p-5 flex-shrink-0">
        {/* Ngoài trang chỉ giữ search text; mọi thuộc tính CHỌN (ngày, sort, facet)
            nằm trong panel "Filter and sort" để không che bảng danh sách. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FilterInput
            label="Search"
            value={filters.search ?? ""}
            onChange={value => setFilters(prev => ({ ...prev, search: value }))}
            placeholder="Name, email, phone"
            icon={<Search size={14} />}
          />
          <FilterInput label="Team" value={filters.teamName ?? ""} onChange={value => setFilter("teamName", value)} placeholder="Team name" />
          <div className="flex items-end">
            <FilterSortButton activeCount={activeFilterCount} onClick={() => setFilterPanelOpen(true)} />
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {selectedRoles.map(code => (
              <FilterChip
                key={`role-${code}`}
                label={`Role: ${ROLE_OPTIONS.find(option => option.value === code)?.label ?? code}`}
                onRemove={() => toggleRole(code)}
              />
            ))}
            {selectedStatuses.map(code => (
              <FilterChip
                key={`status-${code}`}
                label={`Status: ${STATUS_OPTIONS.find(option => option.value === code)?.label ?? code}`}
                onRemove={() => toggleStatus(code)}
              />
            ))}
            <button
              type="button"
              onClick={clearAllFacets}
              style={{ fontSize: 12, fontWeight: 600, color: COLORS.primary, textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </Card>

      {error && (
        <Card className="p-4 flex-shrink-0" style={{ border: `1px solid ${COLORS.error}30` }}>
          <div className="flex items-center gap-2" style={{ color: COLORS.error, fontSize: 13, fontWeight: 700 }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        </Card>
      )}

      <Card className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto" style={{ overscrollBehavior: "contain" }}>
          <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: 1080 }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {["User", "Code", "University", "Role", "Team", "Status", "Joined", "Actions"].map(header => (
                  <Th key={header}>{header}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center" style={{ color: COLORS.textSecondary }}>
                    <Loader size={18} className="animate-spin inline-block mr-2" />
                    Loading users...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center" style={{ color: COLORS.textSecondary }}>
                    {error ? "No users loaded because the request failed." : "No users found."}
                  </td>
                </tr>
              )}
              {!loading && users.map((user, index) => {
                // Suspended: readonly, chỉ Reactivate + Delete Forever.
                // Deleted (isDeleted=1, gồm cả xác account đã merge): readonly
                // tuyệt đối, KHÔNG restore — chỉ Delete Forever để dọn hẳn.
                const isRemoved = user.deleted === true;
                const isSuspended = !isRemoved && normalizeBadgeValue(user.accountStatus) === "suspended";
                return (
                <tr
                  key={user.userId}
                  style={{
                    borderBottom: index < users.length - 1 ? `1px solid ${COLORS.border}` : "none",
                    opacity: isRemoved ? 0.45 : isSuspended ? 0.6 : 1,
                  }}
                >
                  <Td>
                    <div style={{ fontWeight: 700, color: COLORS.textPrimary }}>{user.fullName}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{user.email}</div>
                    {user.phone && <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{user.phone}</div>}
                  </Td>
                  <Td>{studentCodeFor(user)}</Td>
                  <Td>{universityFor(user)}</Td>
                  {/* Role/Status chỉ hiển thị read-only: mọi thay đổi đi qua modal Edit
                      (có Save + validation) để tránh đổi nhầm do click/scroll trong bảng. */}
                  <Td>{labelValue(user.role)}</Td>
                  <Td>{teamLabelFor(user)}</Td>
                  <Td>
                    <div className="flex flex-col gap-2 items-start">
                      <StatusBadge status={normalizeBadgeValue(user.accountStatus)} />
                      {isRemoved && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.error }}>
                          Deleted
                        </span>
                      )}
                      {!isRemoved && user.emailVerified !== undefined && (
                        <span style={{ fontSize: 11, color: user.emailVerified ? COLORS.success : COLORS.warning }}>
                          {user.emailVerified ? "Email verified" : "Email not verified"}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>{formatDate(user.createdAt)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      {!isRemoved && !isSuspended && (
                        <>
                          <Button variant="ghost" size="sm" icon={<Edit size={12} />} onClick={() => openEdit(user)}>
                            Edit
                          </Button>
                          <Button variant="danger" size="sm" icon={<Trash2 size={12} />} disabled={mutating} onClick={() => deleteUser(user)}>
                            Deactivate
                          </Button>
                        </>
                      )}
                      {isSuspended && (
                        <Button variant="primary" size="sm" icon={<RefreshCw size={12} />} disabled={mutating} onClick={() => reactivateUser(user)}>
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Rows</span>
            <Select value={String(filters.size ?? 10) || "none"} onValueChange={value => setFilter("size", Number((value === "none" ? "" : value)))} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    {PAGE_SIZE_OPTIONS.map(size => <SelectItem key={size} value={String(size)} style={{ color: COLORS.textPrimary }}>{size}</SelectItem>)}
  </SelectContent>
</Select>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" disabled={(filters.page ?? 0) <= 0 || loading} onClick={() => setFilter("page", Math.max((filters.page ?? 0) - 1, 0))}>
              Previous
            </Button>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Page {(filters.page ?? 0) + 1} of {totalPages}</span>
            <Button variant="ghost" size="sm" disabled={(filters.page ?? 0) + 1 >= totalPages || loading} onClick={() => setFilter("page", (filters.page ?? 0) + 1)}>
              Next
            </Button>
          </div>
        </div>
      </Card>

      <FilterSortPanel
        open={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
        onClearAll={clearAllFacets}
        hasActive={activeFilterCount > 0}
        ctaLabel={facets ? `Show ${facets.total} user${facets.total === 1 ? "" : "s"}` : "Apply Filters"}
      >
        <FacetGroup
          title="Role"
          open={openGroups.role}
          hasActive={selectedRoles.length > 0}
          onToggle={() => setOpenGroups(prev => ({ ...prev, role: !prev.role }))}
        >
          {ROLE_OPTIONS.map(option => (
            <FacetOptionRow
              key={option.value}
              label={option.label}
              count={facetCount("roles", option.value)}
              checked={selectedRoles.includes(option.value)}
              onToggle={() => toggleRole(option.value)}
            />
          ))}
        </FacetGroup>
        <FacetGroup
          title="Account Status"
          open={openGroups.status}
          hasActive={selectedStatuses.length > 0}
          onToggle={() => setOpenGroups(prev => ({ ...prev, status: !prev.status }))}
        >
          {STATUS_OPTIONS.map(option => (
            <FacetOptionRow
              key={option.value}
              label={option.label}
              count={facetCount("statuses", option.value)}
              checked={selectedStatuses.includes(option.value)}
              onToggle={() => toggleStatus(option.value)}
            />
          ))}
        </FacetGroup>
        <FacetGroup
          title="Joined Date"
          open={openGroups.date}
          hasActive={Boolean(filters.joinedFrom || filters.joinedTo)}
          onToggle={() => setOpenGroups(prev => ({ ...prev, date: !prev.date }))}
        >
          <FilterInput label="Joined From" type="date" value={filters.joinedFrom ?? ""} onChange={value => setFilter("joinedFrom", value)} />
          <FilterInput label="Joined To" type="date" value={filters.joinedTo ?? ""} onChange={value => setFilter("joinedTo", value)} />
        </FacetGroup>
        <FacetGroup
          title="Sort By"
          open={openGroups.sort}
          hasActive={filters.sortBy !== "createdAt" || filters.sortDir !== "desc"}
          onToggle={() => setOpenGroups(prev => ({ ...prev, sort: !prev.sort }))}
        >
          <FilterSelect label="Sort By" value={filters.sortBy ?? "createdAt"} onChange={value => setFilter("sortBy", value)}>
            <option value="createdAt">Joined</option>
            <option value="updatedAt">Updated</option>
            <option value="fullName">Name</option>
            <option value="email">Email</option>
            <option value="role">Role</option>
            <option value="accountStatus">Status</option>
          </FilterSelect>
          <FilterSelect label="Direction" value={filters.sortDir ?? "desc"} onChange={value => setFilter("sortDir", value as "asc" | "desc")}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </FilterSelect>
        </FacetGroup>
      </FilterSortPanel>

      {modal && (
        <UserFormModal
          mode={modal.mode}
          form={form}
          setForm={setForm}
          fieldErrors={fieldErrors}
          mutating={mutating}
          onClose={closeModal}
          onSubmit={submitForm}
        />
      )}
    </div>
  );
}

function UserFormModal({
  mode,
  form,
  setForm,
  fieldErrors,
  mutating,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  form: UserFormState;
  setForm: Dispatch<SetStateAction<UserFormState>>;
  fieldErrors: Record<string, string>;
  mutating: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const role = normalizeRoleValue(form.role);
  const handleRoleChange = (nextRole: string) => {
    const normalizedRole = normalizeRoleValue(nextRole);
    setForm(prev => ({
      ...prev,
      role: normalizedRole,
      accountStatus: defaultStatusForRole(normalizedRole),
      fptStudentCode: normalizedRole === "FPT_STUDENT" ? prev.fptStudentCode : "",
      externalStudentCode: normalizedRole === "EXTERNAL_STUDENT" ? prev.externalStudentCode : "",
      universityName: normalizedRole === "FPT_STUDENT" ? "FPT University" : (normalizedRole === "EXTERNAL_STUDENT" ? prev.universityName : ""),
      accountExpiresAt: normalizedRole === "GUEST_JUDGE" ? prev.accountExpiresAt : "",
    }));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ background: "rgba(30,15,5,0.28)", zIndex: 70 }}>
      <Card className="p-5" style={{ width: "min(640px, 100%)" }}>
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.textPrimary }}>
              {mode === "create" ? "Add User" : "Edit User"}
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
              Users verify their own accounts by email; no organizer approval is required.
            </div>
          </div>
          <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={onClose} disabled={mutating}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Full Name" value={form.fullName} error={fieldErrors.fullName} onChange={value => setForm(prev => ({ ...prev, fullName: value }))} />
          <FormInput label="Email" value={form.email} error={fieldErrors.email} disabled={mode === "edit"} onChange={value => setForm(prev => ({ ...prev, email: value }))} />
          {mode === "create" && (
            <FormInput label="Password" type="password" value={form.password} error={fieldErrors.password} onChange={value => setForm(prev => ({ ...prev, password: value }))} />
          )}
          <FormInput label="Phone" value={form.phone} error={fieldErrors.phone} onChange={value => setForm(prev => ({ ...prev, phone: value }))} />
          <FormSelect label="Role" value={role} error={fieldErrors.role} onChange={handleRoleChange}>
            {ROLE_OPTIONS.map(role => (
              <SelectItem key={role.value} value={role.value} style={{ color: COLORS.textPrimary }}>
                {role.label}
              </SelectItem>
            ))}
          </FormSelect>
          <FormSelect label="Status" value={form.accountStatus} error={fieldErrors.accountStatus} onChange={value => setForm(prev => ({ ...prev, accountStatus: value }))}>
            {STATUS_OPTIONS.map(status => (
              <SelectItem key={status.value} value={status.value} style={{ color: COLORS.textPrimary }}>
                {status.label}
              </SelectItem>
            ))}
          </FormSelect>
          {role === "FPT_STUDENT" && (
            <FormInput
              label="FPT Student Code"
              value={form.fptStudentCode}
              error={fieldErrors.fptStudentCode}
              // Mã sinh viên là định danh — khóa read-only khi Edit để tránh sửa sai quy chiếu.
              disabled={mode === "edit"}
              onChange={value => setForm(prev => ({ ...prev, fptStudentCode: value }))}
            />
          )}
          {role === "EXTERNAL_STUDENT" && (
            <>
              <FormInput
                label="External Student Code"
                value={form.externalStudentCode}
                error={fieldErrors.externalStudentCode}
                disabled={mode === "edit"}
                onChange={value => setForm(prev => ({ ...prev, externalStudentCode: value }))}
              />
              <FormInput
                label="University Name"
                value={form.universityName}
                error={fieldErrors.universityName}
                onChange={value => setForm(prev => ({ ...prev, universityName: value }))}
              />
            </>
          )}
          {role === "GUEST_JUDGE" && (
            <FormInput
              label="Account Expires At"
              type="datetime-local"
              value={form.accountExpiresAt}
              error={fieldErrors.accountExpiresAt}
              onChange={value => setForm(prev => ({ ...prev, accountExpiresAt: value }))}
            />
          )}
        </div>

        {fieldErrors.message && (
          <div className="mt-4 px-3 py-2 rounded-xl" style={{ color: COLORS.error, background: `${COLORS.error}10`, border: `1px solid ${COLORS.error}25`, fontSize: 13 }}>
            {fieldErrors.message}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" size="md" onClick={onClose} disabled={mutating}>Cancel</Button>
          <Button variant="primary" size="md" icon={mutating ? <Loader size={14} className="animate-spin" /> : <Save size={14} />} onClick={onSubmit} disabled={mutating}>
            {mutating ? "Saving..." : "Save"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// FilterChip/FacetGroup/FacetOptionRow chuyển sang shared FilterSortPanel.tsx
// để dùng chung với màn Event Participants.

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon?: ReactNode;
}) {
  return (
    <label className="block">
      <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: COLORS.textSecondary, marginBottom: 5 }}>{label.toUpperCase()}</span>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }}>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? "pl-9" : "pl-3"} pr-3 py-2 rounded-xl outline-none`}
          style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, fontSize: 13 }}
        />
      </div>
    </label>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: COLORS.textSecondary, marginBottom: 5 }}>{label.toUpperCase()}</span>
      <Select value={value || "none"} onValueChange={value => onChange((value === "none" ? "" : value))} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent className="z-[90]" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    {children}
  </SelectContent>
</Select>
    </label>
  );
}

function FormInput({ label, value, onChange, error, disabled, type = "text" }: { label: string; value: string; onChange: (value: string) => void; error?: string; disabled?: boolean; type?: string }) {
  return (
    <label className="block">
      <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: COLORS.textSecondary, marginBottom: 5 }}>{label.toUpperCase()}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
        className="w-full px-3 py-2 rounded-xl outline-none"
        style={{ border: `1px solid ${error ? COLORS.error : COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, fontSize: 13, opacity: disabled ? 0.65 : 1 }}
      />
      {error && <span style={{ display: "block", marginTop: 5, color: COLORS.error, fontSize: 12 }}>{error}</span>}
    </label>
  );
}

function FormSelect({ label, value, onChange, error, children }: { label: string; value: string; onChange: (value: string) => void; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: COLORS.textSecondary, marginBottom: 5 }}>{label.toUpperCase()}</span>
      <Select value={value || "none"} onValueChange={value => onChange((value === "none" ? "" : value))} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent className="z-[100]" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    {children}
  </SelectContent>
</Select>
      {error && <span style={{ display: "block", marginTop: 5, color: COLORS.error, fontSize: 12 }}>{error}</span>}
    </label>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th
      className="text-left px-4 py-3"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        background: COLORS.bg,
        fontSize: 12,
        fontWeight: 700,
        color: COLORS.textSecondary,
        borderBottom: `1px solid ${COLORS.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {String(children).toUpperCase()}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3" style={{ fontSize: 13, color: COLORS.textPrimary, verticalAlign: "top" }}>{children}</td>;
}
