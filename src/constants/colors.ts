export const COLORS = {
  primary: "#F47920",
  secondary: "#009444",
  accent: "#FF9040",
  success: "#009444",
  warning: "#F59E0B",
  error: "#e53e2e",
  bg: "var(--surface-bg)",
  card: "var(--glass-bg)",
  border: "var(--glass-border-subtle)",
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
} as const;

export type ColorKey = keyof typeof COLORS;
