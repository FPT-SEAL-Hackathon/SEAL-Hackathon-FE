import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, Loader } from "lucide-react";
import { resetPassword } from "@/features/auth/api/authService";
import { parseApiError } from "@/lib/api/apiClient";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get("token")?.trim() ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setApiError("");

    if (!token) {
      setApiError("This reset link is invalid or missing a token.");
      return;
    }
    if (newPassword.length < 8) {
      setApiError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setApiError("Password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, newPassword, confirmPassword });
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (err) {
      setApiError(parseApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 py-10"
      style={{ background: "var(--gradient-bg)", backgroundAttachment: "fixed" }}
    >
      <section className="glass-strong w-full max-w-md rounded-3xl p-8">
        <h1 style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 800 }}>Reset password</h1>
        <p className="mt-2" style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
          Choose a new password for your account.
        </p>

        {done ? (
          <div className="mt-6 flex items-start gap-2 rounded-2xl p-4" style={{ background: "rgba(0,148,68,0.08)", border: "1px solid rgba(0,148,68,0.2)" }}>
            <CheckCircle size={18} style={{ color: "var(--fpt-green)", marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "var(--text-primary)" }}>Password reset successfully. Redirecting to login...</p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {apiError && (
              <div className="flex items-start gap-2 rounded-2xl p-3" style={{ background: "rgba(229,62,46,0.08)", border: "1px solid rgba(229,62,46,0.2)" }}>
                <AlertCircle size={16} style={{ color: "var(--destructive)", marginTop: 2 }} />
                <p style={{ fontSize: 13, color: "var(--destructive)" }}>{apiError}</p>
              </div>
            )}

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
                NEW PASSWORD
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c09060" }}><Lock size={15} /></div>
                <input
                  type={showPwd ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full py-3.5 rounded-2xl outline-none transition-all duration-200"
                  style={{ background: "var(--glass-bg)", border: "1.5px solid rgba(244,121,32,0.15)", color: "var(--text-primary)", fontSize: 14, paddingLeft: 44, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c09060" }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
                CONFIRM PASSWORD
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c09060" }}><Lock size={15} /></div>
                <input
                  type={showPwd ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full py-3.5 rounded-2xl outline-none transition-all duration-200"
                  style={{ background: "var(--glass-bg)", border: "1.5px solid rgba(244,121,32,0.15)", color: "var(--text-primary)", fontSize: 14, paddingLeft: 44, paddingRight: 16 }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold"
              style={{ background: "linear-gradient(135deg, #F47920, #FF9040)", color: "white", fontSize: 14, boxShadow: "0 8px 24px rgba(244,121,32,0.4)", opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}
            >
              {loading ? <><Loader size={15} className="animate-spin" /> Resetting...</> : "Reset password"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
