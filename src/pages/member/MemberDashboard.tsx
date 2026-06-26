import { useState, useEffect } from "react";
import {
  Calendar, Trophy, Users, Clock, Bell, CheckCircle,
  ExternalLink, Edit, PlusCircle, AlertCircle, Info,
  User, Mail, Github, Globe, TrendingUp, TrendingDown,
  Minus, ChevronRight, Star, Zap, Target, Award, FileText,
  MapPin, Phone, Save
} from "lucide-react";
import {
  StatCard, Card, SectionHeader, COLORS, StatusBadge,
  ProgressBar, DataTable, Button, AvatarGroup, TimelineItem
} from "@/components/shared/UIComponents";
import { useAuth } from "@/features/auth/store/authStore";
import { eventService } from "@/features/events/api/eventService";
import { notificationService } from "@/features/notifications/api/notificationService";
import { rankingService } from "@/features/rankings/api/rankingService";
import { submissionService } from "@/features/submissions/api/submissionService";





const avatarColors = ["#4F46E5", "#06B6D4", "#8B5CF6", "#22C55E", "#F59E0B"];

type MemberEvent = {
  id: string;
  name: string;
  category: string;
  deadline: string;
  status: string;
  participants: string;
  tracks: string;
  registered?: boolean;
  prizePool: string;
};

type MemberNotification = {
  id: string;
  title: string;
  body: string;
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

export function MemberDashboard({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  const { user } = useAuth();
  const displayName = user?.fullName || user?.email || "Member";
  const userInitials = getInitials(displayName);

  // ── Events ──────────────────────────────────────────────────────────────────
  const [apiEvents, setApiEvents] = useState<MemberEvent[]>([]);
  const [apiLeaderboard, setApiLeaderboard] = useState<any[]>([]);
  const [teamMembers] = useState<MemberTeamMember[]>([]);
  // Load leaderboard when on that page — needs eventId + categoryId from user's team
  useEffect(() => {
    if (currentPage !== "leaderboard") return;
    // Try to get active events and load leaderboard for first one
    eventService.getAll().then(evs => {
      if (!evs[0]) return;
      import("@/features/categories/api/categoryService").then(({ categoryService }) =>
        categoryService.getByEvent(evs[0].eventId).then(cats => {
          if (!cats[0]) return;
          rankingService.getLeaderboard(evs[0].eventId, cats[0].categoryId)
            .then(setApiLeaderboard).catch(() => {});
        })
      );
    }).catch(() => {});
  }, [currentPage]);

  useEffect(() => {
    eventService.getAll()
      .then(data => setApiEvents(data.map(e => ({
        id: e.eventId, name: e.eventName,
        category: e.description ?? "", deadline: e.registrationEnd ?? e.eventEndDate ?? "",
        status: e.eventStatusId || "unknown", participants: "N/A", tracks: "N/A", prizePool: "N/A",
      }))))
      .catch(() => {});
  }, []);

  // ── Notifications ────────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState<MemberNotification[]>([]);
  useEffect(() => {
    notificationService.getMyNotifications()
      .then(page => {
        if (page?.content?.length) {
          setNotifs(page.content.map((n: any) => ({
            id: n.notificationId, title: n.title, body: n.body,
            type: "info", time: new Date(n.createdAt).toLocaleDateString("en-US"), read: n.read,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName ?? "",
    studentId: user?.studentCode ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    github: "", portfolio: "",
    bio: "", major: "",
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [submissionForm, setSubmissionForm] = useState({
    teamId: "",
    roundId: "",
    repositoryUrl: "",
    demoUrl: "",
    reportUrl: "",
    slideUrl: "",
    notes: "",
  });
  const [submissionStatus, setSubmissionStatus] = useState("");
  const [submissionLoading, setSubmissionLoading] = useState(false);

  const unread = notifs.filter(n => !n.read).length;
  const markRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await notificationService.markAsRead(String(id)); } catch { /* ignore */ }
  };
  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    try { await notificationService.markAllAsRead(); } catch { /* ignore */ }
  };

  const handleSubmitWork = async () => {
    if (!submissionForm.teamId || !submissionForm.roundId) {
      setSubmissionStatus("Team ID and Round ID are required by the backend submission API.");
      return;
    }
    setSubmissionLoading(true);
    setSubmissionStatus("");
    try {
      await submissionService.submit(submissionForm);
      setSubmissionStatus("Submission saved.");
    } catch (error) {
      setSubmissionStatus(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setSubmissionLoading(false);
    }
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
            <div style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>{apiEvents[0]?.name ?? "No active event"}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: "8px 0" }}>{apiEvents[0]?.deadline ? "Deadline available" : "N/A"}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Deadline: {apiEvents[0]?.deadline || "No deadline data"}</div>
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
    <>
      <SectionHeader title="My Team" subtitle="Team information linked to your account" />
      {teamMembers.length === 0 && (
        <Card className="p-5">
          <div style={{ fontSize: 14, color: COLORS.textSecondary }}>No team members are available for your account yet.</div>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((m, i) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center rounded-full text-white"
                style={{ width: 44, height: 44, background: avatarColors[i % avatarColors.length], fontSize: 15, fontWeight: 700 }}
              >
                {m.avatar}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{m.name}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{m.role}</div>
              </div>
              {i === 0 && <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: `${COLORS.accent}20`, color: COLORS.accent }}>Leader</span>}
            </div>
            <div className="flex flex-wrap gap-1 mb-4">
              {m.skills.map(s => (
                <span key={s} className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${COLORS.primary}10`, color: COLORS.primary }}>{s}</span>
              ))}
            </div>
            <ProgressBar value={m.completed} max={m.tasks} color={COLORS.success} label={`Tasks: ${m.completed}/${m.tasks}`} />
            <div className="flex items-center gap-2 mt-3">
              <Mail size={13} style={{ color: COLORS.textSecondary }} />
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{m.email}</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const renderEvents = () => (
    <>
      <SectionHeader title="Browse Events" subtitle="Discover and register for hackathon events" />
      {apiEvents.length === 0 && (
        <Card className="p-5">
          <div style={{ fontSize: 14, color: COLORS.textSecondary }}>No events are available.</div>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {apiEvents.map(ev => (
          <Card key={ev.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>{ev.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>{ev.category}</div>
              </div>
              <StatusBadge status={ev.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "Deadline", value: ev.deadline, icon: <Calendar size={13} /> },
                { label: "Teams", value: ev.participants, icon: <Users size={13} /> },
                { label: "Tracks", value: ev.tracks, icon: <Target size={13} /> },
                { label: "Prize Pool", value: ev.prizePool, icon: <Award size={13} /> },
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
            <div className="flex gap-2">
              {ev.registered === true ? (
                <Button variant="outline" size="sm" icon={<CheckCircle size={13} />}>Registered</Button>
              ) : ev.registered === false && ev.status !== "completed" ? (
                <Button variant="primary" size="sm" icon={<PlusCircle size={13} />}>Register</Button>
              ) : (
                <Button variant="ghost" size="sm">View Event</Button>
              )}
              <Button variant="ghost" size="sm" icon={<ExternalLink size={13} />}>Details</Button>
            </div>
          </Card>
        ))}
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
                      The results are currently being compiled and approved by the Judging Panel.
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
                      Please come back later!
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

  const renderSubmissions = () => (
    <>
      <SectionHeader title="Submission Center" subtitle="Submit or update your team's work for an assigned round" />
      <Card className="p-5">
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: "Team ID", key: "teamId", icon: <Users size={14} /> },
            { label: "Round ID", key: "roundId", icon: <Clock size={14} /> },
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
                onChange={e => setSubmissionForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </label>
          ))}
        </div>
        <label className="block mt-4">
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>Notes</span>
          <textarea
            value={submissionForm.notes}
            onChange={e => setSubmissionForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 rounded-lg outline-none resize-none mt-1"
            style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
          />
        </label>
        <div className="flex items-center gap-3 mt-4">
          <Button variant="primary" size="md" icon={<FileText size={14} />} onClick={handleSubmitWork} disabled={submissionLoading}>
            {submissionLoading ? "Saving..." : "Submit Work"}
          </Button>
          {submissionStatus && (
            <span style={{ fontSize: 13, color: submissionStatus === "Submission saved." ? COLORS.success : COLORS.warning }}>
              {submissionStatus}
            </span>
          )}
        </div>
      </Card>
    </>
  );

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
              { icon: <User size={14} />, label: user?.studentCode || "No student code" },
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
      case "submissions": return renderSubmissions();
      case "notifications": return renderNotifications();
      case "profile": return renderProfile();
      default: return renderDashboard();
    }
  };

  return <div className="p-6 space-y-6">{renderPage()}</div>;
}
