import { Link } from "react-router";
import { ShieldAlert } from "lucide-react";

export function ForbiddenPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--gradient-bg)" }}>
      <section
        className="w-full rounded-2xl p-8 text-center"
        style={{
          maxWidth: 440,
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow-lg)",
        }}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(229,62,46,0.12)" }}>
          <ShieldAlert size={24} color="#e53e2e" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>403</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "var(--text-secondary)" }}>
          You do not have permission to access this screen.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #F47920, #FF9040)" }}
        >
          Go to Dashboard
        </Link>
      </section>
    </main>
  );
}
