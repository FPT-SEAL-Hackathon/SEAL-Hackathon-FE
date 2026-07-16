import { useState, type CSSProperties } from "react";
import { useLocation, useNavigate } from "react-router";
import { AlertCircle, Eye, EyeOff, KeyRound, Loader, Lock, Mail } from "lucide-react";
import { googleLink, sendLinkOtp, verifyLinkOtp } from "@/features/auth/api/authService";
import { useAuth } from "@/features/auth/store/authStore";

type VerifyMode = "password" | "otp";

/**
 * Đích đến khi đăng nhập Google với email đã thuộc một tài khoản hiện có
 * (backend trả link_token thay vì tạo user thứ hai).
 * Người dùng xác minh quyền sở hữu bằng mật khẩu local HOẶC OTP email,
 * sau đó Google được gắn vào CHÍNH tài khoản đó — không merge, không user trùng.
 */
export function LinkGooglePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();

  const linkingToken: string = location.state?.linkingToken ?? "";
  const email: string = location.state?.email ?? "";

  const [mode, setMode] = useState<VerifyMode>("password");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  const finishLogin = (user: { accountStatus?: string }) => {
    setAuth(user as never);
    const isTemporary = user.accountStatus?.toUpperCase() === "TEMPORARY";
    navigate(isTemporary ? "/complete-profile" : "/", { replace: true });
  };

  const handlePasswordLink = async () => {
    if (!password) {
      setApiError("Please enter the password of your existing account.");
      return;
    }
    setApiError("");
    setLoading(true);
    try {
      const res = await googleLink({ linkingToken, password });
      finishLogin(res.user);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Could not link your Google account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setApiError("");
    setInfoMessage("");
    setLoading(true);
    try {
      await sendLinkOtp(linkingToken);
      setOtpSent(true);
      setInfoMessage("A 6-digit code has been sent to your account email.");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Could not send the verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndLink = async () => {
    if (otp.trim().length !== 6) {
      setApiError("Please enter the 6-digit code.");
      return;
    }
    setApiError("");
    setLoading(true);
    try {
      if (!otpVerified) {
        await verifyLinkOtp(linkingToken, otp.trim());
        setOtpVerified(true);
      }
      const res = await googleLink({ linkingToken });
      finishLogin(res.user);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!linkingToken) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-6 py-10"
        style={{ background: "var(--gradient-bg)", backgroundAttachment: "fixed" }}
      >
        <section className="glass-strong w-full max-w-md rounded-3xl p-8 text-center">
          <AlertCircle size={32} style={{ color: "var(--destructive)", margin: "0 auto" }} />
          <h1 className="mt-4" style={{ color: "var(--text-primary)", fontSize: 22, fontWeight: 800 }}>
            Linking session expired
          </h1>
          <p className="mt-2" style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Please sign in with Google again to restart the linking process.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-6 w-full rounded-2xl px-4 py-3 font-semibold"
            style={{ background: "var(--gradient-primary)", color: "white" }}
          >
            Back to login
          </button>
        </section>
      </main>
    );
  }

  const inputStyle: CSSProperties = {
    background: "var(--glass-bg)",
    border: "1.5px solid rgba(244,121,32,0.15)",
    color: "var(--text-primary)",
    fontSize: 14,
    paddingLeft: 44,
    paddingRight: 44,
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 py-10"
      style={{ background: "var(--gradient-bg)", backgroundAttachment: "fixed" }}
    >
      <section className="glass-strong w-full max-w-md rounded-3xl p-8">
        <h1 style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 800 }}>
          Link Google to your account
        </h1>
        <p className="mt-2" style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
          An account already exists for{" "}
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{email || "this email"}</span>.
          Verify that it&apos;s yours and we&apos;ll add Google sign-in to the same account —
          no duplicate account will be created.
        </p>

        {apiError && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl p-3" style={{ background: "rgba(229,62,46,0.08)", border: "1px solid rgba(229,62,46,0.2)" }}>
            <AlertCircle size={16} style={{ color: "var(--destructive)", marginTop: 2 }} />
            <span style={{ fontSize: 13, color: "var(--destructive)" }}>{apiError}</span>
          </div>
        )}
        {infoMessage && !apiError && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl p-3" style={{ background: "rgba(0,148,68,0.08)", border: "1px solid rgba(0,148,68,0.2)" }}>
            <Mail size={16} style={{ color: "var(--fpt-green)", marginTop: 2 }} />
            <span style={{ fontSize: 13, color: "var(--fpt-green)" }}>{infoMessage}</span>
          </div>
        )}

        {/* Chọn cách xác minh */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          {([
            { key: "password", label: "Use password", icon: <Lock size={14} /> },
            { key: "otp", label: "Email me a code", icon: <KeyRound size={14} /> },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setMode(tab.key); setApiError(""); setInfoMessage(""); }}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 font-semibold transition-all"
              style={{
                fontSize: 13,
                background: mode === tab.key ? "rgba(244,121,32,0.12)" : "transparent",
                border: mode === tab.key ? "1.5px solid rgba(244,121,32,0.4)" : "1.5px solid rgba(244,121,32,0.12)",
                color: mode === tab.key ? "#F47920" : "var(--text-secondary)",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {mode === "password" ? (
          <div className="mt-6 space-y-5">
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
                ACCOUNT PASSWORD
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c09060" }}><Lock size={15} /></div>
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePasswordLink(); }}
                  placeholder="Enter your password"
                  className="w-full py-3.5 rounded-2xl outline-none transition-all duration-200"
                  style={inputStyle}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c09060" }}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePasswordLink}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold"
              style={{ background: "linear-gradient(135deg, #F47920, #FF9040)", color: "white", fontSize: 14, boxShadow: "0 8px 24px rgba(244,121,32,0.4)", opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}
            >
              {loading ? <><Loader size={15} className="animate-spin" /> Linking...</> : "Verify & link Google"}
            </button>

            <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
              No password on this account? Switch to &quot;Email me a code&quot;.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold"
                style={{ background: "linear-gradient(135deg, #F47920, #FF9040)", color: "white", fontSize: 14, boxShadow: "0 8px 24px rgba(244,121,32,0.4)", opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}
              >
                {loading ? <><Loader size={15} className="animate-spin" /> Sending...</> : "Send verification code"}
              </button>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
                    6-DIGIT CODE
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c09060" }}><KeyRound size={15} /></div>
                    <input
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => { if (e.key === "Enter") handleVerifyOtpAndLink(); }}
                      placeholder="123456"
                      className="w-full py-3.5 rounded-2xl outline-none transition-all duration-200 tracking-[0.3em]"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtpAndLink}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold"
                  style={{ background: "linear-gradient(135deg, #F47920, #FF9040)", color: "white", fontSize: 14, boxShadow: "0 8px 24px rgba(244,121,32,0.4)", opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}
                >
                  {loading ? <><Loader size={15} className="animate-spin" /> Verifying...</> : "Verify & link Google"}
                </button>

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{ fontSize: 13, color: "#F47920", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
                  >
                    Resend code
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-5" style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            style={{ fontSize: 13, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            Cancel and go back to login
          </button>
        </div>
      </section>
    </main>
  );
}
