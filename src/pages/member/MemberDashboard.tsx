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

const teamMembers = [
  { id: 1, name: "Alex Johnson", role: "Team Leader", avatar: "AJ", skills: ["React", "TypeScript", "UI/UX"], tasks: 4, completed: 3, email: "alex.j@fpt.edu.vn" },
  { id: 2, name: "Maria Chen", role: "Backend Developer", avatar: "MC", skills: ["Python", "FastAPI", "ML"], tasks: 5, completed: 4, email: "maria.c@fpt.edu.vn" },
  { id: 3, name: "James Park", role: "ML Engineer", avatar: "JP", skills: ["TensorFlow", "PyTorch", "Data"], tasks: 3, completed: 2, email: "james.p@fpt.edu.vn" },
  { id: 4, name: "Sofia Rodriguez", role: "DevOps Engineer", avatar: "SR", skills: ["Docker", "AWS", "CI/CD"], tasks: 3, completed: 3, email: "sofia.r@fpt.edu.vn" },
  { id: 5, name: "David Kim", role: "Frontend Developer", avatar: "DK", skills: ["Vue.js", "GraphQL", "CSS"], tasks: 4, completed: 2, email: "david.k@fpt.edu.vn" },
];

const events = [
  { id: 1, name: "SEAL Fall 2025", category: "AI/ML", deadline: "Dec 1, 2025", status: "active", participants: 127, tracks: 5, registered: true, prizePool: "$10,000" },
  { id: 2, name: "FPT Web3 Challenge", category: "Web3/Blockchain", deadline: "Jan 15, 2026", status: "open", participants: 89, tracks: 3, registered: false, prizePool: "$5,000" },
  { id: 3, name: "AI Agents Hackathon", category: "Artificial Intelligence", deadline: "Feb 28, 2026", status: "upcoming", participants: 0, tracks: 4, registered: false, prizePool: "$8,000" },
  { id: 4, name: "SEAL Spring 2025", category: "Open Innovation", deadline: "Jul 10, 2025", status: "completed", participants: 203, tracks: 6, registered: true, prizePool: "$12,000" },
];

const leaderboard = [
  { rank: 1, team: "AlphaCoders", score: 92.1, change: 0, track: "AI Agents", members: 5 },
  { rank: 2, team: "CodeCraft Pro", score: 89.5, change: 2, track: "AI Agents", members: 4 },
  { rank: 3, team: "ByteBuilders", score: 87.8, change: -1, track: "AI Agents", members: 5 },
  { rank: 4, team: "InnovateFPT", score: 86.3, change: 3, track: "AI Agents", members: 3 },
  { rank: 5, team: "TechStorm", score: 84.9, change: -2, track: "AI Agents", members: 4 },
  { rank: 6, team: "FutureForge", score: 83.7, change: 1, track: "AI Agents", members: 5 },
  { rank: 7, team: "NeuralNinjas", score: 82.9, change: -1, track: "AI Agents", members: 4 },
  { rank: 8, team: "CloudChasers", score: 82.3, change: 4, track: "AI Agents", members: 5 },
  { rank: 9, team: "DataDynamos", score: 81.5, change: -3, track: "AI Agents", members: 4 },
  { rank: 10, team: "PixelPioneers", score: 80.9, change: 0, track: "AI Agents", members: 3 },
  { rank: 11, team: "SynthMinds", score: 80.1, change: 2, track: "AI Agents", members: 5 },
  { rank: 12, team: "DevDynamo", score: 79.3, change: 3, track: "AI Agents", members: 5 },
  { rank: 13, team: "QuantumLeap", score: 78.8, change: -1, track: "AI Agents", members: 4 },
  { rank: 14, team: "StackSurge", score: 77.4, change: -2, track: "AI Agents", members: 3 },
  { rank: 15, team: "OmegaCode", score: 76.9, change: 1, track: "AI Agents", members: 4 },
];

const activityTimeline = [
  { date: "Nov 29, 2025 • 10:23 AM", title: "Score update received", description: "Round 2 evaluation completed — 79.3/100", status: "completed", color: COLORS.success },
  { date: "Nov 27, 2025 • 2:15 PM", title: "Submission uploaded", description: "DevDynamo submitted prototype for Round 2 evaluation", status: "submitted", color: COLORS.primary },
  { date: "Nov 25, 2025 • 9:00 AM", title: "Round 2 opened", description: "AI Agents Track — Finals round is now accepting submissions", status: "active", color: COLORS.secondary },
  { date: "Nov 20, 2025 • 3:30 PM", title: "Team approved", description: "Your team DevDynamo has been approved to compete", status: "approved", color: COLORS.success },
  { date: "Nov 15, 2025 • 11:00 AM", title: "Event registration", description: "Successfully registered for SEAL Fall 2025", status: "completed", color: COLORS.accent },
];

const initialNotifs = [
  { id: 1, title: "Submission deadline in 2 days", body: "Your team DevDynamo must submit by Dec 1. Don't miss it!", type: "warning", time: "2h ago", read: false },
  { id: 2, title: "Your team was approved!", body: "DevDynamo has been approved to compete in the AI Agents track.", type: "success", time: "5h ago", read: false },
  { id: 3, title: "New round opened: Finals", body: "Round 2 (Finals) is now accepting submissions for AI Agents.", type: "info", time: "1d ago", read: false },
  { id: 4, title: "Score update: Round 1 results", body: "Your team scored 76.8/100 in Round 1. Check the leaderboard.", type: "info", time: "3d ago", read: true },
  { id: 5, title: "Mentor session scheduled", body: "Meeting with Dr. Nguyen on Dec 2 at 10:00 AM.", type: "info", time: "4d ago", read: true },
];

const avatarColors = ["#4F46E5", "#06B6D4", "#8B5CF6", "#22C55E", "#F59E0B"];

export function MemberDashboard({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  const { user } = useAuth();

  // ── Events ──────────────────────────────────────────────────────────────────
  const [apiEvents, setApiEvents] = useState(events);
  const [apiLeaderboard, setApiLeaderboard] = useState<any[]>([]);
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
        status: "active", participants: 0, tracks: 0, registered: false, prizePool: "",
      }))))
      .catch(() => {}); // silent fallback to mock
  }, []);

  // ── Notifications ────────────────────────────────────────────────────────────
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
      })
      .catch(() => {});
  }, []);

  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName ?? "Alex Johnson",
    studentId: user?.studentCode ?? "FPT2021001",
    email: user?.email ?? "alex.j@fpt.edu.vn",
    phone: user?.phone ?? "+84 912 345 678",
    github: "github.com/alexj", portfolio: "alexjohnson.dev",
    bio: "Passionate full-stack developer with focus on AI/ML applications.", major: "Software Engineering",
  });
  const [profileSaved, setProfileSaved] = useState(false);

  const unread = notifs.filter((n: any) => !n.read).length;
  const markRead = async (id: any) => {
    setNotifs(prev => prev.map((n: any) => n.id === id ? { ...n, read: true } : n));
    try { await notificationService.markAsRead(String(id)); } catch { /* ignore */ }
  };
  const markAllRead = async () => {
    setNotifs(prev => prev.map((n: any) => ({ ...n, read: true })));
    try { await notificationService.markAllAsRead(); } catch { /* ignore */ }
  };

  const renderDashboard = () => (
    <>
      <SectionHeader
        title="Team Member Dashboard"
        subtitle="Welcome back, Alex! SEAL Fall 2025 deadline is in 2 days."
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Events" value={2} trend={0} icon={<Calendar size={22} />} color={COLORS.primary} />
        <StatCard title="Team Rank" value="#12" trend={3} icon={<Trophy size={22} />} color={COLORS.warning} />
        <StatCard title="Team Score" value="79.3" trend={5} icon={<Star size={22} />} color={COLORS.accent} />
        <StatCard title="Days to Deadline" value={2} icon={<Clock size={22} />} color={COLORS.error} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Status */}
        <Card className="p-5 col-span-1">
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Team Status</span>
            <StatusBadge status="active" />
          </div>
          <div className="mb-3">
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>DevDynamo</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>AI Agents Track • 5 members</div>
          </div>
          <ProgressBar value={79.3} max={100} color={COLORS.accent} label="Overall Score" />
          <div className="mt-4 space-y-2">
            {[
              { label: "Innovation", value: 82 },
              { label: "Technical", value: 78 },
              { label: "Business Impact", value: 75 },
            ].map(c => (
              <ProgressBar key={c.label} value={c.value} max={100} color={COLORS.primary} label={c.label} />
            ))}
          </div>
          <AvatarGroup names={teamMembers.map(m => m.name)} max={5} />
        </Card>

        {/* Upcoming Deadline */}
        <Card className="p-5 col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={18} style={{ color: COLORS.error }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Upcoming Deadline</span>
          </div>
          <div className="rounded-xl p-4 mb-4" style={{ background: `${COLORS.error}10`, border: `1px solid ${COLORS.error}30` }}>
            <div style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>SEAL Fall 2025 — Finals</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: "8px 0" }}>2 Days Left</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Deadline: December 1, 2025 at 11:59 PM</div>
          </div>
          <div className="space-y-2">
            {[
              { label: "GitHub Repo URL", done: true },
              { label: "Demo Video Link", done: true },
              { label: "Project Report PDF", done: false },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <CheckCircle size={15} style={{ color: item.done ? COLORS.success : COLORS.border }} />
                <span style={{ fontSize: 13, color: item.done ? COLORS.textPrimary : COLORS.textSecondary, textDecoration: item.done ? "none" : "none" }}>{item.label}</span>
                {!item.done && <span style={{ fontSize: 11, color: COLORS.error, fontWeight: 600 }}>Required</span>}
              </div>
            ))}
          </div>
          <Button variant="primary" size="sm" className="mt-4 w-full" icon={<ExternalLink size={14} />} onClick={() => onNavigate("submissions")}>
            Complete Submission
          </Button>
        </Card>

        {/* Activity Timeline */}
        <Card className="p-5 col-span-1">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Recent Activity</div>
          <div className="space-y-0">
            {activityTimeline.slice(0, 4).map((item, i) => (
              <TimelineItem key={i} date={item.date} title={item.title} description={item.description} color={item.color} />
            ))}
          </div>
        </Card>
      </div>
    </>
  );

  const renderTeam = () => (
    <>
      <SectionHeader title="My Team — DevDynamo" subtitle="AI Agents Track • SEAL Fall 2025" />
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
              {ev.registered ? (
                <Button variant="outline" size="sm" icon={<CheckCircle size={13} />}>Registered</Button>
              ) : ev.status !== "completed" ? (
                <Button variant="primary" size="sm" icon={<PlusCircle size={13} />}>Register</Button>
              ) : (
                <Button variant="ghost" size="sm">View Results</Button>
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
              {(apiLeaderboard.length > 0 ? apiLeaderboard : leaderboard).map((row: any, i: number) => {
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
        subtitle={`${unread} unread notification${unread !== 1 ? "s" : ""}`}
        action={unread > 0 ? <Button variant="ghost" size="sm" onClick={markAllRead}>Mark all read</Button> : undefined}
      />
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

  const renderProfile = () => (
    <>
      <SectionHeader title="Profile Settings" subtitle="Manage your personal information and preferences" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 flex flex-col items-center text-center col-span-1">
          <div
            className="flex items-center justify-center rounded-full text-white mb-4"
            style={{ width: 80, height: 80, background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`, fontSize: 24, fontWeight: 700 }}
          >
            AJ
          </div>
          <div style={{ fontWeight: 700, fontSize: 18, color: COLORS.textPrimary }}>Alex Johnson</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>Team Member • DevDynamo</div>
          <StatusBadge status="active" />
          <div className="mt-4 w-full space-y-2 text-left">
            {[
              { icon: <Mail size={14} />, label: "alex.j@fpt.edu.vn" },
              { icon: <Github size={14} />, label: "github.com/alexj" },
              { icon: <Globe size={14} />, label: "alexjohnson.dev" },
              { icon: <MapPin size={14} />, label: "FPT University, HCM" },
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
                { label: "Events Joined", value: "2", icon: <Calendar size={18} />, color: COLORS.primary },
                { label: "Best Rank", value: "#8", icon: <Trophy size={18} />, color: COLORS.warning },
                { label: "Total Score", value: "79.3", icon: <Star size={18} />, color: COLORS.accent },
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
      case "notifications": return renderNotifications();
      case "profile": return renderProfile();
      default: return renderDashboard();
    }
  };

  return <div className="p-6 space-y-6">{renderPage()}</div>;
}
