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

  /**
   * Bật/tắt vòng hiệu chuẩn. Khi BẬT thì xoá luôn các field không áp dụng cho vòng này thay vì
   * chỉ ẩn ô đi: ẩn mà vẫn giữ giá trị trong state thì payload vẫn mang dữ liệu rác lên server
   * (backend cũng ép null, nhưng để form và thứ gửi đi khớp nhau cho khỏi khó hiểu khi debug).
   */
  const toggleCalibrationRound = () => {
    setForm(p => {
      const next = !p.isCalibrationRound;
      if (!next) return { ...p, isCalibrationRound: next };
      return {
        ...p,
        isCalibrationRound: next,
        submissionDeadline: undefined,
        appealStartTime: undefined,
        appealEndTime: undefined,
        advancementTopN: undefined,
      };
    });
  };

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

    // Chặn số âm/0 ngay tại form — khớp @Min(1) ở CreateRoundRequest/UpdateRoundRequest.
    // roundOrder sai làm hỏng sắp xếp bảng xếp hạng chung cuộc và việc xác định vòng chung kết.
    if (form.advancementTopN != null && form.advancementTopN < 1) {
      setError("Advancement Top N must be at least 1.");
      return;
    }
    if (editingRoundId && form.roundOrder != null && form.roundOrder < 1) {
      setError("Round Order must be at least 1.");
      return;
    }

    // eventStartDate/eventEndDate là LocalDateTime (EventResponse.java) → so sánh bằng
    // TIMESTAMP, khớp RoundServiceImpl.validateRoundTimeline (isBefore/isAfter trên datetime
    // nguyên vẹn, KHÔNG cắt về ngày). So sánh ở mức NGÀY sẽ cho qua những giá trị mà backend
    // vẫn từ chối (vd event bắt đầu 08:00, round bắt đầu 06:00 cùng ngày) → người dùng ăn 400.
    // Cách cũ hơn nữa so sánh chuỗi `startDate.substring(0,10) < event.eventStartDate` còn
    // sai hẳn: "2026-08-01" < "2026-08-01T00:00" (chuỗi ngắn hơn được coi là nhỏ hơn) → báo
    // lỗi oan ngay cả khi round bắt đầu đúng mốc khai mạc.
    const evStart = getTime(event?.eventStartDate);
    const evEnd = getTime(event?.eventEndDate);
    const fmtBoundary = (d: string) => new Date(d).toLocaleString();

    if (evStart && sTime && sTime < evStart) {
      setError(`Round Start Date must be on or after Event Start (${fmtBoundary(event!.eventStartDate)}).`);
      return;
    }

    if (evEnd && eTime && eTime > evEnd) {
      setError(`Round End Date must be on or before Event End (${fmtBoundary(event!.eventEndDate)}).`);
      return;
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
    // Cùng lý do như biên round ở trên: so sánh timestamp, không cắt về ngày.
    if (evStart && aStart && aStart < evStart) {
      setError(`Appeal Start Time must be on or after Event Start (${fmtBoundary(event!.eventStartDate)}).`);
      return;
    }
    if (evEnd && aEnd && aEnd > evEnd) {
      setError(`Appeal End Time must be on or before Event End (${fmtBoundary(event!.eventEndDate)}).`);
      return;
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

  // Số đội của category chứa round này — chỉ để tham chiếu khi đặt Advancement Top N.
  // null khi chưa biết (backend chưa trả teamCount hoặc chưa chọn category).
  const categoryTeamCount = categories?.find(c => c.categoryId === categoryId)?.teamCount ?? null;
  // Chỉ cảnh báo khi category ĐÃ có đội: lúc setup event số đội là 0, cảnh báo khi đó chỉ gây nhiễu.
  const topNExceedsTeams =
    categoryTeamCount != null && categoryTeamCount > 0
    && form.advancementTopN != null && form.advancementTopN >= categoryTeamCount;

  // Mốc thời gian của round ĐANG SOẠN, vẽ chồng lên timeline ngay khi user điền TỪNG field.
  // Khối `editingRound` phía trên chỉ xuất hiện khi đã có ĐỦ cả startDate và endDate, nên
  // trong lúc nhập dở organizer không thấy gì để đối chiếu — đây là phần bù cho khoảng đó.
  // DraftOverlay tự bỏ qua mốc rỗng/không parse được.
  const draftMarkers = [
      { label: "Start", at: form.startDate, color: "#2563eb" },
      { label: "Submission", at: form.submissionDeadline, color: "#16a34a" },
      { label: "Judging", at: form.judgingDeadline, color: "#9333ea" },
      { label: "Appeal ▸", at: form.appealStartTime, color: "#d97706" },
      { label: "◂ Appeal", at: form.appealEndTime, color: "#d97706" },
      { label: "End", at: form.endDate, color: "#dc2626" },
  ];

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
        {/* Round Order: khi TẠO MỚI, server luôn tự gán max+1 trong category và bỏ qua giá trị
            client gửi — nên hiện read-only thay vì ô nhập giả. Khi SỬA mới cho đổi, tối thiểu
            1 và không được trùng round khác (backend chặn bằng 409). */}
        <Field label="Round Order">
          {editingRoundId ? (
            <Input
              type="number"
              min={1}
              value={String(form.roundOrder ?? "")}
              onChange={v => set("roundOrder", v ? Math.max(1, Number(v)) : undefined)}
            />
          ) : (
            <Input type="number" value={String(form.roundOrder)} disabled />
          )}
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
        {/* Advancement Top N: số đội đi tiếp. Đội thuộc CATEGORY nên mốc tham chiếu là số đội
            của category này, không phải toàn event. CỐ Ý không chặn cứng theo số đội: round
            hầu như luôn được tạo lúc setup event, khi chưa đội nào đăng ký (số đội = 0) — chặn
            cứng sẽ khoá luôn màn tạo round. Chỉ cảnh báo mềm; RankingServiceImpl vẫn chỉ cho
            đi tiếp trong số đội thực có. */}
        {/* Vòng hiệu chuẩn không cho đội nào đi tiếp (RankingServiceImpl từ chối tính xếp hạng
            cho vòng này) nên ô Top N vô nghĩa — ẩn đi thay vì để tưởng là có tác dụng. */}
        {!form.isCalibrationRound && (
        <Field label="Advancement Top N">
          <Input
            type="number"
            min={1}
            value={form.advancementTopN != null ? String(form.advancementTopN) : ""}
            onChange={v => set("advancementTopN", v ? Math.max(1, Number(v)) : null)}
            placeholder="e.g. 10"
          />
          {categoryTeamCount != null && (
            <div
              className="mt-1"
              style={{
                fontSize: 11,
                color: topNExceedsTeams ? COLORS.warning : COLORS.textSecondary,
              }}
            >
              {topNExceedsTeams
                ? `⚠ This category currently has only ${categoryTeamCount} team${categoryTeamCount === 1 ? "" : "s"} — Top N is greater than or equal to the number of registered teams.`
                : `This category currently has ${categoryTeamCount} team${categoryTeamCount === 1 ? "" : "s"}.`}
            </div>
          )}
        </Field>
        )}
        {/* Biên event truyền vào các picker dưới đây là DATETIME thật của event (không phải
            ngày rồi 00:00), và quan hệ với biên event là BAO GỒM cả mốc — nên KHÔNG đặt
            strictMin/strictMax cho event: RoundServiceImpl cho phép roundStart == eventStart
            và roundEnd == eventEnd. strictMin/strictMax chỉ dùng cho các quan hệ nghiêm ngặt
            trong nội bộ round (start < end, appealStart < appealEnd). */}
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
        {/* Đội thi KHÔNG nộp bài vào vòng hiệu chuẩn được (backend chặn thẳng ở
            validateTeamAdvancedFromPreviousRound) — chỉ Organizer tạo bài mẫu. Nên hạn nộp bài
            không có tác dụng gì với vòng này. */}
        {!form.isCalibrationRound && (
        <Field label="Submission Deadline">
          <DateTimePickerField
            value={form.submissionDeadline ?? ""}
            onChange={v => set("submissionDeadline", v)}
            minDateTime={form.startDate || event?.eventStartDate}
            maxDateTime={form.judgingDeadline || form.endDate || event?.eventEndDate}
          />
        </Field>
        )}
        <Field label="Judging Deadline">
          <DateTimePickerField
            value={form.judgingDeadline ?? ""}
            onChange={v => set("judgingDeadline", v)}
            minDateTime={form.submissionDeadline || form.startDate || event?.eventStartDate}
            maxDateTime={form.endDate || event?.eventEndDate}
          />
        </Field>
        {/* Không có đội thi thì không ai phúc khảo — cửa sổ appeal vô nghĩa với vòng hiệu chuẩn. */}
        {!form.isCalibrationRound && (
        <>
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
        </>
        )}
        <div className="md:col-span-2">
          <Field label="Description">
            <Textarea value={form.description ?? ""} onChange={v => set("description", v)} placeholder="Round description..." />
          </Field>
        </div>
        <div className="md:col-span-2">
          <div
            className="flex items-center gap-2 cursor-pointer select-none w-max"
            onClick={() => toggleCalibrationRound()}
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
          {form.isCalibrationRound && (
            <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 6 }}>
              Judges score organizer-created sample submissions only — no team submits here, so
              submission deadline, advancement and appeal windows do not apply. Judges may score
              before or after the round dates; calibration closes once a competition round in this
              category enters judging.
            </div>
          )}
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
              draftMarkers={draftMarkers}
              draftRange={{ start: form.startDate, end: form.endDate }}
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
