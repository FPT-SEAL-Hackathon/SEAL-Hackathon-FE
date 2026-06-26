import { useState } from "react";
import { Save } from "lucide-react";
import { Card, SectionHeader, COLORS, Button } from "@/components/shared/UIComponents";
import { useAuth } from "@/features/auth/store/authStore";

export function JudgeProfileView() {
  const { user } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.fullName ?? "Dr. Pham Thi Lan",
    email: user?.email ?? "ptlan@fpt.edu.vn",
    expertise: "AI/ML, Computer Vision, NLP",
    institution: user?.universityName ?? "FPT University",
  });

  return (
    <>
      <SectionHeader title="Judge Profile" subtitle="Manage your profile and evaluation preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 text-center col-span-1">
          <div
            className="mx-auto flex items-center justify-center rounded-full text-white mb-4"
            style={{ width: 72, height: 72, background: `linear-gradient(135deg, ${COLORS.warning}, ${COLORS.accent})`, fontSize: 22, fontWeight: 700 }}
          >
            {profileForm.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>{profileForm.name}</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>Judge • SEAL Fall 2025</div>
          <div className="mt-4 space-y-2 text-left">
            {[
              { label: "Expertise", value: profileForm.expertise },
              { label: "Institution", value: profileForm.institution },
              { label: "Email", value: profileForm.email },
              { label: "Evaluations", value: "25 completed" },
            ].map(item => (
              <div key={item.label} className="flex flex-col">
                <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>{item.label.toUpperCase()}</span>
                <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Profile Settings</div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "name" },
                { label: "Email", key: "email" },
                { label: "Expertise Areas", key: "expertise" },
                { label: "Institution", key: "institution" },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{field.label}</label>
                  <input
                    value={profileForm[field.key as keyof typeof profileForm]}
                    onChange={e => setProfileForm(p => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl outline-none"
                    style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                  />
                </div>
              ))}
            </div>
            <Button variant="primary" size="md" icon={<Save size={14} />} className="mt-4">Save Profile</Button>
          </Card>
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Evaluation Preferences</div>
            <div className="space-y-3">
              {[
                { label: "Show scoring guidelines during evaluation", enabled: true },
                { label: "Require comment for scores below 15/25", enabled: true },
                { label: "Email notification when new submission assigned", enabled: false },
                { label: "Show other judges' scores after submitting", enabled: false },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: COLORS.bg }}>
                  <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{pref.label}</span>
                  <div
                    className="rounded-full flex items-center transition-all"
                    style={{ width: 40, height: 22, background: pref.enabled ? COLORS.primary : COLORS.border, padding: "2px", cursor: "pointer" }}
                  >
                    <div className="rounded-full bg-white" style={{ width: 18, height: 18, transform: pref.enabled ? "translateX(18px)" : "translateX(0)", transition: "transform 0.2s" }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
