import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Card, COLORS } from "@/components/shared/UIComponents";
import { researchService, type VarianceReportResponse } from "@/features/research/api/researchService";
import { parseApiError } from "@/lib/api/apiClient";

/**
 * Phương sai điểm giữa các giám khảo theo TỪNG TIÊU CHÍ.
 *
 * Dữ liệu này đã được backend tính sẵn từ lâu (getVarianceReport) nhưng trước đây không có
 * endpoint JSON nào expose ra nên không màn hình nào hiển thị được — chỉ lấy gián tiếp qua
 * file CSV. Component này tiêu thụ endpoint mới `/api/v1/research/variance-report`.
 *
 * Backend đã loại điểm hiệu chuẩn (IsCalibration = 0), nên đây là phương sai trên BÀI THẬT.
 */
export function ScoreVarianceByCriterion({ eventId }: { eventId: string | null }) {
  const [rows, setRows] = useState<VarianceReportResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!eventId) {
      setRows([]);
      return;
    }
    setLoading(true);
    setError("");
    researchService.getVarianceReport({ eventId })
      .then(res => setRows(res || []))
      .catch(err => setError(parseApiError(err).message))
      .finally(() => setLoading(false));
  }, [eventId]);

  // Gộp các bài nộp lại theo tiêu chí: yêu cầu là xem phương sai THEO TIÊU CHÍ, còn dữ liệu
  // thô trả về ở mức (bài nộp × tiêu chí). Trung bình phương sai của các bài cho biết tiêu chí
  // nào khiến hội đồng bất đồng nhiều nhất — thường là tiêu chí mô tả chưa rõ ràng.
  const byCriterion = useMemo(() => {
    const map = new Map<string, {
      criterionName: string;
      submissionCount: number;
      measurableCount: number;
      varianceSum: number;
      maxVariance: number;
      rangeSum: number;
      judgeCountMin: number;
    }>();

    rows.forEach(r => {
      const current = map.get(r.criterionName) ?? {
        criterionName: r.criterionName,
        submissionCount: 0,
        measurableCount: 0,
        varianceSum: 0,
        maxVariance: 0,
        rangeSum: 0,
        judgeCountMin: Number.MAX_SAFE_INTEGER,
      };
      current.submissionCount += 1;
      // variance = null nghĩa là bài đó chỉ 1 giám khảo chấm → KHÔNG tính được, phải loại
      // khỏi mẫu thay vì cộng 0 (cộng 0 sẽ kéo trung bình xuống và làm tiêu chí trông đồng
      // thuận hơn thực tế).
      if (r.variance != null) {
        current.measurableCount += 1;
        current.varianceSum += r.variance;
        current.maxVariance = Math.max(current.maxVariance, r.variance);
      }
      current.rangeSum += r.scoreRange ?? 0;
      current.judgeCountMin = Math.min(current.judgeCountMin, r.judgeCount ?? 0);
      map.set(r.criterionName, current);
    });

    return [...map.values()]
      .map(c => ({
        ...c,
        avgVariance: c.measurableCount ? c.varianceSum / c.measurableCount : null,
        avgRange: c.submissionCount ? c.rangeSum / c.submissionCount : 0,
      }))
      // Tiêu chí bất đồng nhất lên đầu — đó là chỗ cần sửa mô tả/rubric trước.
      // Tiêu chí không tính được (null) xuống cuối chứ không coi như phương sai 0.
      .sort((a, b) => (b.avgVariance ?? -1) - (a.avgVariance ?? -1));
  }, [rows]);

  const worstSubmissions = useMemo(
    () => rows
      .filter(r => r.variance != null)
      .sort((a, b) => (b.variance as number) - (a.variance as number))
      .slice(0, 5),
    [rows],
  );

  if (!eventId) return null;

  return (
    <Card className="p-5">
      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
        Score Variance by Criterion
      </div>
      <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3, marginBottom: 14 }}>
        How much judges disagree on each criterion (calibration scores excluded).
        Higher variance means judges interpret that criterion more differently.
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-gray-400" size={28} />
        </div>
      )}

      {!loading && error && (
        <div className="px-3 py-2 rounded-xl" style={{ color: COLORS.error, background: `${COLORS.error}10`, border: `1px solid ${COLORS.error}25`, fontSize: 13 }}>
          {error}
        </div>
      )}

      {!loading && !error && byCriterion.length === 0 && (
        <div className="py-8 text-center" style={{ color: COLORS.textSecondary, fontSize: 13 }}>
          No scores have been recorded for this event yet.
        </div>
      )}

      {!loading && !error && byCriterion.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr style={{ color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>
                  {["Criterion", "Avg variance", "Peak variance", "Avg score range", "Measurable"].map(h => (
                    <th key={h} className="py-2 pr-3" style={{ fontSize: 12, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byCriterion.map(c => {
                  // Thanh so sánh tương đối giữa các tiêu chí trong cùng bảng.
                  const worst = byCriterion[0].avgVariance || 1;
                  const ratio = c.avgVariance == null ? 0 : Math.min(100, (c.avgVariance / worst) * 100);
                  return (
                    <tr key={c.criterionName} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td className="py-2 pr-3" style={{ color: COLORS.textPrimary, fontWeight: 600 }}>
                        {c.criterionName}
                        {/* Phương sai của 1 giám khảo luôn bằng 0 — nói rõ để không hiểu nhầm là "đồng thuận tuyệt đối" */}
                        {c.judgeCountMin <= 1 && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[11px]" style={{ color: COLORS.warning }}>
                            <AlertTriangle size={11} /> some submissions scored by only 1 judge
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3" style={{ color: COLORS.textPrimary }}>
                        <div className="flex items-center gap-2">
                          <span style={{ fontWeight: 700 }}>
                            {c.avgVariance == null ? "—" : c.avgVariance.toFixed(2)}
                          </span>
                          <div className="h-1.5 rounded-full flex-1 min-w-[60px]" style={{ background: `${COLORS.border}` }}>
                            <div className="h-full rounded-full" style={{ width: `${ratio}%`, background: COLORS.primary }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-2 pr-3" style={{ color: COLORS.textSecondary }}>
                        {c.measurableCount ? c.maxVariance.toFixed(2) : "—"}
                      </td>
                      <td className="py-2 pr-3" style={{ color: COLORS.textSecondary }}>{c.avgRange.toFixed(2)}</td>
                      <td className="py-2 pr-3" style={{ color: COLORS.textSecondary }}>
                        {c.measurableCount}/{c.submissionCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, marginTop: 18, marginBottom: 8 }}>
            Most divergently scored submissions
          </div>
          <div className="space-y-2">
            {worstSubmissions.map(r => (
              <div
                key={`${r.submissionId}-${r.roundCriterionId}`}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: "var(--surface-bg)", border: `1px solid ${COLORS.border}` }}
              >
                <div style={{ fontSize: 13, color: COLORS.textPrimary }}>
                  <span style={{ fontWeight: 600 }}>{r.teamName || "—"}</span>
                  <span style={{ color: COLORS.textSecondary }}> · {r.criterionName} · {r.roundName}</span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  Mean {(r.meanScore ?? 0).toFixed(1)} · range {(r.scoreRange ?? 0).toFixed(1)} · {r.judgeCount} judges
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
