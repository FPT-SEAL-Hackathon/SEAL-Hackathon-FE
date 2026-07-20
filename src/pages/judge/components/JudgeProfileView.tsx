import { useState } from "react";
import { Card, SectionHeader, COLORS } from "@/components/shared/UIComponents";
import { useAuth } from "@/features/auth/store/authStore";
import { MyProfileSection } from "@/features/users/components/MyProfileSection";

export function JudgeProfileView() {
  const { user } = useAuth();
  const [profileForm] = useState({
    name: user?.fullName ?? "Judge",
    email: user?.email ?? "-",
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
          {/* Form hồ sơ dùng chung: save qua API /api/v1/me thật (form cũ là mock,
              nút Save không có onClick). */}
          <MyProfileSection />
        </div>
      </div>
    </>
  );
}
