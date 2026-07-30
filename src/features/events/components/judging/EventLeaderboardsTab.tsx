import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { rankingService } from "@/features/rankings/api/rankingService";
import { Trophy, CheckCircle, Loader, Calendar, BookOpen, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, Button, COLORS, DataTable, StatusBadge } from "@/components/shared/UIComponents";
import { ApiError } from "@/lib/api/apiClient";
import { useCategoryContext } from "../../context/CategoryContext";
import { useRoundContext } from "../../context/RoundContext";
import { ScoreDetailsModal } from "./ScoreDetailsModal";

export function EventLeaderboardsTab({ eventId }: { eventId: string }) {
  const { categories } = useCategoryContext();
  const { roundsByCategory, loadRounds } = useRoundContext();
  
  const [localCategoryId, setLocalCategoryId] = useState<string>("");
  const [localRoundId, setLocalRoundId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"round" | "event">("round");
  const [isLoading, setIsLoading] = useState(false);
  const [localRankings, setLocalRankings] = useState<any[]>([]);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [appealDuration, setAppealDuration] = useState(60);
  
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Filter rounds by selected category
  const categoryRounds = roundsByCategory[localCategoryId] || [];

  // Initialize selections
  useEffect(() => {
    if (categories.length > 0 && !localCategoryId) {
      setLocalCategoryId(categories[0].categoryId);
    }
  }, [categories]);

  useEffect(() => {
    if (categoryRounds.length > 0 && !localRoundId) {
      setLocalRoundId(categoryRounds[0].roundId);
    }
  }, [categoryRounds, localRoundId]);

  // Fetch rankings
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        if (activeTab === "round") {
          if (localRoundId && localCategoryId) {
            const data = await rankingService.getRoundRankings(localRoundId, localCategoryId);
            setLocalRankings(data);
          } else {
            setLocalRankings([]);
          }
        } else if (activeTab === "event") {
          if (localCategoryId) {
            const data = await rankingService.getCategoryLeaderboard(eventId, localCategoryId);
            setLocalRankings(data);
          } else {
            setLocalRankings([]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch existing rankings", e);
        setLocalRankings([]);
      }
    };
    fetchExisting();
  }, [activeTab, eventId, localCategoryId, localRoundId]);

  const doCompute = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "round" && localRoundId && localCategoryId) {
        const data = await rankingService.computeRound(localRoundId, localCategoryId);
        setLocalRankings(data);
        toast.success("Rankings computed successfully.");
      } else if (activeTab === "event" && localCategoryId) {
        const data = await rankingService.computeCategory(localCategoryId);
        setLocalRankings(data);
        toast.success("Category rankings computed successfully.");
      }
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof ApiError ? e.message : "Failed to compute rankings.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const doPublish = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "round" && localRoundId && localCategoryId) {
        await rankingService.publishRound(localRoundId, localCategoryId, appealDuration);
        const roundData = await rankingService.getRoundRankings(localRoundId, localCategoryId);
        setLocalRankings(roundData);
        await loadRounds(localCategoryId);
      } else if (activeTab === "event" && localCategoryId) {
        await rankingService.publishCategory(localCategoryId, appealDuration);
        const eventData = await rankingService.getCategoryLeaderboard(eventId, localCategoryId);
        setLocalRankings(eventData);
      }
      setShowPublishModal(false);
      toast.success("Rankings published successfully.");
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof ApiError ? e.message : "Failed to publish rankings.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const doApprove = async () => {
    if (!window.confirm("Are you sure you want to approve this leaderboard? Once approved, it will be locked and cannot be re-computed or modified.")) return;
    setIsLoading(true);
    try {
      if (activeTab === "round" && localRoundId && localCategoryId) {
        await rankingService.approveRound(localRoundId, localCategoryId);
        const roundData = await rankingService.getRoundRankings(localRoundId, localCategoryId);
        setLocalRankings(roundData);
        await loadRounds(localCategoryId);
      } else if (activeTab === "event" && localCategoryId) {
        await rankingService.approveCategory(localCategoryId);
        const eventData = await rankingService.getCategoryLeaderboard(eventId, localCategoryId);
        setLocalRankings(eventData);
      }
      toast.success("Rankings approved successfully.");
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof ApiError ? e.message : "Failed to approve rankings.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between md:items-end">
          <div className="flex gap-4 flex-wrap flex-1">
            <div className="flex-1 min-w-[200px]">
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</label>
              <Select value={localCategoryId || "none"} onValueChange={value => {
                  setLocalCategoryId((value === "none" ? "" : value));
                  setLocalRoundId(""); // reset round
                }} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="none" style={{ color: COLORS.textPrimary }}>Select a Category</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.categoryId} value={c.categoryId} style={{ color: COLORS.textPrimary }}>{c.categoryName}</SelectItem>
                ))}
  </SelectContent>
</Select>
            </div>

            <div className="flex-1 min-w-[260px]">
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>RANKING TYPE</label>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "round" ? "primary" : "outline"}
                  onClick={() => setActiveTab("round")}
                  className="justify-center whitespace-nowrap"
                  style={{ flex: 1, ...(activeTab !== "round" ? { borderColor: COLORS.border, color: COLORS.textSecondary } : {}) }}
                >
                  Round Rankings
                </Button>
                <Button
                  variant={activeTab === "event" ? "primary" : "outline"}
                  onClick={() => setActiveTab("event")}
                  className="justify-center whitespace-nowrap"
                  style={{ flex: 1, ...(activeTab !== "event" ? { borderColor: COLORS.border, color: COLORS.textSecondary } : {}) }}
                >
                  Category Final
                </Button>
              </div>
            </div>

            {activeTab === "round" && (
              <div className="flex-1 min-w-[200px]">
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>ROUND</label>
                  <Select value={localRoundId || "none"} onValueChange={value => setLocalRoundId((value === "none" ? "" : value))} disabled={!localCategoryId || categoryRounds.length === 0}>
                    <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                      <SelectItem value="none" style={{ color: COLORS.textPrimary }}>
                        {!localCategoryId 
                          ? "Select Category First" 
                          : (categoryRounds.length === 0 ? "No Rounds in Category" : "Select a Round")}
                      </SelectItem>
                      {categoryRounds.map(r => (
                        <SelectItem key={r.roundId} value={r.roundId} style={{ color: COLORS.textPrimary }}>{r.roundName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={isLoading ? <Loader size={16} className="animate-spin" /> : <Trophy size={16} />}
              onClick={doCompute}
              disabled={isLoading || !localCategoryId || (activeTab === "round" && !localRoundId) || localRankings.some(r => r.isApproved)}
            >
              Compute {activeTab === "round" ? "Round" : "Category"}
            </Button>
            <Button
              variant="primary"
              icon={isLoading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              onClick={() => setShowPublishModal(true)}
              disabled={isLoading || localRankings.length === 0 || localRankings.every(r => r.isPublished) || !localCategoryId || (activeTab === "round" && !localRoundId) || localRankings.some(r => r.isApproved)}
            >
              Publish Results
            </Button>
            <Button
              variant="primary"
              style={{ background: localRankings.some(r => r.isApproved) ? COLORS.border : COLORS.error }}
              icon={isLoading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              onClick={doApprove}
              disabled={isLoading || localRankings.length === 0 || localRankings.some(r => !r.isPublished) || localRankings.every(r => r.isApproved) || !localCategoryId || (activeTab === "round" && !localRoundId)}
            >
              Approve Official
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={[
            {
              key: "rank",
              label: "RANK",
              render: (_, row) => {
                const rankNum = row.rankPosition ?? row.rank;
                if (rankNum > 0) {
                  return (
                    <span style={{ fontSize: rankNum <= 3 ? 18 : 14, fontWeight: 700 }}>
                      {rankNum <= 3 ? ["🥇", "🥈", "🥉"][rankNum - 1] : `#${rankNum}`}
                    </span>
                  );
                }
                return (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#dc2626', padding: '2px 6px', borderRadius: 6, letterSpacing: 0.5 }}>DSQ</span>
                );
              }
            },
            {
              key: "team",
              label: "TEAM",
              render: (_, row) => {
                const rankNum = row.rankPosition ?? row.rank;
                return (
                  <span style={{ fontWeight: 600, fontSize: 14, color: rankNum > 0 ? COLORS.textPrimary : COLORS.textSecondary }}>
                    {row.teamName ?? row.teamId ?? row.team}
                  </span>
                );
              }
            },
            {
              key: "category",
              label: "CATEGORY",
              render: (_, row) => <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.categoryName ?? row.categoryId ?? row.track}</span>
            },
            ...(activeTab === "round" ? [{
              key: "score",
              label: "SCORE",
              render: (_: any, row: any) => {
                const rankNum = row.rankPosition ?? row.rank;
                const isDisqualified = rankNum === 0;
                return (
                  <div className="flex items-center gap-2">
                    <span style={{ fontWeight: 700, fontSize: 14, color: isDisqualified ? COLORS.textSecondary : COLORS.textPrimary }}>
                      {isDisqualified ? '—' : (row.averageScore?.toFixed(2) ?? row.finalScore?.toFixed(2) ?? row.totalScore)}
                    </span>
                    {!isDisqualified && row.submissionId && (
                      <button 
                        onClick={() => setSelectedSubmissionId(row.submissionId)}
                        className="text-xs text-primary hover:underline hover:text-primary-dark transition-colors"
                      >
                        (Details)
                      </button>
                    )}
                  </div>
                );
              }
            }] : []),
            ...(activeTab === "round" ? [{
              key: "advanced",
              label: "ADVANCED",
              render: (_: any, row: any) => {
                const rankNum = row.rankPosition ?? row.rank;
                if (rankNum === 0) return <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#dc2626', padding: '2px 6px', borderRadius: 6, letterSpacing: 0.5 }}>DSQ</span>;
                return row.isAdvanced ? (
                  <span style={{ color: COLORS.success, fontWeight: 600, fontSize: 13 }}>Yes</span>
                ) : (
                  <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>No</span>
                );
              }
            }] : []),
            {
              key: "status",
              label: "STATUS",
              render: (_, row) => <StatusBadge status={row.isPublished ? "published" : "draft"} />
            }
          ]}
          data={localRankings.length === 0 ? [{
            rank: 0,
            team: "No rankings computed yet",
            category: "-",
            score: 0,
            status: "draft"
          }] : localRankings}
        />
      </Card>

      {selectedSubmissionId && (
        <ScoreDetailsModal
          submissionId={selectedSubmissionId}
          roundId={localRoundId}
          onClose={() => setSelectedSubmissionId(null)}
        />
      )}

      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">Publish {activeTab === "round" ? "Round" : "Category"} Rankings</h3>
              <button onClick={() => setShowPublishModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-800 text-sm">
                <p>Publishing rankings will make them visible to participants and open the appeal window.</p>
              </div>
              {localRankings.some(r => r.isPublished) && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-800 text-sm flex gap-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <p><strong>Warning:</strong> Rankings have already been published. Re-publishing will reset the appeal window for all participants.</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Appeal Window Duration (minutes)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={appealDuration}
                  onChange={e => setAppealDuration(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowPublishModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={doPublish} disabled={isLoading}>
                {isLoading ? "Publishing..." : "Confirm Publish"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
