import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { AlertCircle, CheckCircle, Loader, LogIn } from "lucide-react";
import { exchangeOAuthCode } from "@/features/auth/api/authService";
import { useAuth } from "@/features/auth/store/authStore";

type ExchangeState = "loading" | "success" | "error";

function cleanUrlParams() {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete("code");
  currentUrl.searchParams.delete("error");
  const nextUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
}

/**
 * Đích redirect sau khi Google OAuth thành công (hoặc thất bại).
 * Backend chỉ đưa code trao đổi một lần lên URL — không đưa JWT thô lên URL.
 */
export function OAuthSuccessPage() {
  const [state, setState] = useState<ExchangeState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const params = new URLSearchParams(location.search);
    const code = params.get("code")?.trim();
    const oauthError = params.get("error");
    cleanUrlParams();

    if (oauthError) {
      setState("error");
      setErrorMessage("Google sign-in was cancelled or failed. Please try again.");
      return;
    }

    if (!code) {
      setState("error");
      setErrorMessage("Missing OAuth exchange code.");
      return;
    }

    exchangeOAuthCode(code)
      .then((res) => {
        setAuth(res.user);
        setState("success");

        // User TEMPORARY (mới đăng nhập Google lần đầu) phải hoàn thiện hồ sơ
        // trước khi vào các trang khác.
        const isTemporary = res.user.accountStatus?.toUpperCase() === "TEMPORARY";
        setTimeout(() => {
          navigate(isTemporary ? "/complete-profile" : "/", { replace: true });
        }, 600);
      })
      .catch(() => {
        setState("error");
        setErrorMessage("We could not complete your Google sign-in. Please try again.");
      });
  }, [location.search, navigate, setAuth]);

  const isLoading = state === "loading";
  const isSuccess = state === "success";

  return (
    <main
      className="flex min-h-screen items-center justify-center px-6 py-10"
      style={{ background: "var(--gradient-bg)", backgroundAttachment: "fixed" }}
    >
      <section className="glass-strong w-full max-w-md rounded-3xl p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: isSuccess ? "rgba(0,148,68,0.12)" : isLoading ? "rgba(244,121,32,0.12)" : "rgba(229,62,46,0.1)",
            color: isSuccess ? "var(--fpt-green)" : isLoading ? "var(--fpt-orange)" : "var(--destructive)",
          }}
        >
          {isLoading ? (
            <Loader className="animate-spin" size={30} aria-hidden="true" />
          ) : isSuccess ? (
            <CheckCircle size={32} aria-hidden="true" />
          ) : (
            <AlertCircle size={32} aria-hidden="true" />
          )}
        </div>

        <h1 className="mt-6" style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 800 }}>
          {isLoading ? "Signing you in..." : isSuccess ? "Signed in with Google" : "Sign-in failed"}
        </h1>
        <p className="mt-3" style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
          {isLoading
            ? "Please wait while we finish signing you in."
            : isSuccess
              ? "Redirecting..."
              : errorMessage}
        </p>

        {state === "error" && (
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition-all hover:-translate-y-0.5"
            style={{ background: "var(--gradient-primary)", color: "white", boxShadow: "0 8px 24px rgba(244,121,32,0.35)" }}
          >
            <LogIn size={16} aria-hidden="true" />
            Back to login
          </button>
        )}
      </section>
    </main>
  );
}
