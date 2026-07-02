import { Star, Github, Globe, Eye } from "lucide-react";
import { Card, SectionHeader, COLORS, StatusBadge, Button } from "@/components/shared/UIComponents";
import { type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { type RoundResponse } from "@/features/judging/api/roundService";

interface JudgeSubmissionsViewProps {
  apiSubmissions: SubmissionResponse[];
  apiRounds: RoundResponse[];
  onSelectSubmission: (submission: any) => void;
  onNavigate: (page: string) => void;
}

export function JudgeSubmissionsView({ apiSubmissions, apiRounds, onSelectSubmission, onNavigate }: JudgeSubmissionsViewProps) {
  const displaySubmissions = apiSubmissions.map(s => ({
    id: s.submissionId,
    team: s.teamName || s.teamId,
    title: s.notes || `Submission ${s.submissionId.slice(0, 8)}`,
    track: "—",
    github: s.repositoryUrl ?? "",
    demo: s.demoUrl ?? "",
    slide: s.slideUrl ?? "",
    report: s.reportUrl ?? "",
    status: s.submissionStatusName?.toLowerCase() === "scored" ? "completed" : "pending",
    score: undefined,
    round: apiRounds.find(r => r.roundId === s.roundId)?.roundName || "Unknown Round",
    raw: s,
  }));

  return (
    <>
      <SectionHeader
        title="Submission Queue"
        subtitle={`${displaySubmissions.filter((s: any) => s.status === "pending").length} submissions pending evaluation`}
      />
      {apiSubmissions.length === 0 && (
        <div className="px-4 py-2 rounded-xl text-sm mb-3" style={{ background: `${COLORS.bg}`, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}>
          No submissions found for the selected round.
        </div>
      )}
      <div className="space-y-3">
        {displaySubmissions.map((sub: any) => (
          <Card key={sub.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{sub.title}</span>
                  <StatusBadge status={sub.status} />
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{sub.team} • {sub.round} • {sub.track}</div>
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
                  <Button variant="primary" size="sm" icon={<Star size={13} />} onClick={() => { onSelectSubmission(sub); onNavigate("scoring"); }}>
                    Score
                  </Button>
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
    </>
  );
}
