import { useCallback, useEffect, useState } from "react";
import { Loader2, BellRing, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { Card, Button, COLORS, StatusBadge } from "@/components/shared/UIComponents";
import { judgingService, type CalibrationJudgeStatus } from "@/features/judging/api/judgingService";
import { parseApiError } from "@/lib/api/apiClient";
import { toast } from "sonner";

/**
 * Tiến độ chấm bài mẫu của từng giám khảo trong một vòng hiệu chuẩn.
 *
 * Trước đây Organizer KHÔNG có cách nào biết ai chưa chấm: giám khảo vắng mặt không sinh ra
 * dòng dữ liệu nào nên không xuất hiện ở bất kỳ báo cáo nào, và hệ thống cũng không nhắc.
 * Hệ quả là median/độ lệch của cả hội đồng được tính trên vài người mà không ai nhận ra.
 *
 * Panel này THUẦN THÔNG TIN: hiệu chuẩn không bắt buộc, giám khảo bỏ qua vẫn chấm vòng thi
 * bình thường. Công cụ duy nhất ở đây là nút nhắc.
 */
export function CalibrationProgressPanel({ roundId }: { roundId: string }) {
  const [rows, setRows] = useState<CalibrationJudgeStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    judgingService.getCalibrationStatus(roundId)
      .then(res => setRows(res || []))
      .catch(err => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, [roundId]);

  useEffect(() => { load(); }, [load]);

  const handleRemind = async () => {
    setReminding(true);
    try {
      const result = await judgingService.remindCalibrationJudges(roundId);
      toast.success(result.message);
      load();
    } catch (err) {
      toast.error(parseApiError(err).message);
    } finally {
      setReminding(false);
    }
  };

  const pending = rows.filter(r => !r.completed);
  const sampleCount = rows[0]?.sampleCount ?? 0;

  return (
    <Card className="p-4 mt-3" style={{ border: `1px solid ${COLORS.border}` }}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>
            Panel Calibration Progress
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
            {rows.length === 0
              ? "No judge has been assigned to this round yet."
              : `${rows.length - pending.length}/${rows.length} judges finished scoring ${sampleCount} sample${sampleCount === 1 ? "" : "s"}.`}
            {" "}Calibration is not mandatory — judges who skip it can still score competition
            rounds normally. Use Remind to nudge the ones who have not finished.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" icon={<RefreshCw size={12} />} onClick={load} disabled={loading}>
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={reminding ? <Loader2 size={12} className="animate-spin" /> : <BellRing size={12} />}
            onClick={handleRemind}
            disabled={reminding || pending.length === 0}
          >
            {pending.length === 0 ? "Nobody to remind" : `Remind ${pending.length} judge${pending.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 12 }}>
          {error}
        </div>
      )}

      {loading && rows.length === 0 && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-gray-400" size={22} />
        </div>
      )}

      {!loading && rows.length > 0 && sampleCount === 0 && (
        <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: `${COLORS.warning}10`, color: COLORS.warning, fontSize: 12, fontWeight: 600 }}>
          This round has no sample submission yet — create one first, otherwise judges have nothing to score.
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-3 space-y-2">
          {rows.map(row => {
            // Thanh tiến độ theo Ô ĐIỂM (bài × tiêu chí) để thấy cả trường hợp chấm dở dang,
            // chứ không chỉ xong/chưa xong.
            const ratio = row.expectedCriterionCount > 0
              ? Math.min(100, (row.scoredCriterionCount / row.expectedCriterionCount) * 100)
              : 0;
            return (
              <div
                key={row.judgeUserId}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                style={{ background: "var(--surface-bg)", border: `1px solid ${COLORS.border}` }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {row.completed
                      ? <CheckCircle2 size={14} style={{ color: COLORS.success }} />
                      : <Clock size={14} style={{ color: COLORS.warning }} />}
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{row.judgeName}</span>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{row.email}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block" style={{ width: 110 }}>
                    <div className="h-1.5 rounded-full" style={{ background: COLORS.border }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${ratio}%`, background: row.completed ? COLORS.success : COLORS.warning }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.textSecondary, marginTop: 3 }}>
                      {row.completedSampleCount}/{row.sampleCount} samples · {row.scoredCriterionCount}/{row.expectedCriterionCount} scores
                    </div>
                  </div>
                  <StatusBadge status={row.completed ? "completed" : "pending"} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
