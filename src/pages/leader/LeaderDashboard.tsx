import { useEffect, useState } from "react";
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
import { submissionService, type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { teamService, type JoinTeamRequestResponse, type TeamResponse } from "@/features/teams/api/teamService";
import { TeamApiPanel } from "@/features/teams/components/TeamApiPanel";
import { notificationService } from "@/features/notifications/api/notificationService";
import { judgingService, type JudgingDTO } from "@/features/judging/api/judgingService";

const ACTIVE_TEAM_STORAGE_KEY = "seal_active_team";

const rankings = [
  { rank: 1, team: "AlphaCoders", score: 92.1, change: 0, r1: 88.5, r2: 95.7 },
  { rank: 2, team: "CodeCraft Pro", score: 89.5, change: 2, r1: 85.2, r2: 93.8 },
  { rank: 3, team: "ByteBuilders", score: 87.8, change: -1, r1: 90.1, r2: 85.5 },
  { rank: 8, team: "CloudChasers", score: 82.3, change: 4, r1: 79.8, r2: 84.8 },
  { rank: 12, team: "DevDynamo", score: 79.3, change: 3, r1: 76.8, r2: 81.8 },
];

type StoredTeam = {
  teamId?: string;
  eventId?: string;
  categoryId?: string;
  teamName?: string;
  leaderUserId?: string;
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

function display(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? "-" : value;
}

export function LeaderDashboard({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  const { user } = useAuth();
  const [activeTeam, setActiveTeam] = useState<TeamResponse | null>(null);
  const [teamId, setTeamId] = useState("");
  const [pendingRequests, setPendingRequests] = useState<JoinTeamRequestResponse[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [handlingId, setHandlingId] = useState<string | null>(null);

  const [submissionForm, setSubmissionForm] = useState({
    teamId: "",
    roundId: "",
    repositoryUrl: "",
    demoUrl: "",
    reportUrl: "",
    slideUrl: "",
    notes: "",
  });
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionResponse[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<SubmissionResponse | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [judgingScores, setJudgingScores] = useState<JudgingDTO[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string; senderName?: string; time: string; read: boolean }>>([]);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    const stored = getStoredTeam();
    if (!stored?.teamId) return;
    setTeamId(stored.teamId);
    setSubmissionForm(prev => ({ ...prev, teamId: stored.teamId ?? "" }));
    teamService.getById(stored.teamId)
      .then(team => {
        setActiveTeam(team);
        setSubmissionForm(prev => ({ ...prev, teamId: team.teamId }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    notificationService.getMyNotifications()
      .then(page => {
        setNotifications((page?.content ?? []).map((notification: any) => ({
          id: notification.notificationId,
          title: notification.title,
          body: notification.body,
          senderName: notification.senderName,
          time: formatDate(notification.createdAt),
          read: notification.read,
        })));
      })
      .catch(() => {});
  }, []);

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

  const handleSubmit = async () => {
    if (!submissionForm.teamId || !submissionForm.roundId) {
      setSubmitError("Team ID and Round ID are required.");
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
        notes: submissionForm.notes,
      });
      setActiveSubmission(saved);
      setSubmissionHistory(prev => [saved, ...prev.filter(item => item.submissionId !== saved.submissionId)]);
      setSubmitMessage("Submission saved.");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const loadSubmission = async () => {
    if (!submissionForm.teamId || !submissionForm.roundId) {
      setSubmitError("Team ID and Round ID are required.");
      return;
    }

    setSubmissionLoading(true);
    setSubmitError("");
    setSubmitMessage("");
    try {
      const submission = await submissionService.getByTeamAndRound(submissionForm.teamId, submissionForm.roundId);
      setActiveSubmission(submission);
      setSubmissionHistory(prev => [submission, ...prev.filter(item => item.submissionId !== submission.submissionId)]);
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
      <TeamApiPanel initialTeamId={teamId} mode="leader" />
    </>
  );

  const renderSubmissions = () => (
    <>
      <SectionHeader title="Submission Center" subtitle="Submit and load your team's work from backend API" />
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField label="Team ID" value={submissionForm.teamId} onChange={value => setSubmissionForm(prev => ({ ...prev, teamId: value }))} />
          <TextField label="Round ID" value={submissionForm.roundId} onChange={value => setSubmissionForm(prev => ({ ...prev, roundId: value }))} />
          <TextField label="Repository URL" value={submissionForm.repositoryUrl} onChange={value => setSubmissionForm(prev => ({ ...prev, repositoryUrl: value }))} icon={<Github size={14} />} />
          <TextField label="Demo URL" value={submissionForm.demoUrl} onChange={value => setSubmissionForm(prev => ({ ...prev, demoUrl: value }))} icon={<Globe size={14} />} />
          <TextField label="Report URL" value={submissionForm.reportUrl} onChange={value => setSubmissionForm(prev => ({ ...prev, reportUrl: value }))} icon={<FileText size={14} />} />
          <TextField label="Slide URL" value={submissionForm.slideUrl} onChange={value => setSubmissionForm(prev => ({ ...prev, slideUrl: value }))} icon={<FileText size={14} />} />
        </div>
        <label className="block mt-4">
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>Notes</span>
          <textarea
            value={submissionForm.notes}
            onChange={event => setSubmissionForm(prev => ({ ...prev, notes: event.target.value }))}
            rows={3}
            className="w-full px-3 py-2 rounded-xl outline-none resize-none mt-1"
            style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <Button
            variant="primary"
            size="md"
            icon={submitLoading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
            onClick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? "Submitting..." : "Submit Work"}
          </Button>
          <Button
            variant="outline"
            size="md"
            icon={submissionLoading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
            onClick={loadSubmission}
            disabled={submissionLoading}
          >
            {submissionLoading ? "Loading..." : "Load Submission"}
          </Button>
          {submitMessage && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>{submitMessage}</span>}
          {submitError && <span style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>{submitError}</span>}
        </div>
      </Card>

      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Submission History</div>
        {submissionHistory.length === 0 ? (
          <EmptyLine text="No submissions loaded yet." />
        ) : (
          <div className="space-y-3">
            {submissionHistory.map(submission => (
              <SubmissionCard
                key={submission.submissionId}
                submission={submission}
                onLoadFeedback={() => loadFeedback(submission.submissionId)}
              />
            ))}
          </div>
        )}
      </Card>
    </>
  );

  const renderRankings = () => (
    <>
      <SectionHeader title="Team Rankings" subtitle="AI Agents Track - SEAL Fall 2025" />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {["Rank", "Team", "Total Score", "Round 1", "Round 2", "Change"].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...rankings].map(row => {
                const isMe = row.team === "DevDynamo";
                return (
                  <tr key={row.rank} style={{ borderBottom: `1px solid ${COLORS.border}`, background: isMe ? `${COLORS.primary}08` : undefined }}>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: row.rank <= 3 ? 18 : 14, fontWeight: 700, color: COLORS.textPrimary }}>
                        {row.rank <= 3 ? ["1st", "2nd", "3rd"][row.rank - 1] : `#${row.rank}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 14, fontWeight: isMe ? 700 : 500, color: isMe ? COLORS.primary : COLORS.textPrimary }}>
                        {row.team} {isMe && <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 8, background: `${COLORS.primary}20`, color: COLORS.primary }}>You</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3"><span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{row.score}</span></td>
                    <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.r1}</span></td>
                    <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.r2}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1" style={{ color: row.change > 0 ? COLORS.success : row.change < 0 ? COLORS.error : COLORS.textSecondary }}>
                        {row.change > 0 ? <TrendingUp size={13} /> : row.change < 0 ? <TrendingDown size={13} /> : <Minus size={13} />}
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{row.change !== 0 ? Math.abs(row.change) : "-"}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );

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
              <div className="min-w-0">
                {notification.senderName && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.primary, marginBottom: 2 }}>
                    {notification.senderName}
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: notification.read ? 500 : 700, color: COLORS.textPrimary }}>{notification.title}</div>
                <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 1.5 }}>{notification.body}</p>
                <span style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4, display: "block" }}>{notification.time}</span>
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
          <InfoPill label="Student Code" value={user?.studentCode} />
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
      case "rankings": return renderRankings();
      case "notifications": return renderNotifications();
      case "feedback": return renderFeedback();
      case "requests": return renderRequests();
      case "settings": return renderSettings();
      case "profile": return renderProfile();
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
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
        style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
      />
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

function SubmissionCard({ submission, onLoadFeedback }: { submission: SubmissionResponse; onLoadFeedback: () => void }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>Round ID: {submission.roundId}</div>
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
      {submission.notes && <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 12 }}>{submission.notes}</p>}
    </div>
  );
}
