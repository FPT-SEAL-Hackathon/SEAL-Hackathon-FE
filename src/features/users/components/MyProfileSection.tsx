import { useEffect, useState } from "react";
import { Loader, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, COLORS, SectionHeader, StatusBadge } from "@/components/shared/UIComponents";
import { parseApiError, saveUser } from "@/lib/api/apiClient";
import { meService, type MyProfileResponse } from "@/features/users/api/userService";
import { useAuth } from "@/features/auth/store/authStore";

// Khớp validation BE (ProfileController): phone rỗng hoặc 7-20 ký tự số/+()-space.
const PHONE_REGEX = /^[0-9+()\-\s]{7,20}$/;
const MAX_NAME_LENGTH = 200;
const MAX_UNIVERSITY_LENGTH = 200;

function formatLabel(value?: string | null) {
  if (!value) return "-";
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function isExternalStudent(role?: string | null) {
  return (role ?? "").toUpperCase().includes("EXTERNAL");
}

function isStudent(role?: string | null) {
  const normalized = (role ?? "").toUpperCase();
  return normalized.includes("STUDENT");
}

/**
 * Form hồ sơ cá nhân dùng chung cho MỌI role (student, judge, mentor, organizer):
 * load từ GET /api/v1/me, lưu qua PUT /api/v1/me.
 * - Sửa được: Họ tên, Số điện thoại, Trường (chỉ External Student).
 * - Khóa (chỉ hiển thị): Email, Mã sinh viên, Role — đây là dữ liệu định danh,
 *   đổi phải qua organizer/flow riêng.
 * Sau khi lưu thành công sẽ đồng bộ lại auth state + localStorage để tên mới
 * hiển thị ngay trên dashboard và giữ nguyên sau khi login lại.
 */
export function MyProfileSection({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { user: authUser, setAuth } = useAuth();
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [universityName, setUniversityName] = useState("");

  useEffect(() => {
    let cancelled = false;
    meService.getMe()
      .then(data => {
        if (cancelled) return;
        setProfile(data);
        setFullName(data.fullName ?? "");
        setPhone(data.phone ?? "");
        setUniversityName(data.universityName ?? "");
      })
      .catch(err => {
        if (!cancelled) setLoadError(parseApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Full name is required.";
    else if (fullName.trim().length > MAX_NAME_LENGTH) errors.fullName = `Full name must not exceed ${MAX_NAME_LENGTH} characters.`;
    if (phone.trim() && !PHONE_REGEX.test(phone.trim())) errors.phone = "Invalid phone number (7-20 digits).";
    if (isExternalStudent(profile?.role)) {
      if (!universityName.trim()) errors.universityName = "University is required for External Student.";
      else if (universityName.trim().length > MAX_UNIVERSITY_LENGTH) errors.universityName = `University must not exceed ${MAX_UNIVERSITY_LENGTH} characters.`;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const updated = await meService.updateMe({
        fullName: fullName.trim(),
        phone: phone.trim(),
        universityName: isExternalStudent(profile?.role) ? universityName.trim() : undefined,
      });
      setProfile(prev => (prev ? { ...prev, ...updated } : prev));
      // Đồng bộ auth state + localStorage để dashboard hiện tên mới ngay
      // và thông tin còn nguyên sau khi logout/login.
      if (authUser) {
        const merged = { ...authUser, fullName: updated.fullName, phone: updated.phone };
        setAuth(merged);
        saveUser(merged);
      }
      toast.success("Profile saved.");
    } catch (err) {
      const parsed = parseApiError(err);
      setFieldErrors(parsed.fieldErrors ?? {});
      toast.error(parsed.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    fontSize: 14,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.bg,
    color: COLORS.textPrimary,
  } as const;
  const disabledStyle = { ...inputStyle, opacity: 0.6, cursor: "not-allowed" } as const;
  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.textSecondary,
    display: "block",
    marginBottom: 4,
  } as const;
  const errorStyle = { fontSize: 12, color: COLORS.error, marginTop: 4 } as const;

  const studentCode = profile?.fptStudentCode || profile?.externalStudentCode || "";
  const showStudentCode = isStudent(profile?.role);
  const showUniversity = isExternalStudent(profile?.role) || !!profile?.universityName;

  const body = loading ? (
    <Card className="p-8">
      <div className="flex items-center gap-3" style={{ color: COLORS.textSecondary }}>
        <Loader size={18} className="animate-spin" />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Loading profile...</span>
      </div>
    </Card>
  ) : loadError ? (
    <Card className="p-6">
      <div style={{ color: COLORS.error, fontSize: 13, fontWeight: 600 }}>{loadError}</div>
    </Card>
  ) : (
    <Card className="p-5">
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Personal Information</div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>
            {formatLabel(profile?.role)}
          </span>
          <StatusBadge status={(profile?.accountStatus ?? "").toLowerCase()} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Full Name</label>
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            className="w-full px-3 py-2 rounded-xl outline-none"
            style={inputStyle}
          />
          {fieldErrors.fullName && <div style={errorStyle}>{fieldErrors.fullName}</div>}
        </div>

        <div>
          <label style={labelStyle}>Email (cannot be changed)</label>
          <input value={profile?.email ?? ""} disabled className="w-full px-3 py-2 rounded-xl outline-none" style={disabledStyle} />
        </div>

        <div>
          <label style={labelStyle}>Phone</label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="e.g. 0901234567"
            className="w-full px-3 py-2 rounded-xl outline-none"
            style={inputStyle}
          />
          {fieldErrors.phone && <div style={errorStyle}>{fieldErrors.phone}</div>}
        </div>

        {showStudentCode && (
          <div>
            <label style={labelStyle}>Student Code (cannot be changed)</label>
            <input value={studentCode} disabled className="w-full px-3 py-2 rounded-xl outline-none" style={disabledStyle} />
          </div>
        )}

        {showUniversity && (
          <div>
            <label style={labelStyle}>
              University{isExternalStudent(profile?.role) ? "" : " (managed by organizer)"}
            </label>
            <input
              value={universityName}
              onChange={e => setUniversityName(e.target.value)}
              disabled={!isExternalStudent(profile?.role)}
              maxLength={MAX_UNIVERSITY_LENGTH}
              className="w-full px-3 py-2 rounded-xl outline-none"
              style={isExternalStudent(profile?.role) ? inputStyle : disabledStyle}
            />
            {fieldErrors.universityName && <div style={errorStyle}>{fieldErrors.universityName}</div>}
          </div>
        )}
      </div>

      <div className="mt-4">
        <Button
          variant="primary"
          size="md"
          icon={saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Card>
  );

  if (!title) return body;
  return (
    <>
      <SectionHeader title={title} subtitle={subtitle} />
      {body}
    </>
  );
}
