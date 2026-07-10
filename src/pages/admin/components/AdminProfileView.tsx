import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Loader, Save } from "lucide-react";
import { Card, SectionHeader, COLORS, StatusBadge, Button } from "@/components/shared/UIComponents";
import { parseApiError } from "@/lib/api/apiClient";
import { meService, type MyProfileResponse } from "@/features/users/api/userService";

interface AdminViewProps {
  context: any;
}

/**
 * Hồ sơ organizer: hiển thị dữ liệu THẬT từ GET /api/v1/me (trước đây là mock
 * "Admin User" cứng nên fullName không khớp database). Cho phép sửa fullName
 * và phone qua PUT /api/v1/me; email/role chỉ đọc.
 */
export function AdminProfileView({ context }: AdminViewProps) {
  const { t } = context;

  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    meService.getMe()
      .then(data => {
        if (cancelled) return;
        setProfile(data);
        setFullName(data.fullName ?? "");
        setPhone(data.phone ?? "");
      })
      .catch(error => {
        if (!cancelled) setMessage({ tone: "error", text: parseApiError(error).message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!fullName.trim()) {
      setMessage({ tone: "error", text: "Full name must not be blank." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const updated = await meService.updateMe({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      setProfile(updated);
      setFullName(updated.fullName ?? "");
      setPhone(updated.phone ?? "");
      setMessage({ tone: "success", text: "Profile updated." });
    } catch (error) {
      setMessage({ tone: "error", text: parseApiError(error).message });
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.fullName ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map(word => word[0]?.toUpperCase() ?? "")
    .join("") || "?";

  const roleLabel = profile?.role?.replace(/_/g, " ") ?? "-";

  if (loading) {
    return (
      <>
        <SectionHeader title={t("admin.myProfile")} subtitle={t("admin.myProfileSubtitle")} />
        <Card className="p-8">
          <div className="flex items-center gap-3" style={{ color: COLORS.textSecondary }}>
            <Loader size={18} className="animate-spin" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Loading profile...</span>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <SectionHeader title={t("admin.myProfile")} subtitle={t("admin.myProfileSubtitle")} />
      {message && (
        <div
          className="mb-4 rounded-xl px-4 py-3 flex items-center gap-2"
          style={{
            fontSize: 13,
            color: message.tone === "success" ? COLORS.success : COLORS.error,
            background: message.tone === "success" ? `${COLORS.success}10` : `${COLORS.error}10`,
            border: `1px solid ${message.tone === "success" ? COLORS.success : COLORS.error}25`,
          }}
        >
          {message.tone === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {message.text}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-center text-center gap-4">
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #F47920, #009444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 700, color: "#fff",
            boxShadow: "0 4px 16px rgba(244,121,32,0.35)"
          }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>
              {profile?.fullName ?? "-"}
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>{roleLabel}</div>
            <StatusBadge status={profile?.accountStatus === "ACTIVE" ? "active" : "pending"} />
          </div>
          <div className="w-full space-y-2 text-left mt-2">
            <div style={{ fontSize: 13, color: COLORS.textSecondary, wordBreak: "break-all" }}>
              {profile?.email ?? "-"}
            </div>
            {profile?.createdAt && (
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </Card>
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>
              {t("admin.personalInfo")}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>
                  {t("common.fullName")}
                </label>
                <input
                  value={fullName}
                  onChange={event => setFullName(event.target.value)}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>
                  {t("common.phone")}
                </label>
                <input
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  placeholder="e.g. 0900000000"
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>
                  {t("common.email")}
                </label>
                <input
                  value={profile?.email ?? ""}
                  disabled
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textSecondary }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>
                  Role
                </label>
                <input
                  value={roleLabel}
                  disabled
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textSecondary }}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="primary"
                size="md"
                icon={saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                disabled={saving || !fullName.trim()}
                onClick={handleSave}
              >
                {saving ? "Saving..." : t("common.saveChanges")}
              </Button>
            </div>
          </Card>
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>
              {t("admin.adminPermissions")}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                t("admin.perm.eventManagement"),
                t("admin.perm.userManagement"),
                t("admin.perm.scoreOverride"),
                t("admin.perm.systemSettings"),
                t("admin.perm.auditLogAccess"),
                t("admin.perm.broadcastMessages"),
              ].map(perm => (
                <div key={perm} className="flex items-center gap-2 p-3 rounded-xl" style={{ background: COLORS.bg }}>
                  <CheckCircle size={14} style={{ color: COLORS.success, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{perm}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
