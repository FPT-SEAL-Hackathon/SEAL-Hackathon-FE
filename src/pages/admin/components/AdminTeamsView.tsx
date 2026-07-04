import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Loader, RefreshCw, Users, XCircle } from "lucide-react";
import { Button, Card, COLORS, SectionHeader, StatusBadge } from "@/components/shared/UIComponents";
import {
  getTeamStatusInfo,
  teamService,
  type TeamEligibilityReviewResponse,
} from "@/features/teams/api/teamService";

interface AdminTeamsViewProps {
  context: any;
}

export function AdminTeamsView({ context }: AdminTeamsViewProps) {
  const {
    apiEvents,
    selectedEventId,
    setSelectedEventId,
    apiCategories,
    apiTeamEligibility,
    setApiTeamEligibility,
  } = context;
  const [loading, setLoading] = useState(false);
  const [actionTeamId, setActionTeamId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTeams = useCallback(async () => {
    if (!selectedEventId) {
      setApiTeamEligibility([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setApiTeamEligibility(await teamService.reviewEligibility(selectedEventId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load teams.");
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, setApiTeamEligibility]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const decide = async (team: TeamEligibilityReviewResponse, approved: boolean) => {
    const note = notes[team.teamId]?.trim();
    if (!approved && !note) {
      setError("Enter a rejection reason before rejecting this team.");
      return;
    }

    setActionTeamId(team.teamId);
    setError("");
    setMessage("");
    try {
      const result = await teamService.decideEligibility(team.teamId, approved, note);
      setMessage(result.message || (approved ? "Team approved." : "Team rejected."));
      setNotes(current => ({ ...current, [team.teamId]: "" }));
      await loadTeams();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not update team status.");
    } finally {
      setActionTeamId("");
    }
  };

  const categoryName = (categoryId: string) =>
    apiCategories.find((category: any) => category.categoryId === categoryId)?.categoryName ?? "None";

  return (
    <>
      <SectionHeader
        title="Team Approvals"
        subtitle="Approve eligible teams before they can submit competition work"
        action={
          <Button
            variant="outline"
            size="sm"
            icon={loading ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            disabled={!selectedEventId || loading}
            onClick={() => void loadTeams()}
          >
            Refresh
          </Button>
        }
      />

      <Card className="p-5 mb-5">
        <label className="block max-w-xl">
          <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 6 }}>
            EVENT
          </span>
          <select
            value={selectedEventId ?? ""}
            onChange={event => setSelectedEventId(event.target.value || null)}
            className="w-full px-3 py-2.5 rounded-xl outline-none"
            style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}
          >
            <option value="">Select an event</option>
            {apiEvents.map((event: any) => (
              <option key={event.eventId ?? event.id} value={event.eventId ?? event.id}>
                {event.eventName ?? event.name}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {message && (
        <div className="rounded-xl px-4 py-3 mb-4" style={{ color: COLORS.success, background: `${COLORS.success}10`, border: `1px solid ${COLORS.success}25` }}>
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl px-4 py-3 mb-4" style={{ color: COLORS.error, background: `${COLORS.error}10`, border: `1px solid ${COLORS.error}25` }}>
          {error}
        </div>
      )}

      {!selectedEventId && (
        <Card className="p-8 text-center">
          <Users size={34} className="mx-auto mb-3" style={{ color: COLORS.textSecondary }} />
          <div style={{ color: COLORS.textSecondary }}>Select an event to manage its teams.</div>
        </Card>
      )}

      {selectedEventId && !loading && apiTeamEligibility.length === 0 && (
        <Card className="p-8 text-center">
          <Users size={34} className="mx-auto mb-3" style={{ color: COLORS.textSecondary }} />
          <div style={{ color: COLORS.textSecondary }}>No teams found for this event.</div>
        </Card>
      )}

      {loading && (
        <Card className="p-8 flex items-center justify-center gap-2" style={{ color: COLORS.textSecondary }}>
          <Loader size={18} className="animate-spin" /> Loading teams...
        </Card>
      )}

      {!loading && apiTeamEligibility.length > 0 && (
        <div className="space-y-4">
          {apiTeamEligibility.map((team: TeamEligibilityReviewResponse) => {
            const status = getTeamStatusInfo(team.teamStatusId);
            const isPending = status.badge === "pending_approval";
            const isActing = actionTeamId === team.teamId;
            return (
              <Card key={team.teamId} className="p-5">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.textPrimary }}>{team.teamName}</div>
                      <StatusBadge status={status.badge} />
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2" style={{ fontSize: 13, color: COLORS.textSecondary }}>
                      <span>Category: {categoryName(team.categoryId)}</span>
                      <span>Members: {team.activeMemberCount}/{team.minTeamSize}-{team.maxTeamSize}</span>
                      <span>Profiles: {team.membersInfoComplete ? "Complete" : "Incomplete"}</span>
                    </div>
                    {team.issues.length > 0 && (
                      <ul className="mt-3 pl-5 list-disc" style={{ fontSize: 12, color: COLORS.error }}>
                        {team.issues.map(issue => <li key={issue}>{issue}</li>)}
                      </ul>
                    )}
                  </div>

                  {isPending && (
                    <div className="w-full xl:max-w-xl">
                      <input
                        value={notes[team.teamId] ?? ""}
                        onChange={event => setNotes(current => ({ ...current, [team.teamId]: event.target.value }))}
                        placeholder="Approval note or required rejection reason"
                        className="w-full px-3 py-2.5 rounded-xl outline-none"
                        style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, fontSize: 13 }}
                      />
                      <div className="flex flex-wrap justify-end gap-2 mt-3">
                        <Button
                          variant="danger"
                          size="sm"
                          icon={isActing ? <Loader size={13} className="animate-spin" /> : <XCircle size={13} />}
                          disabled={isActing}
                          onClick={() => void decide(team, false)}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={isActing ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                          disabled={isActing || !team.eligibleForCompetition}
                          onClick={() => void decide(team, true)}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
