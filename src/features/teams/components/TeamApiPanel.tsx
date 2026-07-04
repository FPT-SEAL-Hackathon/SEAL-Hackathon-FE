import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Eye,
  Loader,
  LogOut,
  PlusCircle,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { useAuth } from "@/features/auth/store/authStore";
import { Button, Card, COLORS, DataTable, StatusBadge } from "@/components/shared/UIComponents";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { eventParticipantService } from "@/features/eventParticipants/api/eventParticipantService";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import {
  teamService,
  type JoinTeamRequestResponse,
  type TeamMemberDetailResponse,
  type TeamMemberResponse,
  type TeamResponse,
} from "@/features/teams/api/teamService";

type ActionKey =
  | "create"
  | "getById"
  | "getByEvent"
  | "join"
  | "requests"
  | "approve"
  | "reject"
  | "memberDetail"
  | "remove"
  | "events"
  | "categories"
  | "discover";

type RoleMode = "auto" | "member" | "leader";
type TeamFlow = "create" | "join" | null;
type LeaderActionPanel = "memberDetail" | "removeMember" | "joinRequests" | null;

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={event => onChange(event.target.value)}
        className="w-full px-3 py-2.5 rounded-xl outline-none"
        style={{
          fontSize: 14,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bg,
          color: COLORS.textPrimary,
        }}
      />
    </label>
  );
}

function InlineMessage({ message, tone }: { message: string; tone: "success" | "error" | "info" }) {
  const color = tone === "success" ? COLORS.success : tone === "error" ? COLORS.error : COLORS.textSecondary;
  return (
    <div className="px-3 py-2 rounded-xl" style={{ background: `${color}10`, color, fontSize: 13, border: `1px solid ${color}25` }}>
      {message}
    </div>
  );
}

function formatError(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function memberRows(members: TeamMemberResponse[]) {
  return members.map(member => ({
    teamMemberId: member.teamMemberId,
    userId: member.userId,
    active: member.active ? "Active" : "Inactive",
    joinedAt: member.joinedAt ? new Date(member.joinedAt).toLocaleString() : "-",
  }));
}

const ACTIVE_TEAM_STORAGE_KEY = "seal_active_team";

function saveActiveTeam(team: TeamResponse, currentUserId?: string) {
  try {
    localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, JSON.stringify({
      teamId: team.teamId,
      eventId: team.eventId,
      categoryId: team.categoryId,
      teamName: team.teamName,
      leaderUserId: team.leaderUserId,
      userId: currentUserId,
      memberUserIds: team.members.map(member => member.userId),
    }));
  } catch {
    // Ignore storage failures; the team can still be used in this view.
  }
}

function userBelongsToTeam(team: TeamResponse, currentUserId?: string) {
  if (!currentUserId) return false;
  return team.members.some(member => member.userId === currentUserId && member.active);
}

function displayValue(value?: string | null) {
  return value && value.trim() ? value : "-";
}

function visibleMemberDetailRows(detail: TeamMemberDetailResponse) {
  const fptStudentCode = detail.fptStudentCode?.trim();
  const externalStudentCode = detail.externalStudentCode?.trim();

  return [
    { label: "Full Name", value: displayValue(detail.fullName) },
    { label: "Email", value: displayValue(detail.email) },
    { label: "Phone", value: displayValue(detail.phone) },
    { label: "FPT Student Code", value: externalStudentCode ? "None" : fptStudentCode || "None" },
    { label: "External Student Code", value: fptStudentCode ? "None" : externalStudentCode || "None" },
    { label: "University", value: displayValue(detail.universityName) },
    { label: "User Type", value: displayValue(detail.userTypeName) },
    { label: "Account Status", value: displayValue(detail.accountStatusName) },
    { label: "Joined At", value: detail.joinedAt ? new Date(detail.joinedAt).toLocaleString() : "-" },
    { label: "Active", value: detail.active ? "Yes" : "No" },
  ];
}

function getStoredActiveTeam(currentUserId?: string): { teamId: string } | null {
  try {
    const raw = localStorage.getItem(ACTIVE_TEAM_STORAGE_KEY);
    if (!raw) return null;
    const team = JSON.parse(raw) as {
      teamId?: string;
      leaderUserId?: string;
      userId?: string;
      memberUserIds?: string[];
    };
    const belongsToUser = !currentUserId
      || team.userId === currentUserId
      || team.memberUserIds?.includes(currentUserId);
    return team.teamId && belongsToUser ? { teamId: team.teamId } : null;
  } catch {
    return null;
  }
}

export function TeamApiPanel({
  initialEventId = "",
  initialTeamId = "",
  mode = "auto",
  onTeamLeft,
}: {
  initialEventId?: string;
  initialTeamId?: string;
  mode?: RoleMode;
  onTeamLeft?: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    eventId: initialEventId,
    categoryId: "",
    teamId: initialTeamId,
    teamName: "",
    requestId: "",
    responseNote: "",
    memberUserId: user?.userId ?? "",
  });
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);
  const [teamFlow, setTeamFlow] = useState<TeamFlow>(null);
  const [teamDiscoveryDone, setTeamDiscoveryDone] = useState(false);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<EventResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [requests, setRequests] = useState<JoinTeamRequestResponse[]>([]);
  const [memberDetails, setMemberDetails] = useState<Record<string, TeamMemberDetailResponse>>({});
  const [loading, setLoading] = useState<Partial<Record<ActionKey, boolean>>>({});
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [leaderActionPanel, setLeaderActionPanel] = useState<LeaderActionPanel>(null);
  const [removeMemberName, setRemoveMemberName] = useState("");
  const [joinTeamName, setJoinTeamName] = useState("");
  const [joinCategoryId, setJoinCategoryId] = useState("");
  const [joinRequestsLoaded, setJoinRequestsLoaded] = useState(false);

  const setField = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const isLeader = useMemo(() => {
    if (mode === "leader") return true;
    if (mode === "member") return false;
    return !!selectedTeam && !!user?.userId && selectedTeam.leaderUserId === user.userId;
  }, [mode, selectedTeam, user?.userId]);

  const canUseTeam = form.teamId.trim().length > 0;
  const canUseEvent = form.eventId.trim().length > 0;
  const canUseApprovedEvent = approvedEvents.some(event => event.eventId === form.eventId.trim());
  const canCreate = approvedEvents.some(event => event.eventId === form.eventId.trim())
    && form.categoryId.trim().length > 0
    && form.teamName.trim().length > 0;
  const joinTeams = useMemo(
    () => joinCategoryId ? teams.filter((team: any) => team.categoryId === joinCategoryId) : teams,
    [joinCategoryId, teams],
  );

  useEffect(() => {
    run(
      "events",
      async () => {
        const [allEvents, participations] = await Promise.all([
          eventService.getAll(true),
          eventParticipantService.getMyParticipations(),
        ]);
        const approvedEventIds = new Set(
          participations
            .filter(participation => participation.participantStatus === "ACTIVE")
            .map(participation => participation.eventId),
        );
        return {
          allEvents,
          approved: allEvents.filter(event => approvedEventIds.has(event.eventId)),
        };
      },
      ({ allEvents, approved }) => {
        setEvents(allEvents);
        setApprovedEvents(approved);
        if (approved[0] && !form.eventId) setField("eventId", approved[0].eventId);
      },
      "Approved event registrations loaded.",
    );
    // Load once when the team panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user?.userId || selectedTeam || teamDiscoveryDone) return;
    const storedTeam = getStoredActiveTeam(user.userId);
    if (storedTeam?.teamId) {
      let cancelled = false;
      setLoading(prev => ({ ...prev, discover: true }));
      teamService.getById(storedTeam.teamId)
        .then((team: any) => {
          if (cancelled) return;
          if (!userBelongsToTeam(team, user.userId)) {
            localStorage.removeItem(ACTIVE_TEAM_STORAGE_KEY);
            setField("teamId", "");
            return;
          }
          setSelectedTeam(team);
          saveActiveTeam(team, user.userId);
          setField("teamId", team.teamId);
          setField("eventId", team.eventId);
          setField("categoryId", team.categoryId);
        })
        .catch(() => {
          try {
            localStorage.removeItem(ACTIVE_TEAM_STORAGE_KEY);
          } catch {
            // Ignore storage failures.
          }
        })
        .finally(() => {
          if (!cancelled) {
            setTeamDiscoveryDone(true);
            setLoading(prev => ({ ...prev, discover: false }));
          }
        });
      return () => {
        cancelled = true;
      };
    }
    if (events.length === 0) return;

    let cancelled = false;
    setLoading(prev => ({ ...prev, discover: true }));
    Promise.all(events.map(event => teamService.getByEvent(event.eventId).catch(() => [] as TeamResponse[])))
      .then(results => {
        if (cancelled) return;
        const team = results.flat().find(item => userBelongsToTeam(item, user.userId));
        if (team) {
          setSelectedTeam(team);
          saveActiveTeam(team, user.userId);
          setField("teamId", team.teamId);
          setField("eventId", team.eventId);
          setField("categoryId", team.categoryId);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTeamDiscoveryDone(true);
          setLoading(prev => ({ ...prev, discover: false }));
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, selectedTeam, teamDiscoveryDone, user?.userId]);

  useEffect(() => {
    if (!form.eventId) {
      setCategories([]);
      return;
    }
    run(
      "categories",
      () => categoryService.getByEvent(form.eventId),
      data => {
        setCategories(data);
        if (data[0] && !data.some((category: any) => category.categoryId === form.categoryId)) {
          setField("categoryId", data[0].categoryId);
        }
      },
      "Categories loaded.",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.eventId]);

  useEffect(() => {
    if (!selectedTeam) {
      setMemberDetails({});
      return;
    }

    let cancelled = false;
    Promise.all(
      selectedTeam.members.map(member =>
        teamService.getMemberDetail(selectedTeam.teamId, member.userId)
          .then(detail => [member.userId, detail] as const)
          .catch(() => null)
      )
    ).then(results => {
      if (cancelled) return;
      const nextDetails: Record<string, TeamMemberDetailResponse> = {};
      results.forEach(result => {
        if (result) nextDetails[result[0]] = result[1];
      });
      setMemberDetails(nextDetails);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedTeam]);

  async function run<T>(key: ActionKey, caller: () => Promise<T>, onSuccess?: (data: T) => void, successText = "Done.") {
    setLoading(prev => ({ ...prev, [key]: true }));
    setMessage(null);
    try {
      const data = await caller();
      onSuccess?.(data);
      setMessage({ tone: "success", text: successText });
    } catch (error) {
      setMessage({ tone: "error", text: formatError(error) });
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }

  const loadTeam = (teamId = form.teamId.trim()) => {
    if (!teamId) return;
    run(
      "getById",
      () => teamService.getById(teamId),
      (team: any) => {
        setSelectedTeam(team);
        if (userBelongsToTeam(team, user?.userId)) {
          saveActiveTeam(team, user?.userId);
        }
        setField("teamId", team.teamId);
        setField("eventId", team.eventId);
        setField("categoryId", team.categoryId);
      },
      "Team loaded.",
    );
  };

  const loadTeamsByEvent = () => {
    run(
      "getByEvent",
      () => teamService.getByEvent(form.eventId.trim()),
      data => {
        setTeams(data);
      },
      "Teams loaded.",
    );
  };

  const loadRequests = (teamId = form.teamId.trim()) => {
    if (!teamId) return;
    run(
      "requests",
      () => teamService.getPendingRequests(teamId),
      data => {
        setRequests(data);
        setJoinRequestsLoaded(true);
      },
      "Join requests loaded.",
    );
  };

  const createTeam = () => {
    run(
      "create",
      () => teamService.create({
        eventId: form.eventId.trim(),
        categoryId: form.categoryId.trim(),
        teamName: form.teamName.trim(),
      }),
      (team: any) => {
        setSelectedTeam(team);
        saveActiveTeam(team, user?.userId);
        setTeams(prev => [team, ...prev.filter(item => item.teamId !== team.teamId)]);
        setField("teamId", team.teamId);
      },
      "Team created.",
    );
  };

  const requestJoin = (teamId = form.teamId.trim()) => {
    if (!teamId) return;
    setField("teamId", teamId);
    run("join", () => teamService.requestJoin(teamId), undefined, "Join request sent.");
  };

  const requestJoinByName = () => {
    const normalizedName = joinTeamName.trim().toLowerCase();
    const team = joinTeams.find(item => item.teamName.trim().toLowerCase() === normalizedName);

    if (!team) {
      setMessage({ tone: "error", text: "No team with that name was found in the selected event." });
      return;
    }

    requestJoin(team.teamId);
  };

  const decideRequest = (requestId: string, action: "APPROVED" | "REJECTED") => {
    run(
      action === "APPROVED" ? "approve" : "reject",
      () => teamService.handleJoinRequest(requestId, action, form.responseNote.trim() || undefined),
      updated => setRequests(prev => prev.filter(request => request.requestId !== updated.requestId)),
      action === "APPROVED" ? "Request approved." : "Request rejected.",
    );
  };

  const removeMember = (userId = form.memberUserId.trim()) => {
    if (!form.teamId.trim() || !userId) return;
    const removingCurrentUser = userId === user?.userId;
    run(
      "remove",
      async () => {
        await teamService.removeMember(form.teamId.trim(), userId);
        return true;
      },
      () => {
        if (removingCurrentUser) {
          try {
            localStorage.removeItem(ACTIVE_TEAM_STORAGE_KEY);
          } catch {
            // Ignore storage failures.
          }
          setSelectedTeam(null);
          setTeamDiscoveryDone(true);
          setTeams([]);
          setMemberDetails({});
          setField("teamId", "");
          onTeamLeft?.();
          return;
        }
        setSelectedTeam(prev => prev ? { ...prev, members: prev.members.filter(member => member.userId !== userId) } : prev);
      },
      removingCurrentUser ? "You left the team." : "Member removed.",
    );
  };

  const leaveTeam = () => {
    if (!selectedTeam || !user?.userId) return;
    removeMember(user.userId);
  };

  const getMemberDetail = () => {
    run(
      "memberDetail",
      () => teamService.getMemberDetail(form.teamId.trim(), form.memberUserId.trim()),
      detail => setMemberDetails(prev => ({ ...prev, [detail.userId]: detail })),
      "Member detail loaded.",
    );
  };

  const removeMemberByName = (team: TeamResponse) => {
    const query = removeMemberName.trim().toLowerCase();
    if (!query) {
      setMessage({ tone: "error", text: "Enter the member name or email before removing." });
      return;
    }

    const target = team.members.find(member => {
      const detail = memberDetails[member.userId];
      const name = detail?.fullName?.toLowerCase() ?? "";
      const email = detail?.email?.toLowerCase() ?? "";
      return name === query || email === query;
    });

    if (!target) {
      setMessage({ tone: "error", text: "No team member matches that name or email." });
      return;
    }
    if (target.userId === user?.userId || target.userId === team.leaderUserId) {
      setMessage({ tone: "error", text: "The team leader cannot be removed from the team." });
      return;
    }

    removeMember(target.userId);
    setRemoveMemberName("");
  };

  if (!selectedTeam && mode !== "leader" && (!teamDiscoveryDone || loading.discover || loading.events)) {
    return (
      <Card className="p-8">
        <div className="flex items-center gap-3" style={{ color: COLORS.textSecondary }}>
          <Loader size={18} className="animate-spin" />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Checking your team...</span>
        </div>
      </Card>
    );
  }

  if (!selectedTeam && mode !== "leader") {
    return (
      <div className="space-y-5">
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 44, height: 44, background: `${COLORS.primary}12`, color: COLORS.primary }}
                >
                  <Users size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.textPrimary }}>You are not on a team yet</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
                    Create a new team or send a request to join an existing team before submitting work.
                  </div>
                </div>
              </div>
            </div>
            {message && <InlineMessage tone={message.tone} message={message.text} />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <button
              type="button"
              onClick={() => {
                const openingCreateFlow = teamFlow !== "create";
                setTeamFlow(openingCreateFlow ? "create" : null);
                if (openingCreateFlow && !approvedEvents.some(event => event.eventId === form.eventId)) {
                  setField("eventId", approvedEvents[0]?.eventId ?? "");
                }
              }}
              className="text-left rounded-2xl p-5 transition-all"
              style={{
                border: `1px solid ${teamFlow === "create" ? COLORS.primary : COLORS.border}`,
                background: teamFlow === "create" ? `${COLORS.primary}10` : COLORS.bg,
              }}
            >
              <div className="flex items-center gap-3">
                <PlusCircle size={22} style={{ color: COLORS.primary }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.textPrimary }}>Create Team</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>Start a team as the leader.</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                const openingJoinFlow = teamFlow !== "join";
                setTeamFlow(openingJoinFlow ? "join" : null);
                if (openingJoinFlow && !approvedEvents.some(event => event.eventId === form.eventId)) {
                  setField("eventId", approvedEvents[0]?.eventId ?? "");
                }
              }}
              className="text-left rounded-2xl p-5 transition-all"
              style={{
                border: `1px solid ${teamFlow === "join" ? COLORS.primary : COLORS.border}`,
                background: teamFlow === "join" ? `${COLORS.primary}10` : COLORS.bg,
              }}
            >
              <div className="flex items-center gap-3">
                <UserPlus size={22} style={{ color: COLORS.primary }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.textPrimary }}>Join Team</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>Request to join an existing team.</div>
                </div>
              </div>
            </button>
          </div>
        </Card>

        {teamFlow === "create" && (
          <Card className="p-5">
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary, marginBottom: 16 }}>Create Team</div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <label className="block">
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</span>
                <select
                  value={form.eventId}
                  onChange={event => setField("eventId", event.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                >
                  {loading.events && <option value="">Loading approved events...</option>}
                  {!loading.events && approvedEvents.length === 0 && (
                    <option value="">No approved event registrations</option>
                  )}
                  {approvedEvents.map(event => (
                    <option key={event.eventId} value={event.eventId}>{event.eventName}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</span>
                <select
                  value={form.categoryId}
                  onChange={event => setField("categoryId", event.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                >
                  {categories.length === 0 && <option value="">No categories found</option>}
                  {categories.map((category: any) => (
                    <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                  ))}
                </select>
              </label>
              <Field label="TEAM NAME" value={form.teamName} onChange={value => setField("teamName", value)} placeholder="Enter team name" />
            </div>
            <div className="mt-5">
              {!loading.events && approvedEvents.length === 0 && (
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 }}>
                  Register for an event and wait for organizer approval before creating a team.
                </div>
              )}
              <Button
                variant="primary"
                size="md"
                icon={loading.create ? <Loader size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                disabled={!canCreate || loading.create}
                onClick={createTeam}
              >
                {loading.create ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </Card>
        )}

        {teamFlow === "join" && (
          <Card className="p-5">
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary, marginBottom: 16 }}>Join Team</div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              <label className="block">
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</span>
                <select
                  value={form.eventId}
                  onChange={event => {
                    setField("eventId", event.target.value);
                    setJoinCategoryId("");
                    setJoinTeamName("");
                    setTeams([]);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                >
                  {loading.events && <option value="">Loading approved events...</option>}
                  {!loading.events && approvedEvents.length === 0 && (
                    <option value="">No approved event registrations</option>
                  )}
                  {approvedEvents.map(event => (
                    <option key={event.eventId} value={event.eventId}>{event.eventName}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</span>
                <select
                  value={joinCategoryId}
                  onChange={event => {
                    setJoinCategoryId(event.target.value);
                    setJoinTeamName("");
                  }}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                >
                  <option value="">All categories</option>
                  {categories.map((category: any) => (
                    <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                  ))}
                </select>
              </label>
              <Button
                variant="outline"
                size="md"
                icon={loading.getByEvent ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
                disabled={!canUseApprovedEvent || loading.getByEvent}
                onClick={loadTeamsByEvent}
              >
                {loading.getByEvent ? "Loading..." : "Load Teams"}
              </Button>
            </div>
            {!loading.events && approvedEvents.length === 0 && (
              <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 12 }}>
                Register for an event and wait for organizer approval before joining a team.
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end mt-4">
              <Field label="TEAM NAME" value={joinTeamName} onChange={setJoinTeamName} placeholder="Enter team name" />
              <Button
                variant="primary"
                size="md"
                icon={loading.join ? <Loader size={14} className="animate-spin" /> : <UserPlus size={14} />}
                disabled={!joinTeamName.trim() || joinTeams.length === 0 || loading.join}
                onClick={requestJoinByName}
              >
                {loading.join ? "Sending..." : "Request Join"}
              </Button>
            </div>
          </Card>
        )}

        {teamFlow === "join" && teams.length > 0 && (
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Teams In Event</div>
            <DataTable
              columns={[
                { key: "teamName", label: "Team" },
                { key: "categoryName", label: "Category" },
                { key: "memberCount", label: "Members" },
                {
                  key: "action",
                  label: "Action",
                  render: (_value, row) => (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={loading.join ? <Loader size={13} className="animate-spin" /> : <UserPlus size={13} />}
                      disabled={loading.join}
                      onClick={() => requestJoin(row.teamId)}
                    >
                      Request Join
                    </Button>
                  ),
                },
              ]}
              data={joinTeams.map((team: any) => ({
                teamName: team.teamName,
                categoryName: categories.find((category: any) => category.categoryId === team.categoryId)?.categoryName || "-",
                memberCount: team.members.length,
                teamId: team.teamId,
                action: team.teamId,
              }))}
            />
          </Card>
        )}
      </div>
    );
  }

  if (selectedTeam) {
    const leaderDetail = memberDetails[selectedTeam.leaderUserId];
    const leaderLabel = leaderDetail?.fullName || leaderDetail?.email || "Team leader";
    const memberTableRows = selectedTeam.members.map(member => {
      const detail = memberDetails[member.userId];
      return {
        userId: member.userId,
        member: detail?.fullName || detail?.email || "Member",
        email: detail?.email || "-",
        active: member.active ? "Active" : "Inactive",
        joinedAt: member.joinedAt ? new Date(member.joinedAt).toLocaleString() : "-",
      };
    });
    const renderLeaderActionPanel = () => {
      if (leaderActionPanel === "memberDetail") {
        return (
          <div className="mt-5 rounded-xl p-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary, marginBottom: 12 }}>Member Details</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {selectedTeam.members.map(member => {
                const detail = memberDetails[member.userId];
                const detailRows = detail ? visibleMemberDetailRows(detail) : [
                  { label: "Joined At", value: member.joinedAt ? new Date(member.joinedAt).toLocaleString() : "-" },
                  { label: "Active", value: member.active ? "Yes" : "No" },
                ];
                return (
                  <div key={member.userId} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.45)", border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.textPrimary }}>
                      {detail?.fullName || detail?.email || "Member"}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                      {detailRows.map(row => (
                        <div key={row.label} className="rounded-lg px-3 py-2" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textSecondary }}>{row.label.toUpperCase()}</div>
                          <div style={{ fontSize: 12, color: COLORS.textPrimary, marginTop: 3, wordBreak: "break-word" }}>
                            {row.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3"><StatusBadge status={member.active ? "active" : "pending"} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      if (leaderActionPanel === "removeMember") {
        return (
          <div className="mt-5 rounded-xl p-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary, marginBottom: 8 }}>Remove Member</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 }}>
              Enter the exact member name or email to remove them from this team.
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
              <Field label="MEMBER NAME OR EMAIL" value={removeMemberName} onChange={setRemoveMemberName} placeholder="Enter member name or email" />
              <Button
                variant="danger"
                size="md"
                icon={loading.remove ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                disabled={!removeMemberName.trim() || loading.remove}
                onClick={() => removeMemberByName(selectedTeam)}
              >
                {loading.remove ? "Removing..." : "Remove Member"}
              </Button>
            </div>
          </div>
        );
      }

      if (leaderActionPanel === "joinRequests") {
        return (
          <div className="mt-5 rounded-xl p-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary, marginBottom: 12 }}>Join Requests</div>
            {joinRequestsLoaded && requests.length === 0 && (
              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.45)", border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 13 }}>
                There are no join requests waiting for review.
              </div>
            )}
            {requests.length > 0 && <div className="space-y-3">
              {requests.map(request => (
                <div
                  key={request.requestId}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.45)", border: `1px solid ${COLORS.border}` }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                      {request.fullName}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
                      University: {request.universityName}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
                      {request.requestStatus} - {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : "-"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={loading.approve ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                      disabled={loading.approve || loading.reject}
                      onClick={() => decideRequest(request.requestId, "APPROVED")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={loading.reject ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      disabled={loading.approve || loading.reject}
                      onClick={() => decideRequest(request.requestId, "REJECTED")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>}
            <div className="mt-4">
              <Field label="RESPONSE NOTE" value={form.responseNote} onChange={value => setField("responseNote", value)} placeholder="Optional note for join request" />
            </div>
          </div>
        );
      }

      return null;
    };

    return (
      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users size={18} style={{ color: COLORS.primary }} />
                <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.textPrimary }}>My Team</div>
                <StatusBadge status="active" />
              </div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 5 }}>
                {selectedTeam.teamName} - {selectedTeam.members.length} member(s)
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {message && <InlineMessage tone={message.tone} message={message.text} />}
              {user?.userId && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={loading.remove ? <Loader size={13} className="animate-spin" /> : <LogOut size={13} />}
                  disabled={loading.remove}
                  onClick={leaveTeam}
                >
                  {loading.remove ? "Leaving..." : "Leave Team"}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
            {[
              { label: "Team Name", value: selectedTeam.teamName },
              { label: "Leader", value: leaderLabel },
              { label: "Members", value: String(selectedTeam.members.length) },
              { label: "Status", value: "Active" },
            ].map(item => (
              <div key={item.label} className="rounded-xl px-4 py-3" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 5 }}>{item.label.toUpperCase()}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary }}>{selectedTeam.teamName}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
                Leader: {leaderLabel}
              </div>
            </div>
            <StatusBadge status="active" />
          </div>
          <DataTable
            columns={[
              { key: "member", label: "Member" },
              { key: "email", label: "Email" },
              { key: "active", label: "Status" },
              { key: "joinedAt", label: "Joined" },
            ]}
            data={memberTableRows}
          />
        </Card>

        {isLeader && (
          <Card className="p-5">
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary, marginBottom: 12 }}>Leader Actions</div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                icon={<Eye size={14} />}
                onClick={() => setLeaderActionPanel(current => current === "memberDetail" ? null : "memberDetail")}
              >
                Member Detail
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={14} />}
                onClick={() => setLeaderActionPanel(current => current === "removeMember" ? null : "removeMember")}
              >
                Remove Member
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={loading.requests ? <Loader size={14} className="animate-spin" /> : <UserCheck size={14} />}
                disabled={loading.requests}
                onClick={() => {
                  setLeaderActionPanel("joinRequests");
                  loadRequests(selectedTeam.teamId);
                }}
              >
                {loading.requests ? "Loading..." : "Load Join Requests"}
              </Button>
            </div>
            {renderLeaderActionPanel()}
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users size={18} style={{ color: COLORS.primary }} />
              <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary }}>
                {isLeader ? "Team Management" : "My Team"}
              </div>
              <StatusBadge status={isLeader ? "active" : "pending"} />
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 5 }}>
              Load an event or team to begin.
            </div>
          </div>
          {message && <InlineMessage tone={message.tone} message={message.text} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
          <Field label="EVENT ID" value={form.eventId} onChange={value => setField("eventId", value)} placeholder="Event UUID" />
          <Field label="TEAM ID" value={form.teamId} onChange={value => setField("teamId", value)} placeholder="Team UUID" />
          <Field label="CATEGORY ID" value={form.categoryId} onChange={value => setField("categoryId", value)} placeholder="Category UUID" />
          <Field label="MEMBER USER ID" value={form.memberUserId} onChange={value => setField("memberUserId", value)} placeholder="User UUID" />
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <Button
            variant="outline"
            size="sm"
            icon={loading.getByEvent ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
            disabled={!canUseEvent || loading.getByEvent}
            onClick={loadTeamsByEvent}
          >
            Load Event Teams
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={loading.getById ? <Loader size={14} className="animate-spin" /> : <Eye size={14} />}
            disabled={!canUseTeam || loading.getById}
            onClick={() => loadTeam()}
          >
            Load Team
          </Button>
          {!isLeader && (
            <>
              <Button
                variant="primary"
                size="sm"
                icon={loading.join ? <Loader size={14} className="animate-spin" /> : <UserPlus size={14} />}
                disabled={!canUseTeam || loading.join}
                onClick={requestJoin}
              >
                Request Join
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={loading.remove ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                disabled={!canUseTeam || !form.memberUserId.trim() || loading.remove}
                onClick={() => removeMember()}
              >
                Leave Team
              </Button>
            </>
          )}
        </div>
      </Card>

      {isLeader && (
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 14 }}>
            Create Team
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 }}>
            Create a new team for the selected event and category.
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_160px] gap-4">
            <label className="block">
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</span>
              <select
                value={approvedEvents.some(event => event.eventId === form.eventId) ? form.eventId : ""}
                onChange={event => setField("eventId", event.target.value)}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              >
                {loading.events && <option value="">Loading approved events...</option>}
                {!loading.events && approvedEvents.length === 0 && (
                  <option value="">No approved event registrations</option>
                )}
                {approvedEvents.map(event => (
                  <option key={event.eventId} value={event.eventId}>{event.eventName}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</span>
              <select
                value={form.categoryId}
                onChange={event => setField("categoryId", event.target.value)}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              >
                {categories.length === 0 && <option value="">No categories found</option>}
                {categories.map(category => (
                  <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                ))}
              </select>
            </label>
            <Field label="TEAM NAME" value={form.teamName} onChange={value => setField("teamName", value)} placeholder="Team name" />
            <div className="flex items-end">
              <Button
                variant="primary"
                size="md"
                fullWidth
                icon={loading.create ? <Loader size={14} className="animate-spin" /> : <PlusCircle size={14} />}
                disabled={!canCreate || loading.create}
                onClick={createTeam}
              >
                Create Team
              </Button>
            </div>
          </div>
          {!loading.events && approvedEvents.length === 0 && (
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 12 }}>
              Register for an event and wait for organizer approval before creating a team.
            </div>
          )}
        </Card>
      )}

      {isLeader && (
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 14 }}>
            Leader Actions
          </div>
          <div className="flex flex-wrap gap-3 mt-5">
            <Button
              variant="outline"
              size="sm"
              icon={loading.requests ? <Loader size={14} className="animate-spin" /> : <UserCheck size={14} />}
              disabled={!canUseTeam || loading.requests}
              onClick={() => loadRequests()}
            >
              Load Join Requests
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={loading.remove ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
              disabled={!canUseTeam || !form.memberUserId.trim() || loading.remove}
              onClick={() => removeMember()}
            >
              Remove Member
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={loading.memberDetail ? <Loader size={14} className="animate-spin" /> : <Eye size={14} />}
              disabled={!canUseTeam || !form.memberUserId.trim() || loading.memberDetail}
              onClick={getMemberDetail}
            >
              Member Detail
            </Button>
          </div>

          <div className="mt-4">
            <Field label="RESPONSE NOTE" value={form.responseNote} onChange={value => setField("responseNote", value)} placeholder="Optional note for join request" />
          </div>
        </Card>
      )}

      {!isLeader && (
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 8 }}>
            Join Existing Team
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 }}>
            Load teams by Event ID, then send a join request to the team you want.
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
            <Field label="TEAM ID TO JOIN" value={form.teamId} onChange={value => setField("teamId", value)} placeholder="Team UUID" />
            <Button
              variant="primary"
              size="md"
              icon={loading.join ? <Loader size={14} className="animate-spin" /> : <UserPlus size={14} />}
              disabled={!canUseTeam || loading.join}
              onClick={() => requestJoin()}
            >
              Request Join
            </Button>
          </div>
        </Card>
      )}

      {teams.length > 0 && (
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Teams In Event</div>
          <DataTable
            columns={[
              { key: "teamName", label: "Team" },
              { key: "teamId", label: "Team ID" },
              { key: "memberCount", label: "Members" },
              {
                key: "action",
                label: "Action",
                render: (_value, row) => (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" icon={<Eye size={13} />} onClick={() => loadTeam(row.teamId)}>
                      Open
                    </Button>
                    {!isLeader && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={loading.join ? <Loader size={13} className="animate-spin" /> : <UserPlus size={13} />}
                        disabled={loading.join}
                        onClick={() => requestJoin(row.teamId)}
                      >
                        Request Join
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            data={teams.map((team: any) => ({
              teamName: team.teamName,
              teamId: team.teamId,
              memberCount: team.members.length,
              action: team.teamId,
            }))}
          />
        </Card>
      )}



      {isLeader && requests.length > 0 && (
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Join Requests</div>
          <div className="space-y-3">
            {requests.map(request => (
              <div
                key={request.requestId}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 rounded-xl"
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>User: {request.userId}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
                    {request.requestStatus} - {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : "-"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={loading.approve ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                    disabled={loading.approve || loading.reject}
                    onClick={() => decideRequest(request.requestId, "APPROVED")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={loading.reject ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    disabled={loading.approve || loading.reject}
                    onClick={() => decideRequest(request.requestId, "REJECTED")}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
}
