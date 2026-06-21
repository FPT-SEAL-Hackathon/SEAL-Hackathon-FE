import { useState, useEffect } from "react";
import {
  Upload, Trophy, Users, CheckCircle, Star, PlusCircle,
  Trash2, Edit, ExternalLink, Github, Globe, FileText,
  AlertCircle, ChevronRight, Mail, Save, Info, Award,
  TrendingUp, TrendingDown, Minus, Bell, Settings, Zap, MessageSquare, Loader
} from "lucide-react";
import {
  StatCard, Card, SectionHeader, COLORS, StatusBadge,
  ProgressBar, Button, AvatarGroup, TimelineItem
} from "@/components/shared/UIComponents";
import { useAuth } from "@/features/auth/store/authStore";
import { submissionService, type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { teamService, type JoinTeamRequestResponse } from "@/features/teams/api/teamService";
import { notificationService } from "@/features/notifications/api/notificationService";
import { judgingService, type JudgingDTO } from "@/features/judging/api/judgingService";

const teamMembers = [
  { id: 1, name: "Alex Johnson", role: "Team Leader", avatar: "AJ", email: "alex.j@fpt.edu.vn", joinDate: "Nov 15, 2025", status: "active" },
  { id: 2, name: "Maria Chen", role: "Backend Developer", avatar: "MC", email: "maria.c@fpt.edu.vn", joinDate: "Nov 16, 2025", status: "active" },
  { id: 3, name: "James Park", role: "ML Engineer", avatar: "JP", email: "james.p@fpt.edu.vn", joinDate: "Nov 16, 2025", status: "active" },
  { id: 4, name: "Sofia Rodriguez", role: "DevOps Engineer", avatar: "SR", email: "sofia.r@fpt.edu.vn", joinDate: "Nov 17, 2025", status: "active" },
  { id: 5, name: "David Kim", role: "Frontend Developer", avatar: "DK", email: "david.k@fpt.edu.vn", joinDate: "Nov 17, 2025", status: "active" },
];

const avatarColors = ["#4F46E5", "#06B6D4", "#8B5CF6", "#22C55E", "#F59E0B"];

const submissions = [
  {
    id: 1, round: "Round 1 — Qualifying", submittedAt: "Nov 20, 2025 at 3:30 PM",
    githubUrl: "https://github.com/devdynamo/ai-task-manager",
    slideUrl: "https://slides.devdynamo.ai/round1",
    score: 76.8, status: "completed",
    feedback: [
      { criterion: "Innovation & Creativity", score: 19, max: 25, comment: "Good concept but needs more originality in approach." },
      { criterion: "Technical Complexity", score: 20, max: 25, comment: "Solid implementation with clean code architecture." },
      { criterion: "Business Impact", score: 18, max: 25, comment: "Clear use case but market analysis could be stronger." },
      { criterion: "Presentation", score: 20, max: 25, comment: "Excellent demo video and documentation." },
    ]
  },
  {
    id: 2, round: "Round 2 — Finals", submittedAt: "Nov 27, 2025 at 2:15 PM",
    githubUrl: "https://github.com/devdynamo/ai-task-manager-v2",
    slideUrl: "https://slides.devdynamo.ai/round2",
    score: null, status: "submitted",
    feedback: []
  },
];

const rankings = [
  { rank: 1, team: "AlphaCoders", score: 92.1, change: 0, r1: 88.5, r2: 95.7 },
  { rank: 2, team: "CodeCraft Pro", score: 89.5, change: 2, r1: 85.2, r2: 93.8 },
  { rank: 3, team: "ByteBuilders", score: 87.8, change: -1, r1: 90.1, r2: 85.5 },
  { rank: 8, team: "CloudChasers", score: 82.3, change: 4, r1: 79.8, r2: 84.8 },
  { rank: 12, team: "DevDynamo", score: 79.3, change: 3, r1: 76.8, r2: 81.8 },
];

const initialNotifs = [
  { id: 1, title: "Finals round submission window open", body: "Round 2 submissions are now being accepted until Dec 1, 2025.", type: "info", time: "1d ago", read: false },
  { id: 2, title: "Score update: Round 1 results", body: "Your team scored 76.8/100. Check feedback from judges.", type: "info", time: "3d ago", read: false },
  { id: 3, title: "Mentor session reminder", body: "Meeting with Dr. Nguyen tomorrow at 10:00 AM.", type: "warning", time: "4d ago", read: true },
];

export function LeaderDashboard({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  const { user } = useAuth();

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState(initialNotifs);
  useEffect(() => {
    notificationService.getMyNotifications()
      .then(page => {
        if (page?.content?.length) {
          setNotifs(page.content.map((n: any) => ({
            id: n.notificationId, title: n.title, body: n.body,
            type: "info", time: new Date(n.createdAt).toLocaleDateString("en-US"), read: n.read,
          })));
        }
      }).catch(() => {});
  }, []);

  // ── Join requests ─────────────────────────────────────────────────────────
  const [joinRequests, setJoinRequests] = useState<JoinTeamRequestResponse[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);

  // ── API submission form ───────────────────────────────────────────────────
  const [submissionForm, setSubmissionForm] = useState({ teamId: "", roundId: "", githubUrl: "", slideUrl: "", demoUrl: "", reportUrl: "", notes: "" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ── Judge feedback (judging scores) ──────────────────────────────────────
  const [judgingScores, setJudgingScores] = useState<JudgingDTO[]>([]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent, setInviteSent] = useState(false);
  const [activeSub, setActiveSub] = useState<number | null>(null);

  const unread = notifs.filter((n: any) => !n.read).length;
  const markRead = async (id: any) => {
    setNotifs(prev => prev.map((n: any) => n.id === id ? { ...n, read: true } : n));
    try { await notificationService.markAsRead(String(id)); } catch { /* ignore */ }
  };
  const markAllRead = async () => {
    setNotifs(prev => prev.map((n: any) => ({ ...n, read: true })));
    try { await notificationService.markAllAsRead(); } catch { /* ignore */ }
  };

  const handleSubmit = async () => {
    if (!submissionForm.githubUrl) return;
    setSubmitLoading(true);
    setSubmitError("");
    try {
      await submissionService.submit({
        teamId: submissionForm.teamId || "demo-team",
        roundId: submissionForm.roundId || "demo-round",
        repositoryUrl: submissionForm.githubUrl,
        slideUrl: submissionForm.slideUrl,
        demoUrl: submissionForm.demoUrl,
        reportUrl: submissionForm.reportUrl,
        notes: submissionForm.notes,
      });
      setSubmitSuccess(true);
      setSubmissionForm(p => ({ ...p, githubUrl: "", slideUrl: "", demoUrl: "", reportUrl: "", notes: "" }));
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err: any) {
      setSubmitError(err?.message ?? "Submission failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderDashboard = () => (
    <>
      <SectionHeader title="Team Leader Dashboard" subtitle="DevDynamo • AI Agents Track • SEAL Fall 2025" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Team Members" value={5} icon={<Users size={20} />} color={COLORS.primary} />
        <StatCard title="Current Rank" value="#12" trend={3} icon={<Trophy size={20} />} color={COLORS.warning} />
        <StatCard title="Avg Score" value="79.3" trend={5} icon={<Star size={20} />} color={COLORS.success} />
        <StatCard title="Submissions" value="2/2" icon={<Upload size={20} />} color={COLORS.secondary} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Score Breakdown</div>
          {[
            { label: "Innovation & Creativity", value: 78, max: 100, color: COLORS.accent },
            { label: "Technical Complexity", value: 82, max: 100, color: COLORS.primary },
            { label: "Business Impact", value: 75, max: 100, color: COLORS.secondary },
            { label: "Presentation Quality", value: 84, max: 100, color: COLORS.success },
          ].map(c => (
            <div key={c.label} className="mb-3">
              <ProgressBar value={c.value} max={c.max} color={c.color} label={c.label} />
            </div>
          ))}
        </Card>

        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Submission Checklist</div>
          {submissions.map(sub => (
            <div key={sub.id} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>{sub.round}</span>
                <StatusBadge status={sub.status} />
              </div>
              {[
                { label: "GitHub Repo", value: sub.githubUrl, icon: <Github size={13} /> },
                { label: "Slide URL", value: sub.slideUrl, icon: <FileText size={13} /> },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 mb-1">
                  <CheckCircle size={13} style={{ color: item.value ? COLORS.success : COLORS.border }} />
                  <span style={{ color: item.value ? COLORS.textSecondary : COLORS.error, fontSize: 13 }}>{item.label}</span>
                </div>
              ))}
              {sub.score !== null && (
                <div className="mt-2 px-3 py-1 rounded-lg inline-flex items-center gap-1" style={{ background: `${COLORS.success}10` }}>
                  <Star size={12} style={{ color: COLORS.success }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.success }}>Score: {sub.score}/100</span>
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>
    </>
  );

  const renderTeam = () => (
    <>
      <SectionHeader
        title="Team Management"
        subtitle="DevDynamo • 5 members"
        action={
          <div className="flex gap-2">
            <input
              placeholder="Invite by email..."
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{ border: `1px solid ${COLORS.border}`, width: 200, fontSize: 14 }}
            />
            <Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => { if (inviteEmail) { setInviteSent(true); setInviteEmail(""); setTimeout(() => setInviteSent(false), 2500); } }}>
              Invite
            </Button>
          </div>
        }
      />
      {inviteSent && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: `${COLORS.success}10`, border: `1px solid ${COLORS.success}30` }}>
          <CheckCircle size={16} style={{ color: COLORS.success }} />
          <span style={{ fontSize: 14, color: COLORS.success }}>Invitation sent successfully!</span>
        </div>
      )}
      <div className="space-y-3">
        {teamMembers.map((m, i) => (
          <Card key={m.id} className="p-4">
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center rounded-full text-white flex-shrink-0"
                style={{ width: 44, height: 44, background: avatarColors[i % avatarColors.length], fontSize: 15, fontWeight: 700 }}
              >
                {m.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{m.name}</span>
                  {i === 0 && <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: `${COLORS.accent}20`, color: COLORS.accent }}>You</span>}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{m.role} • Joined {m.joinDate}</div>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{m.email}</span>
                <StatusBadge status={m.status} />
                {i !== 0 && (
                  <Button variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => {}}>Remove</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const renderSubmissions = () => (
    <>
      <SectionHeader title="Submission Center" subtitle="Manage your team's submissions for SEAL Fall 2025" />

      {/* New Submission Form — POST /submissions */}
      <Card className="p-5">
        <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 4 }}>Submit to Round</div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 }}>
          POST /submissions — Round 2 Finals • Deadline: Dec 1, 2025 at 11:59 PM
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>ROUND</label>
            <select
              value={submissionForm.roundId}
              onChange={e => setSubmissionForm(p => ({ ...p, roundId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
            >
              <option value="1">Round 1 — Qualifying</option>
              <option value="2">Round 2 — Finals</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>TEAM ID</label>
            <input
              value={submissionForm.teamId}
              readOnly
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: `${COLORS.bg}88`, color: COLORS.textSecondary }}
            />
          </div>
        </div>
        <div className="space-y-4">
          {[
            { label: "GitHub Repository URL", key: "githubUrl", placeholder: "https://github.com/your-team/project", icon: <Github size={14} /> },
            { label: "Slide / Presentation URL (slideUrl)", key: "slideUrl", placeholder: "https://slides.google.com/...", icon: <FileText size={14} /> },
          ].map(field => (
            <div key={field.key}>
              <label className="flex items-center gap-2 mb-2" style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>
                {field.icon} {field.label}
              </label>
              <input
                value={submissionForm[field.key as keyof typeof submissionForm]}
                onChange={e => setSubmissionForm(p => ({ ...p, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-5">
          <Button
            variant="primary"
            size="md"
            icon={submitLoading ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
            onClick={handleSubmit}
            disabled={!submissionForm.githubUrl || submitLoading}
          >
            {submitLoading ? "Submitting..." : "Submit Now"}
          </Button>
          {submitSuccess && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>✓ Submission uploaded successfully!</span>}
          {submitError && <span style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>{submitError}</span>}
        </div>
      </Card>

      {/* Submission History */}
      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginTop: 8 }}>Submission History</div>
      {submissions.map(sub => (
        <Card key={sub.id} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{sub.round}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Submitted {sub.submittedAt}</div>
            </div>
            <div className="flex items-center gap-3">
              {sub.score !== null && (
                <span className="px-3 py-1 rounded-xl font-bold" style={{ background: `${COLORS.success}15`, color: COLORS.success, fontSize: 14 }}>
                  {sub.score}/100
                </span>
              )}
              <StatusBadge status={sub.status} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "GitHub Repo", value: sub.githubUrl, icon: <Github size={13} /> },
              { label: "Slide URL", value: sub.slideUrl, icon: <FileText size={13} /> },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                <span style={{ color: item.value ? COLORS.primary : COLORS.border }}>{item.icon}</span>
                <span style={{ fontSize: 12, color: item.value ? COLORS.primary : COLORS.textSecondary }}>
                  {item.value ? item.label : `${item.label} — Missing`}
                </span>
              </div>
            ))}
          </div>
          {sub.feedback.length > 0 && (
            <button
              onClick={() => setActiveSub(activeSub === sub.id ? null : sub.id)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: COLORS.primary }}
            >
              <Star size={14} /> {activeSub === sub.id ? "Hide" : "View"} Judge Feedback
            </button>
          )}
          {activeSub === sub.id && (
            <div className="mt-4 space-y-3">
              {sub.feedback.map(f => (
                <div key={f.criterion} className="p-3 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{f.criterion}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary }}>{f.score}/{f.max}</span>
                  </div>
                  <ProgressBar value={f.score} max={f.max} color={COLORS.primary} />
                  <p style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>{f.comment}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </>
  );

  const renderRankings = () => (
    <>
      <SectionHeader title="Team Rankings" subtitle="AI Agents Track — SEAL Fall 2025" />
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
              {[...rankings].map((row, i) => {
                const isMe = row.team === "DevDynamo";
                return (
                  <tr key={row.rank} style={{ borderBottom: `1px solid ${COLORS.border}`, background: isMe ? `${COLORS.primary}08` : undefined }}>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: row.rank <= 3 ? 18 : 14, fontWeight: 700, color: COLORS.textPrimary }}>
                        {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : `#${row.rank}`}
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
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{row.change !== 0 ? Math.abs(row.change) : "—"}</span>
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
        {notifs.map(n => {
          const iconColor = n.type === "warning" ? COLORS.warning : n.type === "success" ? COLORS.success : COLORS.primary;
          const Icon = n.type === "warning" ? AlertCircle : n.type === "success" ? CheckCircle : Info;
          return (
            <Card key={n.id} className="p-4" style={{ borderLeft: !n.read ? `3px solid ${iconColor}` : undefined, opacity: n.read ? 0.75 : 1 }}>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${iconColor}15` }}>
                  <Icon size={15} style={{ color: iconColor }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: COLORS.textPrimary }}>{n.title}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full" style={{ background: COLORS.primary }} />}
                  </div>
                  <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>{n.body}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{n.time}</span>
                    {!n.read && <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>Mark as read</Button>}
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
      <SectionHeader title="Judge Feedback" subtitle="Detailed scoring and comments from judges for each round" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Round 1 — Judge Feedback</div>
          {submissions[0].feedback.map(f => (
            <div key={f.criterion} className="mb-4">
              <div className="flex justify-between mb-1">
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{f.criterion}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary }}>{f.score}/{f.max}</span>
              </div>
              <ProgressBar value={f.score} max={f.max} color={COLORS.primary} />
              <p style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontStyle: "italic" }}>"{f.comment}"</p>
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Overall Summary</div>
          <div className="space-y-3">
            {[
              { label: "Total Score", value: `${submissions[0].feedback.reduce((s, f) => s + f.score, 0)} / ${submissions[0].feedback.reduce((s, f) => s + f.max, 0)}`, color: COLORS.primary },
              { label: "Highest Criterion", value: [...submissions[0].feedback].sort((a,b) => b.score/b.max - a.score/a.max)[0]?.criterion ?? "—", color: COLORS.success },
              { label: "Round Status", value: "Completed", color: COLORS.success },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );

  const renderProfile = () => (
    <>
      <SectionHeader title="My Profile" subtitle="Manage your personal information and account details" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-center text-center gap-4">
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #F47920, #FF9040)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 700, color: "#fff",
            boxShadow: "0 4px 16px rgba(244,121,32,0.35)"
          }}>AJ</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>Alex Johnson</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>Team Leader · DevDynamo</div>
            <StatusBadge status="active" />
          </div>
          <div className="w-full space-y-2 text-left mt-2">
            {[
              { icon: <Mail size={14} />, value: "alex.j@fpt.edu.vn" },
              { icon: <Github size={14} />, value: "github.com/alexj" },
              { icon: <Globe size={14} />, value: "alexjohnson.dev" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2" style={{ fontSize: 13, color: COLORS.textSecondary }}>
                <span style={{ color: COLORS.primary }}>{item.icon}</span>
                {item.value}
              </div>
            ))}
          </div>
        </Card>
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Personal Information</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Full Name", value: "Alex Johnson" },
                { label: "Student ID", value: "FPT2021001" },
                { label: "Email", value: "alex.j@fpt.edu.vn" },
                { label: "Phone", value: "+84 909 123 456" },
                { label: "GitHub", value: "github.com/alexj" },
                { label: "Portfolio", value: "alexjohnson.dev" },
              ].map(field => (
                <div key={field.label}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{field.label}</label>
                  <input
                    defaultValue={field.value}
                    className="w-full px-3 py-2 rounded-xl outline-none"
                    style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>Bio</label>
                <textarea
                  rows={3}
                  defaultValue="Full-stack developer passionate about AI and building impactful products."
                  className="w-full px-3 py-2 rounded-xl outline-none resize-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button variant="primary" size="md" icon={<Save size={14} />}>Save Changes</Button>
            </div>
          </Card>
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Team & Hackathon Info</div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Team", value: "DevDynamo", color: COLORS.primary },
                { label: "Track", value: "AI Agents", color: COLORS.secondary },
                { label: "Current Rank", value: "#12", color: COLORS.warning },
              ].map(stat => (
                <div key={stat.label} className="text-center p-3 rounded-xl" style={{ background: COLORS.bg }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );

  const renderSettings = () => (
    <>
      <SectionHeader title="Team Settings" subtitle="Configure your team information and contact details" />
      <div className="max-w-lg">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Team Information</div>
          <div className="space-y-4">
            {[
              { label: "Team Name", value: "DevDynamo" },
              { label: "Track", value: "AI Agents" },
              { label: "Contact Email", value: "team@devdynamo.ai" },
            ].map(field => (
              <div key={field.label}>
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{field.label}</label>
                <input
                  defaultValue={field.value}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
            ))}
            <Button variant="primary" size="md" icon={<Save size={14} />}>Save Settings</Button>
          </div>
        </Card>
      </div>
    </>
  );

  // ── Join Requests page ────────────────────────────────────────────────────
  const [pendingRequests, setPendingRequests] = useState<JoinTeamRequestResponse[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [handlingId, setHandlingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentPage !== "requests") return;
    if (!teamId) return;
    setRequestsLoading(true);
    teamService.getPendingRequests(teamId)
      .then(setPendingRequests)
      .catch(() => {})
      .finally(() => setRequestsLoading(false));
  }, [currentPage, teamId]);

  const handleRequest = async (requestId: string, action: "APPROVED" | "REJECTED") => {
    setHandlingId(requestId);
    try {
      await teamService.handleJoinRequest(requestId, action);
      setPendingRequests(prev => prev.filter(r => r.requestId !== requestId));
    } catch { /* show error */ }
    setHandlingId(null);
  };

  const renderRequests = () => (
    <>
      <SectionHeader title="Join Requests" subtitle="Pending requests to join your team" />
      {requestsLoading && (
        <div className="flex items-center justify-center py-12 gap-2" style={{ color: COLORS.textSecondary }}>
          <Loader size={18} className="animate-spin" /> Loading...
        </div>
      )}
      {!requestsLoading && pendingRequests.length === 0 && (
        <Card className="p-8 text-center">
          <CheckCircle size={36} className="mx-auto mb-3" style={{ color: COLORS.border }} />
          <div style={{ fontSize: 15, color: COLORS.textSecondary }}>No pending join requests</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>
            Candidates can request to join via the platform
          </div>
        </Card>
      )}
      <div className="space-y-3">
        {pendingRequests.map(req => (
          <Card key={req.requestId} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>
                  User ID: <span className="font-mono text-xs">{req.userId}</span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                  Requested: {new Date(req.requestedAt).toLocaleString("en-US")}
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: `${COLORS.warning}20`, color: COLORS.warning }}>
                    {req.requestStatus}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" icon={handlingId === req.requestId ? <Loader size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  onClick={() => handleRequest(req.requestId, "APPROVED")}
                  disabled={handlingId === req.requestId}>
                  Approve
                </Button>
                <Button variant="danger" size="sm" icon={<Trash2 size={13} />}
                  onClick={() => handleRequest(req.requestId, "REJECTED")}
                  disabled={handlingId === req.requestId}>
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
