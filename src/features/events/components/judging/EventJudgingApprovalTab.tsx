import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { api } from "@/lib/api/apiClient";
import { CheckCircle, XCircle, Eye, Loader, CheckSquare, Lock } from "lucide-react";
import { Card, Button, StatusBadge, COLORS, DataTable } from "@/components/shared/UIComponents";
import { useCategoryContext } from "../../context/CategoryContext";
import { useRoundContext } from "../../context/RoundContext";
import { rankingService } from "@/features/rankings/api/rankingService";
import {
  getSubmissionStatusLabel,
  SUBMISSION_STATUS_IDS,
} from "@/features/submissions/api/submissionService";

export function EventJudgingApprovalTab({ eventId }: { eventId: string }) {
  const { categories } = useCategoryContext();
  const { roundsByCategory } = useRoundContext();

  const [localCategoryId, setLocalCategoryId] = useState<string>("");
  const [localRoundId, setLocalRoundId] = useState<string>("");

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
  const [isRoundLocked, setIsRoundLocked] = useState(false);

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
  }, [categoryRounds, localRoundId]);

  const fetchSubmissions = async () => {
    if (!localRoundId || !localCategoryId) {
      setSubmissions([]);
      setBatchScores({});
      setJudgesList([]);
      setIsRoundLocked(false);
      return;
    }
    setIsLoading(true);
    try {
      const [data, rankings] = await Promise.all([
        api.get<any[]>(`/api/v1/admin/rounds/${localRoundId}/submissions`),
        rankingService.getRoundRankings(localRoundId, localCategoryId).catch(() => [])
      ]);
      
      setSubmissions(data || []);
      setIsRoundLocked(rankings.some(r => r.isApproved || r.isPublished));
      
      if (data && data.length > 0) {
        setIsBatchLoading(true);
        const subIds = data.map((s: any) => s.submissionId);
        try {
            const batchData = await api.post<any[]>(`/api/v1/judging/batch-scores`, { submissionIds: subIds });
            
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
  }, [localRoundId, localCategoryId]);

  const toggleApproval = async (submissionId: string, currentStatus: boolean) => {
    setApprovingId(submissionId);
    try {
      await api.post(`/api/v1/admin/submissions/${submissionId}/approve`, { approve: !currentStatus });
      setSubmissions(prev => prev.map(s => 
        s.submissionId === submissionId ? {
          ...s,
          isScoreApproved: !currentStatus,
          submissionStatusId: !currentStatus ? SUBMISSION_STATUS_IDS.SCORED : SUBMISSION_STATUS_IDS.IN_PROGRESS,
          submissionStatusName: !currentStatus ? "Scored" : "In Progress",
        } : s
      ));
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  const bulkApprove = async () => {
    const unapproved = submissions.filter(s => !s.isScoreApproved);
    if (unapproved.length === 0) return;
    
    setIsLoading(true);
    try {
      await Promise.all(unapproved.map(s => 
        api.post(`/api/v1/admin/submissions/${s.submissionId}/approve`, { approve: true })
      ));
      fetchSubmissions();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const rejectScore = async (submissionId: string) => {
    if (!rejectReason.trim()) return;
    setApprovingId(submissionId);
    try {
      await api.post(`/api/v1/admin/submissions/${submissionId}/reject-score`, { reason: rejectReason });
      setRejectingId(null);
      setRejectReason("");
      fetchSubmissions();
    } catch (e) {
      console.error(e);
    } finally {
      setApprovingId(null);
    }
  };

  const viewScores = async (submissionId: string) => {
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

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</label>
            <Select value={localCategoryId || "none"} onValueChange={value => {
                setLocalCategoryId((value === "none" ? "" : value));
                setLocalRoundId(""); // reset round
              }} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="none" style={{ color: COLORS.textPrimary }}>Select a Category</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.categoryId} value={c.categoryId} style={{ color: COLORS.textPrimary }}>{c.categoryName}</SelectItem>
              ))}
  </SelectContent>
</Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>ROUND</label>
              <Select value={localRoundId || "none"} onValueChange={value => setLocalRoundId((value === "none" ? "" : value))} disabled={!localCategoryId || categoryRounds.length === 0}>
                <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <SelectItem value="none" style={{ color: COLORS.textPrimary }}>
                    {!localCategoryId 
                      ? "Select Category First" 
                      : (categoryRounds.length === 0 ? "No Rounds in Category" : "Select a Round")}
                  </SelectItem>
                  {categoryRounds.map(r => (
                    <SelectItem key={r.roundId} value={r.roundId} style={{ color: COLORS.textPrimary }}>{r.roundName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </div>
          
          <div className="flex-1 flex justify-end items-end min-w-[200px]">
            <Button
              variant="primary"
              disabled={isLoading || !localRoundId || isRoundLocked || submissions.filter(s => !s.isScoreApproved).length === 0}
              onClick={bulkApprove}
              icon={isRoundLocked ? <Lock size={16} /> : <CheckCircle size={16} />}
              title={isRoundLocked ? "Round is locked because rankings are published/approved" : ""}
            >
              Approve All
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="p-8 text-center"><Loader className="animate-spin inline-block mr-2" size={20}/> Loading submissions...</div>
      ) : !localRoundId ? (
        <Card className="p-8 text-center text-gray-500">Please select a category and round to view submissions.</Card>
      ) : (
        <Card>
          <DataTable
            columns={[
              { key: "team", label: "TEAM", render: (_, row) => <span className="font-medium text-sm">{row.teamName}</span> },
              { key: "status", label: "STATUS", render: (_, row) => <StatusBadge status={getSubmissionStatusLabel(row)} /> },
              ...judgesList.map(judge => ({
                key: judge,
                label: judge.split(' ').pop() || judge,
                render: (_: any, row: any) => {
                  const score = batchScores[row.submissionId]?.[judge];
                  if (score === undefined) return <span className="text-gray-300">-</span>;
                  let bgColor = "", textColor = "";
                  if (score >= 80) { bgColor = "bg-green-100"; textColor = "text-green-800"; }
                  else if (score < 50) { bgColor = "bg-red-100"; textColor = "text-red-800"; }
                  else { bgColor = "bg-amber-100"; textColor = "text-amber-800"; }
                  return (
                    <span className={`inline-block px-3 py-1 rounded-md font-bold text-sm ${bgColor} ${textColor}`}>
                      {Number(score).toFixed(2)}
                    </span>
                  );
                }
              })),
              { key: "finalScore", label: "FINAL SCORE", render: (_, row) => {
                const subScores = batchScores[row.submissionId] || {};
                const scoresArray = Object.values(subScores);
                const totalScore = scoresArray.length > 0 ? (scoresArray.reduce((a,b)=>a+b,0)).toFixed(2) : "-";
                return <span className="font-bold text-primary text-lg">{totalScore}</span>;
              } },
              { key: "action", label: "ACTIONS", render: (_, row) => {
                if (rejectingId === row.submissionId) {
                  return (
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
                        <Button variant="ghost" size="sm" onClick={() => {
                          setRejectingId(null);
                          setRejectReason("");
                        }}>Cancel</Button>
                        <Button variant="danger" size="sm" onClick={() => rejectScore(row.submissionId)}>
                          Confirm Reject
                        </Button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" size="sm" icon={<Eye size={16} />} onClick={() => viewScores(row.submissionId)} title="View Detail Scores" />
                    {!row.isScoreApproved && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        icon={<XCircle size={16} />}
                        onClick={() => {
                          setRejectingId(row.submissionId);
                          setRejectReason("");
                        }}
                        style={{ color: COLORS.error, borderColor: COLORS.error }}
                        disabled={approvingId === row.submissionId || isRoundLocked}
                        title={isRoundLocked ? "Round is locked" : ""}
                      >
                        Reject
                      </Button>
                    )}
                    <Button 
                      variant={row.isScoreApproved ? "secondary" : "primary"} 
                      size="sm" 
                      icon={approvingId === row.submissionId ? <Loader size={16} className="animate-spin" /> : (isRoundLocked ? <Lock size={16}/> : (row.isScoreApproved ? <XCircle size={16} /> : <CheckSquare size={16} />))}
                      onClick={() => toggleApproval(row.submissionId, row.isScoreApproved)}
                      disabled={approvingId === row.submissionId || isRoundLocked}
                      title={isRoundLocked ? "Round is locked" : ""}
                      style={!row.isScoreApproved && approvingId !== row.submissionId ? { background: isRoundLocked ? COLORS.border : COLORS.success } : {}}
                    >
                      {row.isScoreApproved ? "Un-Finalize" : "Finalize"}
                    </Button>
                  </div>
                );
              }}
            ]}
            data={submissions.length === 0 ? [{
              team: "No submissions ready for approval",
              status: "draft",
              finalScore: "-"
            }] : submissions}
          />
        </Card>
      )}

      {selectedSubmissionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedSubmissionId(null)}>
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>Judging Details</h3>
              <Button variant="ghost" icon={<XCircle size={20}/>} onClick={() => setSelectedSubmissionId(null)} />
            </div>
            
            {isJudgingLoading ? (
              <div className="py-12 text-center"><Loader className="animate-spin inline-block mr-2" size={24}/> Loading details...</div>
            ) : judgingDetails.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No judging scores recorded yet.</div>
            ) : (
              <div className="overflow-y-auto pr-2 space-y-6">
                {Object.entries(
                  judgingDetails.reduce((acc, curr) => {
                    const judge = curr.judgeName || "Unknown Judge";
                    if (!acc[judge]) acc[judge] = [];
                    acc[judge].push(curr);
                    return acc;
                  }, {} as Record<string, any[]>)
                ).map(([judge, scores]: [string, any]) => {
                  const totalScore = scores.reduce((sum: number, s: any) => sum + (s.scoreValue || 0), 0);
                  return (
                    <div key={judge} className="rounded-xl p-4" style={{ border: `1px solid ${COLORS.border}`, background: "var(--surface-bg)" }}>
                      <div className="flex justify-between items-center mb-3">
                        <div className="font-bold text-lg" style={{ color: COLORS.textPrimary }}>{judge}</div>
                        <div className="font-bold text-primary">Total: {totalScore.toFixed(2)}</div>
                      </div>
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                            <th className="py-2 text-gray-500 font-semibold">Criterion</th>
                            <th className="py-2 text-gray-500 font-semibold text-center w-24">Score</th>
                            <th className="py-2 text-gray-500 font-semibold">Comment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scores.map((s: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: idx === scores.length - 1 ? "none" : `1px solid ${COLORS.border}50` }}>
                              <td className="py-2" style={{ color: COLORS.textPrimary }}>{s.criterionName}</td>
                              <td className="py-2 text-center font-bold" style={{ color: COLORS.textPrimary }}>{s.scoreValue?.toFixed(2)}</td>
                              <td className="py-2 italic text-xs" style={{ color: COLORS.textSecondary }}>{s.comment || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
