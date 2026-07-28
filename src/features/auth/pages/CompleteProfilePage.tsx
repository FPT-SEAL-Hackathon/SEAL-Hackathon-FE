import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, BookOpen, Building2, Loader, Phone, User } from "lucide-react";
import { completeProfile, type CompleteProfileRequest } from "@/features/auth/api/authService";
import { useAuth } from "@/features/auth/store/authStore";
import { ApiError, parseApiError } from "@/lib/api/apiClient";
import { fptStudentCodePrefixService, type FptStudentCodePrefix } from "@/features/users/api/fptStudentCodePrefixService";
import {
  getFptStudentCodePrefixInfo,
  isValidFptStudentCode,
  MSG_FPT_CODE,
  normalizeFptStudentCode,
} from "@/features/users/utils/profileValidation";

type StudentRole = "FPT_STUDENT" | "EXTERNAL_STUDENT";

const FIELD_LABEL: Record<string, string> = {
  email: "Email",
  phone: "Phone number",
  fptStudentCode: "FPT student code",
  externalStudentCode: "External student code",
};

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, setAuth } = useAuth();

  const [role, setRole] = useState<StudentRole>("FPT_STUDENT");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [fptStudentCode, setFptStudentCode] = useState("");
  const [externalStudentCode, setExternalStudentCode] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [conflictFields, setConflictFields] = useState<string[] | null>(null);
  const [fptPrefixes, setFptPrefixes] = useState<FptStudentCodePrefix[]>([]);
  const prefixInfo = role === "FPT_STUDENT" ? getFptStudentCodePrefixInfo(fptStudentCode, fptPrefixes) : null;

  useEffect(() => {
    let cancelled = false;
    fptStudentCodePrefixService.list()
      .then(data => {
        if (!cancelled) setFptPrefixes(data);
      })
      .catch(() => {
        if (!cancelled) setFptPrefixes([]);
      });
    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async () => {
    setApiError("");
    setConflictFields(null);

    if (!fullName.trim()) {
      setApiError("Full name is required.");
      return;
    }
    if (role === "FPT_STUDENT" && !fptStudentCode.trim()) {
      setApiError("FPT student code is required.");
      return;
    }
    if (role === "FPT_STUDENT" && !isValidFptStudentCode(fptStudentCode, fptPrefixes)) {
      setApiError(MSG_FPT_CODE);
      return;
    }
    if (role === "EXTERNAL_STUDENT" && (!externalStudentCode.trim() || !universityName.trim())) {
      setApiError("External student code and university name are required.");
      return;
    }

    const payload: CompleteProfileRequest = {
      role,
      fullName: fullName.trim(),
      phone: phone.trim() || undefined,
      fptStudentCode: role === "FPT_STUDENT" ? normalizeFptStudentCode(fptStudentCode) : undefined,
      externalStudentCode: role === "EXTERNAL_STUDENT" ? externalStudentCode.trim() : undefined,
      universityName: role === "EXTERNAL_STUDENT" ? universityName.trim() : undefined,
    };

    setLoading(true);
    try {
      const updated = await completeProfile(payload);
      setAuth(updated);
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "PROFILE_CONFLICT") {
        const fields = Array.isArray(err.details?.conflictFields)
          ? (err.details!.conflictFields as string[])
          : [];
        setConflictFields(fields);
        setApiError(err.message);
      } else {
        setApiError(parseApiError(err).message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 py-10"
      style={{ background: "var(--gradient-bg)", backgroundAttachment: "fixed" }}
    >
      <section className="glass-strong w-full max-w-lg rounded-3xl p-8">
        <h1 style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 800 }}>Complete your profile</h1>
        <p className="mt-2" style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
          You signed in with Google. Please choose your role and fill in your details to start using SEAL Hackathon.
        </p>

        {apiError && (
          <div className="mt-5 flex items-start gap-2 rounded-2xl p-3" style={{ background: "rgba(229,62,46,0.08)", border: "1px solid rgba(229,62,46,0.2)" }}>
            <AlertCircle size={16} style={{ color: "var(--destructive)", marginTop: 2 }} />
            <div style={{ fontSize: 13, color: "var(--destructive)" }}>
              {apiError}
              {conflictFields && conflictFields.length > 0 && (
                <ul className="mt-1 list-disc pl-4">
                  {conflictFields.map((field) => (
                    <li key={field}>{FIELD_LABEL[field] ?? field}</li>
                  ))}
                </ul>
              )}
              {conflictFields && (
                <button
                  type="button"
                  onClick={() => navigate("/link-account")}
                  className="mt-2 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 font-semibold"
                  style={{ background: "rgba(244,121,32,0.12)", color: "#F47920", fontSize: 12 }}
                >
                  Link to my existing account instead
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
              I AM A
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("FPT_STUDENT")}
                className="rounded-2xl py-3 font-semibold transition-all"
                style={{
                  background: role === "FPT_STUDENT" ? "linear-gradient(135deg, #F47920, #FF9040)" : "var(--glass-bg)",
                  color: role === "FPT_STUDENT" ? "white" : "var(--text-primary)",
                  border: "1.5px solid rgba(244,121,32,0.2)",
                  fontSize: 13,
                }}
              >
                FPT Student
              </button>
              <button
                type="button"
                onClick={() => setRole("EXTERNAL_STUDENT")}
                className="rounded-2xl py-3 font-semibold transition-all"
                style={{
                  background: role === "EXTERNAL_STUDENT" ? "linear-gradient(135deg, #F47920, #FF9040)" : "var(--glass-bg)",
                  color: role === "EXTERNAL_STUDENT" ? "white" : "var(--text-primary)",
                  border: "1.5px solid rgba(244,121,32,0.2)",
                  fontSize: 13,
                }}
              >
                External Student
              </button>
            </div>
          </div>

          <TextField label="Full name" icon={<User size={15} />} value={fullName} onChange={setFullName} placeholder="John Doe" />
          <TextField label="Phone number" icon={<Phone size={15} />} value={phone} onChange={setPhone} placeholder="0912345678" />

          {role === "FPT_STUDENT" ? (
            <>
              <TextField label="FPT student code" icon={<BookOpen size={15} />} value={fptStudentCode} onChange={setFptStudentCode} placeholder="SE123456" />
              {prefixInfo && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: -8, lineHeight: 1.5 }}>
                  {prefixInfo.prefix} - {prefixInfo.englishName}
                  <br />
                  {prefixInfo.majorGroup}{prefixInfo.majorCode ? ` (Major code: ${prefixInfo.majorCode})` : ""}
                </div>
              )}
            </>
          ) : (
            <>
              <TextField label="External student code" icon={<BookOpen size={15} />} value={externalStudentCode} onChange={setExternalStudentCode} placeholder="EXT2024001" />
              <TextField label="University" icon={<Building2 size={15} />} value={universityName} onChange={setUniversityName} placeholder="Your university" />
            </>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold"
            style={{ background: "linear-gradient(135deg, #F47920, #FF9040)", color: "white", fontSize: 14, boxShadow: "0 8px 24px rgba(244,121,32,0.4)", opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}
          >
            {loading ? <><Loader size={15} className="animate-spin" /> Saving...</> : "Complete profile"}
          </button>
        </div>
      </section>
    </main>
  );
}

function TextField({ label, icon, value, onChange, placeholder }: { label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
        {label.toUpperCase()}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c09060" }}>{icon}</div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full py-3.5 rounded-2xl outline-none transition-all duration-200"
          style={{
            background: "var(--glass-bg)",
            border: "1.5px solid rgba(244,121,32,0.15)",
            color: "var(--text-primary)",
            fontSize: 14,
            paddingLeft: 44,
            paddingRight: 16,
          }}
        />
      </div>
    </div>
  );
}
