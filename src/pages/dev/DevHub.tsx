import { useState } from "react";
import { motion } from "motion/react";
import {
  LayoutDashboard, Users, Calendar, Trophy, Bell, FileText,
  Star, ClipboardList, BarChart2, Shield, Database, GitBranch,
  Clock, Award, Zap, BookOpen, UserCheck, FolderOpen, Activity,
  Target, TrendingUp, PieChart, MessageSquare, Wrench, LogOut,
  ChevronRight,
} from "lucide-react";

interface Props {
  onNavigate: (role: string, page: string) => void;
  onLogout: () => void;
}

const ALL_ROLES: {
  role: string;
  label: string;
  color: string;
  bg: string;
  emoji: string;
  pages: { key: string; label: string; icon: React.ElementType; desc: string }[];
}[] = [
  {
    role: "member",
    label: "Member",
    color: "#F47920",
    bg: "rgba(244,121,32,0.08)",
    emoji: "👤",
    pages: [
      { key: "dashboard",     label: "Dashboard",     icon: LayoutDashboard, desc: "Team overview, scores, deadline" },
      { key: "team",          label: "My Team",        icon: Users,           desc: "Members, skills, progress" },
      { key: "events",        label: "Events",         icon: Calendar,        desc: "Browse and register for events" },
      { key: "leaderboard",   label: "Leaderboard",    icon: Trophy,          desc: "Real-time leaderboard" },
      { key: "notifications", label: "Notifications",  icon: Bell,            desc: "System notifications" },
      { key: "profile",       label: "Profile",        icon: UserCheck,       desc: "Personal information" },
    ],
  },
  {
    role: "leader",
    label: "Leader",
    color: "#059669",
    bg: "rgba(5,150,105,0.08)",
    emoji: "👑",
    pages: [
      { key: "dashboard",     label: "Dashboard",      icon: LayoutDashboard, desc: "Rank, score, checklist" },
      { key: "team",          label: "Team Management",icon: Users,           desc: "Members, invite" },
      { key: "requests",      label: "Join Requests",  icon: UserCheck,       desc: "Approve/reject join requests" },
      { key: "submissions",   label: "Submission Center", icon: FolderOpen,   desc: "Submit work, view history" },
      { key: "rankings",      label: "Rankings",       icon: Trophy,          desc: "Rankings by round" },
      { key: "notifications", label: "Notifications",  icon: Bell,            desc: "System notifications" },
      { key: "feedback",      label: "Judge Feedback",  icon: MessageSquare,  desc: "Scores & comments from judges" },
      { key: "settings",      label: "Settings",        icon: Wrench,         desc: "Team configuration" },
      { key: "profile",       label: "Profile",         icon: UserCheck,      desc: "Personal information" },
    ],
  },
  {
    role: "judge",
    label: "Judge",
    color: "#D97706",
    bg: "rgba(217,119,6,0.08)",
    emoji: "⚖️",
    pages: [
      { key: "rounds",      label: "Assigned Rounds", icon: ClipboardList, desc: "Assigned rounds" },
      { key: "submissions", label: "Submission Queue", icon: FileText,      desc: "Submission queue for scoring" },
      { key: "scoring",     label: "Scoring",          icon: Star,          desc: "Slider-based scoring interface" },
      { key: "calibration", label: "Calibration",      icon: BarChart2,     desc: "Compare scoring patterns" },
      { key: "history",     label: "Score History",    icon: Clock,         desc: "Previously scored history" },
      { key: "profile",     label: "Profile",          icon: UserCheck,     desc: "Judge information" },
    ],
  },
  {
    role: "mentor",
    label: "Mentor",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.08)",
    emoji: "🎓",
    pages: [
      { key: "tracks",   label: "Assigned Tracks",   icon: Target,      desc: "Assigned tracks" },
      { key: "teams",    label: "Teams",              icon: Users,       desc: "Teams to mentor" },
      { key: "progress", label: "Mentoring Progress", icon: TrendingUp,  desc: "Per-team progress" },
      { key: "schedule", label: "Schedule",           icon: Calendar,    desc: "Meeting and consultation schedule" },
      { key: "profile",  label: "Profile",            icon: UserCheck,   desc: "Mentor information" },
    ],
  },
  {
    role: "admin",
    label: "Admin",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.08)",
    emoji: "🛡️",
    pages: [
      { key: "dashboard",     label: "Dashboard",       icon: LayoutDashboard, desc: "System overview" },
      { key: "events",        label: "Events",           icon: Calendar,        desc: "Create/edit/delete events" },
      { key: "categories",    label: "Categories",       icon: BookOpen,        desc: "Manage categories" },
      { key: "rounds",        label: "Rounds",           icon: GitBranch,       desc: "Configure rounds" },
      { key: "criteria",      label: "Criteria",         icon: Star,            desc: "Scoring criteria" },
      { key: "users",         label: "Users",            icon: Users,           desc: "User management" },
      { key: "assignments",   label: "Assignments",      icon: UserCheck,       desc: "Assign judges/mentors" },
      { key: "rankings",      label: "Rankings",         icon: Trophy,          desc: "Compute and view rankings" },
      { key: "reports",       label: "Reports",          icon: BarChart2,       desc: "Analytics reports" },
      { key: "notifications", label: "Notifications",    icon: Bell,            desc: "Send broadcast notifications" },
      { key: "awards",        label: "Awards",           icon: Award,           desc: "Grant awards, auto-grant" },
      { key: "audit",         label: "Audit Logs",       icon: Shield,          desc: "System audit logs" },
      { key: "settings",      label: "Settings",         icon: Wrench,          desc: "Platform configuration" },
      { key: "profile",       label: "Profile",          icon: UserCheck,       desc: "Admin information" },
    ],
  },
  {
    role: "research",
    label: "Research",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
    emoji: "🔬",
    pages: [
      { key: "variance",     label: "Variance Analytics",     icon: Activity,   desc: "Judge variance analysis" },
      { key: "distribution", label: "Score Distribution",     icon: PieChart,   desc: "Score distribution" },
      { key: "reliability",  label: "Inter-rater Reliability",icon: BarChart2,  desc: "ICC & Krippendorff reliability" },
      { key: "export",       label: "Data Export",            icon: Database,   desc: "Export research CSV" },
      { key: "comparison",   label: "Judge Comparison",       icon: TrendingUp, desc: "Judge comparison by criterion" },
      { key: "stats",        label: "Research Stats",         icon: FileText,   desc: "Aggregated research stats" },
    ],
  },
];

export function DevHub({ onNavigate, onLogout }: Props) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const totalPages = ALL_ROLES.reduce((sum, r) => sum + r.pages.length, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-bg)", backgroundAttachment: "fixed" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #F47920, #FF9040)" }}>
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                SEAL Dev Hub
              </span>
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(244,121,32,0.12)", color: "#F47920" }}>
                {totalPages} pages
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all hover:bg-white/40"
            style={{ color: "var(--text-secondary)" }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      {/* Intro */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-4">
        <div className="glass rounded-2xl px-6 py-4 border border-white/25 flex items-center gap-4">
          <div className="text-2xl">🛠️</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
              Development Mode — All Pages
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>
              Click any page to view it directly. Authorization will be handled later.
            </div>
          </div>
        </div>
      </div>

      {/* Role sections */}
      <div className="max-w-7xl mx-auto px-6 pb-16 space-y-10 pt-6">
        {ALL_ROLES.map(roleGroup => (
          <motion.div
            key={roleGroup.role}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Role header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: roleGroup.bg, border: `1px solid ${roleGroup.color}25` }}>
                {roleGroup.emoji}
              </div>
              <div>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em", margin: 0 }}>
                  {roleGroup.label}
                </h2>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {roleGroup.pages.length} pages
                </div>
              </div>
              <div className="flex-1 h-px ml-2" style={{ background: `${roleGroup.color}20` }} />
            </div>

            {/* Pages grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {roleGroup.pages.map(page => {
                const cardId = `${roleGroup.role}:${page.key}`;
                const Icon = page.icon;
                const isHovered = hoveredCard === cardId;
                return (
                  <motion.button
                    key={page.key}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onHoverStart={() => setHoveredCard(cardId)}
                    onHoverEnd={() => setHoveredCard(null)}
                    onClick={() => onNavigate(roleGroup.role, page.key)}
                    className="glass rounded-2xl p-4 text-left transition-all border"
                    style={{
                      borderColor: isHovered ? `${roleGroup.color}50` : "rgba(255,255,255,0.25)",
                      boxShadow: isHovered
                        ? `0 8px 24px ${roleGroup.color}20, 0 2px 8px rgba(0,0,0,0.06)`
                        : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: isHovered ? roleGroup.color : roleGroup.bg }}>
                        <Icon size={15} style={{ color: isHovered ? "white" : roleGroup.color }} />
                      </div>
                      <ChevronRight size={13} style={{ color: isHovered ? roleGroup.color : "var(--text-muted)", marginTop: 2 }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.3 }}>
                      {page.label}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 3, lineHeight: 1.4 }}>
                      {page.desc}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
