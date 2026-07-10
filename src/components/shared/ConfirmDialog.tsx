import { AlertTriangle, X } from "lucide-react";
import { Button, Card, COLORS } from "./UIComponents";

interface Props {

  title: string;

  message: string;

  confirmText?: string;

  cancelText?: string;

  confirmVariant?: "primary" | "danger";

  loading?: boolean;

  onConfirm: () => Promise<void> | void;

  onCancel: () => void;
}

export function ConfirmDialog({

  title,
  message,

  confirmText = "Confirm",
  cancelText = "Cancel",

  confirmVariant = "danger",

  loading = false,

  onConfirm,
  onCancel,
}: Props) {

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
                  background: "#FEF2F2",
                }}
              >
                <AlertTriangle
                  size={22}
                  color="#DC2626"
                />
              </div>

              <div>

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

            </div>

            <button
              onClick={onCancel}
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
              disabled={loading}
            >
              {confirmText}
            </Button>

          </div>

        </div>
      </Card>

    </div>
  );
}