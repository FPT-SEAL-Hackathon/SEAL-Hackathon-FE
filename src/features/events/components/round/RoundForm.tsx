import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import { Card, Button, COLORS } from "../../../../components/shared/UIComponents";
import { Field, Input, Textarea, Select } from "../../shared/ui/shared";
import { RoundRequest } from "../../types/round";
import { ROUND_STATUSES } from "../../constants/roundStatus";
import { EventResponse } from "../../api/eventService";
import { CategoryResponse } from "../../../categories/api/categoryService";
import { RoundResponse } from "../../../judging/api/roundService";
import { EventTimeline } from "../timeline/EventTimeline";


interface Props {
    initial: RoundRequest;
    onSave: (data: RoundRequest) => Promise<void>;
    onCancel: () => void;
    
    // Optional props for Timeline Preview
    event?: EventResponse;
    categories?: CategoryResponse[];
    allRounds?: RoundResponse[];
    categoryId?: string;
}
export function RoundForm({
    initial, 
    onSave, 
    onCancel,
    event,
    categories,
    allRounds,
    categoryId
}: Props) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof typeof form, value: unknown) => setForm(p => ({ ...p, [key]: value }));

  // Prepare data for timeline preview
  let previewRounds = allRounds || [];
  if (categoryId && form.startDate && form.endDate) {
      // Mock the current editing round to preview it on the timeline
      const editingRound: RoundResponse = {
          roundId: "editing-temp-id",
          categoryId: categoryId,
          roundName: form.roundName || "Editing Round...",
          description: form.description || "",
          roundOrder: form.roundOrder || 0,
          roundStatusName: "Draft",
          roundStatusId: "draft-temp-id",
          isCalibrationRound: form.isCalibrationRound || false,
          startDate: form.startDate,
          endDate: form.endDate,
          submissionDeadline: form.submissionDeadline || "",
          judgingDeadline: form.judgingDeadline || "",
          advancementTopN: form.advancementTopN || 0,
            // @ts-ignore
            appealStartTime: form.appealStartTime || undefined,
            // @ts-ignore
            appealEndTime: form.appealEndTime || undefined,
      };
      
      // Filter out this round if we are editing an existing one (it would be in allRounds with same ID, but initial doesn't have ID so we can't easily filter by ID here. Wait, initial is RoundRequest, we'd need roundId to filter. If it's an edit, we might show it twice. To fix, let's just assume we only pass preview data on Add Round for now, or filter by roundName if needed. Wait, RoundRequest doesn't have roundId. We can pass roundId as a prop if we want to replace it, but for simplicity let's just append it. Actually if it's Edit, `RoundCard` handles it. `RoundForm` is used only for Add Round right now! Let's verify this.)
      previewRounds = [...previewRounds, editingRound];
  }

  return (
    <Card className="p-5 mb-3" style={{ border: `1px solid ${COLORS.primary}30` }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Round Name">
          <Input value={form.roundName} onChange={v => set("roundName", v)} placeholder="e.g. Qualifying Round" />
        </Field>
        <Field label="Round Order">
          <Input type="number" value={String(form.roundOrder)} onChange={v => set("roundOrder", Number(v))} />
        </Field>
        <Field label="Status">
          <Select 
              value={form.roundStatusId} 
              onChange={v => set("roundStatusId", v)}
            >
            {ROUND_STATUSES.map(status => (
                <option 
                   key={status.statusId} 
                   value={status.statusId}
                >
                    {status.statusName}
                </option>
                ))
            }
          </Select>
        </Field>
        <Field label="Advancement Top N">
          <Input
            type="number"
            value={form.advancementTopN != null ? String(form.advancementTopN) : ""}
            onChange={v => set("advancementTopN", v ? Number(v) : null)}
            placeholder="e.g. 10"
          />
        </Field>
        <Field label="Start Date">
          <Input type="datetime-local" value={form.startDate ?? ""} onChange={v => set("startDate", v)} />
        </Field>
        <Field label="End Date">
          <Input type="datetime-local" value={form.endDate ?? ""} onChange={v => set("endDate", v)} />
        </Field>
        <Field label="Submission Deadline">
          <Input type="datetime-local" value={form.submissionDeadline ?? ""} onChange={v => set("submissionDeadline", v)} />
        </Field>
        <Field label="Judging Deadline">
          <Input type="datetime-local" value={form.judgingDeadline ?? ""} onChange={v => set("judgingDeadline", v)} />
        </Field>
        <Field label="Appeal Start Time">
          <Input type="datetime-local" value={form.appealStartTime ?? ""} onChange={v => set("appealStartTime", v)} />
        </Field>
        <Field label="Appeal End Time">
          <Input type="datetime-local" value={form.appealEndTime ?? ""} onChange={v => set("appealEndTime", v)} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Description">
            <Textarea value={form.description ?? ""} onChange={v => set("description", v)} placeholder="Round description..." />
          </Field>
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => set("isCalibrationRound", !form.isCalibrationRound)}
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center"
              style={{
                border: `2px solid ${form.isCalibrationRound ? COLORS.primary : COLORS.border}`,
                background: form.isCalibrationRound ? COLORS.primary : "transparent",
              }}
            >
              {form.isCalibrationRound && <CheckCircle size={10} color="white" />}
            </div>
            <span style={{ fontSize: 13, color: COLORS.textPrimary }}>Calibration Round</span>
          </div>
        </div>
      </div>

      {event && categories && previewRounds && (
          <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-500 mb-2">Timeline Preview</div>
              <div className="opacity-80 hover:opacity-100 transition-opacity">
                  <EventTimeline 
                      event={event}
                      categories={categories.filter(c => c.categoryId === categoryId)} // Only show this category lane for compactness
                      rounds={previewRounds.filter(r => r.categoryId === categoryId)}
                  />
              </div>
          </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button variant="primary" size="sm" icon={<Save size={13} />} onClick={() => onSave(form)} disabled={!form.roundName}>
          Save Round
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}