import { useState } from "react";
import { Save, X } from "lucide-react";
import { Field, Input, Textarea } from "../../../features/events/shared/ui/shared";
import { Card, Button, COLORS } from "../../../components/shared/UIComponents";
import { TemplateRequest } from "../types/template";

interface Props {
  mode: "create" | "edit";
  initial: TemplateRequest;
  onSave: (data: TemplateRequest) => Promise<void> | void;
  onCancel: () => void;
}

export function CriteriaTemplateForm({
  mode,
  initial,
  onSave,
  onCancel,
}: Props) {
  const [form, setForm] = useState<TemplateRequest>(initial);

  const set = <K extends keyof TemplateRequest>(
    key: K,
    value: TemplateRequest[K]
  ) => {
    setForm(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-6">

      <Card
        className="w-full max-w-2xl rounded-3xl shadow-2xl"
        style={{
            background: "#FFFBF7",
            border: `1px solid ${COLORS.border}`,
        }}
      >

        {/* Header */}

        <div
          className="flex items-center justify-between px-6 py-5"
          style={{
            background: "#FFF7ED",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: COLORS.textPrimary,
              }}
            >
              {mode === "create"
                ? "Create Criteria Template"
                : "Edit Criteria Template"}
            </h2>

            <p
              style={{
                marginTop: 4,
                fontSize: 13,
                color: COLORS.textSecondary,
              }}
            >
              Configure a reusable judging criterion template.
            </p>
          </div>

          <button
            onClick={onCancel}
            className="p-2 rounded-lg transition hover:bg-orange-100"
          >
            <X
              size={18}
              color={COLORS.textSecondary}
            />
          </button>
        </div>

        {/* Body */}

        <div className="p-6 space-y-5">

          <Field label="Criterion Name">
            <Input
              value={form.criterionName}
              onChange={v => set("criterionName", v)}
              placeholder="Innovation"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">

            <Field label="Default Weight">
              <Input
                type="number"
                value={String(form.defaultWeight)}
                onChange={v => set("defaultWeight", Number(v))}
              />
            </Field>

            <Field label="Max Score">
              <Input
                type="number"
                value={String(form.maxScore)}
                onChange={v => set("maxScore", Number(v))}
              />
            </Field>

          </div>

          <Field label="Description">
            <Textarea
              rows={4}
              value={form.description ?? ""}
              onChange={v => set("description", v)}
              placeholder="Describe how this criterion should be evaluated..."
            />
          </Field>

        </div>

        {/* Footer */}

        <div
          className="flex justify-end gap-3 px-6 py-5"
          style={{
            background: "#FFFBF7",
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >

          <Button
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            icon={<Save size={14} />}
            disabled={!form.criterionName.trim()}
            onClick={async () => await onSave(form)}
          >
            {mode === "create"
              ? "Create Template"
              : "Save Changes"}
          </Button>

        </div>

      </Card>
    </div>
  );
}