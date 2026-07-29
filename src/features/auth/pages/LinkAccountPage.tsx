import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, Eye, EyeOff, Lock, Loader, Mail } from "lucide-react";
import { getLinkCandidates, linkLocalAccount, type LinkCandidate } from "@/features/auth/api/authService";
import { useAuth } from "@/features/auth/store/authStore";
import { ApiError, parseApiError } from "@/lib/api/apiClient";

/**
 * Liên kết tài khoản OAuth tạm vào tài khoản local có sẵn.
 * Bắt buộc nhập mật khẩu để xác minh chủ sở hữu — không tự động gộp theo email.
 */
export function LinkAccountPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [candidates, setCandidates] = useState<LinkCandidate[]>([]);
  const [targetEmail, setTargetEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [apiError, setApiError] = useState("");
  const [mergeBlocked, setMergeBlocked] = useState(false);

  useEffect(() => {
    getLinkCandidates()
      .then((list) => {
        setCandidates(list);
        if (list.length > 0) setTargetEmail(list[0].email);
      })
      .catch(() => setCandidates([]))
      .finally(() => setLoadingCandidates(false));
  }, []);

  const handleSubmit = async () => {
    setApiError("");
    setMergeBlocked(false);

    if (!targetEmail.trim() || !password) {
      setApiError("Please enter the email and password of your existing account.");
      return;
    }

    setLoading(true);
    try {
      const res = await linkLocalAccount({ targetEmail: targetEmail.trim(), password });
      setAuth(res.user);
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "MERGE_BLOCKED") {
        setMergeBlocked(true);
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
      <section className="glass-strong w-full max-w-md rounded-3xl p-8">
        <h1 style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 800 }}>Link to existing account</h1>
        <p className="mt-2" style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
          An account with this information may already exist. You can link the accounts after verifying your password below.
        </p>

        {!loadingCandidates && candidates.length > 0 && (
          <div className="mt-4 rounded-2xl p-3" style={{ background: "rgba(244,121,32,0.06)", border: "1px solid rgba(244,121,32,0.15)" }}>
            <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>We found a matching account:</p>
            {candidates.map((c) => (
              <p key={c.email} style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>
                {c.email} {c.roleName ? `(${c.roleName})` : ""}
              </p>
            ))}
          </div>
        )}

        {apiError && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl p-3" style={{ background: "rgba(229,62,46,0.08)", border: "1px solid rgba(229,62,46,0.2)" }}>
            <AlertCircle size={16} style={{ color: "var(--destructive)", marginTop: 2 }} />
            <div style={{ fontSize: 13, color: "var(--destructive)" }}>
              {apiError}
              {mergeBlocked && (
                <p className="mt-1" style={{ fontSize: 12 }}>
                  Please contact support to complete this merge manually.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
              ACCOUNT EMAIL
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c09060" }}><Mail size={15} /></div>
              <input
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="you@fpt.edu.vn"
                className="w-full py-3.5 rounded-2xl outline-none transition-all duration-200"
                style={{ background: "var(--glass-bg)", border: "1.5px solid rgba(244,121,32,0.15)", color: "var(--text-primary)", fontSize: 14, paddingLeft: 44, paddingRight: 16 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#a07850", display: "block", marginBottom: 8, letterSpacing: "0.06em" }}>
              PASSWORD
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c09060" }}><Lock size={15} /></div>
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full py-3.5 rounded-2xl outline-none transition-all duration-200"
                style={{ background: "var(--glass-bg)", border: "1.5px solid rgba(244,121,32,0.15)", color: "var(--text-primary)", fontSize: 14, paddingLeft: 44, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "#c09060" }}>
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-semibold"
            style={{ background: "linear-gradient(135deg, #F47920, #FF9040)", color: "white", fontSize: 14, boxShadow: "0 8px 24px rgba(244,121,32,0.4)", opacity: loading ? 0.7 : 1, cursor: loading ? "wait" : "pointer" }}
          >
            {loading ? <><Loader size={15} className="animate-spin" /> Linking...</> : "Link account"}
          </button>

          <div style={{ textAlign: "center" }}>
            <button
              type="button"
              onClick={() => navigate("/complete-profile")}
              style={{ fontSize: 13, color: "#F47920", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
            >
              Back to complete profile
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
