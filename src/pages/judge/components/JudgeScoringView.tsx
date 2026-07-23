import { useState, useEffect } from "react";
import { useBlocker } from "react-router";
import { Github, Globe, Loader, Save, FileText, Presentation, Code, GitMerge, Star, ArrowLeft } from "lucide-react";
import { Card, SectionHeader, COLORS, ProgressBar, Button, ScoreSlider } from "@/components/shared/UIComponents";
import { judgingService, type ScoreSubmissionDTO, type UpdateScoreSubmissionDTO } from "@/features/judging/api/judgingService";
import { type RoundCriterionResponse, type RoundResponse } from "@/features/judging/api/roundService";
import { updateGlobalScoreCache } from "./JudgeSubmissionsStep";
import { RepositoryMetadataCard } from "@/features/submissions/components/SubmissionRepositoryField";

interface JudgeScoringViewProps {
  apiCriteria: RoundCriterionResponse[];
  apiRounds: RoundResponse[];
  selectedRoundId: string | null;
  selectedSubmission: any;
  onNavigate?: (page: string) => void;
}

export function JudgeScoringView({ apiCriteria, apiRounds, selectedRoundId, selectedSubmission, onNavigate }: JudgeScoringViewProps) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [scoreSaved, setScoreSaved] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState("");
  const [existingJudgingIds, setExistingJudgingIds] = useState<Record<string, string>>({});
  const [updateReason, setUpdateReason] = useState("");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [successMessage, setSuccessMessage] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "view">(selectedSubmission?.status === "completed" ? "view" : "edit");

  // Reset scoring form and fetch existing scores when changing submissions
  useEffect(() => {
    setScores({});
    setComments({});
    setExistingJudgingIds({});
    setUpdateReason("");
    setScoreSaved(false);
    setScoreError("");
    
    // Optimistically set view mode to avoid UI flashing while fetching
    if (selectedSubmission?.status === "completed") {
      setViewMode("view");
    } else {
      setViewMode("edit");
    }

    if (selectedSubmission?.id) {
      judgingService.getBySubmission(selectedSubmission.id)
        .then(existingScores => {
          if (existingScores && existingScores.length > 0) {
            const newScores: Record<string, number> = {};
            const newComments: Record<string, string> = {};
            const newJudgingIds: Record<string, string> = {};
            existingScores.forEach(s => {
              newScores[s.roundCriterionId] = s.scoreValue;
              newComments[s.roundCriterionId] = s.comment || "";
              newJudgingIds[s.roundCriterionId] = s.id;
            });
            setScores(newScores);
            setComments(newComments);
            setExistingJudgingIds(newJudgingIds);
            setViewMode("view");
          } else {
            if (selectedSubmission?.status !== "completed") {
              setViewMode("edit");
            }
          }
        })
        .catch(err => {
          console.error("Failed to fetch existing scores:", err);
        });
    }
  }, [selectedSubmission]);

  const totalScore = apiCriteria.reduce((sum, c) => sum + ((scores[c.roundCriterionId] || 0) * (c.weight || 1)), 0);
  const hasUnsavedChanges = viewMode === "edit" && !scoreSaved && (totalScore > 0 || Object.values(comments).some(c => c.trim() !== ""));

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

  const handlePreSubmit = () => {
    if (!selectedSubmission) return;
    const isUpdate = Object.keys(existingJudgingIds).length > 0;
    
    if (isUpdate && !updateReason.trim()) {
      setScoreError("A reason is required to update existing scores.");
      return;
    }
    setScoreError("");
    setSubmitStatus("idle");
    setIsConfirmModalOpen(true);
  };

  const confirmAndSubmitScore = async () => {
    if (!selectedSubmission) return;
    setSubmitStatus("loading");
    setScoreError("");
    
    try {
      const isUpdate = Object.keys(existingJudgingIds).length > 0;
      const isCalibrationRound = apiRounds.find(r => r.roundId === selectedRoundId)?.isCalibrationRound || false;
      
      let apiResponse;
      if (isUpdate) {
        const updatePayload: UpdateScoreSubmissionDTO[] = apiCriteria.map(c => ({
          judgingId: existingJudgingIds[c.roundCriterionId],
          scoreValue: scores[c.roundCriterionId] || 0,
          comment: comments[c.roundCriterionId] || "",
          isCalibration: isCalibrationRound,
          reason: updateReason
        })).filter(c => c.judgingId);
        
        apiResponse = await judgingService.updateScores(updatePayload);
      } else {
        const scorePayload: ScoreSubmissionDTO[] = apiCriteria.map((c) => ({
          submissionId: selectedSubmission.id?.toString() ?? "",
          roundCriterionId: c.roundCriterionId,
          scoreValue: scores[c.roundCriterionId] || 0,
          comment: comments[c.roundCriterionId] || "",
          isCalibration: isCalibrationRound,
        }));
        apiResponse = await judgingService.recordScores(scorePayload);
      }
      
      setSuccessMessage(apiResponse?.message || "Your scores have been recorded.");
      setSubmitStatus("success");
      setScoreSaved(true);
      updateGlobalScoreCache(selectedSubmission.id?.toString() ?? "", {
        id: "local-score-cache",
        roundJudgeId: "local-score-cache",
        judgeName: "Current judge",
        submissionId: selectedSubmission.id?.toString() ?? "",
        roundCriterionId: apiCriteria[0]?.roundCriterionId ?? "local-score-cache",
        criterionName: apiCriteria[0]?.criterionName ?? "Criterion",
        scoreValue: 0,
        comment: "",
        scoredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isCalibration: isCalibrationRound,
      });
    } catch (err: any) {
      setSubmitStatus("error");
      setScoreError(err?.message ?? "Failed to save scores");
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <Button variant="outline" size="sm" onClick={() => onNavigate?.("submissions")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Submissions
          </Button>
        </div>
      </div>
      <SectionHeader title="Score Submission" subtitle="Evaluate and submit scores" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SUBMISSION DETAILS */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] overflow-y-auto pr-2">
          <Card className="p-5">
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 12, letterSpacing: '0.05em' }}>
              SUBMISSION DETAILS
            </div>
            
            <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.textPrimary, marginBottom: 4 }}>
              {selectedSubmission.title}
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 20 }}>
              {selectedSubmission.team} • {selectedSubmission.round}
            </div>
            
            {selectedSubmission.raw?.notes && (
              <div className="mb-6 p-4 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>NOTES</div>
                <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.5 }}>
                  {selectedSubmission.raw.notes}
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 8, marginTop: 16 }}>PROJECT LINKS</div>
              
              {selectedSubmission.github && (
                <a href={selectedSubmission.github.startsWith("http") ? selectedSubmission.github : `https://${selectedSubmission.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center gap-3">
                    <Github size={16} color={COLORS.textPrimary} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>Source Code</span>
                  </div>
                </a>
              )}
              
              {selectedSubmission.demo && (
                <a href={selectedSubmission.demo.startsWith("http") ? selectedSubmission.demo : `https://${selectedSubmission.demo}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center gap-3">
                    <Globe size={16} color={COLORS.primary} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>Live Demo</span>
                  </div>
                </a>
              )}
              
              {selectedSubmission.slide && (
                <a href={selectedSubmission.slide.startsWith("http") ? selectedSubmission.slide : `https://${selectedSubmission.slide}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center gap-3">
                    <Presentation size={16} color={COLORS.warning} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>Presentation Slide</span>
                  </div>
                </a>
              )}
              
              {selectedSubmission.report && (
                <a href={selectedSubmission.report.startsWith("http") ? selectedSubmission.report : `https://${selectedSubmission.report}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg hover:opacity-80 transition-opacity" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center gap-3">
                    <FileText size={16} color={COLORS.success} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>Technical Report</span>
                  </div>
                </a>
              )}

              {/* Judge chi DOC metadata repository: khong co nut edit/validate/resync o day. */}
              {selectedSubmission.raw?.repository && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 8, marginTop: 16 }}>REPOSITORY METADATA</div>
                  <RepositoryMetadataCard repository={selectedSubmission.raw.repository} showJudgeDisclaimer />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: SCORING & EVALUATION */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Criteria Scoring */}
          <div className="space-y-4">
              {apiCriteria.map(c => {
                const score = scores[c.roundCriterionId] || 0;
                const weight = c.weight || 1;
                const comment = comments[c.roundCriterionId] || "";

                return (
                  <Card key={c.roundCriterionId} className="p-5">
                    {viewMode === "view" ? (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.textPrimary }}>{c.criterionName}</div>
                            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{c.description}</div>
                          </div>
                          <div className="text-right">
                            <div style={{ fontWeight: 700, fontSize: 20, color: COLORS.primary }}>
                              {score * weight} <span style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>pts</span>
                            </div>
                            <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
                              Raw: {score}/{c.maxScore} &bull; Weight: {weight}x
                            </div>
                          </div>
                        </div>
                        {comment ? (
                          <div className="mt-4 p-3 rounded-xl" style={{ background: `${COLORS.bg}`, border: `1px solid ${COLORS.border}` }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>Judge's Feedback</div>
                            <div style={{ fontSize: 13, color: COLORS.textPrimary, whiteSpace: "pre-wrap" }}>{comment}</div>
                          </div>
                        ) : (
                          <div className="mt-4 p-3 rounded-xl" style={{ background: `#f9fafb`, border: `1px dashed ${COLORS.border}` }}>
                            <div style={{ fontSize: 13, color: COLORS.textSecondary, fontStyle: "italic" }}>No feedback provided.</div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>{c.description}</div>
                        <ScoreSlider
                          label={`${c.criterionName} (Weight: ${weight}x)`}
                          value={score}
                          max={c.maxScore}
                          onChange={v => setScores(p => ({ ...p, [c.roundCriterionId]: v }))}
                        />
                        <div className="mt-4">
                          <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>Comment for {c.criterionName}</label>
                          <textarea
                            value={comment}
                            onChange={e => setComments(p => ({ ...p, [c.roundCriterionId]: e.target.value }))}
                            rows={2}
                            placeholder="Provide feedback specifically for this criterion..."
                            className="w-full px-3 py-2 rounded-xl outline-none resize-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                          />
                        </div>
                      </>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Score Summary */}
            <div className="space-y-4">
              <Card className="p-5">
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Score Summary</div>
                {apiCriteria.map(c => (
                  <div key={c.roundCriterionId} className="flex justify-between mb-3 items-center">
                    <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{c.criterionName} <span style={{fontSize: 11, color: COLORS.primary}}>(x{c.weight || 1})</span></span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                      {scores[c.roundCriterionId] || 0}/{c.maxScore}
                      <span style={{ color: COLORS.textSecondary, marginLeft: 6, marginRight: 6 }}>→</span>
                      <span style={{ color: COLORS.primary }}>{(scores[c.roundCriterionId] || 0) * (c.weight || 1)} pts</span>
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 8, paddingTop: 12 }}>
                  {(() => {
                    const maxTotal = apiCriteria.reduce((sum, c) => sum + (c.maxScore * (c.weight || 1)), 0) || 100;
                    const scoreRatio = maxTotal > 0 ? totalScore / maxTotal : 0;
                    const scoreColor = scoreRatio >= 0.9 ? COLORS.success : scoreRatio >= 0.75 ? COLORS.primary : scoreRatio >= 0.5 ? COLORS.warning : COLORS.error;
                    return (
                      <>
                        <div className="flex justify-between items-center mb-4">
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
                
                {viewMode === "view" ? (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="mt-4"
                    onClick={() => setViewMode("edit")}
                  >
                    Edit Evaluation
                  </Button>
                ) : (
                  <>
                    {Object.keys(existingJudgingIds).length > 0 && (
                      <div className="mt-4 p-3 rounded-lg" style={{ background: `${COLORS.warning}10`, border: `1px solid ${COLORS.warning}30` }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: COLORS.warning, display: "block", marginBottom: 6 }}>Reason for Update (Required)</label>
                        <textarea
                          value={updateReason}
                          onChange={e => {
                            setUpdateReason(e.target.value);
                            if (scoreError) setScoreError("");
                          }}
                          rows={2}
                          placeholder="E.g. Re-evaluated based on new feedback..."
                          className="w-full px-3 py-2 rounded-lg outline-none resize-none"
                          style={{ fontSize: 13, border: `1px solid ${COLORS.warning}40`, background: COLORS.bg, color: COLORS.textPrimary }}
                        />
                      </div>
                    )}
                    
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      icon={<Save size={15} />}
                      className="mt-4"
                      onClick={handlePreSubmit}
                      disabled={totalScore === 0}
                    >
                      Submit Score
                    </Button>
                    {scoreError && (
                      <div className="mt-3 text-center" style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>{scoreError}</div>
                    )}
                  </>
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
      </div>
      
      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b" style={{ borderColor: COLORS.border }}>
              <h2 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
                {submitStatus === "success" ? "Score Submitted Successfully" : "Confirm Your Evaluation"}
              </h2>
              <p className="mt-1 text-sm" style={{ color: submitStatus === "success" ? COLORS.success : COLORS.textSecondary }}>
                {submitStatus === "success" ? successMessage : "Please review your scores and feedback before submitting."}
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="p-4 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <div className="text-sm font-semibold mb-1" style={{ color: COLORS.textSecondary }}>Evaluating Team</div>
                <div className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>{selectedSubmission.team}</div>
                <div className="text-sm" style={{ color: COLORS.textSecondary }}>{selectedSubmission.title}</div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold" style={{ color: COLORS.textPrimary }}>Total Score</span>
                  <span className="text-2xl font-bold" style={{ color: totalScore >= 80 ? COLORS.success : totalScore >= 50 ? COLORS.warning : COLORS.error }}>
                    {totalScore}/{apiCriteria.reduce((sum, c) => sum + (c.maxScore * (c.weight || 1)), 0)}
                  </span>
                </div>
                <div className="space-y-3">
                  {apiCriteria.map(c => (
                    <div key={c.roundCriterionId} className="flex justify-between items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="pr-4">
                        <div className="font-medium text-sm" style={{ color: COLORS.textPrimary }}>{c.criterionName}</div>
                        {comments[c.roundCriterionId] && (
                          <div className="text-xs italic mt-1" style={{ color: COLORS.textSecondary }}>"{comments[c.roundCriterionId]}"</div>
                        )}
                      </div>
                      <div className="font-bold text-sm whitespace-nowrap text-right" style={{ color: COLORS.textPrimary }}>
                        <div>{(scores[c.roundCriterionId] || 0) * (c.weight || 1)} pts</div>
                        <div className="text-xs font-normal" style={{ color: COLORS.textSecondary }}>Raw: {scores[c.roundCriterionId] || 0}/{c.maxScore}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {Object.keys(existingJudgingIds).length > 0 && (
                <div className="p-4 rounded-xl" style={{ background: `${COLORS.warning}10`, border: `1px solid ${COLORS.warning}30` }}>
                  <div className="text-sm font-semibold mb-1" style={{ color: COLORS.warning }}>Update Reason</div>
                  <div className="text-sm" style={{ color: COLORS.textPrimary }}>{updateReason}</div>
                </div>
              )}
              
              {submitStatus === "error" && (
                <div className="p-4 rounded-xl text-sm font-semibold text-center" style={{ background: `${COLORS.error}10`, color: COLORS.error, border: `1px solid ${COLORS.error}30` }}>
                  {scoreError}
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
              {submitStatus === "success" ? (
                <>
                  <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)}>Close</Button>
                  {onNavigate && <Button variant="primary" onClick={() => onNavigate("submissions")}>Return to Queue</Button>}
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsConfirmModalOpen(false)} disabled={submitStatus === "loading"}>Cancel</Button>
                  <Button 
                    variant="primary" 
                    icon={submitStatus === "loading" ? <Loader size={15} className="animate-spin" /> : <Save size={15} />}
                    onClick={confirmAndSubmitScore}
                    disabled={submitStatus === "loading"}
                  >
                    {submitStatus === "loading" ? "Submitting..." : "Confirm & Submit"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
