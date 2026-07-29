import { ReactNode } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { Button, Card, COLORS } from "./UIComponents";

type ConfirmTone = "primary" | "warning" | "danger";

type ConfirmStep = "confirm" | "verify";

interface Props {
  title: string;
  message: string;

  icon?: ReactNode;

  tone?: ConfirmTone;

  confirmText?: string;

  cancelText?: string;

  confirmVariant?: "primary" | "danger";

  loading?: boolean;

  error?: string;

  step?: ConfirmStep;

  verifyLabel?: string;

  verifyPlaceholder?: string;

  expectedValue?: string;

  verifyValue?: string;

  onVerifyChange?: (value: string) => void;

  onConfirm: () => Promise<void> | void;

  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,

  icon,

  tone = "danger",

  confirmText = "Confirm",
  cancelText = "Cancel",

  confirmVariant = "danger",

  loading = false,

  error,

  step = "confirm",

  verifyLabel,

  verifyPlaceholder,

  expectedValue,

  verifyValue = "",

  onVerifyChange,

  onConfirm,

  onCancel,
}: Props) {
  const toneColor =
    tone === "primary"
      ? COLORS.primary
      : tone === "warning"
      ? COLORS.warning
      : COLORS.error;

  const toneBackground =
    tone === "primary"
      ? `${COLORS.primary}15`
      : tone === "warning"
      ? `${COLORS.warning}15`
      : `${COLORS.error}15`;

  const verifyMatched =
    step === "confirm" ||
    !expectedValue ||
    verifyValue.trim() === expectedValue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
      <Card
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{
          background: "#FFFDFB",
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{
                  background: toneBackground,
                }}
              >
                {icon ?? (
                  <AlertTriangle
                    size={22}
                    color={toneColor}
                  />
                )}
              </div>

              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                }}
              >
                {title}
              </h2>
            </div>

            <button
              onClick={onCancel}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <X
                size={18}
                color={COLORS.textSecondary}
              />
            </button>
          </div>

          <p
            className="mt-5 leading-6"
            style={{
              color: COLORS.textSecondary,
              fontSize: 14,
            }}
          >
            {message}
          </p>

          {step === "verify" && (
            <div className="mt-5 space-y-3">
              <div
                style={{
                  fontSize: 13,
                  color: COLORS.textPrimary,
                  fontWeight: 600,
                }}
              >
                {verifyLabel}
              </div>

              <input
                value={verifyValue}
                onChange={(e) => onVerifyChange?.(e.target.value)}
                placeholder={verifyPlaceholder}
                className="w-full rounded-xl px-3 py-2.5 outline-none"
                style={{
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.bg,
                }}
              />

              <div
                style={{
                  fontSize: 12,
                  color: COLORS.textSecondary,
                }}
              >
                Expected:
                <div
                  style={{
                    marginTop: 4,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                  }}
                >
                  {expectedValue}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              className="mt-4 rounded-xl px-4 py-3"
              style={{
                background: `${COLORS.error}10`,
                border: `1px solid ${COLORS.error}30`,
                color: COLORS.error,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-8">
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>

            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={loading || !verifyMatched}
              icon={
                loading ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : undefined
              }
            >
              {loading ? "Processing..." : confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}