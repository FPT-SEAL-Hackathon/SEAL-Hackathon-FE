import { useState } from "react";
import { Save, CheckCircle } from "lucide-react";
import { Card, Button, COLORS } from "../../../../components/shared/UIComponents";
import { Field, Input, Textarea, Select, DateTimePickerField } from "../../shared/ui/shared";
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
  // Khi edit: id của round đang sửa, để loại nó khỏi allRounds và thay bằng bản
  // preview đang chỉnh (tránh hiển thị trùng round trên timeline).
  editingRoundId?: string;
}
export function RoundForm({
  initial,
  onSave,
  onCancel,
  event,
  categories,
  allRounds,
  categoryId,
  editingRoundId
}: Props) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (key: keyof typeof form, value: unknown) => setForm(p => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setError("");
    if (!form.roundName) return;

    const getTime = (d: string | null | undefined) => d ? new Date(d).getTime() : null;

    const sTime = getTime(form.startDate);
    const eTime = getTime(form.endDate);
    const subTime = getTime(form.submissionDeadline);
    const jdgTime = getTime(form.judgingDeadline);

    if (sTime && eTime && sTime >= eTime) {
      setError("End Date must be strictly after Start Date.");
      return;
    }

    if (event?.eventStartDate && form.startDate) {
      const eventStartDay = new Date(event.eventStartDate.substring(0, 10) + "T00:00:00").getTime();
      const roundStartDay = new Date(form.startDate.substring(0, 10) + "T00:00:00").getTime();
      if (!isNaN(roundStartDay) && !isNaN(eventStartDay) && roundStartDay < eventStartDay) {
        setError(`Round Start Date must be on or after Event Start Date (${event.eventStartDate.substring(0, 10)}).`);
        return;
      }
    }

    if (event?.eventEndDate && form.endDate) {
      const eventEndDay = new Date(event.eventEndDate.substring(0, 10) + "T23:59:59").getTime();
      const roundEndDay = new Date(form.endDate.substring(0, 10) + "T00:00:00").getTime();
      if (!isNaN(roundEndDay) && !isNaN(eventEndDay) && roundEndDay > eventEndDay) {
        setError(`Round End Date must be on or before Event End Date (${event.eventEndDate.substring(0, 10)}).`);
        return;
      }
    }

    if (sTime && subTime && subTime < sTime) {
      setError("Submission Deadline must be after or equal to Start Date.");
      return;
    }

    if (subTime && jdgTime && jdgTime < subTime) {
      setError("Judging Deadline must be after or equal to Submission Deadline.");
      return;
    }

    if (jdgTime && eTime && eTime < jdgTime) {
      setError("End Date must be after or equal to Judging Deadline.");
      return;
    }

    // Cross checks if some dates are missing
    if (!subTime && sTime && jdgTime && jdgTime < sTime) {
      setError("Judging Deadline must be after or equal to Start Date.");
      return;
    }
    if (!jdgTime && eTime && subTime && eTime < subTime) {
      setError("End Date must be after or equal to Submission Deadline.");
      return;
    }

    const aStart = getTime(form.appealStartTime);
    const aEnd = getTime(form.appealEndTime);
    if (event?.eventStartDate && form.appealStartTime) {
      const eventStartDay = new Date(event.eventStartDate.substring(0, 10) + "T00:00:00").getTime();
      const appealStartDay = new Date(form.appealStartTime.substring(0, 10) + "T00:00:00").getTime();
      if (!isNaN(appealStartDay) && !isNaN(eventStartDay) && appealStartDay < eventStartDay) {
        setError(`Appeal Start Time must be on or after Event Start Date (${event.eventStartDate.substring(0, 10)}).`);
        return;
      }
    }
    if (event?.eventEndDate && form.appealEndTime) {
      const eventEndDay = new Date(event.eventEndDate.substring(0, 10) + "T23:59:59").getTime();
      const appealEndDay = new Date(form.appealEndTime.substring(0, 10) + "T00:00:00").getTime();
      if (!isNaN(appealEndDay) && !isNaN(eventEndDay) && appealEndDay > eventEndDay) {
        setError(`Appeal End Time must be on or before Event End Date (${event.eventEndDate.substring(0, 10)}).`);
        return;
      }
    }
    if (jdgTime && aStart && aStart < jdgTime) {
      setError("Appeal Start Time must be after or equal to Judging Deadline.");
      return;
    }
    if (sTime && aStart && aStart < sTime) {
      setError("Appeal Start Time must be after or equal to Start Date.");
      return;
    }
    if (eTime && aEnd && aEnd > eTime) {
      setError("Appeal End Time must be before or equal to End Date.");
      return;
    }
    if (aStart && aEnd && aStart >= aEnd) {
      setError("Appeal Start Time must be strictly before Appeal End Time.");
      return;
    }

    try {
      const payload = { ...form };
      if (!payload.roundStatusId) {
        delete payload.roundStatusId;
      }
      await onSave(payload);
    } catch (err: any) {
      setError(err?.message || "Save failed.");
    }
  };

  // Prepare data for timeline preview.
  // Khi edit, loại round đang sửa (theo editingRoundId) khỏi allRounds để bản mock
  // bên dưới thay thế nó, tránh vẽ trùng round trên timeline.
  let previewRounds = (allRounds || []).filter(r => r.roundId !== editingRoundId);
  if (categoryId && form.startDate && form.endDate) {
    // Mock the current editing round to preview it on the timeline
    const editingRound: RoundResponse = {
      roundId: "editing-temp-id",
      categoryId: categoryId,
      roundName: form.roundName || "Editing Round...",
      description: form.description || "",
      roundOrder: form.roundOrder || 0,
      roundStatusId: form.roundStatusId || "",
      roundStatusName: "Draft",
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
      {error && (
        <div className="px-4 py-3 mb-4 rounded-xl text-sm whitespace-pre-wrap" style={{ background: `${COLORS.error}10`, border: `1px solid ${COLORS.error}30`, color: COLORS.error }}>
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Round Name">
          <Input value={form.roundName} onChange={v => set("roundName", v)} placeholder="e.g. Qualifying Round" />
        </Field>
        <Field label="Round Order">
          <Input type="number" value={String(form.roundOrder)} onChange={v => set("roundOrder", Number(v))} />
        </Field>
        <Field label="Status">
          <Select
            value={form.roundStatusId || ""}
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
          <DateTimePickerField
            value={form.startDate ?? ""}
            onChange={v => set("startDate", v)}
            minDateTime={event?.eventStartDate}
            maxDateTime={form.endDate || event?.eventEndDate}
            strictMax={!!form.endDate}
          />
        </Field>
        <Field label="End Date">
          <DateTimePickerField
            value={form.endDate ?? ""}
            onChange={v => set("endDate", v)}
            minDateTime={form.judgingDeadline || form.submissionDeadline || form.startDate || event?.eventStartDate}
            strictMin={!form.judgingDeadline && !form.submissionDeadline && !!form.startDate}
            maxDateTime={event?.eventEndDate}
          />
        </Field>
        <Field label="Submission Deadline">
          <DateTimePickerField
            value={form.submissionDeadline ?? ""}
            onChange={v => set("submissionDeadline", v)}
            minDateTime={form.startDate || event?.eventStartDate}
            maxDateTime={form.judgingDeadline || form.endDate || event?.eventEndDate}
          />
        </Field>
        <Field label="Judging Deadline">
          <DateTimePickerField
            value={form.judgingDeadline ?? ""}
            onChange={v => set("judgingDeadline", v)}
            minDateTime={form.submissionDeadline || form.startDate || event?.eventStartDate}
            maxDateTime={form.endDate || event?.eventEndDate}
          />
        </Field>
        <Field label="Appeal Start Time">
          <DateTimePickerField
            value={form.appealStartTime ?? ""}
            onChange={v => set("appealStartTime", v)}
            minDateTime={form.judgingDeadline || form.startDate || event?.eventStartDate}
            maxDateTime={form.appealEndTime || form.endDate || event?.eventEndDate}
            strictMax={!!form.appealEndTime}
          />
        </Field>
        <Field label="Appeal End Time">
          <DateTimePickerField
            value={form.appealEndTime ?? ""}
            onChange={v => set("appealEndTime", v)}
            minDateTime={form.appealStartTime || form.judgingDeadline || form.startDate || event?.eventStartDate}
            strictMin={!!form.appealStartTime}
            maxDateTime={form.endDate || event?.eventEndDate}
          />
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
        <div className="mt-4 mb-2 pt-4 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-500 mb-2">Timeline Preview</div>
          {/* Bọc cuộn ngang: EventTimeline có min-w-[800px] bên trong, cha phải cho tràn/cuộn
                  để không đè lên các phần khác của form khi card hẹp. */}
          <div className="w-full max-w-full overflow-x-auto">
            <EventTimeline
              event={event}
              categories={categories.filter(c => c.categoryId === categoryId)} // Only show this category lane for compactness
              rounds={previewRounds.filter(r => r.categoryId === categoryId)}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <Button variant="primary" size="sm" icon={<Save size={13} />} onClick={handleSave} disabled={!form.roundName}>
          Save Round
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}
