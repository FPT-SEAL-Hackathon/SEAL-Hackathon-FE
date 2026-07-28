import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Search,
  Filter,
} from "lucide-react";
import { Button, Card, COLORS, StatusBadge } from "@/components/shared/UIComponents";
import {
  canOrganizerApproveTeam,
  getTeamStatusInfo,
  teamService,
  type TeamEligibilityReviewResponse,
  type TeamEligibilityMemberResponse,
  type TeamMemberDetailResponse,
  type TeamResponse,
} from "@/features/teams/api/teamService";
import type { Category } from "@/features/events/types/category";
import type { EventResponse } from "@/features/events/api/eventService";
import { useCategoryContext } from "../context/CategoryContext";
import {
  eventParticipantService,
  type EventParticipantResponse,
  type EventParticipantStatus,
} from "@/features/eventParticipants/api/eventParticipantService";
import { userService, type UserManagementUser } from "@/features/users/api/userService";

interface EventTeamsSectionProps {
  eventId: string;
  event?: EventResponse;
  //categories: Category[];
}

function activeMemberCountForTeam(
  team: TeamEligibilityReviewResponse,
  eventTeam?: TeamResponse,
) {
  const eventTeamMembers = eventTeam?.members ?? [];
  const reviewMembers = team.members ?? [];
  if (eventTeamMembers.length > 0) {
    return eventTeamMembers.filter(member => member.active !== false).length;
  }
  if (reviewMembers.length > 0) {
    return reviewMembers.filter(member => member.active !== false).length;
  }
  return team.activeMemberCount ?? 0;
}

function teamResponseToEligibilityReview(
  team: TeamResponse,
  event?: EventResponse,
): TeamEligibilityReviewResponse {
  const activeMemberCount = team.activeMemberCount ?? team.members.filter(member => member.active !== false).length;
  const minTeamSize = team.minTeamSize ?? event?.minTeamSize ?? 0;
  const maxTeamSize = team.maxTeamSize ?? event?.maxTeamSize ?? 0;
  const teamSizeEligible = !minTeamSize || activeMemberCount >= minTeamSize;
  const withinMaximumSize = !maxTeamSize || activeMemberCount <= maxTeamSize;

  return {
    teamId: team.teamId,
    eventId: team.eventId,
    categoryId: team.categoryId,
    teamName: team.teamName,
    teamStatusId: team.teamStatusId,
    teamStatusName: team.teamStatusName,
    leaderUserId: team.leaderUserId,
    minTeamSize,
    maxTeamSize,
    activeMemberCount,
    teamSizeEligible: team.teamSizeEligible ?? (teamSizeEligible && withinMaximumSize),
    membersInfoComplete: team.membersInfoComplete ?? true,
    eligibleForCompetition: team.teamSizeEligible ?? (teamSizeEligible && withinMaximumSize),
    issues: team.approvalIssues ?? [],
    canRequestApproval: team.canRequestApproval,
    approvalIssues: team.approvalIssues,
    members: team.members.map(member => ({
      teamMemberId: member.teamMemberId,
      userId: member.userId,
      fullName: member.userId,
      email: "",
      phone: "",
      fptStudentCode: "",
      externalStudentCode: "",
      universityName: "",
      userTypeName: "",
      accountStatusName: "",
      participantStatusName: labelParticipantStatus(member.participantStatusName ?? member.participantStatus),
      joinedAt: member.joinedAt,
      active: member.active,
      profileComplete: true,
      issues: [],
    })),
  };
}

function mergeReviewAndEventTeams(
  reviewTeams: TeamEligibilityReviewResponse[],
  eventTeams: TeamResponse[],
  event?: EventResponse,
) {
  const eventTeamsById = new Map(eventTeams.map(team => [team.teamId, team]));
  const mergedTeamsById = new Map<string, TeamEligibilityReviewResponse>();

  reviewTeams.forEach(team => {
    const eventTeam = eventTeamsById.get(team.teamId);
    const activeMemberCount = activeMemberCountForTeam(team, eventTeam);

    mergedTeamsById.set(team.teamId, {
      ...team,
      teamStatusId: eventTeam?.teamStatusId ?? team.teamStatusId,
      teamStatusName: eventTeam?.teamStatusName ?? team.teamStatusName,
      activeMemberCount,
      members: mergeTeamMemberParticipantStatuses(team.members, eventTeam),
    });
  });

  eventTeams.forEach(eventTeam => {
    if (mergedTeamsById.has(eventTeam.teamId)) return;
    mergedTeamsById.set(eventTeam.teamId, teamResponseToEligibilityReview(eventTeam, event));
  });

  return Array.from(mergedTeamsById.values());
}

function labelParticipantStatus(status?: EventParticipantStatus | string | null) {
  const value = String(status ?? "").trim().replace(/[-\s]+/g, "_").toUpperCase();
  if (!value) return "";
  if (value === "PENDING") return "Pending";
  if (value === "ACTIVE") return "Active";
  if (value === "REJECTED") return "Rejected";
  if (value === "SUSPENDED") return "Suspended";
  if (value === "TEMPORARY") return "Temporary";
  if (value === "UNVERIFIED") return "Unverified";
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

function sameId(left?: string | null, right?: string | null) {
  return Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase());
}

function mergeTeamMemberParticipantStatuses(
  members: TeamEligibilityMemberResponse[],
  eventTeam?: TeamResponse,
) {
  if (!eventTeam?.members?.length) return members;
  const statusByUserId = new Map(
    eventTeam.members
      .filter(member => member.userId)
      .map(member => [
        member.userId.trim().toLowerCase(),
        labelParticipantStatus(member.participantStatusName ?? member.participantStatus),
      ]),
  );

  return members.map(member => {
    const status = statusByUserId.get(member.userId.trim().toLowerCase());
    return status ? { ...member, participantStatusName: status } : member;
  });
}

async function loadOrganizerParticipantsForEvent(eventId: string, categoryId?: string) {
  const firstPage = await eventParticipantService.getOrganizerParticipants({
    eventId,
    categoryId,
    page: 0,
    size: 500,
  });
  if (firstPage.totalPages <= 1) return firstPage.content;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      eventParticipantService.getOrganizerParticipants({
        eventId,
        categoryId,
        page: index + 1,
        size: firstPage.size || 500,
      }),
    ),
  );
  return [
    ...firstPage.content,
    ...remainingPages.flatMap(page => page.content),
  ];
}

export async function getVisibleEventTeams(eventId: string, event?: EventResponse) {
  const [reviewResult, eventTeamsResult] = await Promise.allSettled([
    teamService.reviewEligibility(eventId),
    teamService.getByEvent(eventId),
  ]);
  const reviewTeams = reviewResult.status === "fulfilled" ? reviewResult.value : [];
  const eventTeams = eventTeamsResult.status === "fulfilled" ? eventTeamsResult.value : [];

  if (reviewResult.status === "rejected" && eventTeamsResult.status === "rejected") {
    throw reviewResult.reason ?? eventTeamsResult.reason;
  }

  return mergeReviewAndEventTeams(reviewTeams, eventTeams, event);
}

export function EventTeamsSummaryCard({ eventId, event, onOpen }: { eventId: string; event?: EventResponse; onOpen: () => void }) {
  const [summary, setSummary] = useState({ teams: 0, participants: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getVisibleEventTeams(eventId, event)
      .then(visibleTeams => {
        if (cancelled) return;
        setSummary({
          teams: visibleTeams.length,
          participants: visibleTeams.reduce((total, team) => total + team.activeMemberCount, 0),
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
  }, [eventId, event]);

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

export function EventTeamsSection({ eventId, event }: EventTeamsSectionProps) {
  const [teams, setTeams] = useState<TeamEligibilityReviewResponse[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamEligibilityReviewResponse | null>(null);
  const [disqualifyTarget, setDisqualifyTarget] = useState<TeamEligibilityReviewResponse | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionTeamId, setActionTeamId] = useState("");
  const [viewTeamId, setViewTeamId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { categories } = useCategoryContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredTeams = teams.filter(team => {
    const matchesSearch = !searchQuery.trim() || team.teamName?.toLowerCase().includes(searchQuery.trim().toLowerCase());
    const status = getTeamStatusInfo(team.teamStatusId, team.teamStatusName).badge;
    const matchesStatus = statusFilter === "ALL" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const enrichedTeams = await getVisibleEventTeams(eventId, event);
      const sorted = [...enrichedTeams].sort((left, right) => left.teamName.localeCompare(right.teamName));
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
  }, [eventId, event]);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const categoryName = (categoryId: string) =>
    categories.find(category => category.categoryId === categoryId)?.categoryName ?? "None";

  const toEligibilityMember = (
    member: TeamResponse["members"][number],
    detail?: TeamMemberDetailResponse | null,
  ): TeamEligibilityMemberResponse => {
    const hasProfile = Boolean(detail?.fullName?.trim() || detail?.email?.trim());
    return {
      teamMemberId: member.teamMemberId,
      userId: member.userId,
      fullName: detail?.fullName || member.userId,
      email: detail?.email || "",
      phone: detail?.phone || "",
      fptStudentCode: detail?.fptStudentCode || "",
      externalStudentCode: detail?.externalStudentCode || "",
      universityName: detail?.universityName || "",
      userTypeName: detail?.userTypeName || "",
      accountStatusName: detail?.accountStatusName || "",
      participantStatusName: labelParticipantStatus(
        detail?.participantStatusName
          ?? detail?.participantStatus
          ?? member.participantStatusName
          ?? member.participantStatus,
      ),
      joinedAt: member.joinedAt,
      active: member.active,
      profileComplete: hasProfile,
      issues: hasProfile ? [] : ["Member profile could not be loaded"],
    };
  };

  const participantBelongsToTeam = (participant: EventParticipantResponse, team: TeamEligibilityReviewResponse) => {
    if (participant.eventId && participant.eventId !== eventId) return false;
    const participantUserId = participant.studentId || participant.user?.userId;
    if (participantUserId && team.members.some(member => sameId(member.userId, participantUserId))) return true;
    if (participant.teamId) return participant.teamId === team.teamId;
    return participant.teamName?.trim().toLowerCase() === team.teamName.trim().toLowerCase();
  };

  const participantToEligibilityMember = (participant: EventParticipantResponse): TeamEligibilityMemberResponse => {
    const hasProfile = Boolean(participant.studentName?.trim() || participant.studentEmail?.trim());
    return {
      teamMemberId: participant.eventParticipantId || participant.studentId,
      userId: participant.studentId,
      fullName: participant.studentName || participant.studentEmail || participant.studentId,
      email: participant.studentEmail || "",
      phone: "",
      fptStudentCode: participant.fptStudentCode || "",
      externalStudentCode: participant.externalStudentCode || "",
      universityName: participant.universityName || "",
      userTypeName: "FPT Student",
      accountStatusName: "",
      participantStatusName: labelParticipantStatus(participant.participantStatus),
      joinedAt: participant.appliedAt || participant.approvedAt || "",
      active: true,
      profileComplete: hasProfile,
      issues: hasProfile ? [] : ["Member profile could not be loaded"],
    };
  };

  const userToEligibilityMember = (user: UserManagementUser): TeamEligibilityMemberResponse => {
    const hasProfile = Boolean(user.fullName?.trim() || user.email?.trim());
    return {
      teamMemberId: user.userId,
      userId: user.userId,
      fullName: user.fullName || user.email || user.userId,
      email: user.email || "",
      phone: user.phone || "",
      fptStudentCode: user.fptStudentCode || "",
      externalStudentCode: user.externalStudentCode || "",
      universityName: user.universityName || "",
      userTypeName: user.roleName || user.role || "",
      accountStatusName: user.accountStatusName || user.accountStatus || "",
      joinedAt: user.createdAt || "",
      active: user.accountStatus !== "REJECTED",
      profileComplete: hasProfile,
      issues: hasProfile ? [] : ["Member profile could not be loaded"],
    };
  };

  const mergeLatestTeamMembers = async (team: TeamEligibilityReviewResponse) => {
    const [latestTeam, eventTeams, participantPage, usersPage] = await Promise.all([
      teamService.getById(team.teamId),
      teamService.getByEvent(eventId).catch(() => [] as TeamResponse[]),
      loadOrganizerParticipantsForEvent(eventId, team.categoryId).catch(() => [] as EventParticipantResponse[]),
      userService.getUsers({
        teamName: team.teamName,
        size: 500,
      }).catch(() => null),
    ]);
    const eventTeam = eventTeams.find(item => item.teamId === team.teamId);
    const sourceMembers = [
      ...latestTeam.members,
      ...(eventTeam?.members ?? []),
    ];
    const sourceMembersByUserId = new Map<string, TeamResponse["members"][number]>();
    sourceMembers.forEach(member => {
      if (member.userId) sourceMembersByUserId.set(member.userId, member);
    });

    const mergedMembers = new Map<string, TeamEligibilityMemberResponse>();
    team.members.forEach(member => {
      if (member.userId) mergedMembers.set(member.userId, member);
    });

    const participants = participantPage
      .filter(participant => participantBelongsToTeam(participant, team))
      .filter(participant => participant.studentId) ?? [];
    participants.forEach(participant => {
      const existingMember = mergedMembers.get(participant.studentId);
      if (existingMember) {
        mergedMembers.set(participant.studentId, {
          ...existingMember,
          participantStatusName: existingMember.participantStatusName || labelParticipantStatus(participant.participantStatus),
        });
      } else {
        mergedMembers.set(participant.studentId, participantToEligibilityMember(participant));
      }
    });

    const teamUsers = usersPage?.content
      .filter(user => user.userId)
      .filter(user => user.teamId === team.teamId || user.teamName?.trim().toLowerCase() === team.teamName.trim().toLowerCase()) ?? [];
    teamUsers.forEach(user => {
      if (!mergedMembers.has(user.userId)) {
        mergedMembers.set(user.userId, userToEligibilityMember(user));
      }
    });

    const fetchedMembers = await Promise.all(
      Array.from(sourceMembersByUserId.values()).map(async member => {
        const detail = await teamService.getMemberDetail(latestTeam.teamId, member.userId)
          .catch(() => userService.getUserById(member.userId)
            .then(userProfile => ({
              teamMemberId: member.teamMemberId,
              teamId: latestTeam.teamId,
              userId: userProfile.userId,
              fullName: userProfile.fullName,
              email: userProfile.email,
              phone: userProfile.phone ?? "",
              fptStudentCode: userProfile.fptStudentCode ?? "",
              externalStudentCode: userProfile.externalStudentCode ?? "",
              universityName: userProfile.universityName ?? "",
              userTypeName: userProfile.roleName ?? userProfile.role,
              accountStatusName: userProfile.accountStatusName ?? userProfile.accountStatus,
              participantStatus: undefined,
              participantStatusName: undefined,
              joinedAt: member.joinedAt,
              active: member.active,
            }))
            .catch(() => null));
        return toEligibilityMember(member, detail);
      }),
    );

    fetchedMembers.forEach(member => {
      if (!member.userId) return;
      const existingMember = mergedMembers.get(member.userId);
      mergedMembers.set(member.userId, {
        ...existingMember,
        ...member,
        participantStatusName: member.participantStatusName || existingMember?.participantStatusName,
      });
    });

    const activeMemberCount = latestTeam.activeMemberCount ?? Array.from(mergedMembers.values())
      .filter(member => member.active).length;
    const teamSizeEligible = latestTeam.teamSizeEligible ?? (
      activeMemberCount >= team.minTeamSize && activeMemberCount <= team.maxTeamSize
    );
    const membersInfoComplete = latestTeam.membersInfoComplete ?? team.membersInfoComplete;
    const issues = latestTeam.approvalIssues?.length
      ? latestTeam.approvalIssues
      : teamSizeEligible
      ? team.issues.filter(issue => !issue.toLowerCase().includes("fewer active members"))
      : team.issues;
    const mergedTeam = {
      ...team,
      teamStatusId: eventTeam?.teamStatusId ?? latestTeam.teamStatusId,
      teamStatusName: eventTeam?.teamStatusName ?? latestTeam.teamStatusName ?? team.teamStatusName,
      activeMemberCount,
      teamSizeEligible,
      membersInfoComplete,
      eligibleForCompetition: latestTeam.teamSizeEligible ?? (teamSizeEligible && membersInfoComplete),
      canRequestApproval: latestTeam.canRequestApproval,
      approvalIssues: latestTeam.approvalIssues,
      issues,
      members: Array.from(mergedMembers.values()),
    };

    setTeams(prev => prev.map(item => item.teamId === team.teamId ? mergedTeam : item));
    return mergedTeam;
  };

  const openTeamDetail = async (team: TeamEligibilityReviewResponse) => {
    setError("");
    setDecisionNote("");
    setSelectedTeam(team);
    setViewTeamId(team.teamId);
    try {
      const mergedTeam = await mergeLatestTeamMembers(team);
      setSelectedTeam(mergedTeam);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load latest team members.");
    } finally {
      setViewTeamId("");
    }
  };

  const decide = async (approved: boolean) => {
    if (!selectedTeam) return;
    if (getTeamStatusInfo(selectedTeam.teamStatusId, selectedTeam.teamStatusName).badge !== "pending_approval") {
      setError("Only Pending teams can be approved or rejected.");
      return;
    }
    if (approved && !canOrganizerApproveTeam(selectedTeam)) {
      setError("Resolve the approval issues before approving this team.");
      return;
    }
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
              {teams.length} team(s) found for this event
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

        {teams.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search team by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl outline-none"
                style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <div className="relative min-w-[160px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Select value={statusFilter || "none"} onValueChange={(value) => setStatusFilter((value === "none" ? "" : value))} >
  <SelectTrigger className="w-full pl-10 pr-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="ALL" style={{ color: COLORS.textPrimary }}>All Statuses</SelectItem>
                <SelectItem value="pending_approval" style={{ color: COLORS.textPrimary }}>Pending</SelectItem>
                <SelectItem value="active" style={{ color: COLORS.textPrimary }}>Approved (Active)</SelectItem>
                <SelectItem value="rejected" style={{ color: COLORS.textPrimary }}>Rejected</SelectItem>
                <SelectItem value="suspended" style={{ color: COLORS.textPrimary }}>Disqualified</SelectItem>
                <SelectItem value="default" style={{ color: COLORS.textPrimary }}>Forming</SelectItem>
  </SelectContent>
</Select>
            </div>
          </div>
        )}

        {!loading && filteredTeams.length === 0 && (
          <div className="rounded-xl p-6 text-center" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary }}>
            <Users size={28} className="mx-auto mb-2" />
            {teams.length === 0 ? "No teams found for this event." : "No teams match your search or filter."}
          </div>
        )}

        <div className="space-y-2">
          {filteredTeams.map(team => {
            const status = getTeamStatusInfo(team.teamStatusId, team.teamStatusName);
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
                  icon={viewTeamId === team.teamId ? <Loader size={13} className="animate-spin" /> : <Eye size={13} />}
                  disabled={viewTeamId === team.teamId}
                  onClick={() => void openTeamDetail(team)}
                >
                  {viewTeamId === team.teamId ? "Loading..." : "View"}
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
  const status = getTeamStatusInfo(team.teamStatusId, team.teamStatusName);
  const isPending = status.badge === "pending_approval";
  const shouldShowApprovalIssues = status.badge === "forming" || isPending;
  const canApprove = canOrganizerApproveTeam(team);
  const issues = team.approvalIssues?.length ? team.approvalIssues : team.issues;

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

        {shouldShowApprovalIssues && issues.length > 0 && (
          <ul className="rounded-xl px-5 py-3 mt-4 list-disc" style={{ color: COLORS.error, background: `${COLORS.error}08`, fontSize: 12 }}>
            {issues.map(issue => <li key={issue}>{issue}</li>)}
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
                disabled={isActing || !canApprove}
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
  const fields: Array<[string, string | undefined]> = [
    ["Full Name", member.fullName],
    ["Email", member.email],
    ["Phone", member.phone],
    ["FPT Student Code", member.fptStudentCode],
    ["External Student Code", member.externalStudentCode],
    ["University", member.universityName],
    ["User Type", member.userTypeName],
    ["Account Status", member.accountStatusName],
    ["Participant Status", member.participantStatusName],
  ];

  return (
    <div className="rounded-xl p-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between gap-2">
        <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary }}>{member.fullName || member.email || "Member"}</div>
        <StatusBadge status={(member.participantStatusName || (member.profileComplete ? "active" : "unverified")).toLowerCase()} />
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
