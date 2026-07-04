import { useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { AlertTriangle, Edit, Loader, PlusCircle, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { parseApiError } from "@/lib/api/apiClient";
import { Button, Card, COLORS, SectionHeader, StatusBadge } from "@/components/shared/UIComponents";
import {
  userService,
  type CreateUserRequest,
  type UpdateUserRequest,
  type UserManagementUser,
  type UserQueryParams,
} from "@/features/users/api/userService";

const ROLE_OPTIONS = [
  { label: "FPT Student", value: "FPT_STUDENT" },
  { label: "External Student", value: "EXTERNAL_STUDENT" },
  { label: "Organizer", value: "ORGANIZER" },
  { label: "Internal Judge", value: "INTERNAL_JUDGE" },
  { label: "Guest Judge", value: "GUEST_JUDGE" },
];

const STATUS_OPTIONS = [
  { label: "Pending Approval", value: "PENDING_APPROVAL" },
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
  universityName: "",
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
  return !value || /^[+()\d\s.-]{8,20}$/.test(value);
}

function dangerousStatus(accountStatus: string) {
  return ["REJECTED", "SUSPENDED"].includes(accountStatus.toUpperCase());
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

export function AdminUsersView() {
  const [users, setUsers] = useState<UserManagementUser[]>([]);
  const [filters, setFilters] = useState<UserQueryParams>({
    search: "",
    role: "",
    teamName: "",
    accountStatus: "",
    joinedFrom: "",
    joinedTo: "",
    page: 0,
    size: 10,
    sortBy: "createdAt",
    sortDir: "desc",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<UserModalState>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search ?? "");
      setFilters(prev => ({ ...prev, page: 0 }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const page = await userService.getUsers({
        ...filters,
        search: debouncedSearch || undefined,
        role: filters.role || undefined,
        teamName: filters.teamName || undefined,
        accountStatus: filters.accountStatus || undefined,
        joinedFrom: filters.joinedFrom || undefined,
        joinedTo: filters.joinedTo || undefined,
      });
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
    filters.role,
    filters.teamName,
    filters.accountStatus,
    filters.joinedFrom,
    filters.joinedTo,
    filters.page,
    filters.size,
    filters.sortBy,
    filters.sortDir,
  ]);

  const setFilter = (key: keyof UserQueryParams, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: key === "page" ? Number(value) : 0 }));
  };

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
      return compactPayload({ ...base, fptStudentCode: form.fptStudentCode.trim() });
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
      return compactPayload({ ...base, fptStudentCode: form.fptStudentCode.trim() });
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

  const changeStatus = async (user: UserManagementUser, accountStatus: string) => {
    if (!accountStatus || accountStatus === user.accountStatus) return;
    if (dangerousStatus(accountStatus) && !window.confirm(`Change ${user.fullName} status to ${labelValue(accountStatus)}?`)) return;
    setMutating(true);
    try {
      await userService.updateUserStatus(user.userId, { accountStatus });
      toast.success("User status updated.");
      await loadUsers();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setMutating(false);
    }
  };

  const changeRole = async (user: UserManagementUser, role: string) => {
    if (!role || role === user.role) return;
    if (!window.confirm(`Change ${user.fullName} role to ${labelValue(role)}?`)) return;
    setMutating(true);
    try {
      await userService.updateUserRole(user.userId, { role });
      toast.success("User role updated.");
      await loadUsers();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setMutating(false);
    }
  };

  const deleteUser = async (user: UserManagementUser) => {
    if (!window.confirm(`Deactivate ${user.fullName}?`)) return;
    setMutating(true);
    try {
      await userService.deleteUser(user.userId);
      toast.success("User deactivated.");
      await loadUsers();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="h-full min-h-0 overflow-hidden flex flex-col gap-5">
      <div className="flex-shrink-0">
        <SectionHeader
          title="User Management"
          subtitle={`${totalElements} user(s)`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" icon={loading ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />} onClick={loadUsers} disabled={loading}>
                Refresh
              </Button>
              <Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={openCreate}>
                Add User
              </Button>
            </div>
          }
        />
      </div>

      <Card className="p-5 flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <FilterInput
            label="Search"
            value={filters.search ?? ""}
            onChange={value => setFilters(prev => ({ ...prev, search: value }))}
            placeholder="Name, email, phone"
            icon={<Search size={14} />}
          />
          <FilterSelect label="Role" value={filters.role ?? ""} onChange={value => setFilter("role", value)}>
            <option value="">All roles</option>
            {ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
          </FilterSelect>
          <FilterInput label="Team" value={filters.teamName ?? ""} onChange={value => setFilter("teamName", value)} placeholder="Team name" />
          <FilterSelect label="Status" value={filters.accountStatus ?? ""} onChange={value => setFilter("accountStatus", value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
          </FilterSelect>
          <FilterInput label="Joined From" type="date" value={filters.joinedFrom ?? ""} onChange={value => setFilter("joinedFrom", value)} />
          <FilterInput label="Joined To" type="date" value={filters.joinedTo ?? ""} onChange={value => setFilter("joinedTo", value)} />
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
        </div>
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
              {!loading && users.map((user, index) => (
                <tr key={user.userId} style={{ borderBottom: index < users.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <Td>
                    <div style={{ fontWeight: 700, color: COLORS.textPrimary }}>{user.fullName}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{user.email}</div>
                    {user.phone && <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{user.phone}</div>}
                  </Td>
                  <Td>{studentCodeFor(user)}</Td>
                  <Td>{universityFor(user)}</Td>
                  <Td>
                    <select
                      value={normalizeRoleValue(user.role)}
                      disabled={mutating}
                      onChange={event => changeRole(user, event.target.value)}
                      className="px-2 py-1 rounded-xl outline-none"
                      style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, fontSize: 12 }}
                    >
                      <option value={normalizeRoleValue(user.role)}>{labelValue(user.role)}</option>
                      {ROLE_OPTIONS.filter(role => role.value !== normalizeRoleValue(user.role)).map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                  </Td>
                  <Td>{teamLabelFor(user)}</Td>
                  <Td>
                    <div className="flex flex-col gap-2 items-start">
                      <StatusBadge status={normalizeBadgeValue(user.accountStatus)} />
                      <select
                        value={user.accountStatus}
                        disabled={mutating}
                        onChange={event => changeStatus(user, event.target.value)}
                        className="px-2 py-1 rounded-xl outline-none"
                        style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, fontSize: 12 }}
                      >
                        <option value={user.accountStatus}>{labelValue(user.accountStatusName ?? user.accountStatus)}</option>
                        {STATUS_OPTIONS.filter(status => status.value !== user.accountStatus).map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
                      </select>
                      {user.emailVerified !== undefined && (
                        <span style={{ fontSize: 11, color: user.emailVerified ? COLORS.success : COLORS.warning }}>
                          {user.emailVerified ? "Email verified" : "Email not verified"}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>{formatDate(user.createdAt)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" icon={<Edit size={12} />} onClick={() => openEdit(user)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" icon={<Trash2 size={12} />} disabled={mutating} onClick={() => deleteUser(user)}>
                        Deactivate
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Rows</span>
            <select
              value={String(filters.size ?? 10)}
              onChange={event => setFilter("size", Number(event.target.value))}
              className="px-2 py-1 rounded-xl outline-none"
              style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, fontSize: 12 }}
            >
              {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
            </select>
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
      universityName: normalizedRole === "EXTERNAL_STUDENT" ? prev.universityName : "",
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
            {ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
          </FormSelect>
          <FormSelect label="Status" value={form.accountStatus} error={fieldErrors.accountStatus} onChange={value => setForm(prev => ({ ...prev, accountStatus: value }))}>
            {STATUS_OPTIONS.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
          </FormSelect>
          {role === "FPT_STUDENT" && (
            <FormInput
              label="FPT Student Code"
              value={form.fptStudentCode}
              error={fieldErrors.fptStudentCode}
              onChange={value => setForm(prev => ({ ...prev, fptStudentCode: value }))}
            />
          )}
          {role === "EXTERNAL_STUDENT" && (
            <>
              <FormInput
                label="External Student Code"
                value={form.externalStudentCode}
                error={fieldErrors.externalStudentCode}
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
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full px-3 py-2 rounded-xl outline-none"
        style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, fontSize: 13 }}
      >
        {children}
      </select>
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
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full px-3 py-2 rounded-xl outline-none"
        style={{ border: `1px solid ${error ? COLORS.error : COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary, fontSize: 13 }}
      >
        {children}
      </select>
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
