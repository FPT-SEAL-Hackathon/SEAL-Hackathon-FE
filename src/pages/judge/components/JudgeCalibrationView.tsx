import { useState, useEffect } from "react";
import { Star, BarChart2, TrendingUp, Award, Loader2 } from "lucide-react";
import { Card, SectionHeader, COLORS, StatCard, ProgressBar } from "@/components/shared/UIComponents";
import { type ReliabilityMetricResponse } from "@/features/research/api/researchService";
import { judgingService } from "@/features/judging/api/judgingService";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import { useAuth } from "@/features/auth/store/authStore";
import { JudgeConsensusMatrix } from "./JudgeConsensusMatrix";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // Derived filtered rounds
  const filteredRounds = (selectedEventId || selectedCategoryId) ? fetchedRounds : apiRounds;

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

    // Find current judge
    const currentUserObj = data.find(j => j.judgeUserId === user?.userId);
    const myAvg = currentUserObj?.averageScore?.toFixed(1) || "0.0";
    const myStdDev = currentUserObj?.rootMeanSquareDeviation?.toFixed(1) || "0.0";
    
    // Calculate panel averages
    const panelAvg = (data.reduce((sum, j) => sum + (j.averageScore || 0), 0) / data.length).toFixed(1);
    const calibrationScore = currentUserObj?.comparableScoreCount ? Math.min(100, Math.max(0, 100 - (currentUserObj.averageAbsoluteDeviation || 0) * 5)).toFixed(0) + "%" : "N/A";
    
    // Dynamically calculate the theoretical max score (10 or 100) based on max given scores
    const theoreticalMax = data.some(d => (d.maxScore || 0) > 10) ? 100 : 10;

    // Sort data so current judge is at the top
    const sortedData = [...data].sort((a, b) => {
      if (a.judgeUserId === user?.userId) return -1;
      if (b.judgeUserId === user?.userId) return 1;
      return (a.averageAbsoluteDeviation || 0) - (b.averageAbsoluteDeviation || 0);
    });

    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <StatCard title="Your Avg Score" value={myAvg} icon={<Star size={20} />} color={COLORS.primary} />
          <StatCard title="Panel Avg" value={panelAvg} icon={<BarChart2 size={20} />} color={COLORS.secondary} />
          <StatCard title="Your Std Dev" value={myStdDev} icon={<TrendingUp size={20} />} color={COLORS.success} />
          <StatCard title="Calibration Score" value={calibrationScore} icon={<Award size={20} />} color={COLORS.accent} />
        </div>
        <Card className="p-5 mt-4">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Judge Panel Comparison</div>
          <div className="space-y-4">
            {sortedData.map((j, i) => {
              const isMe = j.judgeUserId === user?.userId;
              const avg = j.averageScore?.toFixed(1) || "0";
              const min = j.minScore || 0;
              const max = j.maxScore || 100;
              const stdDev = j.rootMeanSquareDeviation?.toFixed(1) || "0.0";

              return (
                <div key={j.judgeUserId} className="p-4 rounded-xl" style={{ background: isMe ? `${COLORS.primary}08` : COLORS.bg, border: `1px solid ${isMe ? COLORS.primary + "30" : COLORS.border}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontWeight: isMe ? 700 : 500, fontSize: 14, color: isMe ? COLORS.primary : COLORS.textPrimary }}>
                      {isMe ? "You (" + j.judgeName + ")" : j.judgeName} 
                      {isMe && <span style={{ fontSize: 11, marginLeft: 4, padding: "1px 6px", borderRadius: 8, background: `${COLORS.primary}20` }}>You</span>}
                    </span>
                    <div className="flex items-center gap-4">
                      <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Range: {min}–{max}</span>
                      <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Std Dev: {stdDev}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>Avg: {avg}</span>
                    </div>
                  </div>
                  <ProgressBar value={j.averageScore} max={theoreticalMax} color={isMe ? COLORS.primary : COLORS.secondary} />
                </div>
              );
            })}
          </div>
        </Card>
        <Card className="p-5 mt-4">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Calibration Insights</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Consistent Scoring", desc: `Your standard deviation of ${myStdDev} indicates how consistent your evaluation is relative to the mean.`, color: COLORS.success, icon: "✓" },
              { title: "Near Panel Average", desc: `Your average of ${myAvg} is compared to the panel average of ${panelAvg}.`, color: COLORS.primary, icon: "≈" },
              { title: "Bias Detection", desc: currentUserObj?.biasFromPeerMean && currentUserObj.biasFromPeerMean < -2 ? "You tend to score stricter than peers." : currentUserObj?.biasFromPeerMean && currentUserObj.biasFromPeerMean > 2 ? "You tend to score more leniently than peers." : "Your scoring bias is well balanced.", color: COLORS.success, icon: "✓" },
            ].map(insight => (
              <div key={insight.title} className="p-4 rounded-xl" style={{ background: `${insight.color}10`, border: `1px solid ${insight.color}20` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 18, color: insight.color }}>{insight.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>{insight.title}</span>
                </div>
                <p style={{ fontSize: 12, color: COLORS.textSecondary }}>{insight.desc}</p>
              </div>
            ))}
          </div>
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
          subtitle="Compare your scoring patterns with other judges" 
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
