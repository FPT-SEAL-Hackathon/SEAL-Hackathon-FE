import { useState, useEffect } from "react";
import { BarChart2, TrendingUp, Scale, Loader2 } from "lucide-react";
import { Card, SectionHeader, COLORS, StatCard } from "@/components/shared/UIComponents";
import { type ReliabilityMetricResponse } from "@/features/research/api/researchService";
import { judgingService } from "@/features/judging/api/judgingService";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import { useAuth } from "@/features/auth/store/authStore";
import { JudgeConsensusMatrix } from "./JudgeConsensusMatrix";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Dưới ngưỡng này thì bias/RMS chưa đủ dữ liệu để kết luận gì.
const MIN_COMPARISONS = 3;
// Lệch quá mức này (điểm tổng của một bài) mới coi là đáng chú ý.
const NOTABLE_BIAS = 2;

function biasColor(bias: number | null) {
  if (bias == null) return COLORS.textSecondary;
  return Math.abs(bias) >= NOTABLE_BIAS ? COLORS.warning : COLORS.success;
}

/**
 * Một câu chẩn đoán từ cặp (bias, RMS) — đây mới là thứ giám khảo hành động được:
 *  - bias cao, RMS thấp  → lệch HỆ THỐNG, chỉ cần dịch cả thang chấm
 *  - bias ~0, RMS cao    → chấm THẤT THƯỜNG, dịch thang không cứu được
 *  - cả hai thấp         → đã ăn khớp với hội đồng
 */
function describeBias(bias: number | null, rms: number | null): string {
  if (bias == null) {
    return "No peer scored the same samples, so there is nothing to compare against yet.";
  }
  const direction = bias > 0 ? "more leniently" : "more strictly";
  const systematic = Math.abs(bias) >= NOTABLE_BIAS;
  const erratic = rms != null && rms >= Math.abs(bias) * 2 && rms >= NOTABLE_BIAS;

  if (systematic && erratic) {
    return `You score ${direction} than the panel by ${Math.abs(bias).toFixed(1)} on average, and your gap swings a lot between samples (${rms?.toFixed(1)}). Re-read the rubric rather than simply shifting your scale.`;
  }
  if (systematic) {
    return `You consistently score ${direction} than the panel, by ${Math.abs(bias).toFixed(1)} on average. This is a systematic offset — shifting your whole scale would align you.`;
  }
  if (erratic) {
    return `Your average matches the panel, but individual scores swing by ${rms?.toFixed(1)}. The disagreement is case-by-case rather than a fixed offset.`;
  }
  return "Your scoring is aligned with the panel, both on average and case by case.";
}

/**
 * Phân bố điểm trung bình của cả hội đồng trên một trục, chấm của người đang xem được tô màu.
 * Cho biết mình nằm ở rìa hay ở giữa mà không nêu tên ai.
 */
function PanelSpread({ data, myUserId }: { data: ReliabilityMetricResponse[]; myUserId?: string }) {
  const points = data
    .map(j => ({ id: j.judgeUserId, value: j.averageScore }))
    .filter((p): p is { id: string; value: number } => p.value != null);

  if (points.length === 0) {
    return <div style={{ fontSize: 13, color: COLORS.textSecondary }}>No scores to plot yet.</div>;
  }

  const values = points.map(p => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  // Cả hội đồng chấm y hệt nhau thì span = 0 → đặt mọi chấm vào giữa thay vì chia cho 0.
  const span = hi - lo || 1;

  return (
    <div>
      <div className="relative h-8 rounded-lg" style={{ background: "var(--surface-bg)" }}>
        {points.map(p => {
          const isMe = p.id === myUserId;
          return (
            <span
              key={p.id}
              title={isMe ? `You: ${p.value.toFixed(1)}` : `Judge (anonymous): ${p.value.toFixed(1)}`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full"
              style={{
                left: hi === lo ? "50%" : `${((p.value - lo) / span) * 100}%`,
                width: isMe ? 14 : 10,
                height: isMe ? 14 : 10,
                background: isMe ? COLORS.primary : "#9ca3af",
                border: "2px solid #fff",
                zIndex: isMe ? 2 : 1,
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between" style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>
        <span>{lo.toFixed(1)}</span>
        <span>{points.length} judges</span>
        <span>{hi.toFixed(1)}</span>
      </div>
    </div>
  );
}

export function JudgeCalibrationView({
  apiRounds = [], 
  selectedRoundId, 
  onSelectRound 
}: { 
  apiRounds?: any[];
  selectedRoundId?: string;
  onSelectRound?: (id: string) => void;
}) {
  const { user } = useAuth();
  const [data, setData] = useState<ReliabilityMetricResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  useEffect(() => {
    eventService.getAll().then(setEvents).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      categoryService.getByEvent(selectedEventId).then(setCategories).catch(console.error);
    } else {
      setCategories([]);
    }
    setSelectedCategoryId(""); // Reset category when event changes
  }, [selectedEventId]);

  useEffect(() => {
    if (!selectedRoundId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    // Fetch with empty eventId, relying on roundId on backend
    judgingService.getCalibrationMetrics("", selectedRoundId, "")
      .then(res => {
        setData(res || []);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to load calibration data", err);
        setError("Failed to load calibration metrics. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [selectedRoundId]);

  const [fetchedRounds, setFetchedRounds] = useState<any[]>([]);

  useEffect(() => {
    if (selectedCategoryId) {
      import("@/features/judging/api/roundService").then(({ roundService }) => {
        roundService.getByCategory(selectedCategoryId).then(setFetchedRounds).catch(console.error);
      });
    } else if (selectedEventId && categories.length > 0) {
      import("@/features/judging/api/roundService").then(({ roundService }) => {
        Promise.all(categories.map(c => roundService.getByCategory(c.categoryId)))
          .then(results => setFetchedRounds(results.flat()))
          .catch(console.error);
      });
    } else {
      setFetchedRounds([]);
    }
  }, [selectedCategoryId, selectedEventId, categories]);

  // Derived filtered rounds — chỉ hiện calibration round vì điểm calibration (metrics)
  // chỉ tồn tại ở round có isCalibrationRound; tránh chọn nhầm round không có dữ liệu.
  const baseRounds = (selectedEventId || selectedCategoryId) ? fetchedRounds : apiRounds;
  const filteredRounds = baseRounds.filter((r: any) => r?.isCalibrationRound);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      );
    }

    if (error) {
      return <div className="text-red-500 p-4 bg-red-50 rounded-xl">{error}</div>;
    }

    if (!data.length) {
      return (
        <div className="text-gray-500 p-8 text-center bg-gray-50 rounded-xl mt-4">
          No calibration data available for this round yet.
        </div>
      );
    }

    const me = data.find(j => j.judgeUserId === user?.userId);

    // Cỡ mẫu: số lượt chấm có đồng nghiệp chấm cùng bài để so sánh. Với 1-2 lượt thì bias/RMS
    // gần như vô nghĩa nhưng vẫn in ra 1 chữ số thập phân trông rất chắc chắn — nên phải hiện
    // cỡ mẫu và ẩn kết luận khi quá nhỏ.
    const comparisons = me?.comparableScoreCount ?? 0;
    const hasEnoughData = comparisons >= MIN_COMPARISONS;

    // bias/RMS có thể là null khi backend không tính được (không có đồng nghiệp nào chấm cùng
    // bài). null KHÁC 0 — 0 nghĩa là "khớp hoàn hảo", null nghĩa là "không có gì để so".
    const bias = me?.biasFromPeerMean ?? null;
    const rms = me?.rootMeanSquareDeviation ?? null;

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <StatCard
            title="Deviation vs panel"
            value={bias == null ? "—" : `${bias > 0 ? "+" : ""}${bias.toFixed(1)}`}
            icon={<Scale size={20} />}
            color={biasColor(bias)}
          />
          <StatCard
            title="Typical gap vs panel"
            value={rms == null ? "—" : rms.toFixed(1)}
            icon={<TrendingUp size={20} />}
            color={COLORS.secondary}
          />
          <StatCard
            title="Based on"
            value={`${comparisons} comparison${comparisons === 1 ? "" : "s"}`}
            icon={<BarChart2 size={20} />}
            color={COLORS.textSecondary}
          />
        </div>

        {/* Một câu sinh từ số liệu thật, thay cho 3 thẻ "insight" trước đây vốn hardcode màu
            xanh và dấu ✓ bất kể giá trị. */}
        <Card className="p-4 mt-4">
          <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.6 }}>
            {!hasEnoughData
              ? `Not enough overlapping scores yet (${comparisons}). Figures appear once at least ${MIN_COMPARISONS} of your scores share a sample with another judge.`
              : describeBias(bias, rms)}
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>
            See the table below for which criterion you diverge on.
          </div>
        </Card>

        {/* Vị trí của bạn trong hội đồng — ẩn danh. Bản cũ liệt kê TÊN THẬT kèm điểm trung bình
            của từng đồng nghiệp, trong khi file CSV lại ẩn danh: hai chỗ mâu thuẫn nhau, và nó
            biến việc hiệu chuẩn thành bảng so bì ai chấm cao hơn ai. */}
        <Card className="p-5 mt-4">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Where you sit in the panel</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3, marginBottom: 14 }}>
            Each dot is one judge's average on the calibration samples. Other judges are anonymous.
          </div>
          <PanelSpread data={data} myUserId={user?.userId} />
        </Card>

        {/* Consensus Matrix Component */}
        {selectedRoundId && (
          <JudgeConsensusMatrix roundId={selectedRoundId} />
        )}
      </>
    );
  };

  return (
    <>
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-2">
        <SectionHeader
          title="Calibration Analytics"
          subtitle="How your scoring compares with the rest of the panel"
        />
        
        {/* Cascade Filters */}
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Event:</span>
            <Select 
              value={selectedEventId || "none"} 
              onValueChange={(value) => setSelectedEventId(value === "none" ? "" : value)}
            >
              <SelectTrigger 
                className="px-3 py-1.5 border rounded-lg outline-none bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-sm w-48 truncate"
                style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
              >
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <SelectItem value="none" style={{ color: COLORS.textPrimary }}>All Events</SelectItem>
                {events.map(e => <SelectItem key={e.eventId} value={e.eventId} style={{ color: COLORS.textPrimary }}>{e.eventName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Category:</span>
            <Select 
              value={selectedCategoryId || "none"} 
              onValueChange={(value) => setSelectedCategoryId(value === "none" ? "" : value)}
              disabled={!selectedEventId}
            >
              <SelectTrigger 
                className="px-3 py-1.5 border rounded-lg outline-none bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-sm w-40 truncate"
                style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <SelectItem value="none" style={{ color: COLORS.textPrimary }}>All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.categoryId} value={c.categoryId} style={{ color: COLORS.textPrimary }}>{c.categoryName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Round:</span>
            <Select 
              value={selectedRoundId || "none"} 
              onValueChange={(value) => onSelectRound && onSelectRound(value === "none" ? "" : value)}
              disabled={filteredRounds.length === 0}
            >
              <SelectTrigger 
                className="px-3 py-1.5 border rounded-lg outline-none bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-sm w-40 truncate"
                style={{ borderColor: COLORS.border, color: COLORS.textPrimary }}
              >
                <SelectValue placeholder={filteredRounds.length > 0 ? "Select Round" : "No rounds found"} />
              </SelectTrigger>
              <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                {filteredRounds.length > 0 && <SelectItem value="none" style={{ color: COLORS.textPrimary }}>Select Round</SelectItem>}
                {filteredRounds.map(r => (
                  <SelectItem key={r.roundId} value={r.roundId} style={{ color: COLORS.textPrimary }}>{r.roundName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {renderContent()}
    </>
  );
}
