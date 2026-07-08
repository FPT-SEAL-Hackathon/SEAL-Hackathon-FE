import { useState, useEffect } from "react";
import { Star, Github, Globe, Eye, Loader2, AlertCircle } from "lucide-react";
import { Card, SectionHeader, COLORS, StatusBadge, Button } from "@/components/shared/UIComponents";
import { type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { type RoundResponse } from "@/features/judging/api/roundService";
import { judgingService, type JudgingDTO } from "@/features/judging/api/judgingService";
import { consultationService } from "@/features/consultation/api/consultationService";
import { useAuth } from "@/features/auth/store/authStore";

interface JudgeSubmissionsViewProps {
  apiSubmissions: SubmissionResponse[];
  apiRounds: RoundResponse[];
  onSelectSubmission: (submission: any) => void;
  onNavigate: (page: string) => void;
}

export function JudgeSubmissionsView({ apiSubmissions, apiRounds, onSelectSubmission, onNavigate }: JudgeSubmissionsViewProps) {
  const { user } = useAuth();
  const [personalScores, setPersonalScores] = useState<Record<string, JudgingDTO>>({});
  const [mentoredCategoryIds, setMentoredCategoryIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.userId && apiSubmissions.length > 0) {
      setIsLoading(true);
      
      const promises = [
        judgingService.getByJudge(user.userId).catch(() => [] as JudgingDTO[]),
        consultationService.getAssignedCategories().catch(() => [])
      ];

      Promise.all(promises)
        .then(([scores, assignedCats]) => {
          // Process personal scores
          const scoreMap: Record<string, JudgingDTO> = {};
          (scores as JudgingDTO[]).forEach(s => {
            scoreMap[s.submissionId] = s;
          });
          setPersonalScores(scoreMap);

          // Process mentored categories
          const mentorCatIds = new Set<string>();
          (assignedCats as any[]).forEach(cat => {
            mentorCatIds.add(cat.categoryId);
          });
          setMentoredCategoryIds(mentorCatIds);
        })
        .finally(() => setIsLoading(false));
    }
  }, [user?.userId, apiSubmissions]);

  const displaySubmissions = apiSubmissions.map(s => {
    const pScore = personalScores[s.submissionId];
    const isScoredByMe = !!pScore;
    const round = apiRounds.find(r => r.roundId === s.roundId);
    const isMentored = round ? mentoredCategoryIds.has(round.categoryId) : false;
    
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
      score: pScore ? pScore.scoreValue : undefined,
      round: round?.roundName || "Unknown Round",
      isMentored: isMentored,
      raw: s,
    };
  });

  return (
    <>
      <SectionHeader
        title="Submission Queue"
        subtitle={`${displaySubmissions.filter((s: any) => s.status === "pending").length} submissions pending evaluation by you`}
      />
      {apiSubmissions.length === 0 && (
        <div className="px-4 py-2 rounded-xl text-sm mb-3" style={{ background: `${COLORS.bg}`, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}>
          No submissions found for the selected round.
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      ) : (
        <div className="space-y-3">
          {displaySubmissions.map((sub: any) => (
            <Card key={sub.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{sub.title}</span>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{sub.team} • {sub.round}</div>
                </div>
                <div className="flex items-center gap-2">
                  {sub.score !== undefined && (
                    <span className="px-3 py-1 rounded-xl font-bold" style={{ background: `${COLORS.primary}10`, color: COLORS.primary, fontSize: 14 }}>
                      {sub.score}/100
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
                        onClick={() => { onSelectSubmission(sub.raw); onNavigate("scoring"); }}
                        disabled={sub.isMentored}
                        style={sub.isMentored ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                      >
                        Score
                      </Button>
                    </div>
                  )}
                  {sub.status === "completed" && (
                    <Button variant="outline" size="sm" icon={<Eye size={13} />} onClick={() => { onSelectSubmission(sub.raw); onNavigate("scoring"); }}>
                      Review
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
