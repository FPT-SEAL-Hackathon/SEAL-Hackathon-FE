import { useState, useEffect } from "react";
import { 
  ClipboardList, CheckCircle2, Clock, BarChart2, Shield, 
  ArrowRight, Award, UserCheck, AlertCircle 
} from "lucide-react";
import { 
  StatCard, Card, SectionHeader, COLORS, StatusBadge, 
  ProgressBar, Button 
} from "@/components/shared/UIComponents";
import { type RoundResponse } from "@/features/judging/api/roundService";
import { judgingService, type JudgingDTO } from "@/features/judging/api/judgingService";
import { submissionService, type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { useAuth } from "@/features/auth/store/authStore";

interface JudgeOverviewViewProps {
  apiRounds: RoundResponse[];
  apiSubmissions?: SubmissionResponse[];
  onNavigate: (page: string, options?: { state?: any }) => void;
  onSelectRound: (roundId: string) => void;
  isLoadingRounds?: boolean;
}

export function JudgeOverviewView({
  apiRounds,
  onNavigate,
  onSelectRound,
  isLoadingRounds = false,
}: JudgeOverviewViewProps) {
  const { user } = useAuth();
  const [scores, setScores] = useState<JudgingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [roundStatsMap, setRoundStatsMap] = useState<Record<string, { total: number; scored: number }>>({});

  useEffect(() => {
    if (!user?.userId || !apiRounds || apiRounds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchOverviewData = async () => {
      try {
        const scoresRes = await judgingService.getByJudge(user.userId).catch(() => []);
        setScores(scoresRes || []);

        // Fetch submissions count per round
        const statsMap: Record<string, { total: number; scored: number }> = {};
        await Promise.all(
          apiRounds.map(async (r) => {
            const subs = await submissionService.getByRound(r.roundId).catch(() => []);
            const roundScores = (scoresRes || []).filter((s: any) => s.roundId === r.roundId || s.submissionId);
            statsMap[r.roundId] = {
              total: subs.length,
              scored: roundScores.length,
            };
          })
        );
        setRoundStatsMap(statsMap);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [user?.userId, apiRounds]);

  const totalAssignedRounds = apiRounds.length;
  const totalSubmissionsToScore = Object.values(roundStatsMap).reduce((acc, curr) => acc + curr.total, 0);
  const totalSubmissionsScored = scores.length;
  const pendingSubmissions = Math.max(0, totalSubmissionsToScore - totalSubmissionsScored);
  const calibrationRounds = apiRounds.filter((r) => r.isCalibrationRound);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SectionHeader
        title={`Welcome back, Judge ${user?.fullName ?? ""}`}
        subtitle="Overview of your assigned evaluation rounds, scoring metrics, and quick actions."
        action={
          <Button
            variant="primary"
            size="md"
            icon={<ClipboardList size={16} />}
            onClick={() => onNavigate("rounds")}
          >
            Start Evaluating
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Rounds"
          value={totalAssignedRounds}
          icon={<ClipboardList size={20} />}
          color={COLORS.primary}
        />
        <StatCard
          title="Scored Submissions"
          value={totalSubmissionsScored}
          icon={<CheckCircle2 size={20} />}
          color={COLORS.success}
        />
        <StatCard
          title="Pending Submissions"
          value={pendingSubmissions}
          icon={<Clock size={20} />}
          color={COLORS.warning}
        />
        <StatCard
          title="Calibration Rounds"
          value={calibrationRounds.length}
          icon={<BarChart2 size={20} />}
          color={COLORS.accent}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Evaluation Rounds */}
        <Card className="p-6 col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>
              Active Assigned Rounds Overview
            </h3>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("rounds")}>
              View All Rounds <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>

          {isLoadingRounds || loading ? (
            <div className="py-8 text-center" style={{ color: COLORS.textSecondary }}>
              Loading assigned rounds...
            </div>
          ) : apiRounds.length === 0 ? (
            <div className="py-8 text-center" style={{ color: COLORS.textSecondary }}>
              No evaluation rounds currently assigned.
            </div>
          ) : (
            <div className="space-y-4">
              {apiRounds.map((r) => {
                const stats = roundStatsMap[r.roundId] || { total: 0, scored: 0 };
                const isCompleted = stats.total > 0 && stats.scored >= stats.total;

                return (
                  <div
                    key={r.roundId}
                    className="p-4 rounded-xl space-y-3 transition-all border"
                    style={{
                      background: COLORS.bg,
                      borderColor: COLORS.border,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>
                          {r.roundName}
                        </span>
                        <StatusBadge status={r.roundStatusName ?? "OPEN"} />
                        {r.isCalibrationRound && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: `${COLORS.warning}15`, color: COLORS.warning }}
                          >
                            Calibration
                          </span>
                        )}
                      </div>
                      <Button
                        variant={isCompleted ? "outline" : "primary"}
                        size="sm"
                        onClick={() => {
                          onSelectRound(r.roundId);
                          onNavigate("rounds");
                        }}
                      >
                        {isCompleted ? "Review" : "Score Now"}
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs" style={{ color: COLORS.textSecondary }}>
                        <span>Deadline: {r.judgingDeadline ? new Date(r.judgingDeadline).toLocaleString() : "TBD"}</span>
                        <span>
                          {stats.scored} / {stats.total} Scored
                        </span>
                      </div>
                      <ProgressBar
                        value={stats.scored}
                        max={Math.max(stats.total, 1)}
                        color={isCompleted ? COLORS.success : COLORS.primary}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Quick Actions & Guidelines */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>
              Quick Navigation
            </h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                fullWidth
                icon={<ClipboardList size={16} />}
                onClick={() => onNavigate("rounds")}
              >
                Event Judging Workflow
              </Button>
              <Button
                variant="outline"
                fullWidth
                icon={<BarChart2 size={16} />}
                onClick={() => onNavigate("calibration")}
              >
                Calibration Matrix
              </Button>
              <Button
                variant="outline"
                fullWidth
                icon={<Clock size={16} />}
                onClick={() => onNavigate("history")}
              >
                Scoring History & Edit
              </Button>
            </div>
          </Card>

          <Card className="p-6 space-y-3 bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2" style={{ color: COLORS.primary, fontWeight: 700, fontSize: 14 }}>
              <Shield size={18} /> Judging Guidelines
            </div>
            <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>
              Please score all assigned submissions fairly according to rubrics and criteria. Ensure all score comments provide constructive feedback for participating teams.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
