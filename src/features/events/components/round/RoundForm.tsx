import { useState } from "react";
import {
  PlusCircle, Edit, Trash2, Save, X,
  ChevronDown, ChevronRight, GitBranch, UserCheck, CheckCircle,
} from "lucide-react";
import { Card, Button, StatusBadge, COLORS } from "../../../../components/shared/UIComponents";
import { Field, Input, Textarea, Select, AssignModal, CriteriaImportPanel } from "../../shared/ui/shared";
//import { allJudges, emptyRound, roundStatuses } from "./types";
//import type { Category, Round, EventCriteria, Judge, RoundCriteria } from "./types";
import type { Category } from "../../types/category";
import { RoundRequest } from "../../types/round";
import { ROUND_STATUSES } from "../../constants/roundStatus";


interface Props {
    initial: RoundRequest;
    onSave: (data: RoundRequest) => Promise<void>;
    onCancel: () => void;
}
export function RoundForm({
    initial, 
    onSave, 
    onCancel,
}: Props) {
  const [form, setForm] = useState(initial);
  const set = (key: keyof typeof form, value: unknown) => setForm(p => ({ ...p, [key]: value }));

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
      <div className="flex gap-2 mt-4">
        <Button variant="primary" size="sm" icon={<Save size={13} />} onClick={() => onSave(form)} disabled={!form.roundName}>
          Save Round
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </Card>
  );
}