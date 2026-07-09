import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Eye,
  Loader,
  RefreshCw,
  ShieldOff,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { Button, Card, COLORS, StatusBadge } from "@/components/shared/UIComponents";
import {
  getTeamStatusInfo,
  teamService,
  type TeamEligibilityReviewResponse,
  type TeamEligibilityMemberResponse,
} from "@/features/teams/api/teamService";
import type { Category } from "@/features/events/types/category";

interface EventTeamsSectionProps {
  eventId: string;
  categories: Category[];
}

export function EventTeamsSummaryCard({ eventId, onOpen }: { eventId: string; onOpen: () => void }) {
  const [summary, setSummary] = useState({ teams: 0, participants: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    teamService.reviewEligibility(eventId)
      .then(teams => {
        if (cancelled) return;
        setSummary({
          teams: teams.length,
          participants: teams.reduce((total, team) => total + team.activeMemberCount, 0),
        });
      })
      .catch(() => {
        if (!cancelled) setSummary({ teams: 0, participants: 0 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return (
    <Card className="p-5">
      <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary, marginBottom: 10 }}>
        Team Management
      </div>
      {[
        { label: "Teams", value: summary.teams },
        { label: "Participants", value: summary.participants },
      ].map(item => (
        <div key={item.label} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2" style={{ color: COLORS.textSecondary, fontSize: 13 }}>
            <Users size={14} style={{ color: COLORS.primary }} />
            {item.label}
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.primary }}>
            {loading ? "—" : item.value}
          </span>
        </div>
      ))}
      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          icon={<ArrowRight size={13} />}
          onClick={onOpen}
        >
          Open Team Management
        </Button>
      </div>
    </Card>
  );
}

export function EventTeamsSection({ eventId, categories }: EventTeamsSectionProps) {
  const [teams, setTeams] = useState<TeamEligibilityReviewResponse[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamEligibilityReviewResponse | null>(null);
  const [disqualifyTarget, setDisqualifyTarget] = useState<TeamEligibilityReviewResponse | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionTeamId, setActionTeamId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await teamService.reviewEligibility(eventId);
      const sorted = [...data].sort((left, right) => left.teamName.localeCompare(right.teamName));
      setTeams(sorted);
      setSelectedTeam(current => current
        ? sorted.find(team => team.teamId === current.teamId) ?? null
        : null);
      return sorted;
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load teams.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const categoryName = (categoryId: string) =>
    categories.find(category => category.categoryId === categoryId)?.categoryName ?? "None";

  const decide = async (approved: boolean) => {
    if (!selectedTeam) return;
    if (!approved && !decisionNote.trim()) {
      setError("Enter a rejection reason before rejecting this team.");
      return;
    }
    setActionTeamId(selectedTeam.teamId);
    setError("");
    setMessage("");
    try {
      const result = await teamService.decideEligibility(
        selectedTeam.teamId,
        approved,
        decisionNote.trim() || undefined,
      );
      setMessage(result.message || (approved ? "Team approved." : "Team rejected."));
      setDecisionNote("");
      await loadTeams();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not update team status.");
    } finally {
      setActionTeamId("");
    }
  };

  const disqualify = async () => {
    if (!disqualifyTarget || !disqualifyReason.trim()) return;
    setActionTeamId(disqualifyTarget.teamId);
    setError("");
    setMessage("");
    try {
      await teamService.disqualify(disqualifyTarget.teamId, disqualifyReason.trim());
      setMessage(`${disqualifyTarget.teamName} has been disqualified.`);
      setDisqualifyTarget(null);
      setDisqualifyReason("");
      await loadTeams();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Could not disqualify this team.");
    } finally {
      setActionTeamId("");
    }
  };

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary }}>Team Management</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
              {teams.length} team(s) registered for this event
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={loading ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            disabled={loading}
            onClick={() => void loadTeams()}
          >
            Refresh
          </Button>
        </div>

        {message && (
          <div className="rounded-xl px-3 py-2 mb-3" style={{ color: COLORS.success, background: `${COLORS.success}10`, fontSize: 13 }}>
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl px-3 py-2 mb-3" style={{ color: COLORS.error, background: `${COLORS.error}10`, fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && teams.length === 0 && (
          <div className="rounded-xl p-6 text-center" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary }}>
            <Users size={28} className="mx-auto mb-2" />
            No teams registered for this event.
          </div>
        )}

        <div className="space-y-2">
          {teams.map(team => {
            const status = getTeamStatusInfo(team.teamStatusId);
            const isActive = status.badge === "active";
            return (
              <div
                key={team.teamId}
                className="grid grid-cols-1 md:grid-cols-[minmax(180px,1fr)_180px_auto_auto] items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
              >
                <div className="min-w-0">
                  <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary }}>{team.teamName}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                    {categoryName(team.categoryId)} · {team.activeMemberCount}/{team.maxTeamSize} members
                  </div>
                </div>
                <div><StatusBadge status={status.badge} /></div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Eye size={13} />}
                  onClick={() => {
                    setError("");
                    setDecisionNote("");
                    setSelectedTeam(team);
                  }}
                >
                  View
                </Button>
                <div className="md:w-28">
                  {isActive && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<ShieldOff size={13} />}
                      disabled={actionTeamId === team.teamId}
                      onClick={() => {
                        setError("");
                        setDisqualifyReason("");
                        setDisqualifyTarget(team);
                      }}
                    >
                      Disqualify
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {selectedTeam && (
        <TeamDetailDialog
          team={selectedTeam}
          categoryName={categoryName(selectedTeam.categoryId)}
          decisionNote={decisionNote}
          setDecisionNote={setDecisionNote}
          isActing={actionTeamId === selectedTeam.teamId}
          error={error}
          onClose={() => {
            setSelectedTeam(null);
            setDecisionNote("");
            setError("");
          }}
          onApprove={() => void decide(true)}
          onReject={() => void decide(false)}
        />
      )}

      {disqualifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(35,20,10,0.3)" }}>
          <Card
            className="p-6 w-full max-w-lg"
            style={{ background: "var(--surface-bg)", backdropFilter: "none", WebkitBackdropFilter: "none" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle size={22} style={{ color: COLORS.error }} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.textPrimary }}>Disqualify Team</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{disqualifyTarget.teamName}</div>
                </div>
              </div>
              <button type="button" aria-label="Close" onClick={() => setDisqualifyTarget(null)} style={{ color: COLORS.textSecondary }}>
                <X size={18} />
              </button>
            </div>
            <textarea
              value={disqualifyReason}
              onChange={event => setDisqualifyReason(event.target.value)}
              placeholder="Describe the violation reason..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl outline-none resize-none mt-5"
              style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setDisqualifyTarget(null)}>Cancel</Button>
              <Button
                variant="danger"
                size="sm"
                icon={actionTeamId === disqualifyTarget.teamId ? <Loader size={13} className="animate-spin" /> : <ShieldOff size={13} />}
                disabled={!disqualifyReason.trim() || actionTeamId === disqualifyTarget.teamId}
                onClick={() => void disqualify()}
              >
                Confirm Disqualify
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function TeamDetailDialog({
  team,
  categoryName,
  decisionNote,
  setDecisionNote,
  isActing,
  error,
  onClose,
  onApprove,
  onReject,
}: {
  team: TeamEligibilityReviewResponse;
  categoryName: string;
  decisionNote: string;
  setDecisionNote: (value: string) => void;
  isActing: boolean;
  error: string;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const status = getTeamStatusInfo(team.teamStatusId);
  const isPending = status.badge === "pending_approval";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(35,20,10,0.3)" }}>
      <Card
        className="p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        style={{ background: "var(--surface-bg)", backdropFilter: "none", WebkitBackdropFilter: "none" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.textPrimary }}>{team.teamName}</div>
              <StatusBadge status={status.badge} />
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 5 }}>
              Category: {categoryName} · Members: {team.activeMemberCount}/{team.minTeamSize}-{team.maxTeamSize}
            </div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: COLORS.textSecondary }}>
            <X size={20} />
          </button>
        </div>

        {team.issues.length > 0 && (
          <ul className="rounded-xl px-5 py-3 mt-4 list-disc" style={{ color: COLORS.error, background: `${COLORS.error}08`, fontSize: 12 }}>
            {team.issues.map(issue => <li key={issue}>{issue}</li>)}
          </ul>
        )}

        <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary, marginTop: 20, marginBottom: 10 }}>
          Team Members
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {team.members.map(member => <MemberDetailCard key={member.teamMemberId} member={member} />)}
        </div>

        {isPending && (
          <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            <textarea
              value={decisionNote}
              onChange={event => setDecisionNote(event.target.value)}
              placeholder="Approval note or required rejection reason"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
              style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}
            />
            {error && <div style={{ color: COLORS.error, fontSize: 12, marginTop: 8 }}>{error}</div>}
            <div className="flex justify-end gap-2 mt-3">
              <Button
                variant="danger"
                size="sm"
                icon={isActing ? <Loader size={13} className="animate-spin" /> : <XCircle size={13} />}
                disabled={isActing}
                onClick={onReject}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={isActing ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                disabled={isActing || !team.eligibleForCompetition}
                onClick={onApprove}
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function MemberDetailCard({ member }: { member: TeamEligibilityMemberResponse }) {
  const fields = [
    ["Full Name", member.fullName],
    ["Email", member.email],
    ["Phone", member.phone],
    ["FPT Student Code", member.fptStudentCode],
    ["External Student Code", member.externalStudentCode],
    ["University", member.universityName],
    ["User Type", member.userTypeName],
    ["Account Status", member.accountStatusName],
  ];

  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between gap-2">
        <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary }}>{member.fullName || member.email || "Member"}</div>
        <StatusBadge status={member.profileComplete ? "active" : "unverified"} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        {fields.map(([label, value]) => (
          <div key={label} className="rounded-lg px-3 py-2" style={{ background: "var(--glass-bg-hover)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textSecondary }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: 12, color: COLORS.textPrimary, marginTop: 3, wordBreak: "break-word" }}>{value || "None"}</div>
          </div>
        ))}
      </div>
      {member.issues.length > 0 && (
        <ul className="mt-3 pl-5 list-disc" style={{ color: COLORS.error, fontSize: 11 }}>
          {member.issues.map(issue => <li key={issue}>{issue}</li>)}
        </ul>
      )}
    </div>
  );
}
