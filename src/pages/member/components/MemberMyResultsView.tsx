import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, SectionHeader, Button, StatusBadge, COLORS } from "@/components/shared/UIComponents";
import { appealService, type Appeal } from "@/features/appeals/api/appealService";
import { rankingService } from "@/features/rankings/api/rankingService";
import { judgingService } from "@/features/judging/api/judgingService";
import { roundService, type RoundResponse } from "@/features/judging/api/roundService";
import { parseApiError } from "@/lib/api/apiClient";
import { Loader, MessageSquare, PlusCircle, Info, Trophy, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { submissionService } from "@/features/submissions/api/submissionService";

export function MemberMyResultsView({ activeTeamContext, round }: { activeTeamContext: any, round: any }) {
  const [loading, setLoading] = useState(false);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [submission, setSubmission] = useState<any>(null);

  const [isAppealFormOpen, setIsAppealFormOpen] = useState(false);
  const [appealForm, setAppealForm] = useState({ title: "", reason: "", appealType: "SCORE_REVIEW" as any });
  const [submittingAppeal, setSubmittingAppeal] = useState(false);

  const teamId = activeTeamContext?.teamId;
  const eventId = activeTeamContext?.eventId;
  const categoryId = activeTeamContext?.categoryId;
  
  const loadData = async () => {
    if (!teamId || !round?.roundId) return;
    setLoading(true);
    setLeaderboard([]);
    setFeedback([]);
    setAppeals([]);
    setSubmission(null);
    try {
      const ranks = await rankingService.getRoundLeaderboard(round.roundId, categoryId);
      setLeaderboard(ranks);

      let subId = null;
      try {
        const sub = await submissionService.getByTeamAndRound(teamId, round.roundId);
        setSubmission(sub);
        subId = sub.submissionId;
      } catch (e) {
      }

      if (subId) {
        try {
          const [fb, crit] = await Promise.all([
            judgingService.getPublishedBySubmission(subId),
            roundService.getCriteria(round.roundId)
          ]);
          setFeedback(fb.filter((j: any) => !j.isCalibration));
          setCriteria(crit);
        } catch (e) {
          console.error("Failed to fetch published judging data", e);
        }
      }

      try {
        const allAppeals = await appealService.getAppealsByTeam(teamId);
        setAppeals(allAppeals);
      } catch (e) {}

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [round?.roundId, teamId]);

  const handleAppealSubmit = async () => {
    if (!teamId || !eventId || !categoryId || !round?.roundId) {
      toast.error("Missing context to submit appeal.");
      return;
    }
    if (!appealForm.title.trim() || !appealForm.reason.trim()) {
      toast.error("Please fill all fields.");
      return;
    }
    setSubmittingAppeal(true);
    try {
      await appealService.createAppeal({
        teamId,
        eventId,
        categoryId,
        roundId: round.roundId,
        title: appealForm.title,
        reason: appealForm.reason,
        appealType: appealForm.appealType
      } as any);
      toast.success("Appeal submitted successfully.");
      setIsAppealFormOpen(false);
      setAppealForm({ title: "", reason: "", appealType: "SCORE_REVIEW" });
      loadData();
    } catch (error: unknown) {
      toast.error(parseApiError(error).message || "Failed to submit appeal");
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const isAppealWindowOpen = round?.appealEndTime ? new Date() < new Date(round.appealEndTime) : false;
  const myRank = leaderboard.find(r => r.teamId === teamId);

  return (
    <div className="space-y-6">
      {!round?.roundId ? (
        <Card className="p-6 text-center text-gray-500">Please select a round to view results.</Card>
      ) : loading ? (
        <Card className="p-10 flex justify-center"><Loader className="animate-spin text-primary" /></Card>
      ) : (
        <>
          <Card>
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
              <h3 className="font-bold flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                <Trophy size={18} className="text-yellow-500" /> Round Ranking
              </h3>
            </div>
            <div className="p-6">
              {leaderboard.length === 0 ? (
                <p className="text-gray-500 text-sm">Rankings for this round are not published yet.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {myRank ? (
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 flex flex-wrap gap-6 items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-800 font-semibold mb-1">Your Team's Result</p>
                        <p className="text-2xl font-bold text-yellow-900">Rank #{myRank.rank ?? myRank.rankPosition}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-yellow-800 font-semibold mb-1">Total Score</p>
                        <p className="text-2xl font-bold text-yellow-900">{myRank.finalScore?.toFixed(1) ?? myRank.totalScore?.toFixed(1) ?? "0.0"}</p>
                      </div>
                      {myRank.isAdvanced !== undefined && (
                        <div className="text-right">
                          <p className="text-sm text-yellow-800 font-semibold mb-1">Status</p>
                          <p className={`text-xl font-bold ${myRank.isAdvanced ? 'text-green-600' : 'text-red-600'}`}>
                            {myRank.isAdvanced ? 'ADVANCED' : 'ELIMINATED'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Your team is not ranked in this round.</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
              <h3 className="font-bold flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                <FileText size={18} className="text-blue-500" /> Judge Feedback
              </h3>
            </div>
            <div className="p-6">
              {!submission ? (
                <p className="text-gray-500 text-sm">No submission found for this round.</p>
              ) : feedback.length === 0 ? (
                <p className="text-gray-500 text-sm">No feedback available yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.02)" }}>
                        <th className="p-3 text-left border font-semibold text-gray-700">Judge / Criterion</th>
                        {criteria.sort((a,b) => a.sortOrder - b.sortOrder).map(c => (
                          <th key={c.roundCriterionId} className="p-3 text-center border font-semibold text-gray-700">
                            {c.criterionName} ({c.weight * 100}%)
                          </th>
                        ))}
                        <th className="p-3 text-center border font-bold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(new Set(feedback.map(j => j.judgeName))).map(judge => {
                        const judgeScores = feedback.filter(j => j.judgeName === judge);
                        let total = 0;
                        return (
                          <tr key={judge} className="hover:bg-gray-50">
                            <td className="p-3 border font-medium text-gray-700 whitespace-nowrap">{judge}</td>
                            {criteria.map(c => {
                              const score = judgeScores.find(j => j.roundCriterionId === c.roundCriterionId);
                              if (score) total += score.scoreValue * c.weight;
                              return (
                                <td key={c.roundCriterionId} className="p-3 text-center border align-top">
                                  {score ? (
                                    <div className="flex flex-col items-center justify-center">
                                      <div className="font-semibold text-gray-800">{score.scoreValue}</div>
                                      {score.comment && <div className="text-xs text-gray-500 italic mt-1 max-w-[150px] text-left leading-tight break-words">{score.comment}</div>}
                                    </div>
                                  ) : "-"}
                                </td>
                              );
                            })}
                            <td className="p-3 text-center border font-bold text-primary align-middle">{total.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: COLORS.border, background: COLORS.bg }}>
              <h3 className="font-bold flex items-center gap-2" style={{ color: COLORS.textPrimary }}>
                <MessageSquare size={18} className="text-purple-500" /> Appeals
              </h3>
              {isAppealWindowOpen && (
                <Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => setIsAppealFormOpen(!isAppealFormOpen)}>
                  {isAppealFormOpen ? "Cancel" : "File Appeal"}
                </Button>
              )}
            </div>
            
            <div className="p-6">
              {!isAppealWindowOpen && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-100 rounded-lg text-gray-600 text-sm flex gap-2">
                  <Info size={16} className="mt-0.5" />
                  <p>The appeal window is currently closed for this round.</p>
                </div>
              )}
              {isAppealWindowOpen && !isAppealFormOpen && (
                <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg text-green-800 text-sm flex gap-2">
                  <CheckCircle size={16} className="mt-0.5" />
                  <p>The appeal window is open until {round?.appealEndTime ? new Date(round.appealEndTime).toLocaleString() : ""}. You may file an appeal regarding your results.</p>
                </div>
              )}

              {isAppealFormOpen && (
                <div className="mb-6 p-4 border border-primary/20 bg-primary/5 rounded-lg space-y-4">
                  <h4 className="font-bold text-primary">New Appeal</h4>
                  <div>
                    <label className="block text-sm font-medium mb-1">Appeal Type</label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={appealForm.appealType}
                      onChange={e => setAppealForm({...appealForm, appealType: e.target.value as any})}
                    >
                      <option value="SCORE_REVIEW">Score Review</option>
                      <option value="RULE_VIOLATION">Rule Violation</option>
                      <option value="TECHNICAL_ISSUE">Technical Issue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input 
                      className="w-full p-2 border rounded" 
                      value={appealForm.title}
                      onChange={e => setAppealForm({...appealForm, title: e.target.value})}
                      placeholder="Brief summary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description / Reason</label>
                    <textarea 
                      className="w-full p-2 border rounded min-h-[100px]" 
                      value={appealForm.reason}
                      onChange={e => setAppealForm({...appealForm, reason: e.target.value})}
                      placeholder="Provide detail..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setIsAppealFormOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleAppealSubmit} disabled={submittingAppeal}>
                      {submittingAppeal ? "Submitting..." : "Submit Appeal"}
                    </Button>
                  </div>
                </div>
              )}

              {appeals.filter(a => a.roundId === round.roundId || !a.roundId).length === 0 ? (
                <p className="text-gray-500 text-sm">No appeals filed.</p>
              ) : (
                <div className="space-y-4">
                  {appeals.filter(a => a.roundId === round.roundId || !a.roundId).map(appeal => (
                    <div key={appeal.appealId} className="p-4 border rounded-lg bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold">{appeal.title}</h4>
                          <span className="text-xs text-gray-500">{new Date(appeal.createdAt).toLocaleString()}</span>
                        </div>
                        <StatusBadge status={appeal.status.toLowerCase()} />
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{appeal.reason}</p>
                      {appeal.resolutionNote && (
                        <div className="mt-3 p-3 bg-gray-50 border rounded text-sm">
                          <span className="font-semibold text-gray-600 block mb-1">Organizer Response:</span>
                          <span className="text-gray-800">{appeal.resolutionNote}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
