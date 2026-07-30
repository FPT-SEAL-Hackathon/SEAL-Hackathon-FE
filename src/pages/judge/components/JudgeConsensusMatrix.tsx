import { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, CheckCircle, Download, Loader2, Lock } from "lucide-react";
import { researchService, ConsensusMatrixResponse } from "@/features/research/api/researchService";
import { useAuth } from "@/features/auth/store/authStore";
import { getAccessToken } from "@/lib/api/apiClient";
import { Card, COLORS } from "@/components/shared/UIComponents";

// Lệch từ mức này trở lên (tính theo TỶ LỆ trên thang điểm của tiêu chí) thì cảnh báo cho
// riêng giám khảo. Dùng tỷ lệ chứ không dùng số tuyệt đối: lệch 2 điểm trên thang 5 là rất
// nhiều, còn trên thang 100 thì không đáng kể.
const PERSONAL_DEVIATION_RATIO = 0.15;

export function JudgeConsensusMatrix({ roundId }: { roundId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<ConsensusMatrixResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!roundId) return;

    setLoading(true);
    researchService.getConsensusMatrix(roundId)
      .then(res => {
        setData(res || []);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to load consensus matrix", err);
        setError("Could not load the consensus matrix.");
      })
      .finally(() => setLoading(false));
  }, [roundId]);

  const handleExportCsv = async () => {
    if (!roundId || exporting) return;
    setExporting(true);
    setError(null);
    try {
      await researchService.downloadCalibrationCsv(roundId, getAccessToken());
    } catch (err) {
      console.error("Failed to export calibration CSV", err);
      setError("Could not export the calibration CSV.");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-8 flex justify-center items-center">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl">
        {error}
      </Card>
    );
  }

  // Backend chỉ trả bài mẫu mà chính giám khảo này ĐÃ chấm (chặn nhìn median rồi chấm theo).
  // Rỗng nghĩa là chưa chấm bài mẫu nào — nói rõ ra thay vì ẩn component đi không lời giải thích.
  if (data.length === 0) {
    return (
      <Card className="mt-6 p-6 flex items-start gap-3">
        <Lock size={18} className="mt-0.5 shrink-0" style={{ color: COLORS.textSecondary }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>
            No comparison available yet
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
            Score the calibration sample first. The panel's results are revealed only after you
            submit your own scores, so that your judgement is not influenced by others.
          </div>
        </div>
      </Card>
    );
  }

  // Nhóm theo từng bài mẫu: một round hiệu chuẩn có thể có nhiều bài.
  const bySample = data.reduce<Record<string, ConsensusMatrixResponse[]>>((acc, row) => {
    const key = row.sampleLabel || row.submissionId;
    (acc[key] ||= []).push(row);
    return acc;
  }, {});

  return (
    <Card className="mt-6 overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-white gap-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Consensus Matrix</h3>
          <p className="text-sm text-gray-500">
            Panel score distribution per criterion — compare it against your own scoring
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {exporting ? "Exporting..." : "Export CSV (anonymized)"}
        </button>
      </div>

      {Object.entries(bySample).map(([sampleLabel, rows]) => (
        <div key={sampleLabel}>
          <div
            className="px-6 py-2 text-xs font-bold uppercase tracking-wider"
            style={{ background: `${COLORS.primary}0d`, color: COLORS.primary }}
          >
            {sampleLabel}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Criterion</th>
                  <th className="px-6 py-4">Your score</th>
                  <th className="px-6 py-4">Panel median</th>
                  <th className="px-6 py-4">Distribution</th>
                  <th className="px-6 py-4">Deviation (SD)</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...rows]
                  // Tiêu chí lệch nhiều nhất lên đầu: đó là chỗ giám khảo cần xem lại trước.
                  .sort((a, b) => {
                    const da = deviationOf(a, user?.userId);
                    const db = deviationOf(b, user?.userId);
                    return Math.abs(db) - Math.abs(da);
                  })
                  .map(row => {
                    const myScore = user?.userId ? row.judgeScores?.[user.userId] : undefined;
                    const diff = deviationOf(row, user?.userId);
                    const max = row.maxPossibleScore || 0;
                    const isHighDeviation = max > 0 && Math.abs(diff) / max >= PERSONAL_DEVIATION_RATIO;
                    const isDanger = row.status === "DANGER";
                    const isWarning = row.status === "WARNING";

                    return (
                      <tr key={row.criteriaName} className={isDanger ? "bg-red-50/50" : "bg-white"}>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {row.criteriaName}
                          {max > 0 && <span className="text-xs text-gray-400"> / {max}</span>}
                        </td>
                        <td className="px-6 py-4">
                          {myScore === undefined || myScore === null ? (
                            <span className="text-gray-400">—</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-base font-semibold text-gray-800">{myScore}</span>
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                                  isHighDeviation ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                Δ {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-700">{row.median.toFixed(1)}</td>
                        <td className="px-6 py-4">
                          <ScoreDistribution
                            scores={row.scoreDistribution || []}
                            myScore={myScore}
                            maxScore={max}
                          />
                          <div className="text-[11px] text-gray-400 mt-1">
                            {row.minScore.toFixed(1)}–{row.maxScore.toFixed(1)} · {(row.scoreDistribution || []).length} judges
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-800">
                          {row.standardDeviation.toFixed(2)}
                          {max > 0 && (
                            <span className="text-xs font-normal text-gray-400">
                              {" "}({((row.standardDeviation / max) * 100).toFixed(0)}%)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isDanger && (
                            <span className="flex items-center gap-1.5 text-red-700 font-semibold bg-red-100 px-2.5 py-1 rounded-md w-max">
                              <AlertTriangle size={16} /> DANGER
                            </span>
                          )}
                          {isWarning && (
                            <span className="flex items-center gap-1.5 text-amber-600 font-medium bg-amber-50 px-2.5 py-1 rounded-md w-max border border-amber-100">
                              <AlertCircle size={16} /> WARNING
                            </span>
                          )}
                          {!isDanger && !isWarning && (
                            <span className="flex items-center gap-1.5 text-emerald-600/70 font-medium">
                              <CheckCircle size={16} /> GOOD
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </Card>
  );
}

function deviationOf(row: ConsensusMatrixResponse, userId?: string) {
  const myScore = userId ? row.judgeScores?.[userId] : undefined;
  if (myScore === undefined || myScore === null) return 0;
  return myScore - row.median;
}

/**
 * Phân bố điểm của hội đồng trên một tiêu chí: mỗi chấm là một giám khảo (ẩn danh), chấm của
 * người đang xem được tô màu chính. Cho thấy hội đồng có chia hai cực hay có ai lạc hẳn ra
 * ngoài không — điều mà 4 con số tóm tắt (median/min/max/SD) không thể hiện được.
 */
function ScoreDistribution({ scores, myScore, maxScore }: {
  scores: number[];
  myScore?: number | null;
  maxScore: number;
}) {
  if (scores.length === 0) return <span className="text-gray-400 text-xs">—</span>;

  // Không biết thang điểm thì co giãn theo chính dải điểm quan sát được.
  const lo = maxScore > 0 ? 0 : Math.min(...scores);
  const hi = maxScore > 0 ? maxScore : Math.max(...scores);
  const span = hi - lo || 1;
  const pct = (v: number) => ((v - lo) / span) * 100;

  let myMarked = false;

  return (
    <div className="relative h-5 w-40 rounded bg-gray-100">
      {scores.map((s, i) => {
        // Chỉ tô MỘT chấm là của mình, tránh trường hợp trùng điểm với người khác.
        const isMine = !myMarked && myScore != null && s === myScore;
        if (isMine) myMarked = true;
        return (
          <span
            key={i}
            title={isMine ? `You: ${s}` : `Judge (anonymous): ${s}`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full"
            style={{
              left: `${Math.max(0, Math.min(100, pct(s)))}%`,
              width: isMine ? 11 : 8,
              height: isMine ? 11 : 8,
              background: isMine ? COLORS.primary : "#9ca3af",
              border: isMine ? "2px solid #fff" : "1px solid #fff",
              zIndex: isMine ? 2 : 1,
            }}
          />
        );
      })}
    </div>
  );
}
