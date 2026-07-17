import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle,
  Eye,
  FileText,
  Github,
  Globe,
  Loader,
  Mail,
  MessageSquare,
  Minus,
  Save,
  Search,
  Trash2,
  Trophy,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import {
  StatCard,
  Card,
  SectionHeader,
  COLORS,
  StatusBadge,
  Button,
} from "@/components/shared/UIComponents";
import { useAuth } from "@/features/auth/store/authStore";
import { submissionService, type SubmissionHistoryResponse, type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { hasSubmissionUrlErrors, validateSubmissionUrls, type SubmissionUrlErrors } from "@/features/submissions/utils/urlValidation";
import { getTeamStatusInfo, isTeamActive, teamService, type JoinTeamRequestResponse, type TeamResponse } from "@/features/teams/api/teamService";
import { TeamApiPanel } from "@/features/teams/components/TeamApiPanel";
import { notificationService } from "@/features/notifications/api/notificationService";
import { MyMentor } from "@/pages/team/MyMentor";
import { TeamConsultations } from "@/pages/team/TeamConsultations";
import { judgingService, type JudgingDTO } from "@/features/judging/api/judgingService";
import { roundService } from "@/features/events/service/roundService";
import { rankingService } from "@/features/rankings/api/rankingService";
import { eventService } from "@/features/events/api/eventService";
import { discoverUserTeamsForEvents } from "@/features/teams/api/userTeamDiscovery";
import type { Round } from "@/features/events/types/round";

const ACTIVE_TEAM_STORAGE_KEY = "seal_active_team";

type StoredTeam = {
  teamId?: string;
  eventId?: string;
  categoryId?: string;
  teamName?: string;
  leaderUserId?: string;
  teamStatusName?: string;
};

function getStoredTeam(): StoredTeam | null {
  try {
    const raw = localStorage.getItem(ACTIVE_TEAM_STORAGE_KEY);
    return raw ? JSON.parse(raw) as StoredTeam : null;
  } catch {
    return null;
  }
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

function isBeforeSubmissionDeadline(round?: Round) {
  if (!round?.submissionDeadline) return true;
  const deadline = new Date(round.submissionDeadline).getTime();
  return Number.isNaN(deadline) || Date.now() <= deadline;
}

function isOfficialSubmissionRound(round: Round) {
  return !round.isCalibrationRound;
}

function display(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? "-" : value;
}

export function LeaderDashboard({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  const { user } = useAuth();
  const [activeTeam, setActiveTeam] = useState<TeamResponse | null>(null);
  const [teamId, setTeamId] = useState("");
  const [leaderboardEventId, setLeaderboardEventId] = useState("");
  const [leaderboardRoundId, setLeaderboardRoundId] = useState("event");
  const [leaderboardRounds, setLeaderboardRounds] = useState<Round[]>([]);
  const [apiLeaderboard, setApiLeaderboard] = useState<any[]>([]);
  const [leaderboardTeams, setLeaderboardTeams] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JoinTeamRequestResponse[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [handlingId, setHandlingId] = useState<string | null>(null);

  const [submissionForm, setSubmissionForm] = useState({
    teamId: "",
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
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistoryResponse[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionResponse | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionHistoryLoading, setSubmissionHistoryLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submissionFieldErrors, setSubmissionFieldErrors] = useState<SubmissionUrlErrors>({});

  const [judgingScores, setJudgingScores] = useState<JudgingDTO[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string; time: string; read: boolean }>>([]);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    const stored = getStoredTeam();
    if (!stored?.teamId) return;
    setTeamId(stored.teamId);
    setSubmissionForm(prev => ({ ...prev, teamId: stored.teamId ?? "" }));
    teamService.getById(stored.teamId)
      .then((team: any) => {
        const isActiveMember = !!user?.userId
          && team.members.some((member: { userId: string; active: boolean }) =>
            member.userId === user.userId && member.active
          );
        if (!isActiveMember) {
          localStorage.removeItem(ACTIVE_TEAM_STORAGE_KEY);
          setTeamId("");
          setActiveTeam(null);
          setSubmissionForm(prev => ({ ...prev, teamId: "" }));
          return;
        }
        setActiveTeam(team);
        setSubmissionForm(prev => ({ ...prev, teamId: team.teamId }));
      })
      .catch(() => {});
  }, [user?.userId]);

  useEffect(() => {
    notificationService.getMyNotifications()
      .then(page => {
        setNotifications((page?.content ?? []).map((notification: any) => ({
          id: notification.notificationId,
          title: notification.title,
          body: notification.body,
          time: formatDate(notification.createdAt),
          read: notification.read,
        })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (currentPage !== "submissions" || !activeTeam?.categoryId) {
      setSubmissionRounds([]);
      setAllSubmissionRounds([]);
      return;
    }
    let cancelled = false;
    setSubmissionRoundsLoading(true);
    roundService.getByCategory(activeTeam.categoryId)
      .then(rounds => {
        if (cancelled) return;
        const officialRounds = rounds.filter(isOfficialSubmissionRound);
        setAllSubmissionRounds(rounds);
        setSubmissionRounds(officialRounds);
        setSubmissionForm(prev => ({
          ...prev,
          roundId: officialRounds.some(round => round.roundId === prev.roundId)
            ? prev.roundId
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
  }, [activeTeam?.categoryId, currentPage]);

  useEffect(() => {
    if (currentPage !== "requests" || !teamId) return;
    loadRequests(teamId);
  }, [currentPage, teamId]);

  const unread = notifications.filter(notification => !notification.read).length;

  const loadRequests = async (id = teamId) => {
    if (!id) return;
    setRequestsLoading(true);
    try {
      setPendingRequests(await teamService.getPendingRequests(id));
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRequest = async (requestId: string, action: "APPROVED" | "REJECTED") => {
    setHandlingId(requestId);
    try {
      await teamService.handleJoinRequest(requestId, action);
      setPendingRequests(prev => prev.filter(request => request.requestId !== requestId));
    } finally {
      setHandlingId(null);
    }
  };

  const loadSubmissionHistory = useCallback(async (teamIdArg = submissionForm.teamId, roundIdArg = submissionForm.roundId) => {
    if (currentPage !== "submissions" || !teamIdArg || !roundIdArg) {
      setSubmissionHistory([]);
      return;
    }

    setSubmissionHistoryLoading(true);
    try {
      setSubmissionHistory(await submissionService.getHistoryByTeamAndRound(teamIdArg, roundIdArg));
    } catch {
      setSubmissionHistory([]);
    } finally {
      setSubmissionHistoryLoading(false);
    }
  }, [currentPage, submissionForm.roundId, submissionForm.teamId]);

  useEffect(() => {
    void loadSubmissionHistory();
  }, [loadSubmissionHistory]);

  const handleSubmit = async () => {
    if (!submissionForm.teamId || !submissionForm.roundId) {
      setSubmitError("Please select a round before submitting.");
      return;
    }
    if (!submissionForm.submissionName.trim()) {
      setSubmitError("Submission name is required.");
      return;
    }
    if (activeTeam && !isTeamActive(activeTeam.teamStatusId, activeTeam.teamStatusName)) {
      setSubmitError("Only active teams can submit work. Your team is waiting for organizer approval.");
      return;
    }
    const selectedRound = submissionRounds.find(round => round.roundId === submissionForm.roundId);
    if (!isBeforeSubmissionDeadline(selectedRound)) {
      setSubmitError("The submission deadline for this round has passed.");
      return;
    }
    const urlErrors = validateSubmissionUrls(submissionForm);
    setSubmissionFieldErrors(urlErrors);
    if (hasSubmissionUrlErrors(urlErrors)) {
      setSubmitError("Please enter valid URLs or leave optional URL fields blank.");
      return;
    }

    setSubmitLoading(true);
    setSubmitError("");
    setSubmitMessage("");
    try {
      const saved = await submissionService.submit({
        teamId: submissionForm.teamId,
        roundId: submissionForm.roundId,
        repositoryUrl: submissionForm.repositoryUrl,
        demoUrl: submissionForm.demoUrl,
        reportUrl: submissionForm.reportUrl,
        slideUrl: submissionForm.slideUrl,
        notes: submissionForm.submissionName.trim(),
      });
      setActiveSubmission(saved);
      await loadSubmissionHistory(saved.teamId, saved.roundId);
      setSubmitMessage("Submission saved.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const loadSubmission = async () => {
    if (!submissionForm.teamId || !submissionForm.roundId) {
      setSubmitError("Please select a round before loading the submission.");
      return;
    }

    setSubmissionLoading(true);
    setSubmitError("");
    setSubmitMessage("");
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
      setActiveSubmission(submission);
      await loadSubmissionHistory(submission.teamId, submission.roundId);
      setSubmitMessage("Submission loaded.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not load submission.");
    } finally {
      setSubmissionLoading(false);
    }
  };

  const loadFeedback = async (submissionId?: string) => {
    const targetSubmissionId = submissionId || activeSubmission?.submissionId;
    if (!targetSubmissionId) {
      setFeedbackError("Load a submission first.");
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError("");
    try {
      setJudgingScores(await judgingService.getBySubmission(targetSubmissionId));
    } catch (error) {
      setFeedbackError(error instanceof Error ? error.message : "Could not load feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(notification => notification.id === id ? { ...notification, read: true } : notification));
    try {
      await notificationService.markAsRead(id);
    } catch {
      // Keep local read state.
    }
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch {
      // Keep local read state.
    }
  };

  const renderDashboard = () => (
    <>
      <SectionHeader
        title="Team Leader Dashboard"
        subtitle={activeTeam ? activeTeam.teamName : "Load your team from the Team page"}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Team Members" value={activeTeam?.members.length ?? "-"} icon={<Users size={20} />} color={COLORS.primary} />
        <StatCard title="Pending Requests" value={pendingRequests.length} icon={<MessageSquare size={20} />} color={COLORS.warning} />
        <StatCard title="Loaded Submissions" value={submissionHistory.length} icon={<Upload size={20} />} color={COLORS.secondary} />
        <StatCard title="Feedback Items" value={judgingScores.length} icon={<Trophy size={20} />} color={COLORS.success} />
      </div>
      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 10 }}>Active Team</div>
        {activeTeam ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InfoPill label="Team" value={activeTeam.teamName} />
            <InfoPill label="Team ID" value={activeTeam.teamId} />
            <InfoPill label="Members" value={activeTeam.members.length} />
          </div>
        ) : (
          <EmptyLine text="No active team is loaded yet. Open Team Management and load or create a team." />
        )}
      </Card>
    </>
  );

  const renderTeam = () => (
    <>
      <SectionHeader title="Team Management" subtitle="Team data and member actions from backend API" />
      {/* mode="auto": quyền leader phải suy ra từ leaderUserId thực tế —
          nếu quyền đã được chuyển cho người khác thì không hiện nút leader nữa. */}
      <TeamApiPanel
        initialTeamId={teamId}
        mode="auto"
        onTeamLeft={() => {
          setActiveTeam(null);
          setTeamId("");
          setSubmissionForm(prev => ({ ...prev, teamId: "" }));
        }}
      />
    </>
  );

  const renderSubmissions = () => {
    const selectedRound = submissionRounds.find(item => item.roundId === submissionForm.roundId);
    const selectedRoundOpen = isBeforeSubmissionDeadline(selectedRound);
    const roundById = new Map(allSubmissionRounds.map(round => [round.roundId, round]));

    return (
      <>
      <SectionHeader title="Submission Center" subtitle="Submit and load your team's work from backend API" />
      {activeTeam && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
              Team status
            </span>
            <StatusBadge status={getTeamStatusInfo(activeTeam.teamStatusId, activeTeam.teamStatusName).badge} />
            {!isTeamActive(activeTeam.teamStatusId, activeTeam.teamStatusName) && (
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Submissions unlock after organizer approval.
              </span>
            )}
          </div>
        </Card>
      )}
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>Round</span>
            <select
            value={submissionForm.roundId}
            onChange={event => setSubmissionForm(prev => ({ ...prev, roundId: event.target.value }))}
            className="w-full px-3 py-2 rounded-xl outline-none mt-1"
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
            {selectedRound ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={selectedRoundOpen ? "open" : "closed"} />
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  Deadline: {formatDate(selectedRound.submissionDeadline)}
                </span>
              </div>
            ) : (
              <div className="mt-2" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                Choose the round this submission belongs to.
              </div>
            )}
          </label>
          <TextField label="Submission Name" value={submissionForm.submissionName} onChange={value => setSubmissionForm(prev => ({ ...prev, submissionName: value }))} icon={<FileText size={14} />} />
          <TextField label="Repository URL" value={submissionForm.repositoryUrl} onChange={value => {
            setSubmissionForm(prev => ({ ...prev, repositoryUrl: value }));
            setSubmissionFieldErrors(prev => ({ ...prev, repositoryUrl: undefined }));
          }} icon={<Github size={14} />} error={submissionFieldErrors.repositoryUrl} />
          <TextField label="Demo URL" value={submissionForm.demoUrl} onChange={value => {
            setSubmissionForm(prev => ({ ...prev, demoUrl: value }));
            setSubmissionFieldErrors(prev => ({ ...prev, demoUrl: undefined }));
          }} icon={<Globe size={14} />} error={submissionFieldErrors.demoUrl} />
          <TextField label="Report URL" value={submissionForm.reportUrl} onChange={value => {
            setSubmissionForm(prev => ({ ...prev, reportUrl: value }));
            setSubmissionFieldErrors(prev => ({ ...prev, reportUrl: undefined }));
          }} icon={<FileText size={14} />} error={submissionFieldErrors.reportUrl} />
          <TextField label="Slide URL" value={submissionForm.slideUrl} onChange={value => {
            setSubmissionForm(prev => ({ ...prev, slideUrl: value }));
            setSubmissionFieldErrors(prev => ({ ...prev, slideUrl: undefined }));
          }} icon={<FileText size={14} />} error={submissionFieldErrors.slideUrl} />
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <Button
            variant="primary"
            size="md"
            icon={submitLoading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
            onClick={handleSubmit}
            disabled={submitLoading || !submissionForm.roundId}
          >
            {submitLoading ? "Submitting..." : "Submit"}
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={submissionLoading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
            onClick={loadSubmission}
            disabled={submissionLoading || !submissionForm.roundId}
          >
            {submissionLoading ? "Loading..." : selectedRound ? `Load ${selectedRound.roundName}` : "Load Submission"}
          </Button>
          {submitMessage && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>{submitMessage}</span>}
          {submitError && <span style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>{submitError}</span>}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Submission History</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
              {selectedRound ? `Submitted work for ${selectedRound.roundName}` : "Select a round to view submission history"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={submissionHistoryLoading ? <Loader size={13} className="animate-spin" /> : <Search size={13} />}
            onClick={() => loadSubmissionHistory()}
            disabled={submissionHistoryLoading || !submissionForm.roundId}
          >
            {submissionHistoryLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
        {submissionHistoryLoading ? (
          <EmptyLine text="Loading submission history..." />
        ) : submissionHistory.length === 0 ? (
          <EmptyLine text={submissionForm.roundId ? "No saved versions for this round yet." : "Select a round to view submission history."} />
        ) : (
          <div className="space-y-3">
            {submissionHistory.map(submission => (
              <SubmissionCard
                key={submission.submissionHistoryId}
                submission={submission}
                roundName={roundById.get(submission.roundId)?.roundName}
                onLoadFeedback={() => loadFeedback(submission.submissionId)}
              />
            ))}
          </div>
        )}
      </Card>
      </>
    );
  };

  useEffect(() => {
    if (currentPage !== "leaderboard" && currentPage !== "rankings") return;
    
    let cancelled = false;
    const fetchTeams = async () => {
       try {
         const events = await eventService.getPublic();
         if (cancelled) return;
         const teams = await discoverUserTeamsForEvents(events, user?.userId);
         if (cancelled) return;
         setLeaderboardTeams(teams.map(t => ({
            eventId: t.eventId,
            eventName: t.eventName ?? events.find(e => e.eventId === t.eventId)?.eventName,
            categoryId: t.categoryId,
         })));
       } catch (e) {
         console.error(e);
       }
    };
    if (user?.userId) fetchTeams();
    return () => { cancelled = true; };
  }, [currentPage, user?.userId]);

  useEffect(() => {
     if (currentPage !== "leaderboard" && currentPage !== "rankings") return;
     const targetEventId = leaderboardEventId || activeTeam?.eventId;
     if (!targetEventId) return;

     const team = leaderboardTeams.find(t => t.eventId === targetEventId);
     const targetCategoryId = team?.categoryId || activeTeam?.categoryId;
     if (!targetCategoryId) return;

     roundService.getByCategory(targetCategoryId)
       .then(setLeaderboardRounds)
       .catch(() => setLeaderboardRounds([]));
  }, [currentPage, leaderboardEventId, activeTeam?.eventId, activeTeam?.categoryId, leaderboardTeams]);

  useEffect(() => {
     if (currentPage !== "leaderboard" && currentPage !== "rankings") return;
     const targetEventId = leaderboardEventId || activeTeam?.eventId;
     if (!targetEventId) return;

     const team = leaderboardTeams.find(t => t.eventId === targetEventId);
     const targetCategoryId = team?.categoryId || activeTeam?.categoryId;
     if (!targetCategoryId) return;

     if (leaderboardRoundId === "event") {
         rankingService.getLeaderboard(targetEventId, targetCategoryId)
            .then(setApiLeaderboard)
            .catch(() => setApiLeaderboard([]));
     } else {
         rankingService.getRoundLeaderboard(leaderboardRoundId, targetCategoryId)
            .then(setApiLeaderboard)
            .catch(() => setApiLeaderboard([]));
     }
  }, [currentPage, leaderboardEventId, leaderboardRoundId, activeTeam?.eventId, activeTeam?.categoryId, leaderboardTeams]);

  const renderRankings = () => {
    const currentEventId = leaderboardEventId || activeTeam?.eventId || "";

    return (
      <>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <SectionHeader title="Team Rankings" subtitle={leaderboardRoundId === "event" ? "Event leaderboard rankings" : `Round Rankings`} />
          <div className="flex items-center gap-2">
            {leaderboardTeams.length > 0 && (
              <select
                value={currentEventId}
                onChange={(e) => { setLeaderboardEventId(e.target.value); setLeaderboardRoundId("event"); }}
                className="px-3 py-1.5 rounded-md"
                style={{
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textPrimary,
                  outline: "none",
                  fontSize: 13
                }}
              >
                <option value="">Select Event</option>
                {leaderboardTeams.map(ev => (
                  <option key={ev.eventId} value={ev.eventId}>{ev.eventName}</option>
                ))}
              </select>
            )}
            {leaderboardRounds.length > 0 && (
              <select
                value={leaderboardRoundId}
                onChange={(e) => setLeaderboardRoundId(e.target.value)}
                className="px-3 py-1.5 rounded-md"
                style={{
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.textPrimary,
                  outline: "none",
                  fontSize: 13
                }}
              >
                <option value="event">Event Ranking</option>
                {leaderboardRounds.map(r => (
                  <option key={r.roundId} value={r.roundId}>{r.roundName}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: COLORS.bg }}>
                  {["Rank", "Team", "Score", "Category"].concat(leaderboardRoundId !== "event" ? ["Result"] : []).map(h => (
                    <th key={h} className="text-left px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}`, letterSpacing: "0.04em" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apiLeaderboard.length > 0 ? apiLeaderboard.map((row: any, i: number) => {
                  const isMe = activeTeam?.teamId === (row.teamId ?? row.team);
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
                        <span style={{ fontSize: 14, fontWeight: isMe ? 700 : 500, color: isMe ? COLORS.primary : COLORS.textPrimary }}>
                          {row.teamName ?? row.teamId ?? row.team} {isMe && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 8, background: `${COLORS.primary}20`, color: COLORS.primary, marginLeft: 6 }}>You</span>}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>
                          {row.finalScore?.toFixed(1) ?? row.totalScore ?? row.score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.categoryName ?? row.categoryId ?? row.track ?? "—"}</span>
                      </td>
                      {leaderboardRoundId !== "event" && (
                         <td className="px-4 py-3">
                            {row.isAdvanced === true && <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.success, backgroundColor: "rgba(0,148,68,0.1)", padding: "2px 8px", borderRadius: 12 }}>Advanced</span>}
                            {row.isAdvanced === false && <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.error, backgroundColor: "rgba(229,62,46,0.1)", padding: "2px 8px", borderRadius: 12 }}>Eliminated</span>}
                            {row.isAdvanced == null && <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>—</span>}
                         </td>
                      )}
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
  };

  const renderNotifications = () => (
    <>
      <SectionHeader
        title="Notifications"
        subtitle={`${unread} unread`}
        action={unread > 0 ? <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button> : undefined}
      />
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <EmptyLine text="No notifications loaded." />
        ) : notifications.map(notification => (
          <Card key={notification.id} className="p-4" style={{ opacity: notification.read ? 0.75 : 1 }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div style={{ fontSize: 14, fontWeight: notification.read ? 500 : 700, color: COLORS.textPrimary }}>{notification.title}</div>
                <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>{notification.body}</p>
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{notification.time}</span>
              </div>
              {!notification.read && <Button variant="ghost" size="sm" onClick={() => markRead(notification.id)}>Mark as read</Button>}
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const renderFeedback = () => (
    <>
      <SectionHeader
        title="Judge Feedback"
        subtitle="Load a submission in Submission Center, then view its judging scores"
        action={
          <Button
            variant="outline"
            size="sm"
            icon={feedbackLoading ? <Loader size={14} className="animate-spin" /> : <Eye size={14} />}
            onClick={() => loadFeedback()}
            disabled={feedbackLoading}
          >
            Load Feedback
          </Button>
        }
      />
      {feedbackError && <Card className="p-4" style={{ color: COLORS.error }}>{feedbackError}</Card>}
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
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 8 }}>{formatDate(score.scoredAt)}</div>
            </Card>
          ))}
        </div>
      )}
    </>
  );

  const renderProfile = () => (
    <>
      <SectionHeader title="My Profile" subtitle="Account information from current session" />
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoPill label="Full Name" value={user?.fullName} />
          <InfoPill label="Email" value={user?.email} />
          <InfoPill label="Phone" value={user?.phone} />
          <InfoPill label="Student Code" value={user?.fptStudentCode} />
        </div>
        <div className="mt-4">
          <Button variant="primary" size="md" icon={<Save size={14} />} onClick={() => { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2000); }}>
            Save Changes
          </Button>
          {profileSaved && <span className="ml-3" style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>Profile saved locally.</span>}
        </div>
      </Card>
    </>
  );

  const renderSettings = () => (
    <>
      <SectionHeader title="Team Settings" subtitle="Use Team Management to update team membership through backend APIs" />
      <Card className="p-5">
        {activeTeam ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InfoPill label="Team" value={activeTeam.teamName} />
            <InfoPill label="Event ID" value={activeTeam.eventId} />
            <InfoPill label="Category ID" value={activeTeam.categoryId} />
          </div>
        ) : (
          <EmptyLine text="No active team loaded." />
        )}
      </Card>
    </>
  );

  const renderRequests = () => (
    <>
      <SectionHeader
        title="Join Requests"
        subtitle="Pending requests to join your team"
        action={
          <Button
            variant="outline"
            size="sm"
            icon={requestsLoading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
            onClick={() => loadRequests()}
            disabled={!teamId || requestsLoading}
          >
            Load Requests
          </Button>
        }
      />
      {requestsLoading && (
        <div className="flex items-center justify-center py-12 gap-2" style={{ color: COLORS.textSecondary }}>
          <Loader size={18} className="animate-spin" /> Loading...
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
                  University: {request.universityName}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>Requested: {formatDate(request.requestedAt)}</div>
                <div className="mt-2"><StatusBadge status={request.requestStatus.toLowerCase()} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={handlingId === request.requestId ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  onClick={() => handleRequest(request.requestId, "APPROVED")}
                  disabled={handlingId === request.requestId}
                >
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={13} />}
                  onClick={() => handleRequest(request.requestId, "REJECTED")}
                  disabled={handlingId === request.requestId}
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

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return renderDashboard();
      case "team": return renderTeam();
      case "submissions": return renderSubmissions();
      case "leaderboard": return renderRankings();
      case "rankings": return renderRankings();
      case "notifications": return renderNotifications();
      case "feedback": return renderFeedback();
      case "requests": return renderRequests();
      case "settings": return renderSettings();
      case "profile": return renderProfile();
      case "mentor": return <MyMentor isLeader={true} onNavigate={onNavigate} />;
      case "consultations": return <TeamConsultations isLeader={true} />;
      default: return renderDashboard();
    }
  };

  return <div className="p-6 space-y-6">{renderPage()}</div>;
}

function TextField({
  label,
  value,
  onChange,
  icon,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 mb-1" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>
        {icon} {label}
      </span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        className="w-full px-3 py-2 rounded-xl outline-none"
        style={{ fontSize: 14, border: `1px solid ${error ? COLORS.error : COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
      />
      {error && (
        <span style={{ display: "block", marginTop: 4, fontSize: 11, color: COLORS.error, fontWeight: 600 }}>
          {error}
        </span>
      )}
    </label>
  );
}

function InfoPill({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="rounded-xl p-3" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 14, color: COLORS.textPrimary, marginTop: 4, wordBreak: "break-word" }}>{display(value)}</div>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div style={{ fontSize: 14, color: COLORS.textSecondary }}>{text}</div>;
}

function SubmissionCard({ submission, roundName, onLoadFeedback }: { submission: SubmissionHistoryResponse; roundName?: string; onLoadFeedback: () => void }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>
              {submission.notes || "Team submission"}
            </div>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>Round: {roundName ?? submission.roundId}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>Submitted: {formatDate(submission.submittedAt)}</div>
          <div className="mt-2"><StatusBadge status={(submission.submissionStatusName || "submitted").toLowerCase()} /></div>
        </div>
        <Button variant="ghost" size="sm" icon={<Eye size={13} />} onClick={onLoadFeedback}>
          Load Feedback
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
        <InfoPill label="Repository" value={submission.repositoryUrl} />
        <InfoPill label="Demo" value={submission.demoUrl} />
        <InfoPill label="Report" value={submission.reportUrl} />
        <InfoPill label="Slide" value={submission.slideUrl} />
      </div>
    </div>
  );
}
