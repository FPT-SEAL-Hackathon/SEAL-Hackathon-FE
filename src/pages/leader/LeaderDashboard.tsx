import { useCallback, useEffect, useState, useRef } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/features/auth/store/authStore";
import { MyProfileSection } from "@/features/users/components/MyProfileSection";
import { submissionService, type SubmissionHistoryResponse, type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { RepositoryMetadataCard, SubmissionRepositoryField } from "@/features/submissions/components/SubmissionRepositoryField";
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
import type { RoundRankingDTO } from "@/features/rankings/api/rankingService";

const ACTIVE_TEAM_STORAGE_KEY = "seal_active_team";
const TEAM_WITHDRAWN_SUBMISSION_MESSAGE = "This team has been withdrawn and can no longer submit work.";

type StoredTeam = {
  teamId?: string;
  eventId?: string;
  categoryId?: string;
  teamName?: string;
  leaderUserId?: string;
  teamStatusName?: string;
};

type SubmissionEligibility = {
  loading: boolean;
  canSubmit: boolean;
  reason: string;
  previousRoundName?: string;
  previousRank?: RoundRankingDTO;
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

function isWithdrawnTeam(team?: TeamResponse | null) {
  return getTeamStatusInfo(team?.teamStatusId, team?.teamStatusName).badge === "withdrawn";
}

function isOfficialSubmissionRound(round: Round) {
  return !round.isCalibrationRound;
}

function getPreviousOfficialRound(rounds: Round[], selectedRoundId: string) {
  const selectedRound = rounds.find(round => round.roundId === selectedRoundId);
  if (!selectedRound) return undefined;

  return rounds
    .filter(round => isOfficialSubmissionRound(round) && round.roundOrder < selectedRound.roundOrder)
    .sort((a, b) => b.roundOrder - a.roundOrder)[0];
}

function display(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? "-" : value;
}

export function LeaderDashboard({ currentPage, onNavigate, markAllReadKey }: { currentPage: string; onNavigate: (p: string) => void; markAllReadKey?: number }) {
  const { user } = useAuth();
  const [activeTeam, setActiveTeam] = useState<TeamResponse | null>(null);
  const [teamId, setTeamId] = useState("");
  const [leaderboardEventId, setLeaderboardEventId] = useState("");
  const [leaderboardRoundId, setLeaderboardRoundId] = useState("event");
  const [leaderboardRounds, setLeaderboardRounds] = useState<Round[]>([]);
  const [apiLeaderboard, setApiLeaderboard] = useState<any[]>([]);
  const [leaderboardTeams, setLeaderboardTeams] = useState<any[]>([]);
  const leaderboardTeamsRef = useRef<any[]>([]);
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
  const [repoSyncing, setRepoSyncing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionHistoryLoading, setSubmissionHistoryLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submissionFieldErrors, setSubmissionFieldErrors] = useState<SubmissionUrlErrors>({});
  const [submissionEligibility, setSubmissionEligibility] = useState<SubmissionEligibility>({
    loading: false,
    canSubmit: true,
    reason: "",
  });

  const [judgingScores, setJudgingScores] = useState<JudgingDTO[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string; time: string; read: boolean }>>([]);

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
      .catch(() => { });
  }, [user?.userId]);

  const fetchNotifications = () => {
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
      .catch(() => { });
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when navigating to notification page
  useEffect(() => {
    if (currentPage === "notifications") {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Re-fetch when mark-all-read is triggered from the Layout dropdown
  useEffect(() => {
    if (markAllReadKey && markAllReadKey > 0) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, [markAllReadKey]);

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

  useEffect(() => {
    if (currentPage !== "submissions" || !activeTeam?.teamId || !activeTeam.categoryId || !submissionForm.roundId) {
      setSubmissionEligibility({ loading: false, canSubmit: true, reason: "" });
      return;
    }

    const selectedRound = submissionRounds.find(round => round.roundId === submissionForm.roundId);
    const previousRound = getPreviousOfficialRound(submissionRounds, submissionForm.roundId);

    if (!selectedRound || selectedRound.roundOrder <= 1 || !previousRound) {
      setSubmissionEligibility({ loading: false, canSubmit: true, reason: "" });
      return;
    }

    let cancelled = false;
    setSubmissionEligibility({
      loading: true,
      canSubmit: false,
      reason: `Checking advancement from ${previousRound.roundName}...`,
      previousRoundName: previousRound.roundName,
    });

    rankingService.getRoundLeaderboard(previousRound.roundId, activeTeam.categoryId)
      .then(rankings => {
        if (cancelled) return;
        const previousRank = rankings.find(rank => rank.teamId === activeTeam.teamId);
        if (previousRank?.isAdvanced === true) {
          setSubmissionEligibility({
            loading: false,
            canSubmit: true,
            reason: `Advanced from ${previousRound.roundName}.`,
            previousRoundName: previousRound.roundName,
            previousRank,
          });
          return;
        }

        setSubmissionEligibility({
          loading: false,
          canSubmit: false,
          reason: previousRank
            ? `Your team did not advance from ${previousRound.roundName}, so this round is locked.`
            : `No advancement result was found for your team in ${previousRound.roundName}.`,
          previousRoundName: previousRound.roundName,
          previousRank,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSubmissionEligibility({
          loading: false,
          canSubmit: false,
          reason: `Advancement results for ${previousRound.roundName} are not available yet.`,
          previousRoundName: previousRound.roundName,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [activeTeam?.categoryId, activeTeam?.teamId, currentPage, submissionForm.roundId, submissionRounds]);

  const handleSubmit = async () => {
    if (!submissionForm.teamId || !submissionForm.roundId) {
      setSubmitError("Please select a round before submitting.");
      return;
    }
    if (!submissionForm.submissionName.trim()) {
      setSubmitError("Submission name is required.");
      return;
    }
    if (isWithdrawnTeam(activeTeam)) {
      setSubmitError(TEAM_WITHDRAWN_SUBMISSION_MESSAGE);
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
    if (submissionEligibility.loading) {
      setSubmitError("Please wait while we check your team's advancement status.");
      return;
    }
    if (!submissionEligibility.canSubmit) {
      setSubmitError(submissionEligibility.reason || "Your team is not eligible to submit this round.");
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
    const selectedRoundLocked = !!selectedRound
      && !submissionEligibility.loading
      && !submissionEligibility.canSubmit;
    const teamWithdrawn = isWithdrawnTeam(activeTeam);
    const teamCanSubmit = !activeTeam || isTeamActive(activeTeam.teamStatusId, activeTeam.teamStatusName);
    const canSubmitSelectedRound = !!submissionForm.roundId
      && selectedRoundOpen
      && !submissionEligibility.loading
      && submissionEligibility.canSubmit
      && teamCanSubmit;
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
                  {teamWithdrawn ? TEAM_WITHDRAWN_SUBMISSION_MESSAGE : "Submissions unlock after organizer approval."}
                </span>
              )}
            </div>
          </Card>
        )}
        <Card className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>Round</span>
              <Select
                value={submissionForm.roundId}
                onValueChange={value => setSubmissionForm(prev => ({ ...prev, roundId: value }))}
                disabled={submissionRoundsLoading}
              >
                <SelectTrigger
                  className="w-full px-3 py-2 rounded-xl outline-none mt-1"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                >
                  <SelectValue placeholder={submissionRoundsLoading ? "Loading rounds..." : submissionRounds.length === 0 ? "No official rounds available" : "Select a round..."} />
                </SelectTrigger>
                <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  {submissionRoundsLoading && <div className="p-2 text-sm text-center text-muted-foreground">Loading rounds...</div>}
                  {!submissionRoundsLoading && submissionRounds.length === 0 && <div className="p-2 text-sm text-center text-muted-foreground">No official rounds available</div>}
                  {submissionRounds.map(round => (
                    <SelectItem key={round.roundId} value={round.roundId} style={{ color: COLORS.textPrimary }}>
                      {round.roundName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRound ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={selectedRoundOpen ? "open" : "closed"} />
                  {selectedRound.roundOrder > 1 && (
                    <StatusBadge status={submissionEligibility.loading ? "pending" : selectedRoundLocked ? "locked" : "advanced"} />
                  )}
                  <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                    Deadline: {formatDate(selectedRound.submissionDeadline || undefined)}
                  </span>
                  {submissionEligibility.reason && (
                    <span style={{ fontSize: 12, color: selectedRoundLocked ? COLORS.error : COLORS.success }}>
                      {submissionEligibility.reason}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-2" style={{ fontSize: 12, color: COLORS.textSecondary }}>
                  Choose the round this submission belongs to.
                </div>
              )}
            </label>
            <TextField label="Submission Name" value={submissionForm.submissionName} onChange={value => setSubmissionForm(prev => ({ ...prev, submissionName: value }))} icon={<FileText size={14} />} />
            <SubmissionRepositoryField
              value={submissionForm.repositoryUrl}
              onChange={value => {
                setSubmissionForm(prev => ({ ...prev, repositoryUrl: value }));
                setSubmissionFieldErrors(prev => ({ ...prev, repositoryUrl: undefined }));
              }}
              error={submissionFieldErrors.repositoryUrl}
              editable={canSubmitSelectedRound}
            />
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
              disabled={submitLoading || !canSubmitSelectedRound}
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
          {activeSubmission?.repository && (
            <div className="mt-4">
              <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>
                Saved repository metadata (from database)
              </div>
              <RepositoryMetadataCard
                repository={activeSubmission.repository}
                // Refresh chi kha dung khi round con cho phep nop bai (submission editable).
                onRefresh={canSubmitSelectedRound ? async () => {
                  if (!activeSubmission?.submissionId) return;
                  setRepoSyncing(true);
                  try {
                    const repo = await submissionService.syncSubmissionRepository(activeSubmission.submissionId);
                    setActiveSubmission(prev => (prev ? { ...prev, repository: repo } : prev));
                  } catch (error) {
                    setSubmitError(error instanceof Error ? error.message : "Repository sync failed.");
                  } finally {
                    setRepoSyncing(false);
                  }
                } : undefined}
                refreshing={repoSyncing}
              />
            </div>
          )}
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
        setLeaderboardTeams(teams.map(t => {
          const discoveredTeam = t as TeamResponse & { eventName?: string };
          return {
            eventId: discoveredTeam.eventId,
            eventName: discoveredTeam.eventName ?? events.find(e => e.eventId === discoveredTeam.eventId)?.eventName,
            categoryId: discoveredTeam.categoryId,
          };
        }));
      } catch (e) {
        console.error(e);
      }
    };
    if (user?.userId) fetchTeams();
    return () => { cancelled = true; };
  }, [currentPage, user?.userId]);

  useEffect(() => {
    leaderboardTeamsRef.current = leaderboardTeams;
  }, [leaderboardTeams]);

  useEffect(() => {
    if (currentPage !== "leaderboard" && currentPage !== "rankings") return;
    const targetEventId = leaderboardEventId || activeTeam?.eventId;
    if (!targetEventId) return;

    const team = leaderboardTeamsRef.current.find(t => t.eventId === targetEventId);
    const targetCategoryId = team?.categoryId || activeTeam?.categoryId;
    if (!targetCategoryId) return;

    roundService.getByCategory(targetCategoryId)
      .then(setLeaderboardRounds)
      .catch(() => setLeaderboardRounds([]));
  }, [currentPage, leaderboardEventId, activeTeam?.eventId, activeTeam?.categoryId]);

  useEffect(() => {
    if (currentPage !== "leaderboard" && currentPage !== "rankings") return;
    const targetEventId = leaderboardEventId || activeTeam?.eventId;
    if (!targetEventId) return;

    const team = leaderboardTeamsRef.current.find(t => t.eventId === targetEventId);
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
  }, [currentPage, leaderboardEventId, leaderboardRoundId, activeTeam?.eventId, activeTeam?.categoryId]);

  const renderRankings = () => {
    const currentEventId = leaderboardEventId || activeTeam?.eventId || "";

    return (
      <>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <SectionHeader title="Team Rankings" subtitle={leaderboardRoundId === "event" ? "Event leaderboard rankings" : `Round Rankings`} />
          <div className="flex items-center gap-2">
            {leaderboardTeams.length > 0 && (
              <Select
                value={currentEventId || "none"}
                onValueChange={(value) => { setLeaderboardEventId(value === "none" ? "" : value); setLeaderboardRoundId("event"); }}
              >
                <SelectTrigger
                  className="px-3 py-1.5 rounded-md outline-none"
                  style={{
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textPrimary,
                    fontSize: 13,
                    width: "180px",
                  }}
                >
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <SelectItem value="none" style={{ color: COLORS.textPrimary }}>Select Event</SelectItem>
                  {leaderboardTeams.map(ev => (
                    <SelectItem key={ev.eventId} value={ev.eventId} style={{ color: COLORS.textPrimary }}>
                      {ev.eventName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {leaderboardRounds.length > 0 && (
              <Select
                value={leaderboardRoundId}
                onValueChange={(value) => setLeaderboardRoundId(value)}
              >
                <SelectTrigger
                  className="px-3 py-1.5 rounded-md outline-none"
                  style={{
                    background: COLORS.bg,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.textPrimary,
                    fontSize: 13,
                    width: "180px",
                  }}
                >
                  <SelectValue placeholder="Event Ranking" />
                </SelectTrigger>
                <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <SelectItem value="event" style={{ color: COLORS.textPrimary }}>Event Ranking</SelectItem>
                  {leaderboardRounds.map(r => (
                    <SelectItem key={r.roundId} value={r.roundId} style={{ color: COLORS.textPrimary }}>
                      {r.roundName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: COLORS.bg }}>
                  {["Rank", "Team", ...(leaderboardRoundId !== "event" ? ["Score"] : []), "Category", ...(leaderboardRoundId !== "event" ? ["Result"] : [])].map(h => (
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
                          {(() => {
                            const rank = row.rankPosition ?? row.rank;
                            if (!rank || rank <= 0) {
                              return <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, width: 20, textAlign: "center" }}>-</span>;
                            }
                            if (rank <= 3) {
                              return <span style={{ fontSize: 16 }}>{["🥇", "🥈", "🥉"][rank - 1]}</span>;
                            }
                            return <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, width: 20, textAlign: "center" }}>#{rank}</span>;
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ fontSize: 14, fontWeight: isMe ? 700 : 500, color: isMe ? COLORS.primary : COLORS.textPrimary }}>
                          {row.teamName ?? row.teamId ?? row.team} {isMe && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 8, background: `${COLORS.primary}20`, color: COLORS.primary, marginLeft: 6 }}>You</span>}
                        </span>
                      </td>
                      {leaderboardRoundId !== "event" && (
                        <td className="px-4 py-3">
                          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>
                            {row.finalScore?.toFixed(1) ?? row.totalScore ?? row.score}
                          </span>
                        </td>
                      )}
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

  // Form hồ sơ dùng chung: load/save qua API /api/v1/me thật (nút Save cũ chỉ
  // set state local nên logout/login là mất — bug đã sửa).
  const renderProfile = () => (
    <MyProfileSection title="My Profile" subtitle="Update your personal information" />
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
