import { useState, useEffect } from "react";
import { useBlocker } from "react-router";
import { Github, Globe, Loader, Save } from "lucide-react";
import { Card, SectionHeader, COLORS, ProgressBar, Button, ScoreSlider } from "@/components/shared/UIComponents";
import { judgingService, type ScoreSubmissionDTO } from "@/features/judging/api/judgingService";
import { type RoundCriterionResponse, type RoundResponse } from "@/features/judging/api/roundService";

interface JudgeScoringViewProps {
  apiCriteria: RoundCriterionResponse[];
  apiRounds: RoundResponse[];
  selectedRoundId: string | null;
  selectedSubmission: any;
}

export function JudgeScoringView({ apiCriteria, apiRounds, selectedRoundId, selectedSubmission }: JudgeScoringViewProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");

  // Reset scoring form when changing submissions
  useEffect(() => {
    setScores({});
    setComments({});
    setScoreSaved(false);
    setScoreError("");
  }, [selectedSubmission]);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const hasUnsavedChanges = !scoreSaved && (totalScore > 0 || Object.values(comments).some(c => c.trim() !== ""));

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      const confirmLeave = window.confirm("The score data doesn't submit will be delete, Would you like to leave?");
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "The score data doesn't submit will be delete, Would you like to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const saveScore = async () => {
    if (!selectedSubmission) return;
    setScoreLoading(true);
    setScoreError("");
    try {
      const isCalibrationRound = apiRounds.find(r => r.roundId === selectedRoundId)?.isCalibrationRound || false;
      const scorePayload: ScoreSubmissionDTO[] = apiCriteria.map((c) => ({
        submissionId: selectedSubmission.id?.toString() ?? "",
        roundCriterionId: c.roundCriterionId,
        scoreValue: scores[c.roundCriterionId] || 0,
        comment: comments[c.roundCriterionId] || "",
        isCalibration: isCalibrationRound,
      }));
      await judgingService.recordScores(scorePayload);
      setScoreSaved(true);
      setTimeout(() => setScoreSaved(false), 2500);
    } catch (err: any) {
      setScoreError(err?.message ?? "Failed to save scores");
    } finally {
      setScoreLoading(false);
    }
  };

  if (!selectedSubmission) {
    return (
      <div className="p-6 text-center" style={{ color: COLORS.textSecondary }}>
        No submission selected for scoring.
      </div>
    );
  }

  return (
    <>
      <SectionHeader title="Score Submission" subtitle="Evaluate and submit scores" />
      {/* Submission selector */}
      <Card className="p-4">
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 8 }}>
          EVALUATING — Submission ID: {selectedSubmission.id}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{selectedSubmission.title}</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{selectedSubmission.team} • {selectedSubmission.round} • {selectedSubmission.track}</div>
          </div>
          <div className="flex gap-2">
            {selectedSubmission.github && (
              <a href={selectedSubmission.github.startsWith("http") ? selectedSubmission.github : `https://${selectedSubmission.github}`} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" icon={<Github size={13} />}>GitHub</Button>
              </a>
            )}
            {selectedSubmission.demo && (
              <a href={selectedSubmission.demo.startsWith("http") ? selectedSubmission.demo : `https://${selectedSubmission.demo}`} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" icon={<Globe size={13} />}>Demo / Slides</Button>
              </a>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Criteria Scoring */}
        <div className="col-span-2 space-y-4">
          {apiCriteria.map(c => (
            <Card key={c.roundCriterionId} className="p-5">
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>{c.description}</div>
              <ScoreSlider
                label={c.criterionName}
                value={scores[c.roundCriterionId] || 0}
                max={c.maxScore}
                onChange={v => setScores(p => ({ ...p, [c.roundCriterionId]: v }))}
              />
              <div className="mt-4">
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>Comment for {c.criterionName}</label>
                <textarea
                  value={comments[c.roundCriterionId] || ""}
                  onChange={e => setComments(p => ({ ...p, [c.roundCriterionId]: e.target.value }))}
                  rows={2}
                  placeholder="Provide feedback specifically for this criterion..."
                  className="w-full px-3 py-2 rounded-xl outline-none resize-none"
                  style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Score Summary */}
        <div className="space-y-4">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Score Summary</div>
            {apiCriteria.map(c => (
              <div key={c.roundCriterionId} className="flex justify-between mb-3">
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{c.criterionName}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{scores[c.roundCriterionId] || 0}/{c.maxScore}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 8, paddingTop: 12 }}>
              {(() => {
                const maxTotal = apiCriteria.reduce((sum, c) => sum + c.maxScore, 0) || 100;
                const scoreRatio = maxTotal > 0 ? totalScore / maxTotal : 0;
                const scoreColor = scoreRatio >= 0.9 ? COLORS.success : scoreRatio >= 0.75 ? COLORS.primary : scoreRatio >= 0.5 ? COLORS.warning : COLORS.error;
                return (
                  <>
                    <div className="flex justify-between items-center">
                      <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Total Score</span>
                      <span style={{ fontWeight: 700, fontSize: 24, color: scoreColor }}>
                        {totalScore}/{maxTotal}
                      </span>
                    </div>
                    <ProgressBar value={totalScore} max={maxTotal} color={scoreColor} />
                  </>
                );
              })()}
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={scoreLoading ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
              className="mt-4"
              onClick={saveScore}
              disabled={totalScore === 0 || scoreLoading}
            >
              {scoreLoading ? "Submitting..." : "Submit Score"}
            </Button>
            {scoreSaved && (
              <div className="mt-3 text-center" style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>✓ Score submitted successfully!</div>
            )}
            {scoreError && (
              <div className="mt-3 text-center" style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>{scoreError}</div>
            )}
          </Card>

          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, marginBottom: 8 }}>Scoring Guidelines</div>
            <div className="space-y-2">
              {(() => {
                const maxTotal = apiCriteria.reduce((sum, c) => sum + c.maxScore, 0) || 100;
                return [
                  { range: `${Math.ceil(maxTotal * 0.9)}–${maxTotal}`, label: "Exceptional", color: COLORS.success },
                  { range: `${Math.ceil(maxTotal * 0.75)}–${Math.max(0, Math.ceil(maxTotal * 0.9) - 1)}`, label: "Good", color: COLORS.primary },
                  { range: `${Math.ceil(maxTotal * 0.5)}–${Math.max(0, Math.ceil(maxTotal * 0.75) - 1)}`, label: "Average", color: COLORS.warning },
                  { range: `0–${Math.max(0, Math.ceil(maxTotal * 0.5) - 1)}`, label: "Needs Improvement", color: COLORS.error },
                ].map(g => (
                  <div key={g.range} className="flex items-center justify-between">
                    <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{g.range}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: g.color }}>{g.label}</span>
                  </div>
                ));
              })()}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
