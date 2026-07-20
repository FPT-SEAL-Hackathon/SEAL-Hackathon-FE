import { useState, useEffect } from "react";
import { rankingService } from "@/features/rankings/api/rankingService";
import { Trophy, CheckCircle, Loader, Calendar, BookOpen, AlertTriangle } from "lucide-react";
import { Card, Button, COLORS, DataTable, StatusBadge } from "@/components/shared/UIComponents";
import { useCategoryContext } from "../../context/CategoryContext";
import { useRoundContext } from "../../context/RoundContext";

export function EventLeaderboardsTab({ eventId }: { eventId: string }) {
  const { categories } = useCategoryContext();
  const { roundsByCategory } = useRoundContext();
  
  const [localCategoryId, setLocalCategoryId] = useState<string>("");
  const [localRoundId, setLocalRoundId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"round" | "event">("round");
  const [isLoading, setIsLoading] = useState(false);
  const [localRankings, setLocalRankings] = useState<any[]>([]);

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
  }, [categoryRounds]);

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
      } else if (activeTab === "event" && localCategoryId) {
        const data = await rankingService.computeCategory(localCategoryId);
        setLocalRankings(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const doPublish = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "round" && localRoundId && localCategoryId) {
        await rankingService.publishRound(localRoundId, localCategoryId);
        const roundData = await rankingService.getRoundRankings(localRoundId, localCategoryId);
        setLocalRankings(roundData);
      } else if (activeTab === "event" && localCategoryId) {
        await rankingService.publishCategory(localCategoryId);
        const eventData = await rankingService.getCategoryLeaderboard(eventId, localCategoryId);
        setLocalRankings(eventData);
      }
    } catch (e) {
      console.error(e);
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
              <select
                className="w-full px-3 py-2 border rounded-xl outline-none"
                style={{ borderColor: COLORS.border }}
                value={localCategoryId}
                onChange={e => {
                  setLocalCategoryId(e.target.value);
                  setLocalRoundId(""); // reset round
                }}
              >
                <option value="">Select a Category</option>
                {categories.map(c => (
                  <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>RANKING TYPE</label>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "round" ? "primary" : "outline"}
                  onClick={() => setActiveTab("round")}
                  style={{ flex: 1, ...(activeTab !== "round" ? { borderColor: COLORS.border, color: COLORS.textSecondary } : {}) }}
                >
                  Round Rankings
                </Button>
                <Button
                  variant={activeTab === "event" ? "primary" : "outline"}
                  onClick={() => setActiveTab("event")}
                  style={{ flex: 1, ...(activeTab !== "event" ? { borderColor: COLORS.border, color: COLORS.textSecondary } : {}) }}
                >
                  Category Final
                </Button>
              </div>
            </div>

            {activeTab === "round" && (
              <div className="flex-1 min-w-[200px]">
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>ROUND</label>
                <select
                  className="w-full px-3 py-2 border rounded-xl outline-none"
                  style={{ borderColor: COLORS.border }}
                  value={localRoundId}
                  onChange={e => setLocalRoundId(e.target.value)}
                  disabled={!localCategoryId || categoryRounds.length === 0}
                >
                  <option value="">Select a Round</option>
                  {categoryRounds.map(r => (
                    <option key={r.roundId} value={r.roundId}>{r.roundName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              icon={isLoading ? <Loader size={16} className="animate-spin" /> : <Trophy size={16} />}
              onClick={doCompute}
              disabled={isLoading || !localCategoryId || (activeTab === "round" && !localRoundId)}
            >
              Compute {activeTab === "round" ? "Round" : "Category"}
            </Button>
            <Button
              variant="primary"
              icon={isLoading ? <Loader size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              onClick={doPublish}
              disabled={isLoading || localRankings.length === 0 || localRankings.every(r => r.isPublished) || !localCategoryId || (activeTab === "round" && !localRoundId)}
            >
              Publish Results
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
                return <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textSecondary }}>-</span>;
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
            {
              key: "score",
              label: "SCORE",
              render: (_, row) => <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{row.finalScore?.toFixed(1) ?? row.totalScore}</span>
            },
            ...(activeTab === "round" ? [{
              key: "advanced",
              label: "ADVANCED",
              render: (_: any, row: any) => row.isAdvanced ? (
                <span style={{ color: COLORS.success, fontWeight: 600, fontSize: 13 }}>Yes</span>
              ) : (
                <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>No</span>
              )
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
    </div>
  );
}
