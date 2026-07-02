import { useState, useEffect, useMemo } from "react";
import { ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
import { Card, SectionHeader, COLORS, StatusBadge, ProgressBar, Button } from "@/components/shared/UIComponents";
import { type RoundResponse } from "@/features/judging/api/roundService";
import { judgingService, type JudgingDTO } from "@/features/judging/api/judgingService";
import { submissionService, type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { useAuth } from "@/features/auth/store/authStore";

interface JudgeRoundsViewProps {
  apiRounds: RoundResponse[];
  onSelectRound: (roundId: string) => void;
  onNavigate: (page: string) => void;
}

export function JudgeRoundsView({ apiRounds, onSelectRound, onNavigate }: JudgeRoundsViewProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [scores, setScores] = useState<JudgingDTO[]>([]);
  const [roundSubmissions, setRoundSubmissions] = useState<Record<string, SubmissionResponse[]>>({});

  useEffect(() => {
    if (!user?.userId || !apiRounds || apiRounds.length === 0) {
      return;
    }

    setLoading(true);
    
    // Fetch judge scores and submissions for all rounds in parallel
    const fetches = apiRounds.map(r => 
      submissionService.getByRound(r.roundId)
        .then(subs => ({ roundId: r.roundId, subs }))
        .catch(() => ({ roundId: r.roundId, subs: [] }))
    );
    
    fetches.push(
      judgingService.getByJudge(user.userId)
        .then(res => setScores(res || []))
        .catch(() => setScores([])) as any
    );

    Promise.all(fetches).then((results) => {
      const subsMap: Record<string, SubmissionResponse[]> = {};
      results.forEach((r: any) => {
        if (r && r.roundId) {
          subsMap[r.roundId] = r.subs;
        }
      });
      setRoundSubmissions(subsMap);
    }).finally(() => {
      setLoading(false);
    });

  }, [user?.userId, apiRounds]);

  // Aggregate stats
  const { roundStats, globalStats } = useMemo(() => {
    // Group scores by submission
    const scoreMap = new Map<string, number>();
    const submissionTotalScoreMap = new Map<string, number>();

    scores.forEach(s => {
      if (!scoreMap.has(s.submissionId)) scoreMap.set(s.submissionId, 0);
      if (!submissionTotalScoreMap.has(s.submissionId)) submissionTotalScoreMap.set(s.submissionId, 0);
      
      scoreMap.set(s.submissionId, scoreMap.get(s.submissionId)! + 1);
      submissionTotalScoreMap.set(s.submissionId, submissionTotalScoreMap.get(s.submissionId)! + s.scoreValue);
    });

    const rStats: Record<string, { total: number, completed: number, isDone: boolean }> = {};
    let gTotalAssigned = 0;
    let gCompleted = 0;
    let sumTotalScores = 0;
    let sumCountScores = 0;

    apiRounds.forEach(r => {
      const subs = roundSubmissions[r.roundId] || [];
      const totalInRound = subs.length;
      let completedInRound = 0;

      subs.forEach(sub => {
        // A submission is considered scored if the judge has provided scores for it
        if (scoreMap.has(sub.submissionId) && scoreMap.get(sub.submissionId)! > 0) {
          completedInRound++;
          gCompleted++;
          sumTotalScores += submissionTotalScoreMap.get(sub.submissionId)!;
          sumCountScores++;
        }
      });

      rStats[r.roundId] = {
        total: totalInRound,
        completed: completedInRound,
        isDone: totalInRound > 0 && completedInRound === totalInRound
      };
      
      gTotalAssigned += totalInRound;
    });

    return {
      roundStats: rStats,
      globalStats: {
        totalAssigned: gTotalAssigned,
        completed: gCompleted,
        pending: Math.max(0, gTotalAssigned - gCompleted),
        avgScore: sumCountScores > 0 ? (sumTotalScores / sumCountScores).toFixed(1) : "0.0"
      }
    };
  }, [scores, roundSubmissions, apiRounds]);

  // Sort rounds: active ones first, completed ones last
  const sortedRounds = useMemo(() => {
    return [...apiRounds].sort((a, b) => {
      const aDone = roundStats[a.roundId]?.isDone ? 1 : 0;
      const bDone = roundStats[b.roundId]?.isDone ? 1 : 0;
      return aDone - bDone; // Completed rounds (1) will go to the bottom
    });
  }, [apiRounds, roundStats]);

  return (
    <>
      <SectionHeader title="Assigned Rounds" subtitle="SEAL Fall 2025 — Your evaluation assignments" />
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedRounds.length > 0 ? sortedRounds.map(r => {
            const stats = roundStats[r.roundId] || { total: 0, completed: 0, isDone: false };
            const isCompleted = stats.isDone;

            return (
              <Card key={r.roundId} className="p-5 flex flex-col transition-all hover:shadow-md" style={{ opacity: isCompleted ? 0.75 : 1 }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{r.roundName}</div>
                      {isCompleted && <CheckCircle2 size={16} className="text-green-500" />}
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>{r.description || "Event Track"}</div>
                  </div>
                  <StatusBadge status={isCompleted ? "completed" : "open"} />
                </div>
                
                <div className="mb-6 mt-2 flex-1">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</span>
                    <span className="text-xs font-bold" style={{ color: isCompleted ? COLORS.success : COLORS.primary }}>
                      {stats.completed} / {stats.total}
                    </span>
                  </div>
                  <ProgressBar 
                    value={stats.completed} 
                    max={Math.max(stats.total, 1)} 
                    color={isCompleted ? COLORS.success : COLORS.primary} 
                  />
                  {stats.total === 0 && (
                    <div className="text-xs text-gray-400 mt-2 italic">No teams assigned yet.</div>
                  )}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                    Deadline: <span className="font-medium text-gray-700">{r.judgingDeadline ? new Date(r.judgingDeadline).toLocaleDateString() : "N/A"}</span>
                  </span>
                  <Button 
                    variant={isCompleted ? "outline" : "primary"} 
                    size="sm" 
                    icon={<ChevronRight size={14} />} 
                    onClick={() => { 
                      onSelectRound(r.roundId); 
                      onNavigate("submissions"); 
                    }}
                  >
                    {isCompleted ? "Review Scores" : "Score Now"}
                  </Button>
                </div>
              </Card>
            );
          }) : (
            <div className="col-span-2 text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p style={{ color: COLORS.textSecondary, fontSize: 15 }}>No evaluation rounds assigned to you yet.</p>
            </div>
          )}
        </div>
      )}

      {!loading && (
        <Card className="p-5 mt-6 shadow-sm border-gray-100">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Your Global Statistics</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Assigned", value: globalStats.totalAssigned, color: COLORS.primary },
              { label: "Completed", value: globalStats.completed, color: COLORS.success },
              { label: "Pending", value: globalStats.pending, color: COLORS.warning },
              { label: "Avg Score Given", value: globalStats.avgScore, color: COLORS.accent },
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-xl border" style={{ background: `${s.color}05`, borderColor: `${s.color}15` }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, textTransform: "uppercase" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
