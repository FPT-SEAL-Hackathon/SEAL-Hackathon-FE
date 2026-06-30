import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { AlertCircle, CheckCircle, Loader, LogIn, MailCheck } from "lucide-react";
import { verifyEmail } from "@/features/auth/api/authService";
import { ApiError } from "@/lib/api/apiClient";

type VerificationState = "loading" | "success" | "invalid" | "expired" | "already-verified";

const STATE_COPY: Record<VerificationState, { title: string; message: string }> = {
  loading: {
    title: "Verifying email",
    message: "Please wait while we verify your email address.",
  },
  success: {
    title: "Email verified",
    message: "Your email has been verified. Redirecting to login...",
  },
  invalid: {
    title: "Invalid token",
    message: "This verification link is invalid. Please request a new verification email.",
  },
  expired: {
    title: "Expired token",
    message: "This verification link has expired. Please request a new verification email.",
  },
  "already-verified": {
    title: "Already verified",
    message: "This email address has already been verified. You can sign in now.",
  },
};

function getVerificationErrorState(error: unknown): VerificationState {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const status = error instanceof ApiError ? error.status : undefined;

  if (message.includes("already") || message.includes("verified") || status === 409) {
    return "already-verified";
  }

  if (message.includes("expired") || status === 410) {
    return "expired";
  }

  return "invalid";
}

function cleanTokenFromUrl() {
  const currentUrl = new URL(window.location.href);
  if (!currentUrl.searchParams.has("token")) return;
  currentUrl.searchParams.delete("token");
  const nextUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  window.history.replaceState({}, document.title, nextUrl);
}

export function VerifyEmailPage() {
  const [state, setState] = useState<VerificationState>("loading");
  const navigate = useNavigate();
  const location = useLocation();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const token = new URLSearchParams(location.search).get("token")?.trim();
    cleanTokenFromUrl();

    if (!token) {
      setState("invalid");
      return;
    }

    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    verifyEmail(token)
      .then(() => {
        setState("success");
        redirectTimer = setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2200);
      })
      .catch((error) => {
        setState(getVerificationErrorState(error));
      });

    return () => {
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [location.search, navigate]);

  const copy = STATE_COPY[state];
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
          ) : state === "already-verified" ? (
            <MailCheck size={32} aria-hidden="true" />
          ) : (
            <AlertCircle size={32} aria-hidden="true" />
          )}
        </div>

        <h1 className="mt-6" style={{ color: "var(--text-primary)", fontSize: 26, fontWeight: 800 }}>
          {copy.title}
        </h1>
        <p className="mt-3" style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.7 }}>
          {copy.message}
        </p>

        {!isLoading && !isSuccess && (
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-semibold transition-all hover:-translate-y-0.5"
            style={{
              background: "var(--gradient-primary)",
              color: "white",
              boxShadow: "0 8px 24px rgba(244,121,32,0.35)",
            }}
          >
            <LogIn size={16} aria-hidden="true" />
            Go to login
          </button>
        )}
      </section>
    </main>
  );
}
