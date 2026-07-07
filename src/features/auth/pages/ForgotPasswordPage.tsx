import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle, Loader, Mail } from "lucide-react";
import { forgotPassword } from "@/features/auth/api/authService";

/**
 * Quên mật khẩu chỉ áp dụng cho tài khoản LOCAL.
 * Response luôn là thông báo chung — không tiết lộ email có tồn tại hay không.
 */
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await forgotPassword(email.trim());
    } catch {
      // Ignore: response is generic regardless of outcome.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 py-10"
      style={{ background: "var(--gradient-bg)", backgroundAttachment: "fixed" }}
    >
      <section className="glass-strong w-full max-w-md rounded-3xl p-8">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mb-6 inline-flex items-center gap-2"
          style={{ color: "#F47920", fontSize: 13, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft size={15} /> Back to login
        </button>

        <h1 style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 800 }}>Forgot password</h1>
        <p className="mt-2" style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
          Enter your account email and we'll send you a password reset link if a local account exists.
        </p>

        {sent ? (
          <div className="mt-6 flex items-start gap-2 rounded-2xl p-4" style={{ background: "rgba(0,148,68,0.08)", border: "1px solid rgba(0,148,68,0.2)" }}>
            <CheckCircle size={18} style={{ color: "var(--fpt-green)", marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "var(--text-primary)" }}>
              If an account with local login exists for this email, a reset link has been sent. Please check your inbox.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
                EMAIL
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c09060" }}><Mail size={15} /></div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@fpt.edu.vn"
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
              {loading ? <><Loader size={15} className="animate-spin" /> Sending...</> : "Send reset link"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
