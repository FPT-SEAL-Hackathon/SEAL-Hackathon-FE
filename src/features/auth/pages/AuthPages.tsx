import { useEffect, useState } from "react";
import {
  Eye, EyeOff, Mail, Lock, ArrowLeft, ArrowRight, X, CheckCircle, Loader,
  User, BookOpen, Building2, Phone, AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { login, register, REGISTER_USER_TYPES, getGoogleLoginUrl, sendLinkOtp, verifyLinkOtp, setupLocalPassword, type UserResponse } from "@/features/auth/api/authService.ts";
import { useAuth } from "@/features/auth/store/authStore";
import { useNavigate } from "react-router";
import { ApiError, api, parseApiError } from "@/lib/api/apiClient.ts";
import { awardService, type TotalPrizeSummary } from "@/features/awards/api/awardService.ts";

// ─── Dev bypass credential ───────────────────────────────────────────────────
const DEV_EMAIL = "dev@seal.dev";
const DEV_PASSWORD = "dev";

// ─── Demo roles (bypass API for dev/demo) ───────────────────────────────────
const DEMO_ROLES = [
  { role: "member",   label: "Member",   color: "#F47920" },
  { role: "leader",   label: "Leader",   color: "#b45309" },
  { role: "judge",    label: "Judge",    color: "#7C3AED" },
  { role: "mentor",   label: "Mentor",   color: "#0EA5E9" },
  { role: "admin",    label: "Admin",    color: "#c0392b" },
];

interface TeamCountResponse {
  totalTeams: number;
}

function formatPrizeMoney(summary: TotalPrizeSummary): string {
  const { totalPrize, currency } = summary;
  if (!totalPrize || totalPrize === 0) return "N/A";
  const cur = (currency || "VND").toUpperCase();
  let display: string;
  if (totalPrize >= 1_000_000_000) {
    display = `${(totalPrize / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  } else if (totalPrize >= 1_000_000) {
    display = `${(totalPrize / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  } else if (totalPrize >= 1_000) {
    display = `${(totalPrize / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  } else {
    display = totalPrize.toLocaleString();
  }
  return `${display} ${cur}`;
}

async function getPublicTeamCount() {
  const response = await api.get<TeamCountResponse>("/api/v1/public/teams/count", false);
  return response.totalTeams;
}

// ─── OAuth Modal ─────────────────────────────────────────────────────────────
type OAuthProvider = "github" | "google";

function OAuthModal({ provider, onSuccess, onClose }: { provider: OAuthProvider; onSuccess: () => void; onClose: () => void }) {
  const [step, setStep] = useState<"form" | "loading" | "success">("form");
  const [oauthEmail, setOauthEmail] = useState(provider === "github" ? "alex.johnson" : "alex.johnson@gmail.com");
  const [oauthPassword, setOauthPassword] = useState("••••••••");
  const isGitHub = provider === "github";

  const handleAuthorize = () => {
    setStep("loading");
    setTimeout(() => { setStep("success"); setTimeout(onSuccess, 900); }, 1600);
  };

  const meta = isGitHub
    ? { name: "GitHub", bg: "#24292f", border: "rgba(255,255,255,0.1)", text: "#f0f6fc", textMuted: "rgba(240,246,252,0.5)", inputBg: "#0d1117", inputBorder: "#30363d", btnBg: "linear-gradient(135deg,#238636,#2ea043)", btnShadow: "0 4px 16px rgba(35,134,54,0.4)", logo: (<svg viewBox="0 0 24 24" width="36" height="36" fill="#f0f6fc"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>) }
    : { name: "Google", bg: "#ffffff", border: "#dadce0", text: "#202124", textMuted: "#5f6368", inputBg: "#ffffff", inputBorder: "#dadce0", btnBg: "linear-gradient(135deg,#1a73e8,#1557b0)", btnShadow: "0 4px 16px rgba(26,115,232,0.35)", logo: (<svg viewBox="0 0 48 48" width="36" height="36"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>) };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }} transition={{ duration: 0.22 }}
        className="relative rounded-2xl overflow-hidden w-full"
        style={{ maxWidth: 400, background: meta.bg, border: `1px solid ${meta.border}`, boxShadow: "0 32px 80px rgba(0,0,0,0.35)", margin: "0 16px" }}>
        <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-1.5" style={{ color: meta.textMuted }}>
          <X size={16} />
        </button>
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === "form" && (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex flex-col items-center mb-6">
                  {meta.logo}
                  <div style={{ marginTop: 12, fontWeight: 700, fontSize: 20, color: meta.text }}>Sign in to {meta.name}</div>
                  <div style={{ fontSize: 13, color: meta.textMuted, marginTop: 4, textAlign: "center" }}>
                    to continue to <span style={{ fontWeight: 600, color: meta.text }}>SEAL Hackathon</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <input type="text" value={oauthEmail} onChange={e => setOauthEmail(e.target.value)}
                    placeholder={isGitHub ? "Username or email address" : "Email"}
                    className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ background: meta.inputBg, border: `1px solid ${meta.inputBorder}`, color: meta.text, fontSize: 14 }} />
                  <input type="password" value={oauthPassword} onChange={e => setOauthPassword(e.target.value)}
                    placeholder="Password" className="w-full px-3 py-2.5 rounded-lg outline-none"
                    style={{ background: meta.inputBg, border: `1px solid ${meta.inputBorder}`, color: meta.text, fontSize: 14 }} />
                  <motion.button onClick={handleAuthorize} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                    className="w-full py-2.5 rounded-lg font-semibold"
                    style={{ background: meta.btnBg, color: "white", fontSize: 14, boxShadow: meta.btnShadow, border: "none" }}>
                    {isGitHub ? "Sign in" : "Next"}
                  </motion.button>
                </div>
              </motion.div>
            )}
            {step === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center py-8">
                {meta.logo}
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  style={{ marginTop: 24, color: isGitHub ? "#58a6ff" : "#1a73e8" }}>
                  <Loader size={28} />
                </motion.div>
                <div style={{ marginTop: 16, fontSize: 14, color: meta.textMuted }}>Authenticating with {meta.name}...</div>
              </motion.div>
            )}
            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8">
                <CheckCircle size={48} color={isGitHub ? "#2ea043" : "#34a853"} />
                <div style={{ marginTop: 16, fontSize: 15, fontWeight: 600, color: meta.text }}>Authenticated successfully!</div>
                <div style={{ fontSize: 13, color: meta.textMuted, marginTop: 4 }}>Redirecting to SEAL Hackathon...</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Glassmorphism Input ──────────────────────────────────────────────────────
export function GlassInput({ type = "text", label, placeholder, icon, value, onChange, rightElement, error }: {
  type?: string; label: string; placeholder: string; icon: React.ReactNode;
  value: string; onChange: (v: string) => void; rightElement?: React.ReactNode; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
        {label.toUpperCase()}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: error ? "#e53e2e" : focused ? "#F47920" : "#c09060" }}>
          {icon}
        </div>
        <input
          type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full py-3.5 rounded-2xl outline-none transition-all duration-200"
          style={{
            background: focused ? "var(--glass-bg-hover)" : "var(--glass-bg)",
            border: error ? "1.5px solid rgba(229,62,46,0.5)" : focused ? "1.5px solid rgba(244,121,32,0.5)" : "1.5px solid rgba(244,121,32,0.15)",
            color: "var(--text-primary)", fontSize: 14, paddingLeft: 44,
            paddingRight: rightElement ? 44 : 16,
            boxShadow: focused ? "0 0 0 3px rgba(244,121,32,0.1)" : "0 2px 4px rgba(180,100,20,0.04)",
          }}
        />
        {rightElement && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</div>}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-1" style={{ fontSize: 11, color: "#e53e2e" }}>
          <AlertCircle size={11} /> {error}
        </div>
      )}
    </div>
  );
}

// ─── Error Banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-4 py-3 rounded-2xl"
      style={{ background: "rgba(229,62,46,0.08)", border: "1px solid rgba(229,62,46,0.25)", color: "#c0392b" }}>
      <AlertCircle size={15} />
      <span style={{ fontSize: 13 }}>{message}</span>
    </motion.div>
  );
}

// ─── Register Card ────────────────────────────────────────────────────────────
export function RegisterCard({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  type RegisterForm = {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    studentCode: string;
    universityName: string;
    userTypeId: string;
  };

  const [form, setForm] = useState<RegisterForm>({
    fullName: "", email: "", password: "", confirmPassword: "",
    phone: "", studentCode: "", universityName: "FPT University",
    userTypeId: REGISTER_USER_TYPES[0].value,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // Email đã có tài khoản Google-only (chưa có mật khẩu): backend trả 409
  // ACCOUNT_LINK_REQUIRED + linkingToken — chuyển sang bước xác minh OTP để
  // thiết lập mật khẩu cho CHÍNH tài khoản đó (không tạo user mới).
  const [linkSetup, setLinkSetup] = useState<{ linkingToken: string; email: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [otpInfo, setOtpInfo] = useState("");
  const { setAuth } = useAuth();
  const navigate = useNavigate();

  const set = (k: keyof typeof form, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setErrors(prev => ({ ...prev, [k]: "" }));
    setApiError("");
  };

  const validate = (): boolean => {
    const e: Partial<RegisterForm> = {};
    if (!form.fullName.trim()) e.fullName = "Required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Invalid email";
    if (form.password.length < 8) e.password = "Min 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    if (!form.phone.match(/^\d{1,10}$/)) e.phone = "Invalid phone (max 10 digits)";
    if (!form.studentCode.trim()) e.studentCode = "Required";
    if (!form.universityName.trim()) e.universityName = "Required";
    if (!form.userTypeId.trim()) e.userTypeId = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        phone: form.phone,
        studentCode: form.studentCode,
        universityName: form.universityName,
        userTypeId: form.userTypeId,
      });
      setSuccess(true);
      setTimeout(onSwitchToLogin, 2500);
    } catch (err) {
      if (err instanceof ApiError && err.code === "ACCOUNT_LINK_REQUIRED") {
        const linkingToken = typeof err.details?.linkingToken === "string" ? err.details.linkingToken : "";
        if (linkingToken) {
          setLinkSetup({ linkingToken, email: form.email.trim() });
          setApiError("");
          try {
            await sendLinkOtp(linkingToken);
            setOtpInfo("We sent a 6-digit code to your email.");
          } catch (otpErr) {
            setApiError(parseApiError(otpErr).message);
          }
          return;
        }
      }
      setApiError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndSetupPassword = async () => {
    if (!linkSetup) return;
    if (otp.trim().length !== 6) {
      setApiError("Please enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setApiError("");
    try {
      await verifyLinkOtp(linkSetup.linkingToken, otp.trim());
      const res = await setupLocalPassword({
        linkingToken: linkSetup.linkingToken,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setAuth(res.user);
      const isTemporary = res.user.accountStatus?.toUpperCase() === "TEMPORARY";
      navigate(isTemporary ? "/complete-profile" : "/", { replace: true });
    } catch (err) {
      setApiError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendLinkOtp = async () => {
    if (!linkSetup) return;
    setApiError("");
    try {
      await sendLinkOtp(linkSetup.linkingToken);
      setOtpInfo("A new code has been sent to your email.");
    } catch (err) {
      setApiError(parseApiError(err).message);
    }
  };

  if (linkSetup) {
    return (
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full rounded-3xl p-8"
        style={{ background: "var(--glass-bg)", backdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--glass-border)", boxShadow: "var(--glass-shadow-lg)" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
          This email already has an account
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.7 }}>
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{linkSetup.email}</span>{" "}
          already signs in with Google. Verify the code we emailed you and we&apos;ll add your new
          password to the <strong>same account</strong> — no duplicate account will be created.
        </p>

        <div className="mt-6 space-y-4">
          {apiError && <ErrorBanner message={apiError} />}
          {otpInfo && !apiError && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
              style={{ background: "rgba(0,148,68,0.08)", border: "1px solid rgba(0,148,68,0.25)", color: "var(--fpt-green, #009444)" }}>
              <Mail size={15} />
              <span style={{ fontSize: 13 }}>{otpInfo}</span>
            </div>
          )}

          <GlassInput label="6-digit code" placeholder="123456" icon={<Lock size={15} />}
            value={otp} onChange={v => setOtp(v.replace(/\D/g, "").slice(0, 6))} />

          <motion.button onClick={handleVerifyOtpAndSetupPassword} disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }} whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold"
            style={{ background: "linear-gradient(135deg, #F47920, #FF9040)", color: "white", fontSize: 14, boxShadow: "0 8px 24px rgba(244,121,32,0.4)", opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}>
            {loading ? <><Loader size={15} className="animate-spin" /> Verifying...</> : <>Verify & set password <ArrowRight size={15} /></>}
          </motion.button>

          <div className="flex items-center justify-between">
            <button type="button" onClick={handleResendLinkOtp}
              style={{ fontSize: 13, color: "#F47920", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
              Resend code
            </button>
            <button type="button" onClick={() => { setLinkSetup(null); setOtp(""); setOtpInfo(""); setApiError(""); }}
              style={{ fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>
              Back to registration
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full rounded-3xl p-8 flex flex-col items-center text-center"
        style={{ background: "var(--glass-bg)", backdropFilter: "blur(32px)", border: "1px solid var(--glass-border)", boxShadow: "var(--glass-shadow-lg)" }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
          <CheckCircle size={56} color="#F47920" />
        </motion.div>
        <div style={{ marginTop: 20, fontWeight: 700, fontSize: 20, color: "var(--text-primary)" }}>Registration successful!</div>
        <div style={{ marginTop: 8, fontSize: 14, color: "var(--text-secondary)" }}>
          Account pending approval. You will be notified once approved.
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-muted)" }}>Redirecting to login...</div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1, duration: 0.35 }}
      className="w-full rounded-3xl p-8"
      style={{ background: "var(--glass-bg)", backdropFilter: "blur(32px) saturate(180%)", WebkitBackdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--glass-border)", boxShadow: "var(--glass-shadow-lg)" }}>
      <div className="mb-6">
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>Create Account</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 5 }}>Sign up to join SEAL Hackathon</p>
      </div>

      <div className="space-y-4">
        {apiError && <ErrorBanner message={apiError} />}

        <GlassInput label="Full Name" placeholder="John Doe" icon={<User size={15} />}
          value={form.fullName} onChange={v => set("fullName", v)} error={errors.fullName} />
        <GlassInput label="Email" placeholder="you@fpt.edu.vn" icon={<Mail size={15} />}
          value={form.email} onChange={v => set("email", v)} error={errors.email} />
        <GlassInput type={showPwd ? "text" : "password"} label="Password" placeholder="Min 8 characters"
          icon={<Lock size={15} />} value={form.password} onChange={v => set("password", v)} error={errors.password}
          rightElement={<button type="button" onClick={() => setShowPwd(!showPwd)} style={{ color: "#c09060" }}>{showPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />
        <GlassInput type="password" label="Confirm Password" placeholder="Re-enter password"
          icon={<Lock size={15} />} value={form.confirmPassword} onChange={v => set("confirmPassword", v)} error={errors.confirmPassword} />
        <GlassInput label="Phone Number" placeholder="0912345678" icon={<Phone size={15} />}
          value={form.phone} onChange={v => set("phone", v)} error={errors.phone} />
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
            USER TYPE
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: errors.userTypeId ? "#e53e2e" : "#c09060" }}>
              <User size={15} />
            </div>
            <select
              value={form.userTypeId}
              onChange={e => set("userTypeId", e.target.value)}
              className="w-full py-3.5 rounded-2xl outline-none transition-all duration-200 appearance-none"
              style={{
                background: "var(--glass-bg)",
                border: errors.userTypeId ? "1.5px solid rgba(229,62,46,0.5)" : "1.5px solid rgba(244,121,32,0.15)",
                color: "var(--text-primary)",
                fontSize: 14,
                paddingLeft: 44,
                paddingRight: 16,
                boxShadow: "0 2px 4px rgba(180,100,20,0.04)",
              }}
            >
              {REGISTER_USER_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {errors.userTypeId && (
            <div className="flex items-center gap-1 mt-1" style={{ fontSize: 11, color: "#e53e2e" }}>
              <AlertCircle size={11} /> {errors.userTypeId}
            </div>
          )}
        </div>
        <GlassInput label="Student Code" placeholder="FPT2024001" icon={<BookOpen size={15} />}
          value={form.studentCode} onChange={v => set("studentCode", v)} error={errors.studentCode} />
        <GlassInput label="University" placeholder="FPT University" icon={<Building2 size={15} />}
          value={form.universityName} onChange={v => set("universityName", v)} error={errors.universityName} />

        <motion.button onClick={handleRegister} disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }} whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold"
          style={{ background: "linear-gradient(135deg, #F47920, #FF9040)", color: "white", fontSize: 14, boxShadow: "0 8px 24px rgba(244,121,32,0.4)", opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}>
          {loading ? <><Loader size={15} className="animate-spin" /> Processing...</> : <>Create Account <ArrowRight size={15} /></>}
        </motion.button>

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} style={{ color: "#F47920", fontWeight: 600, cursor: "pointer", background: "none", border: "none" }}>
            Sign in
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Login Card ───────────────────────────────────────────────────────────────
type LoginSuccessPayload = UserResponse | "__dev__" | string;

export function LoginCard({ onLogin, onSwitchToRegister, onBackToLanding }: { onLogin: (payload: LoginSuccessPayload) => void; onSwitchToRegister: () => void; onBackToLanding: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<OAuthProvider | null>(null);

  const handleLogin = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) { setApiError("Please enter your email and password."); return; }

    // ── Dev bypass ──────────────────────────────────────────────────────────
    if (normalizedEmail === DEV_EMAIL && password === DEV_PASSWORD) {
      localStorage.setItem("seal_dev_mode", "true");
      onLogin("__dev__");
      return;
    }
    // ────────────────────────────────────────────────────────────────────────

    setLoading(true);
    setApiError("");
    try {
      const res = await login({ email: normalizedEmail, password });
      onLogin(res.user);
    } catch (err) {
      setApiError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <AnimatePresence>
        {oauthProvider && (
          <OAuthModal provider={oauthProvider}
            onSuccess={() => { setOauthProvider(null); onLogin("member"); }}
            onClose={() => setOauthProvider(null)} />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="relative w-full rounded-3xl p-8"
        style={{ background: "var(--glass-bg)", backdropFilter: "blur(32px) saturate(180%)", WebkitBackdropFilter: "blur(32px) saturate(180%)", border: "1px solid var(--glass-border)", boxShadow: "var(--glass-shadow-lg)" }}>
        <button
          type="button"
          onClick={onBackToLanding}
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-2xl transition-all hover:-translate-y-0.5"
          style={{ background: "rgba(244,121,32,0.08)", border: "1px solid rgba(244,121,32,0.16)", color: "#F47920" }}
          aria-label="Back to landing page"
          title="Back to landing page"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="mb-7">
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>Welcome back 👋</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>Sign in to your SEAL Hackathon account</p>
        </div>

        <div className="space-y-5" onKeyDown={handleKeyDown}>
          {/* OAuth — GitHub tạm ẩn vì tính năng chưa hoàn thiện; hiện chỉ hỗ trợ Google. */}
          <div className="grid grid-cols-1 gap-3">
            <motion.button
              type="button"
              onClick={() => { window.location.href = getGoogleLoginUrl(); }}
              whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all"
              style={{ background: "#ffffff", color: "#3c4043", fontSize: 13, fontWeight: 500, border: "1px solid #dadce0" }}>
              <svg viewBox="0 0 48 48" width="16" height="16"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
              Google
            </motion.button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "rgba(244,121,32,0.12)" }} />
            <span style={{ fontSize: 12, color: "#a07850", letterSpacing: "0.02em" }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background: "rgba(244,121,32,0.12)" }} />
          </div>

          {apiError && <ErrorBanner message={apiError} />}

          <GlassInput label="Email" placeholder="you@fpt.edu.vn" icon={<Mail size={15} />}
            value={email} onChange={setEmail} />
          <GlassInput type={showPwd ? "text" : "password"} label="Password" placeholder="Enter your password"
            icon={<Lock size={15} />} value={password} onChange={setPassword}
            rightElement={<button type="button" onClick={() => setShowPwd(!showPwd)} style={{ color: "#c09060" }}>{showPwd ? <EyeOff size={15} /> : <Eye size={15} />}</button>} />

          <div style={{ textAlign: "right", marginTop: -8 }}>
            <a href="/forgot-password" style={{ fontSize: 12, color: "#F47920", fontWeight: 600, textDecoration: "none" }}>
              Forgot password?
            </a>
          </div>

          <motion.button onClick={handleLogin} disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -1 }} whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold"
            style={{ background: "linear-gradient(135deg, #F47920, #FF9040)", color: "white", fontSize: 14, boxShadow: "0 8px 24px rgba(244,121,32,0.4), inset 0 1px 0 rgba(255,255,255,0.2)", opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}>
            {loading ? <><Loader size={15} className="animate-spin" /> Signing in...</> : <>Sign In <ArrowRight size={15} /></>}
          </motion.button>

          <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <button onClick={onSwitchToRegister} style={{ color: "#F47920", fontWeight: 600, cursor: "pointer", background: "none", border: "none" }}>
              Register
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Full-page Login (with left panel) ───────────────────────────────────────
function LoginPage({ onLogin, onSwitchToRegister, onBackToLanding }: { onLogin: (payload: LoginSuccessPayload) => void; onSwitchToRegister: () => void; onBackToLanding: () => void }) {
  const [panelStats, setPanelStats] = useState({
    activeTeams: "N/A",
    submissions: "N/A",
    judges: "N/A",
    prizePool: "N/A",
  });

  useEffect(() => {
    getPublicTeamCount()
      .then(teamCount => setPanelStats(prev => ({ ...prev, activeTeams: String(teamCount) })))
      .catch(() => setPanelStats(prev => ({ ...prev, activeTeams: "N/A" })));

    awardService.getTotalPrize()
      .then(summary => setPanelStats(prev => ({ ...prev, prizePool: formatPrizeMoney(summary) })))
      .catch(() => setPanelStats(prev => ({ ...prev, prizePool: "N/A" })));

    api.get<{ count: number }>("/api/v1/public/submissions/count", false)
      .then(res => setPanelStats(prev => ({ ...prev, submissions: String(res.count) })))
      .catch(() => setPanelStats(prev => ({ ...prev, submissions: "N/A" })));

    api.get<{ count: number }>("/api/v1/public/judges/count", false)
      .then(res => setPanelStats(prev => ({ ...prev, judges: String(res.count) })))
      .catch(() => setPanelStats(prev => ({ ...prev, judges: "N/A" })));
  }, []);

  const displayStats = [
    { label: "Active Teams", value: panelStats.activeTeams, icon: "🚀" },
    { label: "Submissions", value: panelStats.submissions, icon: "📦" },
    { label: "Judges", value: panelStats.judges, icon: "⭐" },
    { label: "Prize Pool", value: panelStats.prizePool, icon: "🏆" },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-bg)", backgroundAttachment: "fixed" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between p-14 flex-1 relative overflow-hidden">
        <div className="absolute pointer-events-none" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(244,121,32,0.12) 0%, transparent 65%)", borderRadius: "50%", top: -150, left: -150 }} />
        <div className="absolute pointer-events-none" style={{ width: 350, height: 350, background: "radial-gradient(circle, rgba(255,208,160,0.10) 0%, transparent 65%)", borderRadius: "50%", bottom: 80, right: -60 }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex items-center gap-3.5 relative z-10">
          <div className="flex items-center justify-center rounded-2xl"
            style={{ width: 52, height: 52, background: "linear-gradient(135deg, #F47920, #FF9040)", boxShadow: "0 8px 24px rgba(244,121,32,0.4)" }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>SEAL</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, letterSpacing: "0.04em" }}>Software Engineering Agile League</div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative z-10">
          <h2 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
            The Ultimate<br />
            <span style={{ background: "linear-gradient(135deg, #F47920 0%, #FF7A00 45%, #FFD0A0 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Hackathon
            </span><br />
            Platform
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 15, lineHeight: 1.7, maxWidth: 380 }}>
            Manage teams, submit projects, score entries, and track leaderboards — all in one modern platform built for FPT University.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="relative z-10 grid grid-cols-2 gap-3">
          {displayStats.map(stat => (
            <motion.div key={stat.label} whileHover={{ y: -2 }} className="rounded-2xl p-4"
              style={{ background: "var(--glass-bg)", backdropFilter: "blur(20px)", border: "1px solid var(--glass-border)", boxShadow: "var(--glass-shadow)" }}>
              <span style={{ fontSize: 20 }}>{stat.icon}</span>
              <div style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", marginTop: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex flex-col justify-center items-center p-8 flex-1" style={{ maxWidth: 520 }}>
        <LoginCard onLogin={onLogin} onSwitchToRegister={onSwitchToRegister} onBackToLanding={onBackToLanding} />
      </div>
    </div>
  );
}

// ─── AuthPages (entry point) ─────────────────────────────────────────────────
export function AuthPages({
  mode,
  onLogin,
  onBackToLanding,
  onSwitchToLogin,
  onSwitchToRegister,
}: {
  mode: "login" | "register";
  onLogin: (payload: LoginSuccessPayload) => void;
  onBackToLanding: () => void;
  onSwitchToLogin: () => void;
  onSwitchToRegister: () => void;
}) {
  if (mode === "register") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--gradient-bg)", backgroundAttachment: "fixed" }}>
        <div className="w-full" style={{ maxWidth: 480 }}>
          <RegisterCard onSwitchToLogin={onSwitchToLogin} />
        </div>
      </div>
    );
  }

  return <LoginPage onLogin={onLogin} onSwitchToRegister={onSwitchToRegister} onBackToLanding={onBackToLanding} />;
}
