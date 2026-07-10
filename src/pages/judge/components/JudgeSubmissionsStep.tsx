import { useState, useEffect } from "react";
import { Star, Github, Globe, Eye, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Card, SectionHeader, COLORS, StatusBadge, Button } from "@/components/shared/UIComponents";
import { type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { type RoundResponse } from "@/features/judging/api/roundService";
import { judgingService, type JudgingDTO } from "@/features/judging/api/judgingService";
import { consultationService } from "@/features/consultation/api/consultationService";
import { useAuth } from "@/features/auth/store/authStore";

interface JudgeSubmissionsStepProps {
  apiSubmissions: SubmissionResponse[];
  apiRounds: RoundResponse[];
  apiCriteria?: any[];
  onSelectSubmission: (submission: any) => void;
  onNavigate: (page: string, options?: any) => void;
  onBack: () => void;
}

let globalCachedPersonalScores: Record<string, JudgingDTO[]> = {};
let globalCachedMentoredCategoryIds: Set<string> = new Set();

export const updateGlobalScoreCache = (submissionId: string, score: JudgingDTO) => {
  if (!globalCachedPersonalScores[submissionId]) {
    globalCachedPersonalScores[submissionId] = [];
  }
  globalCachedPersonalScores[submissionId].push(score);
};

export function JudgeSubmissionsStep({ apiSubmissions, apiRounds, apiCriteria, onSelectSubmission, onNavigate, onBack }: JudgeSubmissionsStepProps) {
  const { user } = useAuth();
  const [personalScores, setPersonalScores] = useState<Record<string, JudgingDTO[]>>(globalCachedPersonalScores);
  const [mentoredCategoryIds, setMentoredCategoryIds] = useState<Set<string>>(globalCachedMentoredCategoryIds);

  useEffect(() => {
    if (user?.userId && apiSubmissions.length > 0) {
      
      const promises = [
        judgingService.getByJudge(user.userId).catch(() => [] as JudgingDTO[]),
        consultationService.getAssignedCategories().catch(() => [])
      ];

      Promise.all(promises)
        .then(([scores, assignedCats]) => {
          // Process personal scores
          const scoreMap: Record<string, JudgingDTO[]> = {};
          (scores as JudgingDTO[]).forEach(s => {
            if (!scoreMap[s.submissionId]) scoreMap[s.submissionId] = [];
            scoreMap[s.submissionId].push(s);
          });
          globalCachedPersonalScores = scoreMap;
          setPersonalScores(scoreMap);

          // Process mentored categories
          const mentorCatIds = new Set<string>();
          (assignedCats as any[]).forEach(cat => {
            mentorCatIds.add(cat.categoryId);
          });
          globalCachedMentoredCategoryIds = mentorCatIds;
          setMentoredCategoryIds(mentorCatIds);
        });
    }
  }, [user?.userId, apiSubmissions]);

  const displaySubmissions = apiSubmissions.map(s => {
    const pScores = personalScores[s.submissionId] || [];
    const isScoredByMe = pScores.length > 0;
    const round = apiRounds.find(r => r.roundId === s.roundId);
    const isMentored = round ? mentoredCategoryIds.has(round.categoryId) : false;
    
    let totalScore: number | undefined = undefined;
    let maxTotalScore = 100;
    
    if (isScoredByMe) {
      totalScore = 0;
      if (apiCriteria && apiCriteria.length > 0) {
        maxTotalScore = apiCriteria.reduce((sum, c) => sum + (c.maxScore * (c.weight || 1)), 0);
        pScores.forEach(score => {
          const c = apiCriteria.find(crit => crit.roundCriterionId === score.roundCriterionId);
          totalScore! += score.scoreValue * (c ? (c.weight || 1) : 1);
        });
      } else {
        totalScore = pScores.reduce((sum, score) => sum + score.scoreValue, 0);
      }
    } else if (apiCriteria && apiCriteria.length > 0) {
      maxTotalScore = apiCriteria.reduce((sum, c) => sum + (c.maxScore * (c.weight || 1)), 0);
    }
    
    return {
      id: s.submissionId,
      team: s.teamName || s.teamId,
      title: s.notes || `Submission ${s.submissionId.slice(0, 8)}`,
      track: "—",
      github: s.repositoryUrl ?? "",
      demo: s.demoUrl ?? "",
      slide: s.slideUrl ?? "",
      report: s.reportUrl ?? "",
      status: isScoredByMe ? "completed" : "pending",
      score: totalScore,
      maxScore: maxTotalScore,
      round: round?.roundName || "Unknown Round",
      isMentored: isMentored,
      raw: s,
    };
  });

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Rounds
        </Button>
        <div>
          <h2 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
            Submission Queue
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{displaySubmissions.filter((s: any) => s.status === "pending").length} submissions pending evaluation by you</p>
        </div>
      </div>
      {apiSubmissions.length === 0 && (
        <div className="px-4 py-2 rounded-xl text-sm mb-3" style={{ background: `${COLORS.bg}`, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}>
          No submissions found for the selected round.
        </div>
      )}
      
        <div className="space-y-3">
          {displaySubmissions.map((sub: any) => (
            <Card key={sub.id} className="px-6 py-5 flex flex-row items-center justify-between border-2 hover:border-primary/30 transition-all bg-white" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)', borderColor: 'transparent' }}>
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{sub.title}</span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>{sub.team} • <span className="text-gray-700">{sub.round}</span></div>
                </div>
                <div className="flex items-center gap-3 justify-end">
                  {sub.score !== undefined && (
                    <span className="px-3 py-1 rounded-xl font-bold" style={{ background: `${COLORS.primary}10`, color: COLORS.primary, fontSize: 14 }}>
                      {sub.score}/{sub.maxScore}
                    </span>
                  )}
                  {sub.github && (
                    <a href={sub.github.startsWith("http") ? sub.github : `https://${sub.github}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" icon={<Github size={13} />}>Code</Button>
                    </a>
                  )}
                  {sub.demo && (
                    <a href={sub.demo.startsWith("http") ? sub.demo : `https://${sub.demo}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm" icon={<Globe size={13} />}>Demo</Button>
                    </a>
                  )}
                  {sub.status === "pending" && (
                    <div className="flex items-center gap-2">
                      {sub.isMentored && (
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-md text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                          <AlertCircle size={10} />
                          Mentored Category
                        </span>
                      )}
                      <Button 
                        variant="primary" 
                        size="sm" 
                        icon={<Star size={13} />} 
                        onClick={() => { onSelectSubmission(sub); onNavigate("scoring"); }}
                        disabled={sub.isMentored}
                        style={sub.isMentored ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                      >
                        Score
                      </Button>
                    </div>
                  )}
                  {sub.status === "completed" && (
                    <Button variant="outline" size="sm" icon={<Eye size={13} />} onClick={() => { onSelectSubmission(sub); onNavigate("scoring"); }}>
                      Review
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
    </div>
  );
}
