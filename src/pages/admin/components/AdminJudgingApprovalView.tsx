import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, Eye, Loader, CheckSquare, X } from "lucide-react";
import { toast } from "sonner";
import { Card, Button, StatusBadge, COLORS } from "@/components/shared/UIComponents";
import { api, parseApiError } from "@/lib/api/apiClient";
import {
  getSubmissionStatusLabel,
  SUBMISSION_STATUS_IDS,
} from "@/features/submissions/api/submissionService";

export function AdminJudgingApprovalView({ context, localCategoryId, localRoundId, isRoundApproved }: any) {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [judgingDetails, setJudgingDetails] = useState<any[]>([]);
  const [isJudgingLoading, setIsJudgingLoading] = useState(false);
  
  const [batchScores, setBatchScores] = useState<Record<string, Record<string, number>>>({});
  const [judgesList, setJudgesList] = useState<string[]>([]);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    type: "judge_submission" | "judge_round";
    submissionId?: string;
    roundId?: string;
    judgeId: string;
    judgeName: string;
    reason: string;
  }>({
    isOpen: false,
    type: "judge_submission",
    judgeId: "",
    judgeName: "",
    reason: "",
  });

  const fetchSubmissions = async () => {
    if (!localRoundId) {
      setSubmissions([]);
      setBatchScores({});
      setJudgesList([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.get<any[]>(`/api/v1/admin/rounds/${localRoundId}/submissions`);
      setSubmissions(data || []);
      
      if (data && data.length > 0) {
        setIsBatchLoading(true);
        const subIds = data.map((s: any) => s.submissionId);
        try {
            const batchData = await api.post<any[]>(`/api/v1/judging/batch-scores`, { submissionIds: subIds });
            
            // Process batch data
            const scoresMap: Record<string, Record<string, number>> = {};
            const judgesSet = new Set<string>();
            
            (batchData || []).forEach((score: any) => {
              if (score.isCalibration) return;
              if (!scoresMap[score.submissionId]) scoresMap[score.submissionId] = {};
              if (!scoresMap[score.submissionId][score.judgeName]) scoresMap[score.submissionId][score.judgeName] = 0;
              scoresMap[score.submissionId][score.judgeName] += (score.scoreValue * (score.criterionWeight || 1)) || 0;
              judgesSet.add(score.judgeName);
            });
            
            setBatchScores(scoresMap);
            setJudgesList(Array.from(judgesSet));
        } catch (e) {
            console.error("Failed to fetch batch scores", e);
        } finally {
            setIsBatchLoading(false);
        }
      } else {
         setBatchScores({});
         setJudgesList([]);
      }
    } catch (e) {
      console.error(e);
      setSubmissions([]);
      setBatchScores({});
      setJudgesList([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [localRoundId]);

  const toggleApproval = async (submissionId: string, currentStatus: boolean) => {
    if (!submissionId || submissionId === "undefined") {
      console.error("Cannot toggle approval: Invalid submissionId");
      return;
    }
    setApprovingId(submissionId);
    try {
      await api.post(`/api/v1/admin/submissions/${submissionId}/approve`, { approve: !currentStatus });
      setSubmissions(prev => prev.map(s => 
        (s.submissionId === submissionId || s.id === submissionId) ? {
          ...s,
          isScoreApproved: !currentStatus,
          submissionStatusId: !currentStatus ? SUBMISSION_STATUS_IDS.SCORED : SUBMISSION_STATUS_IDS.IN_PROGRESS,
          submissionStatusName: !currentStatus ? "Scored" : "In Progress",
        } : s
      ));
    } catch (e) {
      console.error(e);
      toast.error(parseApiError(e).message || "Failed to update score approval.");
    } finally {
      setApprovingId(null);
    }
  };

  const rejectScore = async (submissionId: string) => {
    if (!submissionId || submissionId === "undefined") {
      console.error("Cannot reject score: Invalid submissionId");
      return;
    }
    if (!rejectReason.trim()) return;
    setApprovingId(submissionId); // Borrow this state for loading indicator
    try {
      await api.post(`/api/v1/admin/submissions/${submissionId}/reject-score`, { reason: rejectReason });
      setRejectingId(null);
      setRejectReason("");
      // Reload submissions to get empty scores
      fetchSubmissions();
    } catch (e) {
      console.error(e);
      toast.error(parseApiError(e).message || "Failed to reject score.");
    } finally {
      setApprovingId(null);
    }
  };

  const viewScores = async (submissionId: string) => {
    if (!submissionId || submissionId === "undefined") {
      console.error("Cannot view scores: Invalid submissionId");
      return;
    }
    setSelectedSubmissionId(submissionId);
    setIsJudgingLoading(true);
    try {
      const data = await api.get<any[]>(`/api/v1/judging/submission/${submissionId}`);
      setJudgingDetails(data || []);
    } catch (e) {
      console.error(e);
      setJudgingDetails([]);
    } finally {
      setIsJudgingLoading(false);
    }
  };

  const openRejectJudgeSubmissionModal = (submissionId: string, judgeId: string, judgeName: string) => {
    setRejectModal({
      isOpen: true,
      type: "judge_submission",
      submissionId,
      judgeId,
      judgeName,
      reason: "",
    });
  };

  const openRejectJudgeRoundModal = (roundId: string, judgeId: string, judgeName: string) => {
    setRejectModal({
      isOpen: true,
      type: "judge_round",
      roundId,
      judgeId,
      judgeName,
      reason: "",
    });
  };

  const handleConfirmRejectModal = async () => {
    const { type, submissionId, roundId, judgeId, judgeName, reason } = rejectModal;
    if (!reason.trim()) return;

    try {
      if (type === "judge_submission") {
        await api.post(`/api/v1/admin/submissions/${submissionId}/judges/${judgeId}/reject-score`, { reason });
        toast.success(`Rejected scores from judge ${judgeName} for this team.`);
        viewScores(submissionId!);
      } else {
        await api.post(`/api/v1/admin/rounds/${roundId}/judges/${judgeId}/reject-scores`, { reason });
        toast.success(`Rejected all scores from judge ${judgeName} in this round.`);
        setSelectedSubmissionId(null);
      }
      setRejectModal(prev => ({ ...prev, isOpen: false }));
      fetchSubmissions();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to reject judge scores.";
      toast.error(msg);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center"><Loader className="animate-spin inline-block mr-2" size={20}/> Loading submissions...</div>;
  }

  if (!localRoundId) {
    return <div className="p-8 text-center text-gray-500">Please select an event, category, and round to view submissions.</div>;
  }

  return (
    <>
      {isRoundApproved && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <CheckCircle size={18} />
          <span className="font-medium text-sm">Round rankings have been finalized and approved. Judging scores are locked.</span>
        </div>
      )}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr style={{ borderBottom: `2px solid ${COLORS.border}`, backgroundColor: '#fefcf9' }}>
                <th className="p-4 font-semibold text-sm text-gray-500 sticky left-0 shadow-[1px_0_0_0_#e5e7eb] z-10" style={{ backgroundColor: 'inherit' }}>TEAM</th>
                <th className="p-4 font-semibold text-sm text-gray-500">STATUS</th>
                {judgesList.map((judge, idx) => (
                  <th key={idx} className="p-4 font-semibold text-sm text-gray-500 text-center">
                    {judge.split(' ').pop()} {/* Show given name for brevity */}
                  </th>
                ))}
                <th className="p-4 font-semibold text-sm text-gray-500 text-center">FINAL SCORE</th>
                <th className="p-4 font-semibold text-sm text-gray-500 text-right sticky right-0 shadow-[-1px_0_0_0_#e5e7eb] z-10" style={{ backgroundColor: 'inherit' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub: any) => {
                const subId = sub.submissionId || sub.id;
                const subScores = batchScores[subId] || {};
                const scoresArray = Object.values(subScores);
                const finalScore = scoresArray.length > 0 ? (scoresArray.reduce((a,b)=>a+b,0) / scoresArray.length).toFixed(2) : "-";
                
                return (
                  <tr 
                    key={subId} 
                    className="border-b" 
                    style={{ borderColor: COLORS.border, backgroundColor: '#fefcf9', transition: 'background-color 0.15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fefcf9'}
                  >
                    <td className="p-4 font-medium text-sm sticky left-0 shadow-[1px_0_0_0_#e5e7eb] z-10" style={{ backgroundColor: 'inherit' }}>{sub.teamName}</td>
                    <td className="p-4">
                      <StatusBadge status={getSubmissionStatusLabel(sub)} />
                    </td>
                    
                    {judgesList.map((judge, idx) => {
                      const score = subScores[judge];
                      let bgColor = "";
                      let textColor = "";
                      if (score !== undefined) {
                         if (score >= 80) { bgColor = "bg-green-100"; textColor = "text-green-800"; }
                         else if (score < 50) { bgColor = "bg-red-100"; textColor = "text-red-800"; }
                         else { bgColor = "bg-amber-100"; textColor = "text-amber-800"; }
                      }
                      
                      return (
                        <td key={idx} className="p-4 text-center">
                          {score !== undefined ? (
                            <span className={`inline-block px-3 py-1 rounded-md font-bold text-sm ${bgColor} ${textColor}`}>
                              {Number(score).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="p-4 font-bold text-primary text-lg text-center">
                      {finalScore}
                    </td>

                    <td className="p-4 text-right sticky right-0 shadow-[-1px_0_0_0_#e5e7eb] z-10" style={{ backgroundColor: 'inherit' }}>
                      {rejectingId === subId ? (
                        <div className="flex flex-col gap-2 items-end min-w-[200px]">
                          <input 
                            type="text" 
                            className="px-2 py-1 text-sm border rounded w-full" 
                            placeholder="Reason for rejection..." 
                            value={rejectReason} 
                            onChange={e => setRejectReason(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { setRejectingId(null); setRejectReason(""); }}
                              disabled={approvingId === subId}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="danger"
                              size="sm" 
                              onClick={() => rejectScore(subId)}
                              disabled={!rejectReason.trim() || approvingId === subId}
                              icon={approvingId === subId ? <Loader size={14} className="animate-spin"/> : undefined}
                            >
                              Confirm Reject
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="secondary" size="sm" icon={<Eye size={14} />} onClick={() => viewScores(subId)} title="View Detail Scores" />
                          {!sub.isScoreApproved && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              icon={<XCircle size={14}/>}
                              onClick={() => setRejectingId(subId)}
                              disabled={approvingId === subId || isRoundApproved}
                              style={{ color: COLORS.error, borderColor: COLORS.error }}
                              title="Reject and require re-score"
                            >
                              Reject
                            </Button>
                          )}
                          <Button 
                            variant={sub.isScoreApproved ? "secondary" : "primary"} 
                            size="sm" 
                            icon={approvingId === subId ? <Loader size={14} className="animate-spin"/> : (sub.isScoreApproved ? <XCircle size={14}/> : <CheckSquare size={14}/>)}
                            onClick={() => toggleApproval(subId, sub.isScoreApproved)}
                            disabled={approvingId === subId || isRoundApproved}
                            style={!sub.isScoreApproved && approvingId !== subId ? { background: COLORS.success } : {}}
                          >
                            {sub.isScoreApproved ? "Un-Finalize" : "Finalize"}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={5 + judgesList.length} className="p-8 text-center text-gray-500">No submissions found in this round.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedSubmissionId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ border: `1px solid ${COLORS.border}` }}>
            <div className="sticky top-0 bg-white/80 backdrop-blur-md p-6 border-b flex items-center justify-between z-10" style={{ borderColor: COLORS.border }}>
              <div>
                <h2 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>Detailed Judging Scores</h2>
                <p className="text-sm mt-1" style={{ color: COLORS.textSecondary }}>Breakdown of scores given by each judge</p>
              </div>
              <button onClick={() => setSelectedSubmissionId(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {isJudgingLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                  <Loader size={24} className="animate-spin mb-4 text-primary" />
                  <p>Loading judging details...</p>
                </div>
              ) : judgingDetails.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-xl">
                  <p>No scores have been submitted for this team yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(
                    judgingDetails.reduce((acc: any, curr: any) => {
                      if (!acc[curr.judgeName]) acc[curr.judgeName] = [];
                      acc[curr.judgeName].push(curr);
                      return acc;
                    }, {})
                  ).map(([judgeName, details]: [string, any]) => {
                    const totalScore = details.reduce((sum: number, d: any) => sum + ((d.scoreValue || 0) * (d.criterionWeight || 1)), 0);
                    const judgeId = details[0]?.roundJudgeId; // roundJudgeId is judge's userId in JudgingDTO
                    return (
                      <div key={judgeName} className="border rounded-xl overflow-hidden" style={{ borderColor: COLORS.border }}>
                        <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
                          <h3 className="font-semibold" style={{ color: COLORS.textPrimary }}>Judge: {judgeName}</h3>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg mr-2">Total: {totalScore}</span>
                            {judgeId && (
                              <>
                                <button
                                  className="text-xs text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 bg-white px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                                  onClick={() => openRejectJudgeSubmissionModal(selectedSubmissionId!, judgeId, judgeName)}
                                  disabled={isRoundApproved}
                                >
                                  Reject Score
                                </button>
                                <button
                                  className="text-xs text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 bg-white px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                                  onClick={() => openRejectJudgeRoundModal(localRoundId, judgeId, judgeName)}
                                  disabled={isRoundApproved}
                                >
                                  Reject Round Scores
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="divide-y" style={{ borderColor: COLORS.border }}>
                          {details.map((d: any, i: number) => (
                            <div key={i} className="p-4 hover:bg-gray-50/50 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm" style={{ color: COLORS.textSecondary }}>{d.criterionName || "Criterion"}</span>
                                <span className="font-bold" style={{ color: COLORS.textPrimary }}>{d.scoreValue || 0} pts</span>
                              </div>
                              {d.comment && (
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border" style={{ borderColor: COLORS.border }}>
                                  "{d.comment}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 sticky bottom-0" style={{ borderColor: COLORS.border }}>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setSelectedSubmissionId(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectModal.isOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setRejectModal(prev => ({ ...prev, isOpen: false }))}>
          <Card className="w-full max-w-md p-6 shadow-2xl relative bg-white" style={{ backgroundColor: "#ffffff" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2" style={{ color: COLORS.textPrimary }}>
              {rejectModal.type === "judge_submission" ? "Reject Judge's Score" : "Reject Judge's Round Scores"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {rejectModal.type === "judge_submission"
                ? `Enter reason for rejecting scores from judge ${rejectModal.judgeName} for this team:`
                : `Are you sure you want to reject ALL scores submitted by judge ${rejectModal.judgeName} in this entire round? This action cannot be undone. Enter reason for rejection:`}
            </p>
            <textarea
              className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 mb-4 text-sm"
              rows={3}
              placeholder="Reason for rejection..."
              value={rejectModal.reason}
              onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setRejectModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={!rejectModal.reason.trim()}
                onClick={handleConfirmRejectModal}
              >
                Confirm Reject
              </Button>
            </div>
          </Card>
        </div>,
        document.body
      )}
    </>
  );
}
