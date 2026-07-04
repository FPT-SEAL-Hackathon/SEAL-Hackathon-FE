import { Field, Input, Textarea } from "../../shared/ui/shared";
import { Card, Button, COLORS } from "../../../../components/shared/UIComponents";
import { PlusCircle, Edit, Trash2, Save, X, ChevronDown, ChevronRight, BookOpen, Users } from "lucide-react";
import { useState } from "react";
import { CategoryRequest } from "../../types/category";

// ── Category form ──────────────────────────────────────────────────────────
interface Props {
    initial: CategoryRequest;
    onSave: (data: CategoryRequest) => void;
    onCancel: () => void;
}

export function CategoryForm({
    initial, 
    onSave, 
    onCancel,
}: Props) {
  const [form, setForm] = useState<CategoryRequest>(initial);
  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(p => ({ ...p, [key]: value }));

  return (
    <Card className="p-5 mb-3" style={{ border: `1px solid ${COLORS.primary}30` }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Field label="Category Name">
            <Input value={form.categoryName} onChange={v => set("categoryName", v)} placeholder="e.g. Artificial Intelligence / ML" />
          </Field>
        </div>
        <Field label="Sort Order">
          <Input type="number" value={String(form.sortOrder)} onChange={v => set("sortOrder", Number(v))} />
        </Field>
        <div className="md:col-span-3">
          <Field label="Description">
            <Textarea value={form.description ?? ""} onChange={v => set("description", v)} placeholder="Category description..." rows={2} />
          </Field>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="primary" size="sm" icon={<Save size={13} />} onClick={async () => await onSave(form)} disabled={!form.categoryName}>
          Save Category
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}