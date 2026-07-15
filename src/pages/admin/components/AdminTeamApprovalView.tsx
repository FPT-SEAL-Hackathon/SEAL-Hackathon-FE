import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, Loader, RefreshCw, Users, XCircle } from "lucide-react";
import { Button, Card, COLORS, StatusBadge } from "@/components/shared/UIComponents";
import { parseApiError } from "@/lib/api/apiClient";
import {
  canOrganizerApproveTeam,
  getTeamStatusInfo,
  teamService,
  type TeamEligibilityReviewResponse,
} from "@/features/teams/api/teamService";

/**
 * Màn organizer duyệt team theo sự kiện.
 * Hiển thị rõ sĩ số so với min/max của event và các vấn đề hồ sơ;
 * Approve bị khóa khi team chưa đủ điều kiện (backend cũng chặn 409).
 * Approve/Reject team đồng thời duyệt/từ chối toàn bộ EventParticipant của thành viên.
 */
export function AdminTeamApprovalView({ context }: any) {
  const { selectedEventId, setApiTeamEligibility } = context ?? {};

  const [teams, setTeams] = useState<TeamEligibilityReviewResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [actingTeamId, setActingTeamId] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [rejectingTeamId, setRejectingTeamId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const loadTeams = useCallback(async () => {
    if (!selectedEventId) {
      setTeams([]);
      return;
    }
    setLoading(true);
    try {
      const data = await teamService.reviewEligibility(selectedEventId);
      setTeams(data ?? []);
      setApiTeamEligibility?.(data ?? []);
    } catch (error) {
      setMessage({ tone: "error", text: parseApiError(error).message });
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, setApiTeamEligibility]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const decide = async (team: TeamEligibilityReviewResponse, approved: boolean, note?: string) => {
    if (getTeamStatusInfo(team.teamStatusId, team.teamStatusName).badge !== "pending_approval") {
      setMessage({ tone: "error", text: "Only Pending teams can be approved or rejected." });
      return;
    }
    if (approved && !canOrganizerApproveTeam(team)) {
      setMessage({ tone: "error", text: "Resolve the approval issues before approving this team." });
      return;
    }
    setActingTeamId(team.teamId);
    setMessage(null);
    try {
      await teamService.decideEligibility(team.teamId, approved, note);
      setMessage({
        tone: "success",
        text: approved
          ? `Team "${team.teamName}" approved. All member registrations are now ACTIVE.`
          : `Team "${team.teamName}" rejected. All member registrations are now REJECTED.`,
      });
      setRejectingTeamId(null);
      setRejectNote("");
      await loadTeams();
    } catch (error) {
      setMessage({ tone: "error", text: parseApiError(error).message });
    } finally {
      setActingTeamId(null);
    }
  };

  const sizeLabel = (team: TeamEligibilityReviewResponse) => {
    const min = team.minTeamSize ?? "?";
    const max = team.maxTeamSize ?? "?";
    return `${team.activeMemberCount} / ${min}–${max}`;
  };

  const badge = (ok: boolean, okText: string, badText: string) => (
    <span
      className="px-2 py-1 rounded-lg inline-flex items-center gap-1"
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: ok ? COLORS.success : COLORS.error,
        background: ok ? `${COLORS.success}12` : `${COLORS.error}12`,
      }}
    >
      {ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {ok ? okText : badText}
    </span>
  );

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Users size={18} style={{ color: COLORS.primary }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary }}>Team Approval</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={loading ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            disabled={loading || !selectedEventId}
            onClick={loadTeams}
          >
            {loading ? "Loading..." : "Reload"}
          </Button>
        </div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 6 }}>
          Review team size against the event limits and member profiles, then approve or reject each team.
          Approving a team also approves every member's event registration.
        </div>
        {!selectedEventId && (
          <div className="mt-4 rounded-xl px-4 py-3" style={{ background: COLORS.bg, color: COLORS.textSecondary, fontSize: 13 }}>
            Select an event first to review its teams.
          </div>
        )}
        {message && (
          <div
            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2"
            style={{
              fontSize: 13,
              color: message.tone === "success" ? COLORS.success : COLORS.error,
              background: message.tone === "success" ? `${COLORS.success}10` : `${COLORS.error}10`,
              border: `1px solid ${message.tone === "success" ? COLORS.success : COLORS.error}25`,
            }}
          >
            {message.tone === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {message.text}
          </div>
        )}
      </Card>

      {selectedEventId && !loading && teams.length === 0 && (
        <Card className="p-6">
          <div style={{ color: COLORS.textSecondary, fontSize: 14 }}>No teams found for this event.</div>
        </Card>
      )}

      {teams.map(team => {
        const status = getTeamStatusInfo(team.teamStatusId, team.teamStatusName);
        const isPending = status.badge === "pending_approval";
        const eligible = canOrganizerApproveTeam(team);
        const issues = team.approvalIssues?.length ? team.approvalIssues : team.issues ?? [];
        const expanded = expandedTeamId === team.teamId;
        const rejecting = rejectingTeamId === team.teamId;
        const acting = actingTeamId === team.teamId;

        return (
          <Card key={team.teamId} className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{team.teamName}</div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StatusBadge status={status.badge} />
                  <span
                    className="px-2 py-1 rounded-lg"
                    style={{ fontSize: 12, fontWeight: 700, background: COLORS.bg, color: COLORS.textPrimary }}
                  >
                    Members: {sizeLabel(team)}
                  </span>
                  {badge(Boolean(team.teamSizeEligible), "Size OK", "Size out of range")}
                  {badge(Boolean(team.membersInfoComplete), "Profiles complete", "Profiles incomplete")}
                </div>
                {issues.length > 0 && (
                  <ul className="mt-2" style={{ fontSize: 12.5, color: COLORS.error, paddingLeft: 18 }}>
                    {issues.map(issue => <li key={issue}>{issue}</li>)}
                  </ul>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  icon={expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  onClick={() => setExpandedTeamId(expanded ? null : team.teamId)}
                >
                  Members
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={acting ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  disabled={!isPending || !eligible || acting}
                  onClick={() => decide(team, true)}
                >
                  Approve Team
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<XCircle size={14} />}
                  disabled={!isPending || acting}
                  onClick={() => {
                    setRejectingTeamId(rejecting ? null : team.teamId);
                    setRejectNote("");
                  }}
                >
                  Reject
                </Button>
              </div>
            </div>

            {isPending && !eligible && (
              <div className="mt-3 rounded-xl px-3 py-2" style={{ background: `${COLORS.error}08`, color: COLORS.error, fontSize: 12.5 }}>
                Approve is disabled until every issue above is resolved
                (team size must be within the event's {team.minTeamSize ?? "?"}–{team.maxTeamSize ?? "?"} range
                and all member profiles must be complete).
              </div>
            )}

            {!isPending && (
              <div className="mt-3 rounded-xl px-3 py-2" style={{ background: COLORS.bg, color: COLORS.textSecondary, fontSize: 12.5 }}>
                Only Pending teams can be approved or rejected from this queue.
              </div>
            )}

            {isPending && rejecting && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <input
                  value={rejectNote}
                  onChange={event => setRejectNote(event.target.value)}
                  placeholder="Rejection reason (required)"
                  className="flex-1 min-w-[240px] px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
                <Button
                  variant="danger"
                  size="sm"
                  disabled={!rejectNote.trim() || acting}
                  onClick={() => decide(team, false, rejectNote.trim())}
                >
                  Confirm Reject
                </Button>
              </div>
            )}

            {expanded && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: COLORS.bg }}>
                      {["Name", "Email", "Student Code", "University", "Profile", "Issues"].map(header => (
                        <th
                          key={header}
                          className="text-left px-3 py-2"
                          style={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}
                        >
                          {header.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {team.members.map(member => (
                      <tr key={member.teamMemberId} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                        <td className="px-3 py-2" style={{ fontSize: 13, color: COLORS.textPrimary }}>
                          {member.fullName || "-"}
                          {member.userId === team.leaderUserId && (
                            <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: COLORS.primary }}>LEADER</span>
                          )}
                        </td>
                        <td className="px-3 py-2" style={{ fontSize: 13, color: COLORS.textSecondary }}>{member.email || "-"}</td>
                        <td className="px-3 py-2" style={{ fontSize: 13, color: COLORS.textSecondary }}>
                          {member.fptStudentCode || member.externalStudentCode || "-"}
                        </td>
                        <td className="px-3 py-2" style={{ fontSize: 13, color: COLORS.textSecondary }}>{member.universityName || "-"}</td>
                        <td className="px-3 py-2">{badge(Boolean(member.profileComplete), "Complete", "Incomplete")}</td>
                        <td className="px-3 py-2" style={{ fontSize: 12, color: COLORS.error }}>
                          {member.issues?.length ? member.issues.join("; ") : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
