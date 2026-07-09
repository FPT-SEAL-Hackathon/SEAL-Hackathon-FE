import { useEffect, useState } from "react";
import { PlusCircle, Loader, User, Mail, Trash2 } from "lucide-react";
import { SectionHeader, Card, Button, COLORS } from "@/components/shared/UIComponents";
import { roundService } from "@/features/judging/api/roundService";

interface AdminViewProps {
  context: any;
}

export function AdminAssignmentsView({ context }: AdminViewProps) {
  const {
    t,
    selectedEventId,
    apiDashboardRounds,
    setAssignJudgeModal,
    assignJudgeModal,
  } = context;

  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (judgeId: string, roundJudgeId: string, force = false) => {
    if (!selectedRoundId || !roundJudgeId) return;
    setRemovingId(judgeId);
    setError("");
    try {
      await roundService.removeJudge(roundJudgeId, force);
      // Reload the judges list
      const updatedJudges = await roundService.getJudges(selectedRoundId);
      setJudges(updatedJudges);
    } catch (err: any) {
      if (err.message && err.message.includes("JUDGE_HAS_SCORES")) {
        if (window.confirm("Giám khảo này đã có bảng điểm (chấm thi). Việc xoá sẽ làm mất các điểm số đó. Bạn có chắc chắn muốn xoá không?")) {
          return handleRemove(judgeId, roundJudgeId, true);
        }
      } else {
        setError(err.message || "Failed to remove judge");
      }
    } finally {
      if (!force) setRemovingId(null);
    }
  };

  useEffect(() => {
    if (apiDashboardRounds && apiDashboardRounds.length > 0) {
      const isValid = apiDashboardRounds.some((r: any) => r.roundId === selectedRoundId);
      if (!isValid) {
        setSelectedRoundId(apiDashboardRounds[0].roundId);
      }
    } else {
      setSelectedRoundId("");
    }
  }, [apiDashboardRounds, selectedRoundId]);

  useEffect(() => {
    if (!selectedRoundId) {
      setJudges([]);
      return;
    }
    setLoading(true);
    setError("");
    roundService.getJudges(selectedRoundId)
      .then(setJudges)
      .catch(err => setError(err instanceof Error ? err.message : "Failed to load judges"))
      .finally(() => setLoading(false));
  }, [selectedRoundId, assignJudgeModal?.open]);

  return (
    <>
      <SectionHeader 
        title={t("admin.judgeAssignments")} 
        subtitle={t("admin.judgeAssignmentsSubtitle") || "Manage judges assigned to rounds"} 
        action={
          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 rounded-xl outline-none text-sm font-medium cursor-pointer"
              style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              value={selectedEventId || ""}
              onChange={(e) => context.setSelectedEventId(e.target.value)}
            >
              <option value="" disabled>Select an Event</option>
              {context.apiEvents?.map((evt: any) => (
                <option key={evt.eventId} value={evt.eventId}>{evt.eventName}</option>
              ))}
            </select>
            <Button 
              variant="primary" 
              size="sm" 
              icon={<PlusCircle size={14} />} 
              onClick={() => {
                const round = apiDashboardRounds.find((r: any) => r.roundId === selectedRoundId);
                setAssignJudgeModal({ open: true, roundId: selectedRoundId, roundName: round?.roundName });
              }}
              disabled={!selectedRoundId}
            >
              {t("common.assignJudge")}
            </Button>
          </div>
        }
      />
      
      {!selectedEventId ? (
        <Card className="p-8 text-center" style={{ color: COLORS.textSecondary }}>
          Select an event to view rounds and judges.
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>Rounds</div>
            {apiDashboardRounds?.map((round: any) => (
              <div 
                key={round.roundId} 
                onClick={() => setSelectedRoundId(round.roundId)}
                className="p-3 rounded-xl cursor-pointer transition-colors"
                style={{ 
                  background: selectedRoundId === round.roundId ? `${COLORS.primary}15` : COLORS.bg,
                  border: `1px solid ${selectedRoundId === round.roundId ? COLORS.primary : COLORS.border}`,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: selectedRoundId === round.roundId ? COLORS.primary : COLORS.textPrimary }}>
                  {round.roundName}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }} className="mt-1 line-clamp-1">
                  Round Order: {round.roundOrder}
                </div>
              </div>
            ))}
            {(!apiDashboardRounds || apiDashboardRounds.length === 0) && (
              <div className="text-center p-4 text-sm" style={{ color: COLORS.textSecondary }}>No rounds found</div>
            )}
          </div>
          
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>Assigned Judges</div>
              {loading && <Loader size={14} className="animate-spin" style={{ color: COLORS.textSecondary }} />}
            </div>
            
            {error && (
              <Card className="p-4 bg-red-500/10 text-red-500 text-sm border-red-500/20">{error}</Card>
            )}
            
            {!loading && judges.length === 0 && (
              <Card className="p-8 text-center flex flex-col items-center justify-center gap-2" style={{ borderStyle: "dashed" }}>
                <User size={24} style={{ color: COLORS.textSecondary, opacity: 0.5 }} />
                <div style={{ fontSize: 14, color: COLORS.textSecondary }}>No judges assigned to this round yet</div>
              </Card>
            )}

            {!loading && judges.map((j: any) => {
              const jId = j.judgeId || j.userId || Math.random().toString();
              const rjId = j.roundJudgeId; // From backend's RoundJudgeResponse
              const isRemoving = removingId === jId;
              
              return (
                <Card key={jId} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${COLORS.primary}20`, color: COLORS.primary, fontWeight: 700 }}>
                      {(j.fullName || j.judgeName || "J")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{j.fullName || j.judgeName}</div>
                      <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                        <Mail size={12} />
                        {j.email || j.judgeEmail}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    icon={isRemoving ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    disabled={isRemoving}
                    onClick={() => {
                      if (!rjId) {
                        setError("Missing roundJudgeId. Please restart your Java Backend so the API changes take effect!");
                        return;
                      }
                      handleRemove(jId, rjId);
                    }}
                  >
                    Remove
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
