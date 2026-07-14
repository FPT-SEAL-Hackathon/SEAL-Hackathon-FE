import { useCallback, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar, Trophy, Users, Clock, Bell, CheckCircle,
  ExternalLink, Edit, PlusCircle, AlertCircle, Info,
  User, Mail, Github, Globe, TrendingUp, TrendingDown,
  Minus, ChevronRight, Star, Zap, Target, Award, FileText,
  MapPin, Phone, Save, Download, Eye, MessageSquare, Search, Trash2
} from "lucide-react";
import {
  StatCard, Card, SectionHeader, COLORS, StatusBadge,
  ProgressBar, DataTable, Button, AvatarGroup, TimelineItem
} from "@/components/shared/UIComponents";
import { useAuth } from "@/features/auth/store/authStore";
import { ApiError, getAccessToken, parseApiError } from "@/lib/api/apiClient";
import { eventService, type EventResponse, type EventStatus as EventLifecycleStatus, type UserParticipationStatus } from "@/features/events/api/eventService";
import { roundService } from "@/features/events/service/roundService";
import type { Round } from "@/features/events/types/round";
import { getRoundStatus } from "@/features/events/utils/roundUtils";
import { notificationService } from "@/features/notifications/api/notificationService";
import { MyMentor } from "@/pages/team/MyMentor";
import { TeamConsultations } from "@/pages/team/TeamConsultations";
import { rankingService } from "@/features/rankings/api/rankingService";
import { submissionService, type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { hasSubmissionUrlErrors, validateSubmissionUrls, type SubmissionUrlErrors } from "@/features/submissions/utils/urlValidation";
import { TeamApiPanel } from "@/features/teams/components/TeamApiPanel";
import { getTeamStatusInfo, isTeamActive, teamService, type JoinTeamRequestResponse, type TeamResponse } from "@/features/teams/api/teamService";
import { discoverUserTeamsForEvents, rememberUserTeam } from "@/features/teams/api/userTeamDiscovery";
import { awardService, type AwardResponse } from "@/features/awards/api/awardService";
import { judgingService, type JudgingDTO } from "@/features/judging/api/judgingService";
import {
  eventParticipantService,
  type EventParticipantResponse,
  type EventParticipantStatus,
} from "@/features/eventParticipants/api/eventParticipantService";





const avatarColors = ["#4F46E5", "#06B6D4", "#8B5CF6", "#22C55E", "#F59E0B"];
const ACTIVE_TEAM_STORAGE_KEY = "seal_active_team";
const ACTIVE_SUBMISSION_ROUND_STORAGE_KEY = "seal_active_submission_round";
const EVENTS_RELOAD_MIN_INTERVAL_MS = 15_000;

type ActiveTeamContext = {
  teamId: string;
  eventId?: string;
  categoryId?: string;
  teamName?: string;
  leaderUserId?: string;
  teamStatusId?: string;
  teamStatusName?: string;
  userId?: string;
  memberUserIds?: string[];
};

function teamToActiveContext(team: Awaited<ReturnType<typeof teamService.getById>>, userId?: string): ActiveTeamContext {
  return {
    teamId: team.teamId,
    eventId: team.eventId,
    categoryId: team.categoryId,
    teamName: team.teamName,
    leaderUserId: team.leaderUserId,
    teamStatusId: team.teamStatusId,
    teamStatusName: team.teamStatusName,
    userId,
    memberUserIds: team.members.map(member => member.userId),
  };
}

function isActiveTeamContext(team?: ActiveTeamContext | null) {
  return getTeamStatusInfo(team?.teamStatusId, team?.teamStatusName).badge === "active";
}

function getStoredActiveTeam(userId?: string): ActiveTeamContext | null {
  try {
    const raw = localStorage.getItem(ACTIVE_TEAM_STORAGE_KEY);
    if (!raw) return null;
    const team = JSON.parse(raw) as ActiveTeamContext;
    if (!team?.teamId) return null;
    const belongsToStoredTeam = !userId
      || team.userId === userId
      || team.leaderUserId === userId
      || team.memberUserIds?.includes(userId);
    return belongsToStoredTeam ? team : null;
  } catch {
    return null;
  }
}

function getStoredSubmissionRound(teamId?: string) {
  if (!teamId) return "";
  try {
    const raw = localStorage.getItem(ACTIVE_SUBMISSION_ROUND_STORAGE_KEY);
    const roundsByTeam = raw ? JSON.parse(raw) as Record<string, string> : {};
    return roundsByTeam[teamId] ?? "";
  } catch {
    return "";
  }
}

function setStoredSubmissionRound(teamId: string | undefined, roundId: string) {
  if (!teamId) return;
  try {
    const raw = localStorage.getItem(ACTIVE_SUBMISSION_ROUND_STORAGE_KEY);
    const roundsByTeam = raw ? JSON.parse(raw) as Record<string, string> : {};
    if (roundId) {
      roundsByTeam[teamId] = roundId;
    } else {
      delete roundsByTeam[teamId];
    }
    localStorage.setItem(ACTIVE_SUBMISSION_ROUND_STORAGE_KEY, JSON.stringify(roundsByTeam));
  } catch {
    // Ignore storage failures; the in-memory selection still works.
  }
}

type MemberEvent = {
  eventId: string;
  eventName: string;
  description?: string;
  eventStartDate?: string;
  eventEndDate?: string;
  registrationStart?: string;
  registrationEnd?: string;
  location?: string;
  mode?: string;
  eventStatus: EventLifecycleStatus | string;
  participantStatus: EventCardParticipationStatus;
  participants: string;
  tracks: string;
  registered?: boolean;
  prizePool: string;
  eventParticipantId?: string | null;
  rejectedReason?: string | null;
  appliedAt?: string | null;
  approvedAt?: string | null;
};

type EventCardParticipationStatus = UserParticipationStatus;

const participantStatusLabels: Record<EventCardParticipationStatus, string> = {
  NOT_REGISTERED: "Register for Event",
  PENDING: "Pending Approval",
  ACTIVE: "Approved",
  REJECTED: "Rejected",
};

const restrictedParticipationMessage: Record<Exclude<EventCardParticipationStatus, "ACTIVE" | "NOT_REGISTERED">, string> = {
  PENDING: "Waiting for organizer approval.",
  REJECTED: "Registration rejected.",
};

function normalizeParticipationStatus(status?: string | null): EventCardParticipationStatus {
  const value = String(status ?? "").trim().replace(/[-\s]+/g, "_").toUpperCase();
  if (!value || value === "NOT_REGISTERED") return "NOT_REGISTERED";
  if (value === "PENDING_APPROVAL") return "PENDING";
  if (value === "PENDING" || value === "ACTIVE" || value === "REJECTED") return value as EventCardParticipationStatus;
  return "NOT_REGISTERED";
}

function mapEvent(event: EventResponse): MemberEvent {
  const participantStatus = normalizeParticipationStatus(event.participantStatus);
  return {
    eventId: event.eventId,
    eventName: event.eventName,
    description: event.description ?? "",
    eventStartDate: event.eventStartDate,
    eventEndDate: event.eventEndDate,
    registrationStart: event.registrationStart,
    registrationEnd: event.registrationEnd,
    location: event.location,
    eventStatus: typeof event.eventStatus === "object" ? event.eventStatus.eventStatusName : event.eventStatusName,
    participants: "N/A",
    tracks: "N/A",
    prizePool: "N/A",
    participantStatus,
  };
}

function mergeEventParticipation(event: MemberEvent, participation?: EventParticipantResponse): MemberEvent {
  if (!participation) return event;
  return {
    ...event,
    eventParticipantId: participation.eventParticipantId ?? event.eventParticipantId,
    participantStatus: statusFromParticipation(participation),
    rejectedReason: participation.rejectedReason ?? event.rejectedReason,
    appliedAt: participation.appliedAt ?? event.appliedAt,
    approvedAt: participation.approvedAt ?? event.approvedAt,
  };
}

function normalizeEventStatusKey(status?: string | null) {
  return status?.trim().replace(/[\s-]+/g, "_").toUpperCase() ?? "";
}

function registrationUnavailableReason(event?: Pick<MemberEvent, "eventStatus" | "registrationStart" | "registrationEnd"> | null) {
  if (!event) return "Registration unavailable";

  const status = normalizeEventStatusKey(String(event.eventStatus || ""));
  if (status !== "REGISTRATION_OPEN") return "Registration not open";

  const registrationStart = new Date(event.registrationStart ?? "").getTime();
  const registrationEnd = new Date(event.registrationEnd ?? "").getTime();
  const now = Date.now();
  if (Number.isNaN(registrationStart) || now < registrationStart) return "Not open yet";
  if (Number.isNaN(registrationEnd) || now > registrationEnd) return "Deadline passed";

  return "";
}

type MemberNotification = {
  id: string;
  title: string;
  body: string;
  eventId?: string;
  type: "info" | "success" | "warning";
  time: string;
  read: boolean;
};

type MemberTeamMember = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  skills: string[];
  tasks: number;
  completed: number;
  email: string;
};

const getInitials = (name?: string) =>
  (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join("") || "U";

function statusFromParticipation(participation: EventParticipantResponse): EventCardParticipationStatus {
  return normalizeParticipationStatus(participation.participantStatus);
}

function isApprovedParticipationStatus(status?: string | null) {
  return status === "ACTIVE";
}

function formatSubmissionDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("en-US") : "Not submitted";
}

function parseDateTime(value?: string | null) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function normalizeRoundStatusName(round?: Round | null) {
  return (getRoundStatus(round?.roundStatusId ?? "")?.statusName ?? "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

function roundStatusLabel(round?: Round | null) {
  return getRoundStatus(round?.roundStatusId ?? "")?.statusName?.trim() || "Unknown";
}

function getSubmissionRoundState(round?: Round | null) {
  const now = Date.now();
  const startTime = parseDateTime(round?.startDate);
  const deadlineTime = parseDateTime(round?.submissionDeadline);
  const status = normalizeRoundStatusName(round);
  const hasStarted = !startTime || now >= startTime;
  const deadlinePassed = Boolean(deadlineTime && now > deadlineTime);
  const statusAllowsSubmission = status === "submission_open" || status === "open";
  const statusClosed = ["judging", "completed", "closed"].includes(status);
  const canSubmit = !!round
    && isOfficialSubmissionRound(round)
    && statusAllowsSubmission
    && hasStarted
    && !deadlinePassed;

  let reason = "";
  if (!round) {
    reason = "Select a round to submit work.";
  } else if (!isOfficialSubmissionRound(round)) {
    reason = "Only official competition rounds accept team submissions.";
  } else if (deadlinePassed) {
    reason = "The submission deadline has passed.";
  } else if (!hasStarted) {
    reason = "Round has not started yet.";
  } else if (!statusAllowsSubmission || statusClosed) {
    reason = `Round is ${roundStatusLabel(round)} and is not accepting submissions.`;
  }

  return {
    canSubmit,
    canDownloadProblem: Boolean(round) && hasStarted,
    deadlinePassed,
    hasStarted,
    statusAllowsSubmission,
    statusClosed,
    reason,
  };
}

function isBeforeSubmissionDeadline(round?: Round) {
  return !getSubmissionRoundState(round).deadlinePassed;
}

function isOfficialSubmissionRound(round: Round) {
  return !round.isCalibrationRound;
}

export function MemberDashboard({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  const { user } = useAuth();
  const submissionFormRef = useRef<HTMLDivElement | null>(null);
  const displayName = user?.fullName || user?.email || "Member";
  const userInitials = getInitials(displayName);
  const studentCode = user?.fptStudentCode ?? user?.externalStudentCode ?? "";

  // ── Events ──────────────────────────────────────────────────────────────────
  const [apiEvents, setApiEvents] = useState<MemberEvent[]>([]);
  const [participations, setParticipations] = useState<Record<string, EventParticipantResponse>>({});
  const [eventsError, setEventsError] = useState("");
  const [eventActionLoading, setEventActionLoading] = useState<Record<string, boolean>>({});
  const [eventActionMessage, setEventActionMessage] = useState<Record<string, string>>({});
  const [selectedEventDetailId, setSelectedEventDetailId] = useState<string | null>(null);
  const [teamInitialEventId, setTeamInitialEventId] = useState("");
  const [apiLeaderboard, setApiLeaderboard] = useState<any[]>([]);
  const [teamMembers] = useState<MemberTeamMember[]>([]);
  const eventsRequestInFlightRef = useRef(false);
  const lastEventsLoadAtRef = useRef(0);
  const loadEvents = useCallback(() => {
    const now = Date.now();
    if (
      eventsRequestInFlightRef.current
      || (lastEventsLoadAtRef.current > 0 && now - lastEventsLoadAtRef.current < EVENTS_RELOAD_MIN_INTERVAL_MS)
    ) {
      return () => { };
    }

    let cancelled = false;
    eventsRequestInFlightRef.current = true;
    lastEventsLoadAtRef.current = now;
    const hasToken = !!getAccessToken();
    const eventsRequest = hasToken ? eventService.getAll(true) : eventService.getPublic();
    const participationsRequest = hasToken
      ? eventParticipantService.getMyParticipations().catch(error => {
        const parsed = parseApiError(error);
        if (parsed.status === 401) {
          setEventsError("Your session has expired. Please sign in again.");
        } else {
          setEventsError(parsed.message || "Could not load your registration statuses.");
        }
        return [] as EventParticipantResponse[];
      })
      : Promise.resolve([] as EventParticipantResponse[]);

    Promise.all([eventsRequest, participationsRequest])
      .then(([data, myParticipations]) => {
        if (cancelled) return;
        const participationByEvent = Object.fromEntries(
          myParticipations
            .filter(participation => participation.eventId)
            .map(participation => [participation.eventId, participation]),
        );
        setParticipations(participationByEvent);
        setApiEvents(data.map(event => mergeEventParticipation(mapEvent(event), participationByEvent[event.eventId])));
        if (myParticipations.length > 0 || !hasToken) setEventsError("");
      })
      .catch(error => {
        if (cancelled) return;
        setApiEvents([]);
        setParticipations({});
        setEventsError(parseApiError(error).message || "Could not load events.");
      })
      .finally(() => {
        eventsRequestInFlightRef.current = false;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const handleFocus = () => {
      loadEvents();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [loadEvents]);

  // ── Notifications ────────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState<MemberNotification[]>([]);
  useEffect(() => {
    notificationService.getMyNotifications()
      .then(page => {
        if (page?.content?.length) {
          setNotifs(page.content.map((n: any) => {
            const title = n.title || "";
            let type: "info" | "success" | "warning" = "info";
            if (title.includes("Approved")) type = "success";
            else if (title.includes("Rejected")) type = "warning";
            return {
              id: n.notificationId, title: n.title, body: n.body,
              eventId: n.eventId,
              type, time: new Date(n.createdAt).toLocaleDateString("en-US"), read: n.read,
            };
          }));
        }
      })
      .catch(() => { });
  }, []);

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName ?? "",
    studentId: studentCode ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    github: "", portfolio: "",
    bio: "", major: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [activeTeamContext, setActiveTeamContext] = useState<ActiveTeamContext | null>(() => getStoredActiveTeam(user?.userId));
  const [submissionTeams, setSubmissionTeams] = useState<ActiveTeamContext[]>([]);
  const [submissionTeamsLoading, setSubmissionTeamsLoading] = useState(false);
  const [submissionParticipation, setSubmissionParticipation] = useState<EventParticipantResponse | null>(null);
  const [submissionParticipationLoading, setSubmissionParticipationLoading] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    teamId: activeTeamContext?.teamId ?? "",
    roundId: "",
    submissionName: "",
    repositoryUrl: "",
    demoUrl: "",
    reportUrl: "",
    slideUrl: "",
  });
  const [submissionRounds, setSubmissionRounds] = useState<Round[]>([]);
  const [allSubmissionRounds, setAllSubmissionRounds] = useState<Round[]>([]);
  const [submissionRoundsLoading, setSubmissionRoundsLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [submissionFieldErrors, setSubmissionFieldErrors] = useState<SubmissionUrlErrors>({});
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionLookupLoading, setSubmissionLookupLoading] = useState(false);
  useEffect(() => {
    if (currentPage !== "leaderboard") return;
    if (!activeTeamContext?.eventId || !activeTeamContext?.categoryId) return;
    
    rankingService.getLeaderboard(activeTeamContext.eventId, activeTeamContext.categoryId)
      .then(setApiLeaderboard)
      .catch(() => { setApiLeaderboard([]); });
  }, [currentPage, activeTeamContext?.eventId, activeTeamContext?.categoryId]);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionResponse[]>([]);
  const [submissionHistoryLoading, setSubmissionHistoryLoading] = useState(false);
  const [problemDownloadLoading, setProblemDownloadLoading] = useState<"csv" | "zip" | null>(null);
  const [pendingRequests, setPendingRequests] = useState<JoinTeamRequestResponse[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [handlingRequestId, setHandlingRequestId] = useState<string | null>(null);
  const [judgingScores, setJudgingScores] = useState<JudgingDTO[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [certificateAwards, setCertificateAwards] = useState<AwardResponse[]>([]);
  const [certificateCategoryId, setCertificateCategoryId] = useState("all");
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateError, setCertificateError] = useState("");
  const [certificateActionLoading, setCertificateActionLoading] = useState<Record<string, "view" | "download">>({});

  useEffect(() => {
    if (currentPage !== "submissions") return;
    if (!user?.userId || apiEvents.length === 0) {
      setSubmissionTeams([]);
      return;
    }

    let cancelled = false;
    const storedTeam = getStoredActiveTeam(user?.userId);
    const storedSubmissionTeam = isActiveTeamContext(storedTeam) ? storedTeam : null;
    setActiveTeamContext(storedSubmissionTeam);
    if (storedSubmissionTeam?.teamId) {
      setSubmissionForm(prev => ({ ...prev, teamId: storedSubmissionTeam.teamId }));
    } else {
      setSubmissionForm(prev => ({ ...prev, teamId: "" }));
    }

    setSubmissionTeamsLoading(true);
    discoverUserTeamsForEvents(apiEvents, user.userId, { activeOnly: true })
      .then(results => {
        if (cancelled) return;
        const userTeams = results.map(team => teamToActiveContext(team, user.userId));

        setSubmissionTeams(userTeams);

        const selectedTeam = (storedSubmissionTeam?.teamId
          ? userTeams.find(team => team.teamId === storedSubmissionTeam.teamId)
          : null) ?? userTeams[0] ?? null;

        setActiveTeamContext(selectedTeam);
        setSubmissionForm(prev => {
          const nextTeamId = selectedTeam?.teamId ?? "";
          const teamChanged = prev.teamId !== nextTeamId;
          return {
            ...prev,
            teamId: nextTeamId,
            roundId: teamChanged ? "" : prev.roundId,
          };
        });
        setSubmissionStatus("");

        if (selectedTeam) {
          localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, JSON.stringify(selectedTeam));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSubmissionTeams([]);
          if (storedSubmissionTeam?.teamId) {
            teamService.getById(storedSubmissionTeam.teamId)
              .then(team => {
                if (cancelled) return;
                if (!isTeamActive(team.teamStatusId, team.teamStatusName)) {
                  setActiveTeamContext(null);
                  setSubmissionForm(prev => ({ ...prev, teamId: "" }));
                  return;
                }
                const refreshedTeam = teamToActiveContext(team, user.userId);
                setSubmissionTeams([refreshedTeam]);
                setActiveTeamContext(refreshedTeam);
                setSubmissionForm(prev => ({ ...prev, teamId: refreshedTeam.teamId }));
                localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, JSON.stringify(refreshedTeam));
              })
              .catch(() => {
                // Submission API remains the source of truth if refreshing the team fails.
              });
          }
        }
      })
      .finally(() => {
        if (!cancelled) setSubmissionTeamsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiEvents, currentPage, user?.userId]);

  useEffect(() => {
    if (currentPage !== "submissions") return;
    const storedTeam = getStoredActiveTeam(user?.userId);
    if (storedTeam?.teamId && isActiveTeamContext(storedTeam) && submissionTeams.length === 0) {
      teamService.getById(storedTeam.teamId)
        .then(team => {
          if (!isTeamActive(team.teamStatusId, team.teamStatusName)) {
            setActiveTeamContext(null);
            setSubmissionForm(prev => ({ ...prev, teamId: "" }));
            return;
          }
          const refreshedTeam = teamToActiveContext(team, user?.userId);
          setActiveTeamContext(refreshedTeam);
          setSubmissionTeams([refreshedTeam]);
          setSubmissionForm(prev => ({ ...prev, teamId: refreshedTeam.teamId }));
          localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, JSON.stringify(refreshedTeam));
        })
        .catch(() => {
          // Submission API remains the source of truth if refreshing the team fails.
        });
    }
  }, [currentPage, submissionTeams.length, user?.userId]);

  useEffect(() => {
    if (currentPage !== "certificates") return;
    const storedTeam = getStoredActiveTeam(user?.userId);
    setActiveTeamContext(storedTeam);

    if (!storedTeam?.eventId) {
      setCertificateAwards([]);
      setCertificateError("");
      setCertificateCategoryId("all");
      return;
    }

    let cancelled = false;
    setCertificateLoading(true);
    setCertificateError("");
    awardService.getByEvent(storedTeam.eventId)
      .then(awards => {
        if (cancelled) return;
        const visibleAwards = awards.filter((award: any) => (
          (!storedTeam.teamId || award.teamId === storedTeam.teamId)
          && (!storedTeam.categoryId || award.categoryId === storedTeam.categoryId)
          && award.isPublished
        ));
        setCertificateAwards(visibleAwards);
        setCertificateCategoryId(prev => {
          if (prev === "all" || visibleAwards.some((award: any) => award.categoryId === prev)) return prev;
          return storedTeam.categoryId ?? "all";
        });
      })
      .catch(error => {
        if (cancelled) return;
        setCertificateAwards([]);
        setCertificateError(error instanceof Error ? error.message : "Could not load certificates.");
      })
      .finally(() => {
        if (!cancelled) setCertificateLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, user?.userId]);

  useEffect(() => {
    if (currentPage !== "submissions" || !activeTeamContext?.eventId) {
      setSubmissionParticipation(null);
      return;
    }
    let cancelled = false;
    setSubmissionParticipationLoading(true);
    eventParticipantService.getMyParticipation(activeTeamContext.eventId)
      .then(participation => {
        if (!cancelled) setSubmissionParticipation(participation);
      })
      .catch(() => {
        if (!cancelled) setSubmissionParticipation(null);
      })
      .finally(() => {
        if (!cancelled) setSubmissionParticipationLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTeamContext?.eventId, currentPage]);

  useEffect(() => {
    if (currentPage !== "submissions" || !activeTeamContext?.categoryId) {
      setSubmissionRounds([]);
      setAllSubmissionRounds([]);
      setSubmissionHistory([]);
      return;
    }
    let cancelled = false;
    setSubmissionRoundsLoading(true);
    roundService.getByCategory(activeTeamContext.categoryId)
      .then(rounds => {
        if (cancelled) return;
        const officialRounds = rounds.filter(isOfficialSubmissionRound);
        setAllSubmissionRounds(rounds);
        setSubmissionRounds(officialRounds);
        setSubmissionForm(prev => ({
          ...prev,
          roundId: officialRounds.some(round => round.roundId === prev.roundId)
            ? prev.roundId
            : officialRounds.some(round => round.roundId === getStoredSubmissionRound(prev.teamId))
              ? getStoredSubmissionRound(prev.teamId)
              : "",
        }));
      })
      .catch(() => {
        if (!cancelled) {
          setAllSubmissionRounds([]);
          setSubmissionRounds([]);
        }
      })
      .finally(() => {
        if (!cancelled) setSubmissionRoundsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTeamContext?.categoryId, currentPage]);

  const loadSubmissionHistory = useCallback(async () => {
    if (currentPage !== "submissions" || !submissionForm.teamId) {
      setSubmissionHistory([]);
      return;
    }

    setSubmissionHistoryLoading(true);
    try {
      const directResults = allSubmissionRounds.length > 0
        ? await Promise.all(
          allSubmissionRounds.map(round =>
            submissionService.getByTeamAndRound(submissionForm.teamId, round.roundId)
              .then(submission => submission)
              .catch(() => null),
          ),
        )
        : [];
      const eventResults = activeTeamContext?.eventId
        ? await submissionService.getByEvent(activeTeamContext.eventId)
          .then(submissions => submissions.filter(submission => submission.teamId === submissionForm.teamId))
          .catch(() => [])
        : [];
      const uniqueSubmissions = new Map<string, SubmissionResponse>();
      [...directResults, ...eventResults]
        .filter((submission): submission is SubmissionResponse => Boolean(submission?.submissionId))
        .forEach(submission => uniqueSubmissions.set(submission.submissionId, submission));

      setSubmissionHistory(
        Array.from(uniqueSubmissions.values())
          .sort((a, b) => {
            const aTime = new Date(a.submittedAt || a.lastUpdatedAt || 0).getTime();
            const bTime = new Date(b.submittedAt || b.lastUpdatedAt || 0).getTime();
            return bTime - aTime;
          }),
      );
    } finally {
      setSubmissionHistoryLoading(false);
    }
  }, [activeTeamContext?.eventId, allSubmissionRounds, currentPage, submissionForm.teamId]);

  useEffect(() => {
    void loadSubmissionHistory();
  }, [loadSubmissionHistory]);

  const loadRequests = useCallback(async () => {
    if (!activeTeamContext?.teamId) {
      setPendingRequests([]);
      return;
    }
    setRequestsLoading(true);
    try {
      setPendingRequests(await teamService.getPendingRequests(activeTeamContext.teamId));
    } finally {
      setRequestsLoading(false);
    }
  }, [activeTeamContext?.teamId]);

  useEffect(() => {
    if (currentPage !== "requests") return;
    void loadRequests();
  }, [currentPage, loadRequests]);

  const handleRequest = async (requestId: string, action: "APPROVED" | "REJECTED") => {
    setHandlingRequestId(requestId);
    try {
      await teamService.handleJoinRequest(requestId, action);
      setPendingRequests(prev => prev.filter(request => request.requestId !== requestId));
    } finally {
      setHandlingRequestId(null);
    }
  };

  const loadFeedback = async () => {
    const targetSubmission = (submissionForm.roundId
      ? submissionHistory.find(submission => submission.roundId === submissionForm.roundId)
      : null) ?? submissionHistory[0];

    if (!targetSubmission?.submissionId) {
      setFeedbackError("Load or select a submitted round first.");
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError("");
    try {
      setJudgingScores(await judgingService.getBySubmission(targetSubmission.submissionId));
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Could not load feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  useEffect(() => {
    if (currentPage !== "submissions" || !submissionForm.teamId || !submissionForm.roundId) return;

    let cancelled = false;
    setSubmissionLookupLoading(true);
    submissionService.getByTeamAndRound(submissionForm.teamId, submissionForm.roundId)
      .then(submission => {
        if (cancelled) return;
        setSubmissionHistory(prev => [submission, ...prev.filter(item => item.submissionId !== submission.submissionId)]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSubmissionLookupLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, submissionForm.teamId, submissionForm.roundId]);

  const unread = notifs.filter(n => !n.read).length;
  const markRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await notificationService.markAsRead(String(id)); } catch { /* ignore */ }
  };
  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    try { await notificationService.markAllAsRead(); } catch { /* ignore */ }
  };
  const openNotification = async (notification: MemberNotification) => {
    await markRead(notification.id);
    if (notification.eventId) onNavigate("events");
  };

  const handleSubmitWork = async () => {
    if (activeTeamContext?.eventId && !isApprovedParticipationStatus(submissionParticipation?.participantStatus)) {
      setSubmissionStatus("You must be approved by the organizer before accessing competition activities.");
      return;
    }
    if (activeTeamContext?.leaderUserId !== user?.userId) {
      setSubmissionStatus("Only the team leader can submit or update team work.");
      return;
    }
    if (activeTeamContext?.teamStatusId && !isTeamActive(activeTeamContext.teamStatusId, activeTeamContext.teamStatusName)) {
      setSubmissionStatus("Only active teams can submit work. Your team is waiting for organizer approval.");
      return;
    }
    if (!submissionForm.teamId || !submissionForm.roundId) {
      setSubmissionStatus("Please select a round before submitting.");
      return;
    }
    const selectedRound = submissionRounds.find(round => round.roundId === submissionForm.roundId);
    const roundState = getSubmissionRoundState(selectedRound);
    if (!roundState.canSubmit) {
      setSubmissionStatus(roundState.reason || "This round is not accepting submissions.");
      return;
    }
    if (!submissionForm.submissionName.trim()) {
      setSubmissionStatus("Submission name is required.");
      return;
    }
    const urlErrors = validateSubmissionUrls(submissionForm);
    setSubmissionFieldErrors(urlErrors);
    if (hasSubmissionUrlErrors(urlErrors)) {
      setSubmissionStatus("Please enter valid URLs or leave optional URL fields blank.");
      return;
    }
    setSubmissionLoading(true);
    setSubmissionStatus("");
    try {
      const payload = {
        teamId: submissionForm.teamId,
        roundId: submissionForm.roundId,
        repositoryUrl: submissionForm.repositoryUrl.trim(),
        demoUrl: submissionForm.demoUrl.trim(),
        reportUrl: submissionForm.reportUrl.trim(),
        slideUrl: submissionForm.slideUrl.trim(),
        notes: submissionForm.submissionName.trim(),
      };
      const saved = await submissionService.submit(payload);
      setSubmissionHistory(prev => [saved, ...prev.filter(item => item.submissionId !== saved.submissionId)]);
      setSubmissionStatus("Submission saved.");
    } catch (error) {
      const parsed = parseApiError(error);
      setSubmissionFieldErrors(parsed.fieldErrors ?? {});
      setSubmissionStatus(parsed.message || "Submission failed.");
    } finally {
      setSubmissionLoading(false);
    }
  };

  const handleLoadSubmission = async () => {
    if (!submissionForm.teamId || !submissionForm.roundId) {
      setSubmissionStatus("Please select a round before loading the current submission.");
      return;
    }
    setSubmissionLookupLoading(true);
    setSubmissionStatus("");
    try {
      const submission = await submissionService.getByTeamAndRound(submissionForm.teamId, submissionForm.roundId);
      setSubmissionForm(prev => ({
        ...prev,
        submissionName: submission.notes ?? "",
        repositoryUrl: submission.repositoryUrl ?? "",
        demoUrl: submission.demoUrl ?? "",
        reportUrl: submission.reportUrl ?? "",
        slideUrl: submission.slideUrl ?? "",
      }));
      setSubmissionFieldErrors({});
      setSubmissionHistory(prev => [submission, ...prev.filter(item => item.submissionId !== submission.submissionId)]);
      setSubmissionStatus(`Current status: ${submission.submissionStatusName ?? "Loaded"}.`);
    } catch (error) {
      setSubmissionStatus(error instanceof Error ? error.message : "Could not load current submission.");
    } finally {
      setSubmissionLookupLoading(false);
    }
  };

  const handleDownloadProblem = async (type: "csv" | "zip") => {
    if (!submissionForm.roundId) {
      setSubmissionStatus("Please select a round before downloading the problem.");
      return;
    }
    setProblemDownloadLoading(type);
    setSubmissionStatus("");
    try {
      const blob = await submissionService.downloadProblem(submissionForm.roundId, type);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `round-${submissionForm.roundId}-problem.${type}`;
      link.click();
      URL.revokeObjectURL(url);
      setSubmissionStatus(`Problem ${type.toUpperCase()} downloaded.`);
    } catch (error) {
      setSubmissionStatus(error instanceof Error ? error.message : "Problem download failed.");
    } finally {
      setProblemDownloadLoading(null);
    }
  };

  const handlePrepareSubmissionUpdate = (submission: SubmissionResponse) => {
    const round = allSubmissionRounds.find(item => item.roundId === submission.roundId);
    if (!round || !isOfficialSubmissionRound(round)) {
      setSubmissionStatus("Only official competition rounds can be updated from Submission Center.");
      return;
    }
    const roundState = getSubmissionRoundState(round);
    if (!roundState.canSubmit) {
      setSubmissionStatus(roundState.reason || "This round is not accepting submissions.");
      return;
    }

    setSubmissionForm(prev => ({
      ...prev,
      roundId: submission.roundId,
      submissionName: submission.notes ?? "",
      repositoryUrl: submission.repositoryUrl ?? "",
      demoUrl: submission.demoUrl ?? "",
      reportUrl: submission.reportUrl ?? "",
      slideUrl: submission.slideUrl ?? "",
    }));
    setSubmissionFieldErrors({});
    setSubmissionStatus("Loaded submitted work. Update the fields and submit again before the deadline.");
    submissionFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectSubmissionTeam = (teamId: string) => {
    const nextTeam = submissionTeams.find(team => team.teamId === teamId) ?? null;
    const storedRoundId = getStoredSubmissionRound(teamId);
    setActiveTeamContext(nextTeam);
    setSubmissionForm(prev => ({
      ...prev,
      teamId,
      roundId: storedRoundId,
      submissionName: "",
      repositoryUrl: "",
      demoUrl: "",
      reportUrl: "",
      slideUrl: "",
    }));
    setSubmissionStatus("");
    setSubmissionFieldErrors({});
    setSubmissionHistory([]);
    setSubmissionParticipation(null);
    if (nextTeam) {
      localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, JSON.stringify(nextTeam));
    }
  };

  const selectSubmissionRound = (roundId: string) => {
    setStoredSubmissionRound(submissionForm.teamId, roundId);
    setSubmissionForm(prev => ({
      ...prev,
      roundId,
      submissionName: "",
      repositoryUrl: "",
      demoUrl: "",
      reportUrl: "",
      slideUrl: "",
    }));
    setSubmissionStatus("");
    setSubmissionFieldErrors({});
  };

  const handleTeamChange = useCallback((team: TeamResponse) => {
    const nextTeam = teamToActiveContext(team, user?.userId);
    setActiveTeamContext(nextTeam);
    setSubmissionTeams(prev => [nextTeam, ...prev.filter(item => item.teamId !== nextTeam.teamId)]);
    setSubmissionForm(prev => ({
      ...prev,
      teamId: nextTeam.teamId,
      roundId: prev.teamId === nextTeam.teamId ? prev.roundId : "",
    }));
    localStorage.setItem(ACTIVE_TEAM_STORAGE_KEY, JSON.stringify(nextTeam));
    rememberUserTeam(team, user?.userId);
  }, [user?.userId]);

  const selectedSubmissionRound = submissionRounds.find(item => item.roundId === submissionForm.roundId);
  const selectedSubmissionRoundState = getSubmissionRoundState(selectedSubmissionRound);
  const selectedSubmissionRoundOpen = selectedSubmissionRoundState.canSubmit;

  const renderSubmissionTeamSelector = () => (
    <Card className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <label className="block">
          <span className="flex items-center gap-2 mb-1" style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary }}>
            <Users size={14} /> Team
          </span>
          <select
            value={submissionForm.teamId}
            onChange={event => selectSubmissionTeam(event.target.value)}
            className="w-full px-3 py-2 rounded-lg outline-none"
            style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
            disabled={submissionTeamsLoading || submissionTeams.length === 0}
          >
            {submissionTeamsLoading && <option value="">Loading your teams...</option>}
            {!submissionTeamsLoading && submissionTeams.length === 0 && <option value="">No teams available</option>}
            {submissionTeams.map(team => (
              <option key={team.teamId} value={team.teamId}>
                {team.teamName ?? team.teamId}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="flex items-center gap-2 mb-1" style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary }}>
            <Clock size={14} /> Round
          </span>
          <select
            value={submissionForm.roundId}
            onChange={event => selectSubmissionRound(event.target.value)}
            className="w-full px-3 py-2 rounded-lg outline-none"
            style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
            disabled={submissionRoundsLoading}
          >
            <option value="" disabled hidden>Select a round...</option>
            {submissionRoundsLoading && <option value="">Loading rounds...</option>}
            {!submissionRoundsLoading && submissionRounds.length === 0 && <option value="">No official rounds available</option>}
            {submissionRounds.map(round => (
              <option key={round.roundId} value={round.roundId}>{round.roundName}</option>
            ))}
          </select>
          {selectedSubmissionRound && selectedSubmissionRoundState.canSubmit ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedSubmissionRoundOpen ? "open" : selectedSubmissionRoundState.deadlinePassed ? "closed" : roundStatusLabel(selectedSubmissionRound)} />
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Submitting for: <strong>{selectedSubmissionRound.roundName}</strong>
              </span>
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Status: <strong>{roundStatusLabel(selectedSubmissionRound)}</strong>
              </span>
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Starts: {formatSubmissionDate(selectedSubmissionRound.startDate)}
              </span>
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Deadline: {formatSubmissionDate(selectedSubmissionRound.submissionDeadline)}
              </span>
            </div>
          ) : null}
        </label>
      </div>
    </Card>
  );

  const renderSubmissionHistory = () => {
    const roundById = new Map(allSubmissionRounds.map(round => [round.roundId, round]));
    const isSubmissionLeader = activeTeamContext?.leaderUserId === user?.userId;
    const visibleSubmissionHistory = submissionForm.roundId
      ? submissionHistory.filter(submission => submission.roundId === submissionForm.roundId)
      : submissionHistory;

    return (
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary }}>Submission History</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 3 }}>
              {selectedSubmissionRound
                ? `Work submitted by ${activeTeamContext?.teamName ?? "this team"} for ${selectedSubmissionRound.roundName}`
                : `Work submitted by ${activeTeamContext?.teamName ?? "this team"}`}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<ExternalLink size={13} />}
            onClick={loadSubmissionHistory}
            disabled={submissionHistoryLoading}
          >
            {submissionHistoryLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {submissionHistoryLoading ? (
          <div style={{ fontSize: 14, color: COLORS.textSecondary }}>Loading submission history...</div>
        ) : visibleSubmissionHistory.length === 0 ? (
          <div className="rounded-lg px-4 py-5" style={{ border: `1px dashed ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 14 }}>
            {submissionForm.roundId
              ? "No submissions have been recorded for this round yet."
              : "No submissions have been recorded for this team yet."}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleSubmissionHistory.map(submission => {
              const round = roundById.get(submission.roundId);
              const canUpdateSubmission = isSubmissionLeader && getSubmissionRoundState(round).canSubmit;
              const links = [
                { label: "Repo", url: submission.repositoryUrl, icon: <Github size={13} /> },
                { label: "Demo", url: submission.demoUrl, icon: <Globe size={13} /> },
                { label: "Report", url: submission.reportUrl, icon: <FileText size={13} /> },
                { label: "Slides", url: submission.slideUrl, icon: <FileText size={13} /> },
              ].filter(link => Boolean(link.url));

              return (
                <div
                  key={submission.submissionId}
                  className="rounded-lg p-4"
                  style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div className="min-w-0">
                      <div style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary }}>
                        {submission.notes || `Submission ${submission.submissionId.slice(0, 8)}`}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} /> Round: {round?.roundName ?? submission.roundId}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} /> Submitted: {formatSubmissionDate(submission.submittedAt || submission.lastUpdatedAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} /> Deadline: {formatSubmissionDate(round?.submissionDeadline)}
                        </span>
                        {submission.submissionStatusName && <StatusBadge status={submission.submissionStatusName.toLowerCase()} />}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button
                        variant={canUpdateSubmission ? "outline" : "ghost"}
                        size="sm"
                        icon={<Edit size={13} />}
                        onClick={() => handlePrepareSubmissionUpdate(submission)}
                        disabled={!canUpdateSubmission}
                      >
                        {canUpdateSubmission ? "Update" : "Update closed"}
                      </Button>
                      {links.length > 0 ? links.map(link => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2"
                          style={{ border: `1px solid ${COLORS.border}`, color: COLORS.primary, fontSize: 12, fontWeight: 700 }}
                        >
                          {link.icon}
                          {link.label}
                        </a>
                      )) : (
                        <span style={{ fontSize: 12, color: COLORS.textSecondary }}>No URLs attached</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    );
  };

  const renderRoundSubmissionNotice = () => {
    if (!selectedSubmissionRound || selectedSubmissionRoundState.canSubmit) return null;
    const isExpired = selectedSubmissionRoundState.deadlinePassed;

    return (
      <Card
        className="p-6"
        style={{
          border: `2px solid ${isExpired ? COLORS.error : COLORS.warning}`,
          background: isExpired ? "rgba(229,62,46,0.08)" : `${COLORS.warning}12`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{
              width: 52,
              height: 52,
              background: isExpired ? "rgba(229,62,46,0.14)" : `${COLORS.warning}18`,
              color: isExpired ? COLORS.error : COLORS.warning,
            }}
          >
            <AlertCircle size={28} />
          </div>
          <div>
            <div
              style={{
                fontSize: isExpired ? 24 : 20,
                fontWeight: 900,
                color: isExpired ? COLORS.error : COLORS.textPrimary,
              }}
            >
              {isExpired ? "The submission deadline has passed" : "Round is not open for submissions"}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: 13, color: COLORS.textSecondary }}>
              <span>Round: <strong>{selectedSubmissionRound.roundName}</strong></span>
              <span>Status: <strong>{roundStatusLabel(selectedSubmissionRound)}</strong></span>
              <span>Starts: {formatSubmissionDate(selectedSubmissionRound.startDate)}</span>
              <span>Deadline: {formatSubmissionDate(selectedSubmissionRound.submissionDeadline)}</span>
            </div>
            {!isExpired && (
              <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 8, fontWeight: 700 }}>
                {selectedSubmissionRoundState.reason}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const handleCertificateFile = async (award: AwardResponse, mode: "view" | "download") => {
    setCertificateActionLoading(prev => ({ ...prev, [award.id]: mode }));
    setCertificateError("");
    try {
      const blob = await awardService.downloadCertificate(award.id);
      const url = URL.createObjectURL(blob);
      if (mode === "view") {
        const opened = window.open(url, "_blank", "noopener,noreferrer");
        if (!opened) {
          const link = document.createElement("a");
          link.href = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.click();
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        const link = document.createElement("a");
        const filename = `${award.eventName}-${award.categoryName}-${award.awardTitle}-certificate.pdf`
          .replace(/[^a-z0-9._-]+/gi, "-")
          .replace(/^-+|-+$/g, "");
        link.href = url;
        link.download = filename || "certificate.pdf";
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      setCertificateError(error instanceof Error ? error.message : "Certificate download failed.");
    } finally {
      setCertificateActionLoading(prev => {
        const next = { ...prev };
        delete next[award.id];
        return next;
      });
    }
  };

  const handleRegisterEvent = async (eventId: string) => {
    if (!eventId) {
      toast.error("Event not found.");
      return;
    }

    const targetEvent = apiEvents.find(event => event.eventId === eventId);
    if (!targetEvent) {
      setEventActionMessage(prev => ({ ...prev, [eventId]: "Event not found." }));
      toast.error("Event not found.");
      return;
    }

    if (!getAccessToken()) {
      setEventActionMessage(prev => ({ ...prev, [eventId]: "Please log in before registering for this event." }));
      toast.error("Please log in before registering for this event.");
      return;
    }

    const participantStatus = normalizeParticipationStatus(participations[eventId]?.participantStatus ?? targetEvent.participantStatus);
    const unavailableReason = registrationUnavailableReason(targetEvent);
    if (unavailableReason) {
      setEventActionMessage(prev => ({ ...prev, [eventId]: `Registration unavailable: ${unavailableReason}.` }));
      return;
    }
    if (participantStatus !== "NOT_REGISTERED") {
      const message = participantStatus === "PENDING"
        ? "Registration already submitted. Waiting for organizer approval."
        : participantStatus === "REJECTED"
          ? "Your registration was rejected."
          : "You are already registered for this event.";
      setEventActionMessage(prev => ({ ...prev, [eventId]: message }));
      return;
    }

    setEventActionLoading(prev => ({ ...prev, [eventId]: true }));
    setEventActionMessage(prev => ({ ...prev, [eventId]: "" }));
    try {
      const participation = await eventParticipantService.registerForEvent(eventId);
      const nextStatus = statusFromParticipation(participation);
      setParticipations(prev => ({ ...prev, [eventId]: participation }));
      setApiEvents(prev => prev.map(event => event.eventId === eventId ? {
        ...event,
        eventParticipantId: participation.eventParticipantId ?? event.eventParticipantId,
        participantStatus: nextStatus === "ACTIVE" ? "ACTIVE" : "PENDING",
        rejectedReason: null,
        appliedAt: participation.appliedAt ?? event.appliedAt,
        approvedAt: null,
      } : event));
      const successMessage = nextStatus === "ACTIVE"
        ? "Registration approved."
        : "Registration submitted. Waiting for organizer approval.";
      setEventActionMessage(prev => ({ ...prev, [eventId]: successMessage }));
      toast.success(successMessage);
      loadEvents();
    } catch (error) {
      if (eventParticipantService.isDuplicateRegistrationError(error)) {
        const duplicateMessage = registrationMessageForError(error, parseApiError(error).message);
        try {
          const participation = await eventParticipantService.getMyParticipation(eventId);
          if (!participation) {
            setEventActionMessage(prev => ({ ...prev, [eventId]: duplicateMessage }));
            toast.error(duplicateMessage);
            return;
          }
          setParticipations(prev => ({ ...prev, [eventId]: participation }));
          setApiEvents(prev => prev.map(event => event.eventId === eventId ? {
            ...event,
            eventParticipantId: participation.eventParticipantId ?? event.eventParticipantId,
            participantStatus: statusFromParticipation(participation),
            rejectedReason: participation.rejectedReason ?? event.rejectedReason,
            appliedAt: participation.appliedAt ?? event.appliedAt,
            approvedAt: participation.approvedAt ?? event.approvedAt,
          } : event));
          const participantStatus = statusFromParticipation(participation);
          const message = `${duplicateMessage} Current status: ${participantStatusLabels[participantStatus] ?? participantStatus}.`;
          setEventActionMessage(prev => ({ ...prev, [eventId]: message }));
          toast.error(message);
          loadEvents();
        } catch (lookupError) {
          const parsedLookupError = parseApiError(lookupError);
          const message = parsedLookupError.status === 404 ? duplicateMessage : parsedLookupError.message;
          setEventActionMessage(prev => ({ ...prev, [eventId]: message }));
          toast.error(message);
        }
      } else {
        const parsedError = parseApiError(error);
        const message = registrationMessageForError(error, parsedError.message);
        setEventActionMessage(prev => ({ ...prev, [eventId]: message }));
        toast.error(message);
      }
    } finally {
      setEventActionLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const registrationMessageForError = (error: unknown, fallback: string) => {
    if (!(error instanceof ApiError)) return fallback || "Registration failed.";
    if (error.status === 400) return error.message || "Registration request is invalid.";
    if (error.status === 401) return "Your session has expired. Please sign in again.";
    if (error.status === 403) return error.message || "You do not have permission to register for this event.";
    if (error.status === 404) return error.message || "Event not found.";
    if (error.status === 409) return error.message || "You have already registered for this event.";
    if (error.status === 500) return "Something went wrong. Please try again later.";
    return fallback || "Registration failed.";
  };

  const renderDashboard = () => (
    <>
      <SectionHeader
        title="Team Member Dashboard"
        subtitle={`Welcome back, ${displayName}.`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Events" value={apiEvents.length} trend={0} icon={<Calendar size={22} />} color={COLORS.primary} />
        <StatCard title="Team Rank" value="N/A" icon={<Trophy size={22} />} color={COLORS.warning} />
        <StatCard title="Team Score" value="N/A" icon={<Star size={22} />} color={COLORS.accent} />
        <StatCard title="Unread" value={unread} icon={<Clock size={22} />} color={COLORS.error} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Team Status</span>
            <StatusBadge status={teamMembers.length > 0 ? "active" : "pending"} />
          </div>
          {teamMembers.length > 0 ? (
            <>
              <div className="mb-3">
                <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>My Team</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{teamMembers.length} members</div>
              </div>
              <AvatarGroup names={teamMembers.map(m => m.name)} max={5} />
            </>
          ) : (
            <div className="rounded-xl p-4" style={{ background: COLORS.bg, color: COLORS.textSecondary, fontSize: 13 }}>
              No team data is available for your account yet.
            </div>
          )}
        </Card>

        <Card className="p-5 col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} style={{ color: COLORS.error }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Upcoming Deadline</span>
          </div>
          <div className="rounded-xl p-4 mb-4" style={{ background: `${COLORS.error}10`, border: `1px solid ${COLORS.error}30` }}>
            <div style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>{apiEvents[0]?.eventName ?? "No active event"}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: "8px 0" }}>{apiEvents[0]?.registrationEnd ? "Deadline available" : "N/A"}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Deadline: {apiEvents[0]?.registrationEnd || "No deadline data"}</div>
          </div>
          <Button variant="primary" size="sm" className="mt-4 w-full" icon={<ExternalLink size={14} />} onClick={() => onNavigate("submissions")}>
            Open Submission
          </Button>
        </Card>

        <Card className="p-5 col-span-1">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Recent Activity</div>
          <div className="rounded-xl p-4" style={{ background: COLORS.bg, color: COLORS.textSecondary, fontSize: 13 }}>
            No recent activity is available.
          </div>
        </Card>
      </div>
    </>
  );

  const renderTeam = () => (
    <TeamApiPanel initialEventId={teamInitialEventId} onNavigate={onNavigate} onTeamChange={handleTeamChange} />
  );

  const renderEvents = () => (
    <>
      <SectionHeader title="Browse Events" subtitle="Discover and register for hackathon events" />
      {eventsError && (
        <Card className="p-4">
          <div className="flex items-center gap-2" style={{ color: COLORS.error, fontSize: 13, fontWeight: 600 }}>
            <AlertCircle size={15} />
            {eventsError}
          </div>
        </Card>
      )}
      {apiEvents.length === 0 && (
        <Card className="p-5">
          <div style={{ fontSize: 14, color: COLORS.textSecondary }}>
            {eventsError ? "Events could not be loaded." : "No events are available."}
          </div>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {apiEvents.map(ev => {
          const participation = participations[ev.eventId];
          const participantStatus = normalizeParticipationStatus(participation?.participantStatus ?? ev.participantStatus);
          const isRegistered = participantStatus !== "NOT_REGISTERED";
          const statusLabel = participantStatusLabels[participantStatus] ?? participantStatus;
          const lifecycleStatus = String(ev.eventStatus || "UNKNOWN").toUpperCase();
          const unavailableReason = registrationUnavailableReason(ev);
          const isSelected = selectedEventDetailId === ev.eventId;
          const isActiveParticipant = isApprovedParticipationStatus(participantStatus);
          const isPendingParticipant = participantStatus === "PENDING";
          const isRejectedParticipant = participantStatus === "REJECTED";
          return (
            <Card key={ev.eventId} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{ev.eventName}</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>{ev.description}</div>
                </div>
                <StatusBadge status={lifecycleStatus.toLowerCase()} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Event Status", value: lifecycleStatus, icon: <Info size={13} /> },
                  { label: "Deadline", value: ev.registrationEnd || "N/A", icon: <Calendar size={13} /> },
                  { label: "Location", value: ev.location || "N/A", icon: <MapPin size={13} /> },
                  { label: "Participation", value: statusLabel, icon: <Award size={13} /> },
                ].map(info => (
                  <div key={info.label} className="flex items-center gap-2">
                    <span style={{ color: COLORS.textSecondary }}>{info.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{info.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{info.value}</div>
                    </div>
                  </div>
                ))}
              </div>
              {isSelected && (
                <div className="rounded-xl p-3 mb-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>Participation Status</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>
                    {!isRegistered && "You have not registered for this event yet."}
                    {isPendingParticipant && "Waiting for organizer approval. Team features and competition activities are locked for this event."}
                    {isActiveParticipant && "You are approved for this event. Team features and competition activities are available."}
                    {isRegistered && !isPendingParticipant && !isActiveParticipant && restrictedParticipationMessage[participantStatus as Exclude<EventCardParticipationStatus, "ACTIVE" | "NOT_REGISTERED">]}
                  </div>
                  {isRejectedParticipant && (ev.rejectedReason || participation?.rejectedReason) && (
                    <div style={{ fontSize: 13, color: COLORS.error, marginTop: 6 }}>
                      Reason: {ev.rejectedReason || participation?.rejectedReason}
                    </div>
                  )}
                  {!isActiveParticipant && (
                    <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 8 }}>
                      Competition-only features are hidden until this event participation is approved.
                    </div>
                  )}
                </div>
              )}
              {eventActionMessage[ev.eventId] && (
                <div className="rounded-xl px-3 py-2 mb-4" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, fontSize: 13 }}>
                  {eventActionMessage[ev.eventId]}
                </div>
              )}
              <div className="flex gap-2">
                {isActiveParticipant ? (
                  <>
                    <Button variant="outline" size="sm" disabled icon={<CheckCircle size={13} />}>Joined</Button>
                    <Button variant="primary" size="sm" icon={<ExternalLink size={13} />} onClick={() => setSelectedEventDetailId(ev.eventId)}>Enter Event</Button>
                  </>
                ) : isPendingParticipant ? (
                  <Button variant="outline" size="sm" disabled icon={<Clock size={13} />}>Pending Approval</Button>
                ) : isRegistered ? (
                  <Button variant="outline" size="sm" disabled icon={<CheckCircle size={13} />}>{statusLabel}</Button>
                ) : unavailableReason ? (
                  <Button variant="ghost" size="sm" disabled>{unavailableReason}</Button>
                ) : (
                  // Team-first: đăng ký sự kiện theo team — tạo/join team trước,
                  // leader đăng ký cả team ở tab My Team.
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<PlusCircle size={13} />}
                    onClick={() => {
                      setEventActionMessage(prev => ({
                        ...prev,
                        [ev.eventId]: "Event registration is per team: create or join a team, then the team leader registers the team in the My Team tab.",
                      }));
                      setTeamInitialEventId(ev.eventId);
                      onNavigate("team");
                    }}
                  >
                    Create/Join Team to Register
                  </Button>
                )}
                <Button variant="ghost" size="sm" icon={<ExternalLink size={13} />} onClick={() => setSelectedEventDetailId(isSelected ? null : ev.eventId)}>Details</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );

  const renderLeaderboard = () => (
    <>
      <SectionHeader title="Leaderboard" subtitle="Event leaderboard rankings" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {["Rank", "Team", "Score", "Category"].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}`, letterSpacing: "0.04em" }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apiLeaderboard.length > 0 ? apiLeaderboard.map((row: any, i: number) => {
                const isMe = false;
                return (
                  <tr
                    key={row.rank ?? row.id ?? i}
                    style={{
                      borderBottom: `1px solid ${COLORS.border}`,
                      background: isMe ? `${COLORS.primary}08` : undefined,
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(row.rankPosition ?? row.rank) <= 3 ? (
                          <span style={{ fontSize: 16 }}>{["🥇", "🥈", "🥉"][(row.rankPosition ?? row.rank) - 1]}</span>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, width: 20, textAlign: "center" }}>#{row.rankPosition ?? row.rank}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.textPrimary }}>
                        {row.teamId ?? row.team}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>
                        {row.finalScore?.toFixed(1) ?? row.score}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.categoryId ?? row.track ?? "—"}</span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center">
                    <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 8 }}>
                      The leaderboard has not been published yet.
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
                      Results will appear here once they are officially announced.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );

  const renderCertificates = () => {
    if (!activeTeamContext?.eventId) {
      return (
        <>
          <SectionHeader title="Certificates" subtitle="View and download certificates by event category" />
          <Card className="p-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 44, height: 44, background: `${COLORS.warning}14`, color: COLORS.warning }}
                >
                  <Award size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.textPrimary }}>No active event team</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 3 }}>
                    Select or create a team first so certificates can be matched to your event and category.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="md" icon={<Users size={14} />} onClick={() => onNavigate("team")}>
                  Open My Team
                </Button>
                <Button variant="outline" size="md" icon={<Calendar size={14} />} onClick={() => onNavigate("events")}>
                  Browse Events
                </Button>
              </div>
            </div>
          </Card>
        </>
      );
    }

    const categoryOptions = Array.from(
      new Map(certificateAwards.map((award: any) => [award.categoryId, award.categoryName])).entries(),
    );
    const filteredAwards = certificateCategoryId === "all"
      ? certificateAwards
      : certificateAwards.filter((award: any) => award.categoryId === certificateCategoryId);

    return (
      <>
        <SectionHeader
          title="Certificates"
          subtitle={`Certificates for ${activeTeamContext.teamName ?? "your team"}`}
          action={
            <select
              value={certificateCategoryId}
              onChange={event => setCertificateCategoryId(event.target.value)}
              className="px-3 py-2 rounded-lg outline-none"
              style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              disabled={certificateLoading || categoryOptions.length === 0}
            >
              <option value="all">All categories</option>
              {categoryOptions.map(([categoryId, categoryName]) => (
                <option key={categoryId} value={categoryId}>{categoryName}</option>
              ))}
            </select>
          }
        />

        {certificateError && (
          <Card className="p-4">
            <div className="flex items-center gap-2" style={{ color: COLORS.error, fontSize: 13, fontWeight: 600 }}>
              <AlertCircle size={15} />
              {certificateError}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Published Certificates" value={certificateAwards.length} icon={<Award size={22} />} color={COLORS.warning} />
          <StatCard title="Categories" value={categoryOptions.length} icon={<Target size={22} />} color={COLORS.secondary} />
          <StatCard title="Selected" value={filteredAwards.length} icon={<FileText size={22} />} color={COLORS.primary} />
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: COLORS.bg }}>
                  {["Award", "Event", "Category", "Published", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}`, letterSpacing: "0.04em" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {certificateLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center" style={{ fontSize: 13, color: COLORS.textSecondary }}>
                      Loading certificates...
                    </td>
                  </tr>
                ) : filteredAwards.length > 0 ? filteredAwards.map((award: any) => {
                  const actionLoading = certificateActionLoading[award.id];
                  return (
                    <tr key={award.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td className="px-4 py-3">
                        <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>{award.awardTitle}</div>
                        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{award.awardTierName}</div>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 13, color: COLORS.textPrimary }}>{award.eventName}</td>
                      <td className="px-4 py-3" style={{ fontSize: 13, color: COLORS.textSecondary }}>{award.categoryName}</td>
                      <td className="px-4 py-3" style={{ fontSize: 13, color: COLORS.textSecondary }}>
                        {award.publishedAt ? new Date(award.publishedAt).toLocaleDateString("en-US") : "Published"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Eye size={13} />}
                            disabled={!!actionLoading}
                            onClick={() => handleCertificateFile(award, "view")}
                          >
                            {actionLoading === "view" ? "Opening..." : "View"}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Download size={13} />}
                            disabled={!!actionLoading}
                            onClick={() => handleCertificateFile(award, "download")}
                          >
                            {actionLoading === "download" ? "Downloading..." : "Download"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 8 }}>
                        No published certificates are available for this category.
                      </div>
                      <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
                        Certificates will appear here after awards are published by the organizer.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </>
    );
  };

  const renderNotifications = () => (
    <>
      <SectionHeader
        title="Notifications"
        subtitle={`${unread} unread notification${unread !== 1 ? "s" : ""}`}
        action={unread > 0 ? <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button> : undefined}
      />
      {notifs.length === 0 && (
        <Card className="p-5">
          <div style={{ fontSize: 14, color: COLORS.textSecondary }}>No notifications are available.</div>
        </Card>
      )}
      <div className="space-y-3">
        {notifs.map(n => {
          const iconColor = n.type === "warning" ? COLORS.warning : n.type === "success" ? COLORS.success : COLORS.primary;
          const Icon = n.type === "warning" ? AlertCircle : n.type === "success" ? CheckCircle : Info;
          return (
            <Card key={n.id} className="p-4" style={{ opacity: n.read ? 0.75 : 1, borderLeft: !n.read ? `3px solid ${iconColor}` : undefined }}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${iconColor}15` }}>
                  <Icon size={15} style={{ color: iconColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: COLORS.textPrimary }}>{n.title}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS.primary }} />}
                  </div>
                  <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>{n.body}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{n.time}</span>
                    <div className="flex items-center gap-2">
                      {n.eventId && (
                        <button
                          type="button"
                          onClick={() => openNotification(n)}
                          className="px-2 py-1 rounded-lg"
                          style={{ fontSize: 12, color: COLORS.primary, background: `${COLORS.primary}10` }}
                        >
                          Open Event
                        </button>
                      )}
                      {!n.read && <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>Mark as read</Button>}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );

  const renderFeedback = () => (
    <>
      <SectionHeader
        title="Judge Feedback"
        subtitle="View judge scores and comments for the selected or latest submission"
        action={
          <Button
            variant="outline"
            size="sm"
            icon={<Eye size={14} />}
            onClick={loadFeedback}
            disabled={feedbackLoading}
          >
            {feedbackLoading ? "Loading..." : "Load Feedback"}
          </Button>
        }
      />
      {feedbackError && (
        <Card className="p-4" style={{ color: COLORS.error }}>
          {feedbackError}
        </Card>
      )}
      {judgingScores.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare size={34} className="mx-auto mb-3" style={{ color: COLORS.border }} />
          <div style={{ fontSize: 14, color: COLORS.textSecondary }}>No feedback loaded yet.</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {judgingScores.map(score => (
            <Card key={score.id} className="p-5">
              <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{score.criterionName}</div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>Judge: {score.judgeName}</div>
              <div className="mt-3" style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary }}>{score.scoreValue}</div>
              {score.comment && <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 8 }}>{score.comment}</p>}
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 8 }}>{formatSubmissionDate(score.scoredAt)}</div>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  const renderRequests = () => {
    const isLeader = activeTeamContext?.leaderUserId === user?.userId;

    if (!activeTeamContext?.teamId) {
      return (
        <>
          <SectionHeader title="Join Requests" subtitle="Load a team before reviewing join requests" />
          <Card className="p-8" style={{ color: COLORS.textSecondary }}>
            No active team is loaded.
          </Card>
        </>
      );
    }

    if (!isLeader) {
      return (
        <>
          <SectionHeader title="Join Requests" subtitle="Only the team leader can approve join requests" />
          <Card className="p-8" style={{ color: COLORS.textSecondary }}>
            You are not the leader of {activeTeamContext.teamName ?? "this team"}.
          </Card>
        </>
      );
    }

    return (
      <>
        <SectionHeader
          title="Join Requests"
          subtitle={`Pending requests to join ${activeTeamContext.teamName ?? "your team"}`}
          action={
            <Button
              variant="outline"
              size="sm"
              icon={<Search size={14} />}
              onClick={loadRequests}
              disabled={requestsLoading}
            >
              {requestsLoading ? "Loading..." : "Load Requests"}
            </Button>
          }
        />
        {requestsLoading && (
          <div className="flex items-center justify-center py-12 gap-2" style={{ color: COLORS.textSecondary }}>
            Loading...
          </div>
        )}
        {!requestsLoading && pendingRequests.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle size={36} className="mx-auto mb-3" style={{ color: COLORS.border }} />
            <div style={{ fontSize: 15, color: COLORS.textSecondary }}>No pending join requests</div>
          </Card>
        )}
        <div className="space-y-3">
          {pendingRequests.map(request => (
            <Card key={request.requestId} className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{request.fullName}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                    University: {request.universityName || "-"}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                    Requested: {formatSubmissionDate(request.requestedAt)}
                  </div>
                  <div className="mt-2"><StatusBadge status={request.requestStatus.toLowerCase()} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle size={13} />}
                    onClick={() => handleRequest(request.requestId, "APPROVED")}
                    disabled={handlingRequestId === request.requestId}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 size={13} />}
                    onClick={() => handleRequest(request.requestId, "REJECTED")}
                    disabled={handlingRequestId === request.requestId}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  };

  const renderSubmissions = () => {
    if (!activeTeamContext?.teamId) {
      return (
        <>
          <SectionHeader title="Submission Center" subtitle="Create or join a team before submitting work" />
          {renderSubmissionTeamSelector()}
          <Card className="p-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 44, height: 44, background: `${COLORS.warning}14`, color: COLORS.warning }}
                >
                  <Users size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.textPrimary }}>No team yet</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 3 }}>
                    Submissions belong to a team and a round. Create a team or join an existing team first.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="md" icon={<PlusCircle size={14} />} onClick={() => onNavigate("team")}>
                  Create or Join Team
                </Button>
                <Button variant="outline" size="md" icon={<Calendar size={14} />} onClick={() => onNavigate("events")}>
                  Browse Events
                </Button>
              </div>
            </div>
          </Card>
        </>
      );
    }

    if (submissionParticipationLoading) {
      return (
        <>
          <SectionHeader title="Submission Center" subtitle="Checking event approval status" />
          {renderSubmissionTeamSelector()}
          <Card className="p-8">
            <div style={{ fontSize: 14, color: COLORS.textSecondary }}>Checking your event participation...</div>
          </Card>
        </>
      );
    }

    if (activeTeamContext.eventId && !isApprovedParticipationStatus(submissionParticipation?.participantStatus)) {
      return (
        <>
          <SectionHeader title="Submission Center" subtitle="Organizer approval required" />
          {renderSubmissionTeamSelector()}
          <Card className="p-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 44, height: 44, background: `${COLORS.warning}14`, color: COLORS.warning }}
                >
                  <AlertCircle size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.textPrimary }}>Approval required</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 3 }}>
                    You must be approved by the organizer before accessing competition activities for this event.
                  </div>
                </div>
              </div>
              <Button variant="outline" size="md" icon={<Calendar size={14} />} onClick={() => onNavigate("events")}>
                View Event Status
              </Button>
            </div>
          </Card>
        </>
      );
    }

    const isSubmissionLeader = activeTeamContext.leaderUserId === user?.userId;
    if (!isSubmissionLeader) {
      return (
        <>
          <SectionHeader title="Submission Center" subtitle="Only team leaders can submit or update team work" />
          {renderSubmissionTeamSelector()}
          <Card className="p-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 44, height: 44, background: `${COLORS.warning}14`, color: COLORS.warning }}
                >
                  <FileText size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.textPrimary }}>Leader-only submission</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 3 }}>
                    You are a member of {activeTeamContext.teamName ?? "this team"}. The backend submission API is available to the team leader only.
                  </div>
                </div>
              </div>
              <Button variant="outline" size="md" icon={<Users size={14} />} onClick={() => onNavigate("team")}>
                Back to My Team
              </Button>
            </div>
          </Card>
          {renderSubmissionHistory()}
        </>
      );
    }

    return (
      <>
        <SectionHeader title="Submission Center" subtitle={`Submit or update work for ${activeTeamContext.teamName ?? "your team"}`} />
        {renderSubmissionTeamSelector()}
        {renderRoundSubmissionNotice()}
        {selectedSubmissionRoundState.canSubmit && (
        <div ref={submissionFormRef}>
          <Card className="p-5">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Submission Name", key: "submissionName", icon: <FileText size={14} /> },
                { label: "Repository URL", key: "repositoryUrl", icon: <Github size={14} /> },
                { label: "Demo URL", key: "demoUrl", icon: <Globe size={14} /> },
                { label: "Report URL", key: "reportUrl", icon: <FileText size={14} /> },
                { label: "Slide URL", key: "slideUrl", icon: <FileText size={14} /> },
              ].map(field => (
                <label key={field.key} className="block">
                  <span className="flex items-center gap-2 mb-1" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>
                    {field.icon} {field.label}
                  </span>
                  <input
                    value={submissionForm[field.key as keyof typeof submissionForm]}
                    onChange={e => {
                      setSubmissionForm(prev => ({ ...prev, [field.key]: e.target.value }));
                      setSubmissionFieldErrors(prev => ({ ...prev, [field.key]: undefined }));
                    }}
                    className="w-full px-3 py-2 rounded-lg outline-none"
                    style={{
                      fontSize: 14,
                      border: `1px solid ${submissionFieldErrors[field.key as keyof SubmissionUrlErrors] ? COLORS.error : COLORS.border}`,
                      background: COLORS.bg,
                      color: COLORS.textPrimary,
                    }}
                  />
                  {submissionFieldErrors[field.key as keyof SubmissionUrlErrors] && (
                    <span style={{ display: "block", marginTop: 4, fontSize: 11, color: COLORS.error, fontWeight: 600 }}>
                      {submissionFieldErrors[field.key as keyof SubmissionUrlErrors]}
                    </span>
                  )}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Button variant="primary" size="md" icon={<FileText size={14} />} onClick={handleSubmitWork} disabled={submissionLoading || !submissionForm.roundId}>
                {submissionLoading ? "Saving..." : selectedSubmissionRound ? `Submit for ${selectedSubmissionRound.roundName}` : "Select Round to Submit"}
              </Button>
              <Button variant="outline" size="md" icon={<ExternalLink size={14} />} onClick={handleLoadSubmission} disabled={submissionLookupLoading || !submissionForm.roundId}>
                {submissionLookupLoading ? "Loading..." : selectedSubmissionRound ? `Load ${selectedSubmissionRound.roundName}` : "Load Current"}
              </Button>
              <Button variant="ghost" size="md" icon={<FileText size={14} />} onClick={() => handleDownloadProblem("csv")} disabled={problemDownloadLoading !== null || !submissionForm.roundId || !selectedSubmissionRoundState.canDownloadProblem}>
                {problemDownloadLoading === "csv" ? "Downloading..." : "Problem CSV"}
              </Button>
              <Button variant="ghost" size="md" icon={<FileText size={14} />} onClick={() => handleDownloadProblem("zip")} disabled={problemDownloadLoading !== null || !submissionForm.roundId || !selectedSubmissionRoundState.canDownloadProblem}>
                {problemDownloadLoading === "zip" ? "Downloading..." : "Problem ZIP"}
              </Button>
              {submissionStatus && (
                <span
                  style={{
                    fontSize: 13,
                    color: submissionStatus === "Submission saved." || submissionStatus.includes("downloaded.")
                      ? COLORS.success
                      : submissionStatus.startsWith("Current status:")
                        ? COLORS.textSecondary
                        : COLORS.error,
                    fontWeight: 600,
                  }}
                >
                  {submissionStatus}
                </span>
              )}
            </div>
          </Card>
        </div>
        )}
        {renderSubmissionHistory()}
      </>
    );
  };

  const renderProfile = () => (
    <>
      <SectionHeader title="Profile Settings" subtitle="Manage your personal information and preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 flex flex-col items-center text-center col-span-1">
          <div
            className="flex items-center justify-center rounded-full text-white mb-4"
            style={{ width: 80, height: 80, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, fontSize: 24, fontWeight: 700 }}
          >
            {userInitials}
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.textPrimary }}>{displayName}</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>Team Member</div>
          <StatusBadge status="active" />
          <div className="mt-4 w-full space-y-2 text-left">
            {[
              { icon: <Mail size={14} />, label: user?.email || "No email" },
              { icon: <Phone size={14} />, label: user?.phone || "No phone" },
              { icon: <User size={14} />, label: studentCode || "No student code" },
            ].map((info, i) => (
              <div key={i} className="flex items-center gap-2">
                <span style={{ color: COLORS.textSecondary }}>{info.icon}</span>
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{info.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Personal Information</div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Full Name", key: "fullName" },
                { label: "Student ID", key: "studentId" },
                { label: "Email", key: "email" },
                { label: "Phone", key: "phone" },
                { label: "GitHub", key: "github" },
                { label: "Portfolio", key: "portfolio" },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{field.label}</label>
                  <input
                    value={profileForm[field.key as keyof typeof profileForm]}
                    onChange={e => setProfileForm(p => ({ ...p, [field.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg outline-none"
                    style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>Bio</label>
              <textarea
                value={profileForm.bio}
                onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg outline-none resize-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button variant="primary" size="md" icon={<Save size={14} />} onClick={() => { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2000); }}>
                Save Changes
              </Button>
              {profileSaved && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>✓ Profile saved!</span>}
            </div>
          </Card>

          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Hackathon Stats</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Events", value: String(apiEvents.length), icon: <Calendar size={18} />, color: COLORS.primary },
                { label: "Best Rank", value: "N/A", icon: <Trophy size={18} />, color: COLORS.warning },
                { label: "Total Score", value: "N/A", icon: <Star size={18} />, color: COLORS.accent },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-4 text-center" style={{ background: `${stat.color}10` }}>
                  <span style={{ color: stat.color }}>{stat.icon}</span>
                  <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, marginTop: 4 }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return renderDashboard();
      case "team": return renderTeam();
      case "events": return renderEvents();
      case "leaderboard": return renderLeaderboard();
      case "certificates": return renderCertificates();
      case "submissions": return renderSubmissions();
      case "feedback": return renderFeedback();
      case "requests": return renderRequests();
      case "notifications": return renderNotifications();
      case "profile": return renderProfile();
      case "mentor": return <MyMentor isLeader={false} onNavigate={onNavigate} />;
      case "consultations": return <TeamConsultations isLeader={false} />;
      default: return renderDashboard();
    }
  };

  return <div className="p-6 space-y-6">{renderPage()}</div>;
}
