import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Loader,
  LogOut,
  PlusCircle,
  Search,
  Send,
  Trash2,
  Undo2,
  UserCheck,
  UserPlus,
  Users,
  Crown,
  X,
  MessageSquare,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/features/auth/store/authStore";
import { getCurrentUser, refreshAccessToken } from "@/features/auth/api/authService";
import { Button, Card, COLORS, DataTable, StatusBadge } from "@/components/shared/UIComponents";
import { parseApiError } from "@/lib/api/apiClient";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import {
  teamService,
  getTeamStatusInfoForTeam,
  isTeamRejected,
  type JoinTeamRequestResponse,
  type TeamMemberDetailResponse,
  type TeamMemberResponse,
  type TeamResponse,
} from "@/features/teams/api/teamService";
import {
  discoverUserTeamsForEvents,
  mergeTeams,
  rememberUserTeam,
  saveStoredUserTeams,
  userBelongsToTeam,
} from "@/features/teams/api/userTeamDiscovery";
import { userService } from "@/features/users/api/userService";

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
  | "transferLeader"
  | "register"
  | "withdraw"
  | "events"
  | "categories"
  | "discover"
  | "transfer"
  | "disband"
  | "cancelRequest"
  | "myRequests";

type RoleMode = "auto" | "member" | "leader";
type TeamFlow = "create" | "join" | null;
type TeamPanelMode = "current" | "other" | null;
type LeaderActionPanel = "memberDetail" | "removeMember" | "joinRequests" | "transferLeadership" | null;

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
  return parseApiError(error).message || "Request failed.";
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
const MEMBER_DETAILS_STORAGE_KEY = "seal_member_details";
const EVENT_NAMES_STORAGE_KEY = "seal_event_names";

function isMemberDetail(value: unknown): value is TeamMemberDetailResponse {
  const detail = value as Partial<TeamMemberDetailResponse>;
  return typeof detail?.userId === "string"
    && typeof detail?.teamMemberId === "string"
    && (typeof detail?.fullName === "string" || typeof detail?.email === "string");
}

function readStoredMemberDetails() {
  try {
    const raw = localStorage.getItem(MEMBER_DETAILS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as unknown : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {} as Record<string, TeamMemberDetailResponse>;

    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => isMemberDetail(value) && hasDisplayableMemberDetail(value))
    ) as Record<string, TeamMemberDetailResponse>;
  } catch {
    return {} as Record<string, TeamMemberDetailResponse>;
  }
}

function rememberMemberDetails(details: Record<string, TeamMemberDetailResponse>) {
  try {
    const existing = readStoredMemberDetails();
    localStorage.setItem(MEMBER_DETAILS_STORAGE_KEY, JSON.stringify({ ...existing, ...details }));
  } catch {
    // Ignore storage failures; live API data still works.
  }
}

function readStoredEventNames() {
  try {
    const raw = localStorage.getItem(EVENT_NAMES_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as unknown : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {} as Record<string, string>;

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] =>
        typeof entry[0] === "string" && typeof entry[1] === "string" && entry[1].trim().length > 0
      )
    );
  } catch {
    return {} as Record<string, string>;
  }
}

function rememberEventNames(events: EventResponse[]) {
  try {
    const existing = readStoredEventNames();
    const nextNames = Object.fromEntries(
      events
        .filter(event => event.eventId && event.eventName)
        .map(event => [event.eventId, event.eventName])
    );
    localStorage.setItem(EVENT_NAMES_STORAGE_KEY, JSON.stringify({ ...existing, ...nextNames }));
  } catch {
    // Ignore storage failures; event names can still load from the API.
  }
}

function saveActiveTeam(team: TeamResponse, currentUserId?: string) {
  if (isTeamRejected(team)) return;
  try {
    localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, JSON.stringify({
      teamId: team.teamId,
      eventId: team.eventId,
      categoryId: team.categoryId,
      teamName: team.teamName,
      leaderUserId: team.leaderUserId,
      teamStatusId: team.teamStatusId,
      teamStatusName: team.teamStatusName,
      userId: currentUserId,
      memberUserIds: team.members.map(member => member.userId),
    }));
  } catch {
    // Ignore storage failures; the team can still be used in this view.
  }
  rememberUserTeam(team, currentUserId);
}

function memberDetailFromUser(
  member: TeamMemberResponse,
  user: Awaited<ReturnType<typeof userService.getUserById>>,
): TeamMemberDetailResponse {
  return {
    teamMemberId: member.teamMemberId,
    teamId: user.teamId ?? "",
    userId: user.userId,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? "",
    fptStudentCode: user.fptStudentCode ?? "",
    externalStudentCode: user.externalStudentCode ?? "",
    universityName: user.universityName ?? "",
    userTypeName: user.roleName ?? user.role,
    accountStatusName: user.accountStatusName ?? user.accountStatus,
    joinedAt: member.joinedAt,
    active: member.active,
  };
}

type TeamMemberWithProfile = TeamMemberResponse & {
  fullName?: string;
  name?: string;
  email?: string;
  studentEmail?: string;
  user?: {
    fullName?: string;
    name?: string;
    email?: string;
  };
};

function memberDetailFromTeamMember(member: TeamMemberResponse): TeamMemberDetailResponse | null {
  const source = member as TeamMemberWithProfile;
  const fullName = source.fullName ?? source.name ?? source.user?.fullName ?? source.user?.name ?? "";
  const email = source.email ?? source.studentEmail ?? source.user?.email ?? "";
  if (!fullName && !email) return null;

  return {
    teamMemberId: member.teamMemberId,
    teamId: "",
    userId: member.userId,
    fullName: fullName || email,
    email,
    phone: "",
    fptStudentCode: "",
    externalStudentCode: "",
    universityName: "",
    userTypeName: "",
    accountStatusName: "",
    joinedAt: member.joinedAt,
    active: member.active,
  };
}

function hasDisplayableMemberDetail(detail?: TeamMemberDetailResponse) {
  return Boolean(detail?.fullName?.trim() || detail?.email?.trim());
}

function displayValue(value?: string | null) {
  return value && value.trim() ? value : "-";
}

function formatStatusLabel(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return "";
  return normalized
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function getMemberStatusLabel(member: TeamMemberResponse) {
  return formatStatusLabel(member.participantStatusName ?? member.participantStatus)
    || (member.active ? "Active" : "Inactive");
}

function getMemberStatusColor(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === "active" || normalized === "approved") return COLORS.success;
  if (normalized === "suspended" || normalized === "rejected" || normalized === "inactive") return COLORS.error;
  if (normalized === "pending" || normalized === "temporary" || normalized === "unverified") return COLORS.warning;
  return COLORS.textSecondary;
}

function getEventLifecycleStatus(event?: EventResponse | null) {
  if (!event) return "";
  if (typeof event.eventStatus === "object") {
    return (event.eventStatus.eventStatusName || event.eventStatusName || "").trim().toUpperCase();
  }
  return (event.eventStatusName || event.eventStatus || "").trim().toUpperCase();
}

function normalizeEventStatusKey(status?: string | null) {
  return status?.trim().replace(/[\s-]+/g, "_").toUpperCase() ?? "";
}

function registrationUnavailableMessage(event?: EventResponse | null) {
  if (!event) return "Registration is not available because event data could not be loaded.";

  const status = normalizeEventStatusKey(getEventLifecycleStatus(event));
  if (status !== "REGISTRATION_OPEN") {
    return "Registration is not available because this event is not open for registration.";
  }

  const registrationStart = new Date(event.registrationStart).getTime();
  const registrationEnd = new Date(event.registrationEnd).getTime();
  const now = Date.now();

  if (Number.isNaN(registrationStart) || now < registrationStart) {
    return "Registration is not available because the registration period has not started.";
  }

  if (Number.isNaN(registrationEnd) || now > registrationEnd) {
    return "Registration is not available because the registration deadline has passed.";
  }

  return "";
}

function isEventRegistrationOpen(event?: EventResponse | null) {
  return Boolean(event) && !registrationUnavailableMessage(event);
}

function hasRegistrationDeadlinePassed(event?: EventResponse | null) {
  if (!event) return false;
  const registrationEnd = new Date(event.registrationEnd).getTime();
  return !Number.isNaN(registrationEnd) && Date.now() > registrationEnd;
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
    { label: "Participant Status", value: formatStatusLabel(detail.participantStatusName ?? detail.participantStatus) || "-" },
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
      teamStatusId?: string;
      teamStatusName?: string;
    };
    if (isTeamRejected(team)) return null;
    const belongsToUser = !currentUserId
      || team.userId === currentUserId
      || team.leaderUserId === currentUserId
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
  onNavigate,
  onTeamChange,
}: {
  initialEventId?: string;
  initialTeamId?: string;
  mode?: RoleMode;
  onTeamLeft?: () => void;
  onNavigate?: (page: string) => void;
  onTeamChange?: (team: TeamResponse | null) => void;
}) {
  const { user, setAuth } = useAuth();
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
  const [userTeams, setUserTeams] = useState<TeamResponse[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamResponse | null>(null);
  const [teamFlow, setTeamFlow] = useState<TeamFlow>(null);
  const [teamPanelMode, setTeamPanelMode] = useState<TeamPanelMode>(initialEventId ? "other" : null);
  const [teamDiscoveryDone, setTeamDiscoveryDone] = useState(true);
  const [teamSearchEventId, setTeamSearchEventId] = useState("");
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<EventResponse[]>([]);
  const [eventNames, setEventNames] = useState<Record<string, string>>(() => readStoredEventNames());
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryResponse | null>(null);
  const [requests, setRequests] = useState<JoinTeamRequestResponse[]>([]);
  const [memberDetails, setMemberDetails] = useState<Record<string, TeamMemberDetailResponse>>(() => readStoredMemberDetails());
  const [loading, setLoading] = useState<Partial<Record<ActionKey, boolean>>>({});
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [leaderActionPanel, setLeaderActionPanel] = useState<LeaderActionPanel>(null);
  const [selectedMemberDetailUserId, setSelectedMemberDetailUserId] = useState<string | null>(null);
  const [removeMemberName, setRemoveMemberName] = useState("");
  const [removeMemberReason, setRemoveMemberReason] = useState("");
  const [newLeaderUserId, setNewLeaderUserId] = useState("");
  const [joinTeamName, setJoinTeamName] = useState("");
  const [joinCategoryId, setJoinCategoryId] = useState("");
  const [joinRequestsLoaded, setJoinRequestsLoaded] = useState(false);
  // Request PENDING của chính user (mọi team) — hiển thị trạng thái + cho phép hủy.
  const [myPendingRequests, setMyPendingRequests] = useState<JoinTeamRequestResponse[]>([]);
  // Confirm dialog cho các hành động phá hủy (leave/disband/chuyển leader).
  // Kick dùng panel removeMember (có nhập lý do) nên không đi qua dialog này.
  const [confirmAction, setConfirmAction] = useState<
    | { kind: "leave" }
    | { kind: "kick"; userId: string; name: string }
    | { kind: "disband" }
    | { kind: "makeLeader"; userId: string; name: string }
    | null
  >(null);
  const [dismissedExpiredTeamId, setDismissedExpiredTeamId] = useState<string | null>(null);
  const loadedMemberDetailsTeamIdRef = useRef<string | null>(null);
  const loadedCategoryIdRef = useRef<string | null>(null);
  const teamDiscoveryAttemptedRef = useRef(false);
  const teamPanelModeRef = useRef<TeamPanelMode>(teamPanelMode);
  const currentUserId = user?.userId ?? "";

  useEffect(() => {
    onTeamChange?.(selectedTeam);
  }, [selectedTeam, onTeamChange]);

  const setField = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    teamPanelModeRef.current = teamPanelMode;
  }, [teamPanelMode]);

  const resolveMemberDetail = async (
    team: TeamResponse,
    member: TeamMemberResponse,
    knownTeams = userTeams,
  ): Promise<TeamMemberDetailResponse | null> => {
    const embeddedDetail = memberDetailFromTeamMember(member);
    if (embeddedDetail) return embeddedDetail;

    const storedDetail = readStoredMemberDetails()[member.userId];
    if (storedDetail && hasDisplayableMemberDetail(storedDetail)) {
      return {
        ...storedDetail,
        teamMemberId: member.teamMemberId,
        joinedAt: member.joinedAt || storedDetail.joinedAt,
        active: member.active,
      };
    }

    const currentTeamDetail = await teamService.getMemberDetail(team.teamId, member.userId).catch(() => null);
    if (currentTeamDetail && hasDisplayableMemberDetail(currentTeamDetail)) return currentTeamDetail;

    const alternateTeams = knownTeams.filter(knownTeam =>
      knownTeam.teamId !== team.teamId
      && knownTeam.members.some(knownMember => knownMember.userId === member.userId)
    );

    for (const alternateTeam of alternateTeams) {
      const alternateMember = alternateTeam.members.find(knownMember => knownMember.userId === member.userId);
      if (!alternateMember) continue;

      const alternateEmbeddedDetail = memberDetailFromTeamMember(alternateMember);
      if (alternateEmbeddedDetail) {
        return {
          ...alternateEmbeddedDetail,
          teamMemberId: member.teamMemberId,
          joinedAt: member.joinedAt,
          active: member.active,
        };
      }

      const alternateDetail = await teamService.getMemberDetail(alternateTeam.teamId, member.userId).catch(() => null);
      if (alternateDetail && hasDisplayableMemberDetail(alternateDetail)) {
        return {
          ...alternateDetail,
          teamMemberId: member.teamMemberId,
          joinedAt: member.joinedAt || alternateDetail.joinedAt,
          active: member.active,
        };
      }
    }

    const userProfileDetail = await userService.getUserById(member.userId)
      .then(userProfile => memberDetailFromUser(member, userProfile))
      .catch(() => null);
    return userProfileDetail && hasDisplayableMemberDetail(userProfileDetail) ? userProfileDetail : null;
  };

  const loadTeamMemberDetails = async (team: TeamResponse, knownTeams = userTeams) => {
    const entries = await Promise.all(
      team.members.map(member =>
        resolveMemberDetail(team, member, knownTeams)
          .then(detail => detail ? [member.userId, detail] as const : null)
      ),
    );
    setMemberDetails(prev => {
      const nextDetails = { ...prev };
      entries.forEach(entry => {
        if (entry) nextDetails[entry[0]] = entry[1];
      });
      rememberMemberDetails(nextDetails);
      return nextDetails;
    });
    return entries;
  };

  const activateTeam = (
    team: TeamResponse,
    shouldPersist = true,
    nextPanelMode: TeamPanelMode = "current",
    knownTeams = userTeams,
  ) => {
    if (isTeamRejected(team)) {
      clearTeamLocally(team.teamId, false, team.eventId);
      return;
    }
    loadedMemberDetailsTeamIdRef.current = null;
    setMemberDetails(prev => ({ ...readStoredMemberDetails(), ...prev }));
    void loadTeamMemberDetails(team, mergeTeams(knownTeams, [team]));
    setSelectedTeam(team);
    if (userBelongsToTeam(team, currentUserId)) {
      setUserTeams(prev => {
        const nextTeams = mergeTeams(prev, [team]);
        saveStoredUserTeams(nextTeams, currentUserId);
        return nextTeams;
      });
    }
    if (shouldPersist && userBelongsToTeam(team, currentUserId)) {
      saveActiveTeam(team, currentUserId);
    }
    setField("teamId", team.teamId);
    setField("eventId", team.eventId);
    setField("categoryId", team.categoryId);
    setTeamFlow(null);
    teamPanelModeRef.current = nextPanelMode;
    setTeamPanelMode(nextPanelMode);
  };

  const clearTeamLocally = (teamId: string, shouldNotifyTeamLeft = false, eventId?: string) => {
    if (!teamId) return;
    try {
      localStorage.removeItem(ACTIVE_TEAM_STORAGE_KEY);
    } catch {
      // Ignore storage failures.
    }
    setSelectedTeam(prev => prev?.teamId === teamId ? null : prev);
    setUserTeams(prev => {
      const nextTeams = prev.filter(team => team.teamId !== teamId);
      saveStoredUserTeams(nextTeams, currentUserId);
      return nextTeams;
    });
    setTeams(prev => prev.filter(team => team.teamId !== teamId));
    setMemberDetails({});
    setRequests([]);
    setJoinRequestsLoaded(false);
    setTeamDiscoveryDone(true);
    teamDiscoveryAttemptedRef.current = true;
    setField("teamId", "");
    if (eventId && teamSearchEventId === eventId) {
      void teamService.getByEvent(eventId)
        .then(eventTeams => setTeams(eventTeams.filter(team => team.teamId !== teamId)))
        .catch(() => {
          setTeams(prev => prev.filter(team => team.teamId !== teamId));
        });
    }
    if (shouldNotifyTeamLeft) onTeamLeft?.();
  };

  const startTeamFlow = (flow: Exclude<TeamFlow, null>, eventId = form.eventId) => {
    teamPanelModeRef.current = "other";
    setSelectedTeam(null);
    setTeamPanelMode("other");
    setTeamFlow(flow);
    if (eventId) setField("eventId", eventId);
    setTeams([]);
    setTeamSearchEventId("");
    setJoinCategoryId("");
    setJoinTeamName("");
    setMessage(null);
  };

  const isLeader = useMemo(() => {
    if (selectedTeam && currentUserId) return selectedTeam.leaderUserId === currentUserId;
    if (mode === "leader") return true;
    if (mode === "member") return false;
    return false;
  }, [mode, selectedTeam, currentUserId]);

  const canUseTeam = form.teamId.trim().length > 0;
  const canUseEvent = form.eventId.trim().length > 0;
  const canUseApprovedEvent = approvedEvents.some(event => event.eventId === form.eventId.trim());
  const canCreate = approvedEvents.some(event => event.eventId === form.eventId.trim())
    && form.categoryId.trim().length > 0
    && form.teamName.trim().length > 0;
  const normalizeId = (value?: string | null) => value?.trim().toLowerCase() ?? "";
  const activeMemberCountForTeam = (team: TeamResponse) =>
    team.activeMemberCount ?? team.members.filter(member => member.active !== false).length;
  const maxTeamSizeForTeam = (team: TeamResponse, event?: EventResponse) =>
    team.maxTeamSize ?? event?.maxTeamSize ?? 0;
  const teamHasOpenSlot = (team: TeamResponse, event?: EventResponse) => {
    const maxTeamSize = maxTeamSizeForTeam(team, event);
    return !maxTeamSize || activeMemberCountForTeam(team) < maxTeamSize;
  };
  const teamMatchesJoinCategory = (team: TeamResponse) =>
    !joinCategoryId || normalizeId(team.categoryId) === normalizeId(joinCategoryId);
  const joinTeams = useMemo(() => {
    const selectedEvent = events.find(event => event.eventId === form.eventId);
    if (!isEventRegistrationOpen(selectedEvent)) return [];

    return teams.filter(team => {
      const isForming = getTeamStatusInfoForTeam(team).badge === "forming";
      return isForming && teamHasOpenSlot(team, selectedEvent) && teamMatchesJoinCategory(team);
    });
  }, [events, form.eventId, joinCategoryId, teams]);
  const getEventName = (eventId?: string) => {
    if (!eventId) return "-";
    return events.find(event => event.eventId === eventId)?.eventName
      ?? eventNames[eventId]
      ?? eventId;
  };
  const selectedEventName = getEventName(selectedTeam?.eventId)
    ?? selectedTeam?.eventId
    ?? "-";
  const selectedCategoryName = selectedCategory?.categoryName
    ?? categories.find(category => category.categoryId === selectedTeam?.categoryId)?.categoryName
    ?? "None";

  useEffect(() => {
    if (!initialEventId) return;
    teamPanelModeRef.current = "other";
    setTeamPanelMode("other");
    setField("eventId", initialEventId);
    if (teamDiscoveryDone) {
      setSelectedTeam(null);
      setTeamFlow(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEventId]);

  useEffect(() => {
    run(
      "events",
      async () => {
        const allEvents = await eventService.getAll(true);
        return {
          allEvents,
          approved: allEvents.filter(isEventRegistrationOpen),
        };
      },
      ({ allEvents, approved }) => {
        setEvents(allEvents);
        setApprovedEvents(approved);
        const nextEventNames = Object.fromEntries(
          allEvents
            .filter(event => event.eventId && event.eventName)
            .map(event => [event.eventId, event.eventName])
        );
        setEventNames(prev => ({ ...prev, ...nextEventNames }));
        rememberEventNames(allEvents);
        if (approved[0] && !form.eventId) setField("eventId", approved[0].eventId);
      },
      "",
    );
    // Load once when the team panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Trạng thái request PENDING của chính user (để hiển thị và cho phép hủy).
    loadMyPendingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  useEffect(() => {
    if (!teamDiscoveryDone || selectedTeam || !form.eventId) {
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
      "",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.eventId, selectedTeam, teamDiscoveryDone]);

  useEffect(() => {
    const categoryId = selectedTeam?.categoryId;
    if (!categoryId) {
      setSelectedCategory(null);
      loadedCategoryIdRef.current = null;
      return;
    }
    if (loadedCategoryIdRef.current === categoryId && selectedCategory?.categoryId === categoryId) return;

    let cancelled = false;
    setSelectedCategory(current => current?.categoryId === categoryId ? current : null);
    categoryService.getById(categoryId)
      .then(category => {
        if (!cancelled) {
          setSelectedCategory(category);
          loadedCategoryIdRef.current = categoryId;
        }
      })
      .catch(() => {
        if (!cancelled) setSelectedCategory(null);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory?.categoryId, selectedTeam?.categoryId]);

  useEffect(() => {
    if (!selectedTeam) {
      loadedMemberDetailsTeamIdRef.current = null;
      return;
    }
    const hasAllMemberDetails = selectedTeam.members.every(member => hasDisplayableMemberDetail(memberDetails[member.userId]));
    if (loadedMemberDetailsTeamIdRef.current === selectedTeam.teamId && hasAllMemberDetails) return;

    let cancelled = false;
    Promise.all(
      selectedTeam.members.map(member => {
        const cachedDetail = memberDetails[member.userId];
        if (hasDisplayableMemberDetail(cachedDetail)) return Promise.resolve([member.userId, cachedDetail] as const);
        return resolveMemberDetail(selectedTeam, member, userTeams)
          .then(detail => detail ? [member.userId, detail] as const : null);
      })
    ).then(results => {
      if (cancelled) return;
      const nextDetails: Record<string, TeamMemberDetailResponse> = { ...memberDetails };
      results.forEach(result => {
        if (result) nextDetails[result[0]] = result[1];
      });
      setMemberDetails(nextDetails);
      const loadedEveryMember = selectedTeam.members.every(member => hasDisplayableMemberDetail(nextDetails[member.userId]));
      loadedMemberDetailsTeamIdRef.current = loadedEveryMember ? selectedTeam.teamId : null;
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeam]);

  useEffect(() => {
    setLeaderActionPanel(null);
    setRequests([]);
    setJoinRequestsLoaded(false);
    setRemoveMemberName("");
    setRemoveMemberReason("");
    setNewLeaderUserId("");
    setSelectedMemberDetailUserId(null);
    setField("responseNote", "");
  }, [selectedTeam?.teamId]);

  async function run<T>(
    key: ActionKey,
    caller: () => Promise<T>,
    onSuccess?: (data: T) => void,
    successText = "Done.",
    notify = false,
  ) {
    setLoading(prev => ({ ...prev, [key]: true }));
    setMessage(null);
    try {
      const data = await caller();
      onSuccess?.(data);
      if (successText) {
        setMessage({ tone: "success", text: successText });
        if (notify) toast.success(successText);
      }
    } catch (error) {
      const errorText = formatError(error);
      setMessage({ tone: "error", text: errorText });
      if (notify) toast.error(errorText);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }

  const loadTeam = (teamId = form.teamId.trim(), requireCurrentMembership = teamPanelMode === "current") => {
    if (!teamId) return;
    run(
      "getById",
      async () => {
        const team = await teamService.getById(teamId);
        const shouldVerifyMembership = requireCurrentMembership
          || userTeams.some(userTeam => userTeam.teamId === team.teamId);
        const detail = currentUserId && shouldVerifyMembership
          ? await teamService.getMemberDetail(team.teamId, currentUserId).catch(() => null)
          : null;
        if (currentUserId && shouldVerifyMembership && (!detail || detail.active === false)) {
          throw new Error("You are no longer an active member of this team.");
        }
        return team;
      },
      (team: any) => {
        if (requireCurrentMembership && teamPanelModeRef.current !== "current") return;
        activateTeam(team);
        setField("teamId", team.teamId);
        setField("eventId", team.eventId);
        setField("categoryId", team.categoryId);
        setMessage({ tone: "success", text: "Team loaded successfully." });
      },
      "",
    );
  };

  const discoverUserTeamsFromEvents = async () => {
    const discoveredTeams = await discoverUserTeamsForEvents(events, currentUserId);
    setUserTeams(discoveredTeams);
    return discoveredTeams;
  };

  const discoverUserTeams = (forceRefresh = false, autoLoadTeam = true) => {
    if (!currentUserId || loading.discover || (!forceRefresh && teamDiscoveryAttemptedRef.current)) return;

    const storedTeam = getStoredActiveTeam(currentUserId);
    const teamId = initialTeamId || storedTeam?.teamId;

    if (events.length === 0) {
      setMessage({
        tone: "info",
        text: "Loading events before checking your teams...",
      });
      return;
    }

    teamDiscoveryAttemptedRef.current = true;

    if (!teamId) {
      setTeamDiscoveryDone(false);
      run(
        "discover",
        discoverUserTeamsFromEvents,
        teams => {
          if (!autoLoadTeam) {
            if (selectedTeam && !teams.some(team => team.teamId === selectedTeam.teamId)) {
              setSelectedTeam(null);
              setField("teamId", "");
              try {
                localStorage.removeItem(ACTIVE_TEAM_STORAGE_KEY);
              } catch {
                // Ignore storage failures.
              }
            } else {
              setField("teamId", selectedTeam?.teamId ?? "");
            }
            if (teams.length === 0) {
              setMessage({
                tone: "info",
                text: "No teams found yet. Create a team or join one from the Join Another Event tab.",
              });
            }
            return;
          }
          if (teams[0]) {
            if (teamPanelModeRef.current !== "current") return;
            activateTeam(teams[0], true, "current", teams);
            return;
          }
          setMessage({
            tone: "info",
            text: "No teams found yet. Create a team or join one from the Join Another Event tab.",
          });
        },
        "",
      ).finally(() => {
        setTeamDiscoveryDone(true);
      });
      return;
    }

    setTeamDiscoveryDone(false);
    run(
      "discover",
      async () => {
        const discoveredTeams = await discoverUserTeamsFromEvents();
        if (discoveredTeams.length > 0) return discoveredTeams;
        if (!teamId) return [] as TeamResponse[];

        const team = await teamService.getById(teamId);
        return userBelongsToTeam(team, currentUserId) && !isTeamRejected(team) ? [team] : [] as TeamResponse[];
      },
      teams => {
        const selected = teams.find(team => team.teamId === teamId) ?? teams[0];
        if (!autoLoadTeam) {
          setUserTeams(teams);
          saveStoredUserTeams(teams, currentUserId);
          if (selectedTeam && !teams.some(team => team.teamId === selectedTeam.teamId)) {
            setSelectedTeam(null);
            setField("teamId", "");
            try {
              localStorage.removeItem(ACTIVE_TEAM_STORAGE_KEY);
            } catch {
              // Ignore storage failures.
            }
          } else {
            setField("teamId", selectedTeam?.teamId ?? "");
          }
          if (teams.length === 0) {
            try {
              localStorage.removeItem(ACTIVE_TEAM_STORAGE_KEY);
            } catch {
              // Ignore storage failures.
            }
            setMessage({
              tone: "info",
              text: "No teams found yet. Create a team or join one from the Join Another Event tab.",
            });
          }
          return;
        }
        if (selected) {
          setUserTeams(teams);
          saveStoredUserTeams(teams, currentUserId);
          if (teamPanelModeRef.current !== "current") return;
          activateTeam(selected, true, "current", teams);
          return;
        }

        try {
          localStorage.removeItem(ACTIVE_TEAM_STORAGE_KEY);
        } catch {
          // Ignore storage failures.
        }
        setUserTeams([]);
        setMessage({
          tone: "info",
          text: "No teams found yet. Create a team or join one from the Join Another Event tab.",
        });
      },
      "",
    ).finally(() => {
      setTeamDiscoveryDone(true);
    });
  };

  useEffect(() => {
    if (teamPanelMode !== "current" || loading.discover || teamDiscoveryAttemptedRef.current) {
      return;
    }
    discoverUserTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length, loading.discover, teamPanelMode, userTeams.length]);

  const loadTeamsByEvent = () => {
    run(
      "getByEvent",
      () => teamService.getByEvent(form.eventId.trim()),
      data => {
        setTeams(data);
        setTeamSearchEventId(form.eventId.trim());
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
      "",
    );
  };

  const createTeam = () => {
    const selectedEvent = events.find(event => event.eventId === form.eventId.trim());
    const unavailableMessage = registrationUnavailableMessage(selectedEvent);
    if (unavailableMessage) {
      setMessage({ tone: "error", text: unavailableMessage });
      return;
    }
    const existingTeam = activeTeamInEvent(form.eventId.trim());
    if (existingTeam) {
      setMessage({
        tone: "error",
        text: `You already belong to team "${existingTeam.teamName}" in this event. Leave it before creating a new team.`,
      });
      return;
    }

    run(
      "create",
      async () => {
        const createdTeam = await teamService.create({
          eventId: form.eventId.trim(),
          categoryId: form.categoryId.trim(),
          teamName: form.teamName.trim(),
        });
        await refreshAccessToken().catch(() => null);
        const currentUser = await getCurrentUser().catch(() => null);
        if (currentUser) setAuth(currentUser);
        return teamService.getById(createdTeam.teamId).catch(() => createdTeam);
      },
      (team: any) => {
        teamDiscoveryAttemptedRef.current = true;
        activateTeam(team);
        setUserTeams(prev => {
          const nextTeams = mergeTeams(prev, [team]);
          saveStoredUserTeams(nextTeams, currentUserId);
          return nextTeams;
        });
        setTeams(prev => [team, ...prev.filter(item => item.teamId !== team.teamId)]);
        setField("teamId", team.teamId);
      },
      "Team created in forming status. Add members, then press Join to send it for organizer approval.",
    );
  };

  const requestJoin = (teamId = form.teamId.trim()) => {
    if (!teamId) return;
    const team = teams.find(item => item.teamId === teamId);
    if (team && getTeamStatusInfoForTeam(team).badge !== "forming") {
      setMessage({ tone: "error", text: "This team's roster is locked because it is no longer forming." });
      return;
    }
    const selectedEvent = events.find(event => event.eventId === team?.eventId);
    const unavailableMessage = registrationUnavailableMessage(selectedEvent);
    if (unavailableMessage) {
      setMessage({ tone: "error", text: unavailableMessage });
      return;
    }
    if (team && !teamHasOpenSlot(team, selectedEvent)) {
      setMessage({ tone: "error", text: "This team has reached the event's maximum team size." });
      return;
    }
    const existingTeam = activeTeamInEvent(team?.eventId || form.eventId.trim());
    if (existingTeam) {
      setMessage({
        tone: "error",
        text: `You already belong to team "${existingTeam.teamName}" in this event. Leave it before joining another team.`,
      });
      return;
    }
    if (myPendingRequests.some(request => request.teamId === teamId)) {
      setMessage({ tone: "info", text: "You already have a pending request for this team. Wait for the leader to respond or cancel it below." });
      return;
    }
    setField("teamId", teamId);
    run(
      "join",
      async () => {
        const request = await teamService.requestJoin(teamId);
        const eventId = team?.eventId || form.eventId.trim();
        const eventTeams = eventId ? await teamService.getByEvent(eventId).catch(() => teams) : teams;
        return { request, eventTeams, eventId };
      },
      ({ request, eventTeams, eventId }) => {
        setTeams(eventTeams);
        if (eventId) setTeamSearchEventId(eventId);
        setMyPendingRequests(prev => [request, ...prev.filter(item => item.requestId !== request.requestId)]);
      },
      "Join request sent. Ask the team leader to approve it from Join Requests.",
      true,
    );
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
    if (action === "APPROVED" && selectedTeam && getTeamStatusInfoForTeam(selectedTeam).badge !== "forming") {
      setMessage({ tone: "error", text: "The team roster is locked and cannot accept new members." });
      return;
    }
    const teamId = selectedTeam?.teamId ?? form.teamId.trim();
    run(
      action === "APPROVED" ? "approve" : "reject",
      async () => {
        const updatedRequest = await teamService.handleJoinRequest(
          requestId,
          action,
          form.responseNote.trim() || undefined,
        );
        const updatedTeam = action === "APPROVED" && teamId
          ? await teamService.getById(teamId)
          : null;
        return { updatedRequest, updatedTeam };
      },
      ({ updatedRequest, updatedTeam }) => {
        setRequests(prev => prev.filter(request => request.requestId !== updatedRequest.requestId));
        if (updatedTeam) {
          activateTeam(updatedTeam);
        }
      },
      action === "APPROVED" ? "Request approved." : "Request rejected.",
    );
  };

  const removeMember = (userId = form.memberUserId.trim(), reason?: string) => {
    if (!form.teamId.trim() || !userId) return;
    if (selectedTeam && getTeamStatusInfoForTeam(selectedTeam).badge !== "forming") {
      setMessage({ tone: "error", text: "The team roster is locked unless the team is forming." });
      return;
    }
    const removingCurrentUser = userId === currentUserId;
    const targetTeamId = form.teamId.trim();
    const targetTeam = selectedTeam?.teamId === targetTeamId
      ? selectedTeam
      : userTeams.find(team => team.teamId === targetTeamId)
        ?? teams.find(team => team.teamId === targetTeamId);
    const targetEventId = targetTeam?.eventId || form.eventId.trim();
    run(
      "remove",
      async () => {
        await teamService.removeMember(targetTeamId, userId, reason);
        const refreshedTeam = await teamService.getById(targetTeamId).catch(error => {
          const parsedError = parseApiError(error);
          if (parsedError.status === 404) return null;
          throw error;
        });
        return { refreshedTeam };
      },
      ({ refreshedTeam }) => {
        const remainingActiveMembers = refreshedTeam?.members.filter(member => member.active !== false).length ?? 0;
        if (!refreshedTeam || remainingActiveMembers === 0) {
          clearTeamLocally(targetTeamId, removingCurrentUser, targetEventId);
          return;
        }
        if (removingCurrentUser) {
          clearTeamLocally(targetTeamId, true, targetEventId);
          return;
        }
        activateTeam(refreshedTeam);
        setTeams(prev => [refreshedTeam, ...prev.filter(team => team.teamId !== refreshedTeam.teamId)]);
        setLeaderActionPanel(null);
      },
      removingCurrentUser ? "Leave team successfully." : "Member removed successfully.",
      removingCurrentUser,
    );
  };

  const leaveTeam = () => {
    if (!selectedTeam || !currentUserId) return;
    removeMember(currentUserId);
  };

  // Thành viên active sớm nhất (ngoài leader) — người sẽ được backend
  // tự động trao quyền nếu leader rời team.
  const successorMember = useMemo(() => {
    if (!selectedTeam) return null;
    const candidates = selectedTeam.members
      .filter(member => member.active !== false && member.userId !== selectedTeam.leaderUserId)
      .slice()
      .sort((a, b) => (a.joinedAt ?? "").localeCompare(b.joinedAt ?? ""));
    return candidates[0] ?? null;
  }, [selectedTeam]);

  const transferLeadershipTo = (newLeaderUserId: string) => {
    if (!selectedTeam) return;
    run(
      "transfer",
      () => teamService.transferLeadership(selectedTeam.teamId, newLeaderUserId),
      team => {
        activateTeam(team);
        setTeams(prev => [team, ...prev.filter(item => item.teamId !== team.teamId)]);
        setUserTeams(prev => {
          const nextTeams = mergeTeams(prev, [team]);
          saveStoredUserTeams(nextTeams, currentUserId);
          return nextTeams;
        });
      },
      "Leadership transferred.",
      true,
    );
  };

  const disbandTeam = () => {
    if (!selectedTeam) return;
    const targetTeamId = selectedTeam.teamId;
    const targetEventId = selectedTeam.eventId;
    run(
      "disband",
      () => teamService.disband(targetTeamId),
      () => {
        clearTeamLocally(targetTeamId, true, targetEventId);
      },
      "Team disbanded.",
      true,
    );
  };

  const loadMyPendingRequests = () => {
    if (!currentUserId) return;
    teamService.getMyPendingRequests()
      .then(setMyPendingRequests)
      .catch(() => setMyPendingRequests([]));
  };

  const cancelMyRequest = (requestId: string) => {
    run(
      "cancelRequest",
      () => teamService.cancelJoinRequest(requestId),
      () => {
        setMyPendingRequests(prev => prev.filter(request => request.requestId !== requestId));
      },
      "Join request cancelled.",
      true,
    );
  };

  // Team active của user trong một event (pre-guard "đã có team" phía UI,
  // thay vì chờ backend trả 409).
  const activeTeamInEvent = (eventId?: string) => {
    if (!eventId) return null;
    return userTeams.find(team =>
      team.eventId === eventId
      && !isTeamRejected(team)
      && team.members.some(member => member.userId === currentUserId && member.active !== false),
    ) ?? null;
  };

  const submitTeamForApproval = () => {
    if (!selectedTeam || getTeamStatusInfoForTeam(selectedTeam).badge !== "forming") return;
    const selectedEvent = events.find(event => event.eventId === selectedTeam.eventId);
    const unavailableMessage = registrationUnavailableMessage(selectedEvent);
    if (unavailableMessage) {
      setMessage({ tone: "error", text: unavailableMessage });
      return;
    }
    if (selectedTeam.canRequestApproval === false) {
      setMessage({
        tone: "error",
        text: selectedTeam.approvalIssues?.join(" ") || "Resolve the team approval issues before sending.",
      });
      return;
    }
    run(
      "register",
      async () => {
        await teamService.registerEvent(selectedTeam.teamId);
        return teamService.getById(selectedTeam.teamId);
      },
      team => {
        activateTeam(team);
        setTeams(prev => [team, ...prev.filter(item => item.teamId !== team.teamId)]);
        setLeaderActionPanel(null);
        setRequests([]);
        setJoinRequestsLoaded(false);
      },
      "Team sent to organizer for approval.",
    );
  };

  const withdrawTeamApprovalRequest = () => {
    if (!selectedTeam || getTeamStatusInfoForTeam(selectedTeam).badge !== "pending_approval") return;
    run(
      "withdraw",
      async () => {
        await teamService.withdrawEvent(selectedTeam.teamId);
        return teamService.getById(selectedTeam.teamId);
      },
      team => {
        activateTeam(team);
        setTeams(prev => [team, ...prev.filter(item => item.teamId !== team.teamId)]);
        setLeaderActionPanel(null);
        setRequests([]);
        setJoinRequestsLoaded(false);
      },
      "Approval request withdrawn. Your team is back to forming.",
    );
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
    const selectedUserId = removeMemberName.trim();
    const reason = removeMemberReason.trim();
    if (!selectedUserId) {
      setMessage({ tone: "error", text: "Select a member before removing." });
      return;
    }
    if (!reason) {
      setMessage({ tone: "error", text: "Enter a removal reason before removing this member." });
      return;
    }

    const target = team.members.find(member => member.userId === selectedUserId);

    if (!target) {
      setMessage({ tone: "error", text: "Selected member was not found." });
      return;
    }
    if (target.userId === currentUserId || target.userId === team.leaderUserId) {
      setMessage({ tone: "error", text: "The team leader cannot be removed from the team." });
      return;
    }

    removeMember(target.userId, reason);
    setRemoveMemberName("");
    setRemoveMemberReason("");
  };

  const transferLeadership = (team: TeamResponse, targetUserIdOverride?: string) => {
    const targetUserId = (targetUserIdOverride ?? newLeaderUserId).trim();
    if (!targetUserId) {
      setMessage({ tone: "error", text: "Select an active member before transferring leadership." });
      return;
    }
    if (getTeamStatusInfoForTeam(team).badge !== "forming") {
      setMessage({ tone: "error", text: "Team roster can only be changed while the team is forming." });
      return;
    }

    const target = team.members.find(member => member.userId === targetUserId);
    if (!target || target.active === false || target.userId === team.leaderUserId) {
      setMessage({ tone: "error", text: "Leadership can only be transferred to an active member in this team." });
      return;
    }

    run(
      "transferLeader",
      async () => {
        const updatedTeam = await teamService.transferLeadership(team.teamId, target.userId);
        await refreshAccessToken().catch(() => null);
        const currentUser = await getCurrentUser().catch(() => null);
        if (currentUser) setAuth(currentUser);
        return updatedTeam;
      },
      updatedTeam => {
        activateTeam(updatedTeam);
        setTeams(prev => [updatedTeam, ...prev.filter(item => item.teamId !== updatedTeam.teamId)]);
        setLeaderActionPanel(null);
        setNewLeaderUserId("");
      },
      "Leadership transferred successfully.",
      true,
    );
  };

  const renderTeamEntryChoices = () => {
    if (mode === "leader") return null;

    return (
      <div
        className="inline-flex flex-wrap items-center gap-2 rounded-xl p-1"
        style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
      >
          <button
            type="button"
            onClick={() => {
              teamPanelModeRef.current = "current";
              setTeamPanelMode("current");
              setTeamFlow(null);
              setMessage(null);
              discoverUserTeams(true, false);
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
            style={{
              border: `1px solid ${teamPanelMode === "current" ? COLORS.primary : "transparent"}`,
              background: teamPanelMode === "current" ? `${COLORS.primary}10` : "transparent",
              color: teamPanelMode === "current" ? COLORS.primary : COLORS.textSecondary,
            }}
          >
            <Users size={15} />
            <span style={{ fontWeight: 800, fontSize: 13 }}>Current Team</span>
          </button>

          <button
            type="button"
            onClick={() => {
              teamPanelModeRef.current = "other";
              setTeamPanelMode("other");
              setSelectedTeam(null);
              setTeamFlow(null);
              setMessage(null);
              const nextEventId = initialEventId || form.eventId || approvedEvents[0]?.eventId || "";
              if (nextEventId) setField("eventId", nextEventId);
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all"
            style={{
              border: `1px solid ${teamPanelMode === "other" ? COLORS.primary : "transparent"}`,
              background: teamPanelMode === "other" ? `${COLORS.primary}10` : "transparent",
              color: teamPanelMode === "other" ? COLORS.primary : COLORS.textSecondary,
            }}
          >
            <UserPlus size={15} />
            <span style={{ fontWeight: 800, fontSize: 13 }}>Join Another Event</span>
          </button>
      </div>
    );
  };

  const renderCurrentTeamPicker = () => {
    if (mode === "leader") return null;
    const isCompact = !!selectedTeam;
    const currentUserTeams = userTeams.filter(team => userBelongsToTeam(team, currentUserId));
    const selectedPickerTeamId = form.teamId || selectedTeam?.teamId || "";

    return (
      <Card className={isCompact ? "p-3" : "p-5"}>
        {!isCompact && (
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary }}>Your Teams</div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
                Select a team from the filter below to load and review its details.
              </div>
            </div>
            {message && <InlineMessage tone={message.tone} message={message.text} />}
          </div>
        )}

        {loading.discover || (teamPanelMode === "current" && !teamDiscoveryAttemptedRef.current && currentUserTeams.length === 0) ? (
          <div className="flex items-center gap-3" style={{ color: COLORS.textSecondary, marginTop: isCompact ? 0 : 20 }}>
            <Loader size={18} className="animate-spin" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Loading your teams...</span>
          </div>
        ) : currentUserTeams.length === 0 ? (
          <div
            className="rounded-xl px-4 py-5 text-center mt-5"
            style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 14, fontWeight: 700 }}
          >
            No teams yet
          </div>
        ) : (
          <div className={isCompact ? "" : "mt-5"}>
            <label className="block">
              <select
                value={selectedPickerTeamId}
                onChange={event => loadTeam(event.target.value, true)}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                disabled={loading.getById}
              >
                {!selectedPickerTeamId && (
                  <option value="" disabled hidden>Select a team...</option>
                )}
                {currentUserTeams.map(team => {
                  const eventName = getEventName(team.eventId);
                  return (
                    <option key={team.teamId} value={team.teamId}>
                      {team.teamName} - {eventName}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
        )}
      </Card>
    );
  };

  const renderTeamEmptyState = () => (
    <div
      className="min-h-[52vh] flex items-center justify-center px-4"
      style={{ marginTop: 24 }}
    >
      <Card className="w-full max-w-2xl p-8 text-center">
        <div
          className="mx-auto flex items-center justify-center rounded-2xl"
          style={{
            width: 72,
            height: 72,
            background: `${COLORS.primary}12`,
            color: COLORS.primary,
            border: `1px solid ${COLORS.primary}20`,
          }}
        >
          <Users size={32} />
        </div>
        <div style={{ fontWeight: 900, fontSize: 22, color: COLORS.textPrimary, marginTop: 18 }}>
          My Team
        </div>
        <div className="mx-auto" style={{ maxWidth: 480, fontSize: 14, color: COLORS.textSecondary, marginTop: 8, lineHeight: 1.6 }}>
          Select one of your existing teams, create a new team for an event, or browse open events to find a team to join.
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
          <Button
            variant="primary"
            size="md"
            icon={<Users size={14} />}
            onClick={() => {
              teamPanelModeRef.current = "current";
              setTeamPanelMode("current");
              setTeamFlow(null);
              setMessage(null);
              discoverUserTeams(true, false);
            }}
          >
            View My Teams
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={<PlusCircle size={14} />}
            onClick={() => {
              teamPanelModeRef.current = "other";
              setTeamPanelMode("other");
              setSelectedTeam(null);
              setTeamFlow("create");
              const nextEventId = initialEventId || form.eventId || approvedEvents[0]?.eventId || "";
              if (nextEventId) setField("eventId", nextEventId);
            }}
          >
            Create Team
          </Button>
          {onNavigate && (
            <Button
              variant="ghost"
              size="md"
              icon={<Search size={14} />}
              onClick={() => onNavigate("events")}
            >
              Find Events
            </Button>
          )}
        </div>
      </Card>
    </div>
  );

  const renderPanelHeading = (marginBottom = 18) => (
    <div style={{ fontWeight: 800, fontSize: 24, color: COLORS.textPrimary, marginBottom }}>
      My Team
    </div>
  );

  if (!selectedTeam && mode !== "leader") {
    return (
      <div className="space-y-3">
        {!teamPanelMode && renderTeamEmptyState()}
        {teamPanelMode && (
          <>
            {renderPanelHeading()}
            {renderTeamEntryChoices()}
            {message && <InlineMessage tone={message.tone} message={message.text} />}
          </>
        )}
        {teamPanelMode === "current" && renderCurrentTeamPicker()}
        {teamPanelMode === "other" && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  const openingCreateFlow = teamFlow !== "create";
                  if (openingCreateFlow) {
                    startTeamFlow("create", form.eventId);
                  } else {
                    setTeamFlow(null);
                  }
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
                  if (openingJoinFlow) {
                    startTeamFlow("join", form.eventId);
                  } else {
                    setTeamFlow(null);
                  }
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
        )}

        {teamPanelMode === "other" && teamFlow === "create" && (
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
                  {loading.events && <option value="">Loading events...</option>}
                  {!loading.events && approvedEvents.length === 0 && (
                    <option value="">No open events available</option>
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
                  No events are currently open for registration.
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

        {teamPanelMode === "other" && teamFlow === "join" && (
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
                    setTeamSearchEventId("");
                  }}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                >
                  {loading.events && <option value="">Loading events...</option>}
                  {!loading.events && approvedEvents.length === 0 && (
                    <option value="">No open events available</option>
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
                No events are currently open for registration.
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
                {loading.join ? "Sending..." : "Join"}
              </Button>
            </div>
          </Card>
        )}

        {teamFlow === "join" && myPendingRequests.length > 0 && (
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>
              Your Pending Join Requests
            </div>
            <div className="space-y-3">
              {myPendingRequests.map(request => (
                <div
                  key={request.requestId}
                  className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 rounded-xl"
                  style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                      {teams.find(team => team.teamId === request.teamId)?.teamName
                        ?? userTeams.find(team => team.teamId === request.teamId)?.teamName
                        ?? "Team"}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
                      Waiting for the team leader to respond
                      {request.requestedAt ? ` — sent ${new Date(request.requestedAt).toLocaleString()}` : ""}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={loading.cancelRequest ? <Loader size={13} className="animate-spin" /> : <Undo2 size={13} />}
                    disabled={loading.cancelRequest}
                    onClick={() => cancelMyRequest(request.requestId)}
                  >
                    Cancel Request
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {teamPanelMode === "other" && teamFlow === "join" && !!teamSearchEventId && teamSearchEventId === form.eventId && (
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Teams In Event</div>
            {joinTeams.length === 0 ? (
              <div
                className="rounded-xl px-4 py-5 text-center"
                style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 13 }}
              >
                {joinCategoryId
                  ? "There are no forming teams with open slots in this category."
                  : "There are no forming teams with open slots for this event."}
              </div>
            ) : (
              <DataTable
                columns={[
                  { key: "teamName", label: "Team" },
                  { key: "categoryName", label: "Category" },
                  { key: "memberCount", label: "Members" },
                  {
                    key: "action",
                    label: "Action",
                    render: (_value, row) => {
                      const alreadyRequested = myPendingRequests.some(request => request.teamId === row.teamId);
                      if (alreadyRequested) {
                        return (
                          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.warning }}>
                            Requested
                          </span>
                        );
                      }
                      return (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={loading.join ? <Loader size={13} className="animate-spin" /> : <UserPlus size={13} />}
                          disabled={loading.join}
                          onClick={() => requestJoin(row.teamId)}
                        >
                          Join
                        </Button>
                      );
                    },
                  },
                ]}
                data={joinTeams.map(team => ({
                  teamName: team.teamName,
                  categoryName: categories.find(category => normalizeId(category.categoryId) === normalizeId(team.categoryId))?.categoryName || "-",
                  memberCount: (() => {
                    const selectedEvent = events.find(event => event.eventId === team.eventId);
                    const maxTeamSize = maxTeamSizeForTeam(team, selectedEvent);
                    const activeMemberCount = activeMemberCountForTeam(team);
                    return maxTeamSize ? `${activeMemberCount}/${maxTeamSize}` : activeMemberCount;
                  })(),
                  teamId: team.teamId,
                  action: team.teamId,
                }))}
              />
            )}
          </Card>
        )}
      </div>
    );
  }

  if (selectedTeam) {
    const leaderDetail = memberDetails[selectedTeam.leaderUserId];
    const leaderLabel = leaderDetail?.fullName || leaderDetail?.email || "Team leader";
    const baseTeamStatus = getTeamStatusInfoForTeam(selectedTeam);
    const teamStatus = baseTeamStatus;
    const teamStatusColor = teamStatus.badge === "forming"
      ? COLORS.primary
      : teamStatus.badge === "pending_approval"
        ? COLORS.warning
      : teamStatus.badge === "active"
        ? COLORS.success
      : teamStatus.badge === "rejected" || teamStatus.badge === "disqualified"
        ? COLORS.error
        : COLORS.textPrimary;
    const isTeamLoadMessage = message?.text.toLowerCase().includes("team loaded");
    const currentUserRole = isLeader ? "Leader" : "Member";
    const canEditRoster = teamStatus.badge === "forming";
    const canWithdrawApprovalRequest = isLeader && teamStatus.badge === "pending_approval";
    const teamEvent = events.find(event => event.eventId === selectedTeam.eventId);
    const teamEventUnavailableMessage = registrationUnavailableMessage(teamEvent);
    const teamEventRegistrationOpen = !teamEventUnavailableMessage;
    const registrationRestrictionApplies = canEditRoster;
    const registrationDeadlinePassed = registrationRestrictionApplies && hasRegistrationDeadlinePassed(teamEvent);
    const activeMemberCount = selectedTeam.activeMemberCount ?? selectedTeam.members.filter(member => member.active).length;
    const minTeamSize = selectedTeam.minTeamSize ?? teamEvent?.minTeamSize ?? 0;
    const maxTeamSize = selectedTeam.maxTeamSize ?? teamEvent?.maxTeamSize ?? 0;
    const hasMinimumMembers = !minTeamSize || activeMemberCount >= minTeamSize;
    const withinMaximumMembers = !maxTeamSize || activeMemberCount <= maxTeamSize;
    const hasTeamSizeRequirement = Boolean(minTeamSize || maxTeamSize);
    const computedTeamSizeEligible = hasMinimumMembers && withinMaximumMembers;
    const teamSizeEligible = hasTeamSizeRequirement
      ? computedTeamSizeEligible
      : selectedTeam.teamSizeEligible ?? computedTeamSizeEligible;
    const backendApprovalIssues = selectedTeam.approvalIssues ?? [];
    const hasBackendProfileIssue = backendApprovalIssues.some(issue => {
      const normalizedIssue = issue.trim().toLowerCase();
      return normalizedIssue.includes("profile") || normalizedIssue.includes("member info");
    });
    const membersInfoComplete = selectedTeam.membersInfoComplete === true;
    const profileCheckReady = membersInfoComplete || hasBackendProfileIssue;
    const approvalIssues = Array.from(new Set([
      ...(registrationRestrictionApplies && teamEventUnavailableMessage ? [teamEventUnavailableMessage] : []),
      ...backendApprovalIssues,
    ]));
    const canRequestApproval = teamEventRegistrationOpen
      && (selectedTeam.canRequestApproval ?? (teamSizeEligible && profileCheckReady && membersInfoComplete));
    const canSubmitForApproval = isLeader && canEditRoster && canRequestApproval;
    const memberRequirementLabel = minTeamSize && maxTeamSize
      ? `${activeMemberCount}/${minTeamSize}-${maxTeamSize}`
      : maxTeamSize
        ? `${activeMemberCount}/${maxTeamSize}`
        : String(activeMemberCount);
    const getMemberDisplay = (member: TeamMemberResponse) => {
      const detail = memberDetails[member.userId];
      const embeddedDetail = memberDetailFromTeamMember(member);
      const isCurrentUser = member.userId === user?.userId;
      return {
        name: detail?.fullName || detail?.email || embeddedDetail?.fullName || embeddedDetail?.email || (isCurrentUser ? user?.fullName : undefined) || member.userId,
        email: detail?.email || embeddedDetail?.email || (isCurrentUser ? user?.email : undefined) || "-",
      };
    };
    const memberTableRows = selectedTeam.members.map(member => {
      const display = getMemberDisplay(member);
      return {
        userId: member.userId,
        member: display.name,
        role: member.userId === selectedTeam.leaderUserId ? "Leader" : "Member",
        email: display.email,
        active: getMemberStatusLabel(member),
        joinedAt: member.joinedAt ? new Date(member.joinedAt).toLocaleString() : "-",
        action: member.userId,
      };
    });
    const removableMembers = selectedTeam.members.filter(member =>
      member.userId !== user?.userId && member.userId !== selectedTeam.leaderUserId
    );
    const transferableMembers = selectedTeam.members.filter(member =>
      member.active !== false && member.userId !== selectedTeam.leaderUserId
    );
    const renderCenteredModal = (title: string, onClose: () => void, content: ReactNode) => {
      if (typeof document === "undefined") return null;

      return createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(35, 24, 14, 0.58)", backdropFilter: "blur(2px)" }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-3xl rounded-2xl p-5 shadow-2xl"
            style={{ background: "#fffaf4", border: `1px solid ${COLORS.border}`, maxHeight: "86vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div style={{ fontWeight: 900, fontSize: 18, color: COLORS.textPrimary }}>{title}</div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg"
                style={{ width: 34, height: 34, border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, background: COLORS.bg }}
              >
                <X size={16} />
              </button>
            </div>
            {content}
          </div>
        </div>,
        document.body,
      );
    };
    const renderFinalizeTeamCard = () => {
      if (!isLeader || (!canEditRoster && !canWithdrawApprovalRequest)) return null;

      return (
        <div
          className="w-full lg:w-[280px] rounded-xl px-4 py-3"
          style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
        >
          <div className="flex items-center justify-between gap-3">
            <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.textSecondary }}>
              FINALIZE TEAM
            </div>
            <StatusBadge status={teamStatus.badge} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary, marginTop: 8 }}>
            Members: {memberRequirementLabel}
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              {
                label: teamSizeEligible ? "Size OK" : "Size Issue",
                color: teamSizeEligible ? COLORS.success : COLORS.error,
                background: teamSizeEligible ? `${COLORS.success}10` : `${COLORS.error}10`,
              },
              {
                label: !profileCheckReady ? "Profiles Checking" : membersInfoComplete ? "Profiles OK" : "Profile Issue",
                color: !profileCheckReady ? COLORS.warning : membersInfoComplete ? COLORS.success : COLORS.error,
                background: !profileCheckReady ? `${COLORS.warning}10` : membersInfoComplete ? `${COLORS.success}10` : `${COLORS.error}10`,
              },
            ].map(item => (
              <span
                key={item.label}
                className="px-2 py-1 rounded-lg"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: item.color,
                  background: item.background,
                  border: `1px solid ${item.color}22`,
                }}
              >
                {item.label}
              </span>
            ))}
          </div>
          {(canWithdrawApprovalRequest || canRequestApproval) && (
            <div style={{ fontSize: 12, color: COLORS.success, marginTop: 8 }}>
              {canWithdrawApprovalRequest
                ? "Waiting for organizer approval."
                : "Ready to send for organizer approval."}
            </div>
          )}
          {approvalIssues.length > 0 && !canWithdrawApprovalRequest && (
            <ul className="mt-2 pl-4 list-disc" style={{ fontSize: 11.5, color: COLORS.error }}>
              {approvalIssues.map(issue => <li key={issue}>{issue}</li>)}
            </ul>
          )}
        </div>
      );
    };
    const renderRegistrationExpiredModal = () => {
      if (!registrationDeadlinePassed || dismissedExpiredTeamId === selectedTeam.teamId) return null;

      return renderCenteredModal(
        "Registration Expired",
        () => setDismissedExpiredTeamId(selectedTeam.teamId),
        <>
          <div
            className="rounded-xl p-4"
            style={{ background: "rgba(255,255,255,0.45)", border: `1px solid ${COLORS.border}` }}
          >
            <div className="flex gap-4">
              <div
                className="flex shrink-0 items-center justify-center rounded-xl"
                style={{
                  width: 44,
                  height: 44,
                  background: `${COLORS.error}12`,
                  color: COLORS.error,
                  border: `1px solid ${COLORS.error}24`,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: COLORS.textPrimary }}>
                  Registration deadline has passed
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 6, lineHeight: 1.6 }}>
                  This team can no longer request approval for {selectedEventName}. Please leave this team and join or create a team in another event that is still open for registration.
                </div>
                {teamEventUnavailableMessage && (
                  <div
                    className="mt-3 rounded-xl px-3 py-2"
                    style={{ background: `${COLORS.error}08`, border: `1px solid ${COLORS.error}18`, color: COLORS.error, fontSize: 12, fontWeight: 700 }}
                  >
                    {teamEventUnavailableMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="danger"
              size="md"
              icon={loading.remove ? <Loader size={14} className="animate-spin" /> : <LogOut size={14} />}
              disabled={loading.remove}
              onClick={leaveTeam}
            >
              {loading.remove ? "Leaving..." : "Leave Team"}
            </Button>
          </div>
        </>,
      );
    };
    const renderLeaderActionPanel = () => {
      if (leaderActionPanel === "memberDetail") {
        return (
          <div className="mt-5 rounded-xl p-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary, marginBottom: 12 }}>Member Details</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {selectedTeam.members.map(member => {
                const detail = memberDetails[member.userId];
                const display = getMemberDisplay(member);
                const detailRows = detail ? visibleMemberDetailRows(detail) : [
                  { label: "Full Name", value: display.name },
                  { label: "Email", value: display.email },
                  { label: "Joined At", value: member.joinedAt ? new Date(member.joinedAt).toLocaleString() : "-" },
                  { label: "Active", value: member.active ? "Yes" : "No" },
                ];
                return (
                  <div key={member.userId} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.45)", border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.textPrimary }}>
                      {display.name}
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

      if (leaderActionPanel === "removeMember" && canEditRoster) {
        return (
          <div className="mt-5 rounded-xl p-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary, marginBottom: 8 }}>Remove Member</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 }}>
              Select a member to remove from this team.
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
              <label className="block">
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
                  MEMBER
                </span>
                <select
                  value={removeMemberName}
                  onChange={event => setRemoveMemberName(event.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                  disabled={removableMembers.length === 0 || loading.remove}
                >
                  <option value="" disabled hidden>Select a member...</option>
                  {removableMembers.map(member => {
                    const display = getMemberDisplay(member);
                    const email = display.email !== "-" && display.email !== display.name ? ` - ${display.email}` : "";
                    return (
                      <option key={member.userId} value={member.userId}>
                        {display.name}{email}
                      </option>
                    );
                  })}
                </select>
              </label>
              <Button
                variant="danger"
                size="md"
                icon={loading.remove ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                disabled={!removeMemberName.trim() || !removeMemberReason.trim() || loading.remove}
                onClick={() => removeMemberByName(selectedTeam)}
              >
                {loading.remove ? "Removing..." : "Remove Member"}
              </Button>
            </div>
            <label className="block mt-4">
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
                REMOVAL REASON
              </span>
              <textarea
                value={removeMemberReason}
                onChange={event => setRemoveMemberReason(event.target.value)}
                placeholder="Explain why this member is being removed..."
                className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
                rows={3}
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                disabled={loading.remove}
              />
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>
                This reason will be included in the notification sent to the removed member.
              </div>
            </label>
          </div>
        );
      }

      if (leaderActionPanel === "transferLeadership" && canEditRoster) {
        return (
          <div className="mt-5 rounded-xl p-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary, marginBottom: 8 }}>Transfer Leadership</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 }}>
              Select an active member to become the new team leader.
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-end">
              <label className="block">
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
                  NEW LEADER
                </span>
                <select
                  value={newLeaderUserId}
                  onChange={event => setNewLeaderUserId(event.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                  disabled={transferableMembers.length === 0 || loading.transferLeader}
                >
                  <option value="" disabled hidden>Select an active member...</option>
                  {transferableMembers.map(member => {
                    const display = getMemberDisplay(member);
                    const email = display.email !== "-" && display.email !== display.name ? ` - ${display.email}` : "";
                    return (
                      <option key={member.userId} value={member.userId}>
                        {display.name}{email}
                      </option>
                    );
                  })}
                </select>
              </label>
              <Button
                variant="primary"
                size="md"
                icon={loading.transferLeader ? <Loader size={14} className="animate-spin" /> : <Crown size={14} />}
                disabled={!newLeaderUserId.trim() || loading.transferLeader}
                onClick={() => transferLeadership(selectedTeam)}
              >
                {loading.transferLeader ? "Transferring..." : "Transfer"}
              </Button>
            </div>
            {transferableMembers.length === 0 && (
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 10 }}>
                There are no other active members available to receive leadership.
              </div>
            )}
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

    if (mode !== "leader" && teamPanelMode !== "current") {
      return (
        <div className="space-y-3">
          {renderPanelHeading()}
          {renderTeamEntryChoices()}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div className="flex flex-col gap-2">
            {mode !== "leader" ? renderPanelHeading(0) : <span />}
            {renderTeamEntryChoices()}
          </div>
          {renderFinalizeTeamCard()}
        </div>
        {mode !== "leader" && renderCurrentTeamPicker()}
        <Card className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users size={18} style={{ color: COLORS.primary }} />
                <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.textPrimary }}>My Team</div>
              </div>
            </div>
            {message && isTeamLoadMessage && (
              <div className="w-full lg:w-auto">
                <InlineMessage tone={message.tone} message={message.text} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
              {[
                { label: "Team Name", value: selectedTeam.teamName },
                { label: "Event", value: selectedEventName },
                { label: "Category", value: selectedCategoryName },
                { label: "Role", value: currentUserRole },
                { label: "Members", value: String(selectedTeam.members.length) },
                {
                  label: "Status",
                  value: teamStatus.label,
                  color: teamStatusColor,
                },
              ].map(item => (
                <div key={item.label} className="rounded-xl px-4 py-3" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, marginBottom: 5 }}>{item.label.toUpperCase()}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: item.color ?? COLORS.textPrimary }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary }}>{selectedTeam.teamName}</div>
              {onNavigate && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<MessageSquare size={14} />}
                    onClick={() => onNavigate("mentor")}
                  >
                    Mentoring Support
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ClipboardList size={14} />}
                    onClick={() => onNavigate("consultations")}
                  >
                    Consultation History
                  </Button>
                </>
              )}
              {isLeader && canEditRoster && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={loading.requests ? <Loader size={14} className="animate-spin" /> : <UserCheck size={14} />}
                    disabled={loading.requests}
                    onClick={() => {
                      setLeaderActionPanel(current => current === "joinRequests" ? null : "joinRequests");
                      if (leaderActionPanel !== "joinRequests") loadRequests(selectedTeam.teamId);
                    }}
                  >
                    {loading.requests ? "Loading..." : "Join Request"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={loading.transferLeader ? <Loader size={14} className="animate-spin" /> : <Crown size={14} />}
                    disabled={loading.transferLeader || transferableMembers.length === 0}
                    onClick={() => setLeaderActionPanel(current => current === "transferLeadership" ? null : "transferLeadership")}
                    title={transferableMembers.length === 0 ? "No active member is available to receive leadership." : "Transfer team leadership"}
                  >
                    Transfer Leader
                  </Button>
                </>
              )}
            </div>
          </div>
          {message && !isTeamLoadMessage && (
            <div className="mb-4">
              <InlineMessage tone={message.tone} message={message.text} />
            </div>
          )}
          <DataTable
            columns={[
              { key: "member", label: "Member" },
              { key: "role", label: "Role" },
              { key: "email", label: "Email" },
              {
                key: "active",
                label: "Status",
                render: (status) => {
                  const color = getMemberStatusColor(String(status));
                  return (
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1"
                      style={{
                        color,
                        background: `${color}10`,
                        border: `1px solid ${color}24`,
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {status}
                    </span>
                  );
                },
              },
              { key: "joinedAt", label: "Joined" },
              {
                key: "action",
                label: "Action",
                render: (memberUserId) => {
                  const canRemoveMember = isLeader
                    && canEditRoster
                    && memberUserId !== user?.userId
                    && memberUserId !== selectedTeam.leaderUserId;
                  const isCurrentUserRow = memberUserId === user?.userId;
                  const canMakeLeader = canRemoveMember; // leader + roster mở + không phải mình/leader hiện tại
                  const memberName = getMemberDisplay(
                    selectedTeam.members.find(item => item.userId === memberUserId) ?? { userId: memberUserId } as any,
                  ).name;
                  return (
                    <div className="flex justify-center">
                      <div className="flex flex-wrap justify-center gap-2" style={{ minWidth: 188 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye size={13} />}
                          onClick={() => setSelectedMemberDetailUserId(current => current === memberUserId ? null : memberUserId)}
                        >
                          Detail
                        </Button>
                        {canMakeLeader && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={loading.transfer ? <Loader size={13} className="animate-spin" /> : <UserCheck size={13} />}
                            disabled={loading.transfer}
                            onClick={() => setConfirmAction({ kind: "makeLeader", userId: memberUserId, name: memberName })}
                          >
                            Make Leader
                          </Button>
                        )}
                        {isCurrentUserRow && canEditRoster ? (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={loading.remove ? <Loader size={13} className="animate-spin" /> : <LogOut size={13} />}
                            disabled={loading.remove}
                            onClick={() => setConfirmAction({ kind: "leave" })}
                          >
                            {loading.remove ? "Leaving..." : "Leave"}
                          </Button>
                        ) : canRemoveMember ? (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={loading.remove ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            disabled={loading.remove}
                            onClick={() => {
                              // Kick đi qua panel removeMember của Dev (bắt nhập lý do) —
                              // panel đó đóng vai trò bước xác nhận.
                              setRemoveMemberName(memberUserId);
                              setRemoveMemberReason("");
                              setLeaderActionPanel("removeMember");
                            }}
                          >
                            Remove
                          </Button>
                        ) : (
                          <span />
                        )}
                      </div>
                    </div>
                  );
                },
              },
            ]}
            data={memberTableRows}
          />
          {selectedMemberDetailUserId && (() => {
            const member = selectedTeam.members.find(item => item.userId === selectedMemberDetailUserId);
            if (!member) return null;
            const detail = memberDetails[member.userId];
            const display = getMemberDisplay(member);
            const detailRows = detail ? visibleMemberDetailRows(detail) : [
              { label: "Full Name", value: display.name },
              { label: "Email", value: display.email },
              { label: "Joined At", value: member.joinedAt ? new Date(member.joinedAt).toLocaleString() : "-" },
              { label: "Active", value: member.active ? "Yes" : "No" },
            ];
            return renderCenteredModal(
              "Member Detail",
              () => setSelectedMemberDetailUserId(null),
              <>
                <div style={{ fontWeight: 800, fontSize: 14, color: COLORS.textPrimary }}>
                  {display.name}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                  {detailRows.map(row => (
                    <div key={row.label} className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.45)", border: `1px solid ${COLORS.border}` }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: COLORS.textSecondary }}>{row.label.toUpperCase()}</div>
                      <div style={{ fontSize: 12, color: COLORS.textPrimary, marginTop: 3, wordBreak: "break-word" }}>
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>
              </>,
            );
          })()}
          {leaderActionPanel === "removeMember" && canEditRoster && renderCenteredModal(
            "Remove Member",
            () => setLeaderActionPanel(null),
            <>
              <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 }}>
                Select a member and enter the reason. The removed member will receive this reason by notification.
              </div>
              <label className="block">
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
                  MEMBER
                </span>
                <select
                  value={removeMemberName}
                  onChange={event => setRemoveMemberName(event.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                  disabled={removableMembers.length === 0 || loading.remove}
                >
                  <option value="" disabled hidden>Select a member...</option>
                  {removableMembers.map(member => {
                    const display = getMemberDisplay(member);
                    const email = display.email !== "-" && display.email !== display.name ? ` - ${display.email}` : "";
                    return (
                      <option key={member.userId} value={member.userId}>
                        {display.name}{email}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className="block mt-4">
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
                  REMOVAL REASON
                </span>
                <textarea
                  value={removeMemberReason}
                  onChange={event => setRemoveMemberReason(event.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
                  rows={4}
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                  disabled={loading.remove}
                />
              </label>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="ghost"
                  size="md"
                  disabled={loading.remove}
                  onClick={() => setLeaderActionPanel(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  icon={loading.remove ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  disabled={!removeMemberName.trim() || !removeMemberReason.trim() || loading.remove}
                  onClick={() => removeMemberByName(selectedTeam)}
                >
                  {loading.remove ? "Removing..." : "Remove Member"}
                </Button>
              </div>
            </>,
          )}
          {leaderActionPanel === "transferLeadership" && renderCenteredModal(
            "Transfer Leadership",
            () => setLeaderActionPanel(null),
            <>
              {transferableMembers.length === 0 && (
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.45)", border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 13 }}>
                  There are no other active members available to receive leadership.
                </div>
              )}
              {transferableMembers.length > 0 && <div className="space-y-3">
                {transferableMembers.map(member => {
                  const display = getMemberDisplay(member);
                  return (
                    <div
                      key={member.userId}
                      className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.45)", border: `1px solid ${COLORS.border}` }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                          {display.name}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
                          Email: {display.email}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
                          Joined: {member.joinedAt ? new Date(member.joinedAt).toLocaleString() : "-"}
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={loading.transferLeader ? <Loader size={13} className="animate-spin" /> : <Crown size={13} />}
                        disabled={loading.transferLeader}
                        onClick={() => {
                          setNewLeaderUserId(member.userId);
                          transferLeadership(selectedTeam, member.userId);
                        }}
                      >
                        {loading.transferLeader ? "Transferring..." : "Transfer"}
                      </Button>
                    </div>
                  );
                })}
              </div>}
            </>,
          )}
          {leaderActionPanel === "joinRequests" && renderCenteredModal(
            "Join Requests",
            () => setLeaderActionPanel(null),
            <>
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
                <Field label="RESPONSE NOTE" value={form.responseNote} onChange={value => setField("responseNote", value)} />
              </div>
            </>,
          )}
          {renderRegistrationExpiredModal()}
        </Card>

        {isLeader && (canEditRoster || canWithdrawApprovalRequest) && (
          <div className="flex justify-end gap-2">
            {canEditRoster && (
              <Button
                variant="danger"
                size="md"
                icon={loading.disband ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                disabled={loading.disband}
                onClick={() => setConfirmAction({ kind: "disband" })}
              >
                {loading.disband ? "Disbanding..." : "Disband Team"}
              </Button>
            )}
            {canWithdrawApprovalRequest ? (
              <Button
                variant="outline"
                size="md"
                icon={loading.withdraw ? <Loader size={14} className="animate-spin" /> : <Undo2 size={14} />}
                disabled={loading.withdraw}
                onClick={withdrawTeamApprovalRequest}
              >
                {loading.withdraw ? "Withdrawing..." : "Withdraw Request"}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                style={{ minWidth: 180, justifyContent: "center" }}
                icon={loading.register ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                disabled={!canSubmitForApproval || loading.register}
                onClick={submitTeamForApproval}
              >
                {loading.register ? "Sending..." : "Request Approval"}
              </Button>
            )}
          </div>
        )}

        {confirmAction && (() => {
          const isLeaderLeaving = confirmAction.kind === "leave" && isLeader;
          const title = confirmAction.kind === "leave" ? "Leave team?"
            : confirmAction.kind === "kick" ? "Remove member?"
            : confirmAction.kind === "disband" ? "Disband team?"
            : "Transfer leadership?";
          const description = confirmAction.kind === "leave"
            ? (isLeaderLeaving
                ? (successorMember
                    ? `You are the team leader. If you leave, leadership will automatically transfer to ${getMemberDisplay(successorMember).name} (earliest member). You can also use "Make Leader" first to pick someone else.`
                    : "You are the only member. Leaving will delete this team permanently, including all pending join requests.")
                : "You will leave this team. You can request to join another team afterwards.")
            : confirmAction.kind === "kick"
              ? `Remove ${confirmAction.name} from the team? They can request to join again later.`
              : confirmAction.kind === "disband"
                ? "This will permanently delete the team, its membership history and all pending join requests. This cannot be undone."
                : `Make ${confirmAction.name} the new team leader? You will become a regular member and lose leader controls.`;
          const confirmLabel = confirmAction.kind === "leave" ? "Leave team"
            : confirmAction.kind === "kick" ? "Remove"
            : confirmAction.kind === "disband" ? "Disband"
            : "Transfer";
          const onConfirm = () => {
            const action = confirmAction;
            setConfirmAction(null);
            if (action.kind === "leave") leaveTeam();
            else if (action.kind === "kick") removeMember(action.userId);
            else if (action.kind === "disband") disbandTeam();
            else transferLeadershipTo(action.userId);
          };
          return renderCenteredModal(
            title,
            () => setConfirmAction(null),
            <>
              <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>{description}</div>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>Cancel</Button>
                <Button
                  variant={confirmAction.kind === "makeLeader" ? "primary" : "danger"}
                  size="sm"
                  onClick={onConfirm}
                >
                  {confirmLabel}
                </Button>
              </div>
            </>,
          );
        })()}

        {false && isLeader && (() => {
          const teamEvent = events.find(event => event.eventId === selectedTeam!.eventId);
          const activeMemberCount = selectedTeam!.members.filter(member => member.active).length;
          const minTeamSize = teamEvent?.minTeamSize ?? 0;
          const maxTeamSize = teamEvent?.maxTeamSize ?? 0;
          const sizeOk = (!minTeamSize || activeMemberCount >= minTeamSize)
            && (!maxTeamSize || activeMemberCount <= maxTeamSize);
          const sizeLabel = `${activeMemberCount} / ${minTeamSize ?? "?"}–${maxTeamSize ?? "?"}`;

          return (
            <Card className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary }}>Leader Actions</div>
                <span
                  className="px-2 py-1 rounded-lg"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: sizeOk ? `${COLORS.success}12` : `${COLORS.error}12`,
                    color: sizeOk ? COLORS.success : COLORS.error,
                  }}
                >
                  Members: {sizeLabel}
                </span>
              </div>
              {message && (
                <div className="mb-4">
                  <InlineMessage tone={message!.tone} message={message!.text} />
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Eye size={14} />}
                  onClick={() => setLeaderActionPanel(current => current === "memberDetail" ? null : "memberDetail")}
                >
                  Member Detail
                </Button>
                {canEditRoster && (
                  <>
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
                        loadRequests(selectedTeam!.teamId);
                      }}
                    >
                      {loading.requests ? "Loading..." : "Load Join Requests"}
                    </Button>
                  </>
                )}
              </div>
              {renderLeaderActionPanel()}
            </Card>
          );
        })()}
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
                Join
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
                {loading.events && <option value="">Loading events...</option>}
                {!loading.events && approvedEvents.length === 0 && (
                  <option value="">No open events available</option>
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
              No events are currently open for registration.
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
              Join
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
                        Join
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
