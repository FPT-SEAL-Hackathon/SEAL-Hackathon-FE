import { useState, useEffect } from "react";
import { useLanguage } from "@/app/store/languageStore";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import { roundService, type CriterionTemplateResponse, type RoundResponse } from "@/features/judging/api/roundService";
import { teamService, type TeamEligibilityReviewResponse } from "@/features/teams/api/teamService";
import { rankingService, type EventRankingDTO } from "@/features/rankings/api/rankingService";
import { awardService, type AwardResponse } from "@/features/awards/api/awardService";
import { notificationService } from "@/features/notifications/api/notificationService";
import { EventModal } from "@/features/events/components/EventModal";
import { CategoryModal } from "@/features/categories/components/CategoryModal";
import { RoundModal } from "@/features/judging/components/RoundModal";
import { AssignJudgeModal } from "@/features/judging/components/AssignJudgeModal";
import {
  Users, Upload, Shield, AlertTriangle, Calendar, BookOpen,
  GitBranch, Star, UserCheck, Trophy, BarChart2, Bell,
  Settings, PlusCircle, Edit, Trash2, Save, CheckCircle,
  TrendingUp, Clock, Activity, Download, Send, Search, Filter,
  Eye, ToggleLeft, ToggleRight, ChevronDown, X, Zap, Award, Loader
} from "lucide-react";
import {
  StatCard, Card, SectionHeader, COLORS, StatusBadge,
  ProgressBar, Button, DataTable, TimelineItem
} from "@/components/shared/UIComponents";

// ===== DATA =====

const events = [
  { id: 1, name: "SEAL Fall 2025", category: "AI/ML", status: "active", teams: 127, rounds: 2, deadline: "Dec 1, 2025", prize: "$10,000" },
  { id: 2, name: "FPT Web3 Challenge", category: "Web3", status: "open", teams: 89, rounds: 2, deadline: "Jan 15, 2026", prize: "$5,000" },
  { id: 3, name: "AI Agents Hackathon", category: "AI", status: "upcoming", teams: 0, rounds: 3, deadline: "Feb 28, 2026", prize: "$8,000" },
  { id: 4, name: "SEAL Spring 2025", category: "Open Innovation", status: "completed", teams: 203, rounds: 3, deadline: "Jul 10, 2025", prize: "$12,000" },
];

const categories = [
  { id: 1, name: "Artificial Intelligence / ML", tracks: 3, teams: 54, criteria: 4, color: COLORS.primary },
  { id: 2, name: "Web3 & Blockchain", tracks: 2, teams: 38, criteria: 4, color: COLORS.secondary },
  { id: 3, name: "Cybersecurity", tracks: 1, teams: 12, criteria: 4, color: COLORS.error },
  { id: 4, name: "Healthcare Tech", tracks: 2, teams: 23, criteria: 4, color: COLORS.success },
];

const rounds = [
  { id: 1, event: "SEAL Fall 2025", name: "Round 1 — Qualifying", status: "completed", teams: 127, scored: 127, deadline: "Nov 22, 2025" },
  { id: 2, event: "SEAL Fall 2025", name: "Round 2 — Finals", status: "scoring", teams: 40, scored: 28, deadline: "Dec 3, 2025" },
  { id: 3, event: "FPT Web3 Challenge", name: "Round 1 — Qualifying", status: "open", teams: 89, scored: 0, deadline: "Dec 20, 2025" },
];

const criteria = [
  { id: 1, name: "Standard Hackathon Template", fields: ["Innovation (25)", "Technical (25)", "Impact (25)", "Presentation (25)"], events: 2, status: "active" },
  { id: 2, name: "AI/ML Specialist Template", fields: ["Model Performance (30)", "Data Quality (20)", "Innovation (25)", "Business Case (25)"], events: 1, status: "active" },
  { id: 3, name: "Web3 Template", fields: ["Smart Contract (30)", "UX/Design (20)", "Security (25)", "Scalability (25)"], events: 1, status: "draft" },
];

const users = [
  { id: 1, name: "Alex Johnson", email: "alex.j@fpt.edu.vn", role: "member", status: "active", team: "DevDynamo", joined: "Nov 15, 2025" },
  { id: 2, name: "Dr. Pham Thi Lan", email: "ptlan@fpt.edu.vn", role: "judge", status: "active", team: "—", joined: "Oct 20, 2025" },
  { id: 3, name: "Dr. Nguyen Van Minh", email: "nvminh@fpt.edu.vn", role: "mentor", status: "active", team: "—", joined: "Oct 18, 2025" },
  { id: 4, name: "Maria Chen", email: "maria.c@fpt.edu.vn", role: "member", status: "active", team: "DevDynamo", joined: "Nov 16, 2025" },
  { id: 5, name: "Prof. Le Thi Bich", email: "ltbich@fpt.edu.vn", role: "judge", status: "active", team: "—", joined: "Oct 22, 2025" },
  { id: 6, name: "James Park", email: "james.p@fpt.edu.vn", role: "member", status: "active", team: "DevDynamo", joined: "Nov 16, 2025" },
  { id: 7, name: "Tran Minh Duc", email: "tmduc@fpt.edu.vn", role: "leader", status: "active", team: "AlphaCoders", joined: "Nov 14, 2025" },
  { id: 8, name: "Hoang Thi Thu", email: "htthu@fpt.edu.vn", role: "member", status: "pending", team: "—", joined: "Nov 28, 2025" },
];

const rankings = [
  { rank: 1, team: "AlphaCoders", track: "AI Agents", r1: 88.5, r2: 95.7, total: 92.1, status: "finalist" },
  { rank: 2, team: "CodeCraft Pro", track: "AI Agents", r1: 85.2, r2: 93.8, total: 89.5, status: "finalist" },
  { rank: 3, team: "ByteBuilders", track: "AI Agents", r1: 90.1, r2: 85.5, total: 87.8, status: "finalist" },
  { rank: 4, team: "InnovateFPT", track: "AI Agents", r1: 82.0, r2: 90.6, total: 86.3, status: "finalist" },
  { rank: 5, team: "TechStorm", track: "AI Agents", r1: 84.9, r2: 84.9, total: 84.9, status: "finalist" },
  { rank: 12, team: "DevDynamo", track: "AI Agents", r1: 76.8, r2: 81.8, total: 79.3, status: "active" },
];

const auditLogs = [
  { id: 1, action: "Score submitted", actor: "Dr. Pham Thi Lan", target: "DevDynamo — Round 2", timestamp: "2025-11-28 14:23:11", ip: "192.168.1.42" },
  { id: 2, action: "User role changed", actor: "Admin (System)", target: "Hoang Thi Thu → member", timestamp: "2025-11-28 11:05:33", ip: "10.0.0.5" },
  { id: 3, action: "Event settings updated", actor: "Admin (You)", target: "SEAL Fall 2025 — deadline extended", timestamp: "2025-11-27 16:44:20", ip: "10.0.0.5" },
  { id: 4, action: "New team registered", actor: "System", target: "QuantumLeap — AI Agents", timestamp: "2025-11-27 10:21:08", ip: "—" },
  { id: 5, action: "Round opened", actor: "Admin (You)", target: "SEAL Fall 2025 — Round 2 Finals", timestamp: "2025-11-25 09:00:00", ip: "10.0.0.5" },
  { id: 6, action: "Submission approved", actor: "Admin (You)", target: "AlphaCoders — Round 2 submission", timestamp: "2025-11-24 15:30:22", ip: "10.0.0.5" },
];

const broadcastHistory = [
  { id: 1, title: "Finals round now open!", message: "Round 2 submissions are now accepted. Deadline is Dec 1.", audience: "All Teams", sent: "Nov 25, 2025 at 9:00 AM", status: "sent" },
  { id: 2, title: "Round 1 results published", message: "Scores for Round 1 have been finalized and are now visible.", audience: "All Participants", sent: "Nov 23, 2025 at 3:00 PM", status: "sent" },
];

const roleColors: Record<string, string> = {
  member: COLORS.primary,
  leader: COLORS.secondary,
  judge: COLORS.warning,
  mentor: COLORS.success,
  admin: COLORS.error,
};

const AWARD_TIER_OPTIONS = [
  { label: "First Place", value: "70000000-0000-0000-0000-000000000001" },
  { label: "Second Place", value: "70000000-0000-0000-0000-000000000002" },
  { label: "Third Place", value: "70000000-0000-0000-0000-000000000003" },
  { label: "Honorable Mention", value: "70000000-0000-0000-0000-000000000004" },
  { label: "Best Innovation", value: "70000000-0000-0000-0000-000000000005" },
  { label: "Best Presentation", value: "70000000-0000-0000-0000-000000000006" },
  { label: "Special Award", value: "70000000-0000-0000-0000-000000000007" },
];

const createEmptyAwardPattern = (rankPosition: number) => ({
  rankPosition,
  awardTierId: AWARD_TIER_OPTIONS[Math.min(rankPosition - 1, AWARD_TIER_OPTIONS.length - 1)].value,
  awardTitle: `${rankPosition}${rankPosition === 1 ? "st" : rankPosition === 2 ? "nd" : rankPosition === 3 ? "rd" : "th"} Place`,
  description: "",
  prizeValue: "",
  prizeCurrency: "VND",
});

export function AdminDashboard({ currentPage, onNavigate }: { currentPage: string; onNavigate: (p: string) => void }) {
  const { t } = useLanguage();

  // ── API state ────────────────────────────────────────────────────────────
  const [apiEvents, setApiEvents] = useState(events);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [apiCategories, setApiCategories] = useState<CategoryResponse[]>([]);
  const [apiRounds, setApiRounds] = useState<RoundResponse[]>([]);
  const [apiTeamEligibility, setApiTeamEligibility] = useState<TeamEligibilityReviewResponse[]>([]);
  const [apiRankings, setApiRankings] = useState<EventRankingDTO[]>([]);
  const [apiAwards, setApiAwards] = useState<AwardResponse[]>([]);
  const [apiCriteriaTemplates, setApiCriteriaTemplates] = useState<CriterionTemplateResponse[]>([]);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [eventModal, setEventModal] = useState<{ open: boolean; edit?: EventResponse }>({ open: false });
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; edit?: CategoryResponse }>({ open: false });
  const [roundModal, setRoundModal] = useState<{ open: boolean; edit?: RoundResponse; categoryId?: string }>({ open: false });
  const [assignJudgeModal, setAssignJudgeModal] = useState<{ open: boolean; roundId?: string; roundName?: string }>({ open: false });

  const [userSearch, setUserSearch] = useState("");
  const [approvedUsers, setApprovedUsers] = useState<number[]>([]);
  const [showGuestJudgeForm, setShowGuestJudgeForm] = useState(false);
  const [guestJudgeForm, setGuestJudgeForm] = useState({ email: "", fullName: "", company: "" });
  const [guestJudgeSuccess, setGuestJudgeSuccess] = useState(false);
  const [rankingsComputed, setRankingsComputed] = useState(false);
  const [disqualifiedTeams, setDisqualifiedTeams] = useState<number[]>([]);
  const [disqualifyTarget, setDisqualifyTarget] = useState<{ id: number; name: string } | null>(null);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [awardPatternCategoryId, setAwardPatternCategoryId] = useState("");
  const [awardPatterns, setAwardPatterns] = useState([
    createEmptyAwardPattern(1),
    createEmptyAwardPattern(2),
    createEmptyAwardPattern(3),
  ]);
  const [awardPatternLoading, setAwardPatternLoading] = useState(false);
  const [awardPatternMessage, setAwardPatternMessage] = useState("");
  const [awardPatternError, setAwardPatternError] = useState("");
  const [autoGrantLimit, setAutoGrantLimit] = useState("3");
  const [autoGrantLoading, setAutoGrantLoading] = useState(false);
  const [autoGrantMessage, setAutoGrantMessage] = useState("");
  const [autoGrantError, setAutoGrantError] = useState("");
  const [autoGrantPreview, setAutoGrantPreview] = useState<Array<{ teamId: string; teamName: string; rankPosition: number; totalScore: number }>>([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastAudience, setBroadcastAudience] = useState("All Teams");
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [notificationTargetMode, setNotificationTargetMode] = useState<"team" | "user">("team");
  const [notificationTeamId, setNotificationTeamId] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationSending, setNotificationSending] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [systemSettings, setSystemSettings] = useState({
    platformName: "SEAL FPT Hackathon Platform",
    maxTeamSize: "5",
    minTeamSize: "2",
    submissionGracePeriod: "30",
    allowLateSubmissions: true,
    enablePublicLeaderboard: true,
    requireEmailVerification: true,
    contactEmail: "seal@fpt.edu.vn",
  });

  useEffect(() => {
    eventService.getAll()
      .then(data => {
        const mapped = data.map(e => ({
          id: e.eventId, name: e.eventName,
          category: e.description ?? "—", status: "active",
          teams: 0, rounds: 0, deadline: e.eventEndDate ?? "—", prize: "—",
        }));
        setApiEvents(mapped as any);
        if (data[0]) setSelectedEventId(data[0].eventId);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    categoryService.getByEvent(selectedEventId).then(data => {
      setApiCategories(data);
      // Load rounds for first category
      if (data[0]) {
        roundService.getByCategory(data[0].categoryId).then(setApiRounds).catch(() => {});
        setAwardPatternCategoryId(data[0].categoryId);
      }
    }).catch(() => {});
    teamService.reviewEligibility(selectedEventId).then(setApiTeamEligibility).catch(() => {});
    awardService.getByEvent(selectedEventId).then(setApiAwards).catch(() => {});
  }, [selectedEventId]);

  useEffect(() => {
    if (!awardPatternCategoryId) return;
    awardService.getPatterns(awardPatternCategoryId)
      .then(patterns => {
        if (patterns.length === 0) return;
        setAwardPatterns(patterns.map(pattern => ({
          rankPosition: pattern.rankPosition,
          awardTierId: pattern.awardTierId,
          awardTitle: pattern.awardTitle,
          description: pattern.description ?? "",
          prizeValue: pattern.prizeValue !== undefined && pattern.prizeValue !== null ? String(pattern.prizeValue) : "",
          prizeCurrency: pattern.prizeCurrency || "VND",
        })));
      })
      .catch(() => {});
  }, [awardPatternCategoryId]);

  useEffect(() => {
    if (currentPage !== "criteria") return;
    roundService.getTemplates().then(setApiCriteriaTemplates).catch(() => {});
  }, [currentPage]);

  // Disqualify with real API
  const handleDisqualifyConfirm = async () => {
    if (!disqualifyTarget || !disqualifyReason) return;
    try {
      await teamService.disqualify(String(disqualifyTarget.id), disqualifyReason);
      setDisqualifiedTeams(prev => [...prev, disqualifyTarget.id]);
    } catch { /* show UI error gracefully */ }
    setDisqualifyTarget(null);
    setDisqualifyReason("");
  };

  // Broadcast notification with real API
  const handleBroadcast = async () => {
    if (!broadcastTitle || !broadcastMessage) return;
    try {
      const recipientIds = apiTeamEligibility.map(t => t.leaderUserId).filter(Boolean);
      if (recipientIds.length > 0) {
        await notificationService.broadcast({
          recipientUserIds: recipientIds,
          title: broadcastTitle,
          body: broadcastMessage,
          eventId: selectedEventId ?? undefined,
        });
      }
      setBroadcastSent(true);
      setBroadcastTitle("");
      setBroadcastMessage("");
      setTimeout(() => setBroadcastSent(false), 3000);
    } catch { setBroadcastSent(true); setTimeout(() => setBroadcastSent(false), 3000); }
  };

  const handleSendTargetedNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      setNotificationError("Title and message are required.");
      return;
    }

    setNotificationSending(true);
    setNotificationStatus("");
    setNotificationError("");

    try {
      if (notificationTargetMode === "team") {
        const team = apiTeamEligibility.find(item => item.teamId === notificationTeamId);
        if (!team) {
          setNotificationError("Select a team before sending.");
          return;
        }

        const recipientIds = Array.from(new Set([
          team.leaderUserId,
          ...team.members.map(member => member.userId),
        ].filter(Boolean)));

        if (recipientIds.length === 0) {
          setNotificationError("This team has no recipient user IDs.");
          return;
        }

        const sent = await notificationService.broadcast({
          recipientUserIds: recipientIds,
          eventId: selectedEventId ?? undefined,
          title: notificationTitle.trim(),
          body: notificationMessage.trim(),
        });
        setNotificationStatus(`Sent to ${sent.length} team member(s).`);
      } else {
        const email = notificationEmail.trim().toLowerCase();
        if (!email) {
          setNotificationError("Recipient email is required.");
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setNotificationError("Enter a valid recipient email.");
          return;
        }

        await notificationService.sendToEmail({
          recipientEmail: email,
          eventId: selectedEventId ?? undefined,
          title: notificationTitle.trim(),
          body: notificationMessage.trim(),
        });
        setNotificationStatus(`Notification sent to ${email}.`);
      }

      setNotificationTitle("");
      setNotificationMessage("");
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Failed to send notification.");
    } finally {
      setNotificationSending(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const updateAwardPattern = (index: number, key: keyof typeof awardPatterns[number], value: string | number) => {
    setAwardPatterns(prev => prev.map((pattern, i) => (
      i === index ? { ...pattern, [key]: value } : pattern
    )));
  };

  const addAwardPattern = () => {
    setAwardPatterns(prev => [...prev, createEmptyAwardPattern(prev.length + 1)]);
  };

  const removeAwardPattern = (index: number) => {
    setAwardPatterns(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAwardPatterns = async () => {
    if (!awardPatternCategoryId) {
      setAwardPatternError("Select a category before saving award patterns.");
      return;
    }
    const validPatterns = awardPatterns
      .map(pattern => ({
        rankPosition: Number(pattern.rankPosition),
        awardTierId: pattern.awardTierId,
        awardTitle: pattern.awardTitle.trim(),
        description: pattern.description.trim() || undefined,
        prizeValue: pattern.prizeValue ? Number(pattern.prizeValue) : undefined,
        prizeCurrency: pattern.prizeCurrency || undefined,
      }))
      .filter(pattern => pattern.rankPosition && pattern.awardTierId && pattern.awardTitle);

    if (validPatterns.length === 0) {
      setAwardPatternError("Add at least one rank with title and award tier.");
      return;
    }

    setAwardPatternLoading(true);
    setAwardPatternError("");
    setAwardPatternMessage("");
    try {
      const saved = await awardService.savePatterns(awardPatternCategoryId, validPatterns);
      setAwardPatternMessage(`Saved ${saved.length} award pattern(s).`);
    } catch (error) {
      setAwardPatternError(error instanceof Error ? error.message : "Failed to save award patterns.");
    } finally {
      setAwardPatternLoading(false);
    }
  };

  const renderDashboard = () => (
    <>
      <SectionHeader title="Admin Dashboard" subtitle="SEAL Hackathon Platform — System Overview" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Teams" value={127} trend={12} icon={<Users size={20} />} color={COLORS.primary} />
        <StatCard title="Submissions" value={89} trend={8} icon={<Upload size={20} />} color={COLORS.success} />
        <StatCard title="Active Judges" value={24} icon={<Shield size={20} />} color={COLORS.warning} />
        <StatCard title="Pending Approvals" value={8} icon={<AlertTriangle size={20} />} color={COLORS.error} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Active Events Overview</div>
            {apiEvents.filter((e: any) => e.status === "active" || e.status === "scoring" || e.status !== "completed").map((ev: any) => (
              <div key={ev.id} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{ev.name}</span>
                  <StatusBadge status={ev.status} />
                </div>
                <ProgressBar value={ev.teams} max={150} color={COLORS.primary} label={`${ev.teams} teams registered`} />
              </div>
            ))}
          </Card>

          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Scoring Progress — SEAL Fall 2025</div>
            {rounds.filter(r => r.event === "SEAL Fall 2025").map(r => (
              <div key={r.id} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{r.name}</span>
                  <StatusBadge status={r.status} />
                </div>
                <ProgressBar value={r.scored} max={r.teams} color={r.status === "completed" ? COLORS.success : COLORS.warning} label={`Scored: ${r.scored}/${r.teams}`} />
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Quick Actions</div>
            <div className="space-y-2">
              {[
                { label: "Create New Event", icon: <PlusCircle size={14} />, page: "events" },
                { label: "Manage Users", icon: <Users size={14} />, page: "users" },
                { label: "View Rankings", icon: <Trophy size={14} />, page: "rankings" },
                { label: "Send Broadcast", icon: <Bell size={14} />, page: "notifications" },
                { label: "View Audit Logs", icon: <Shield size={14} />, page: "audit" },
                { label: "System Settings", icon: <Settings size={14} />, page: "settings" },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.page)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                  style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}
                >
                  <span style={{ color: COLORS.primary }}>{action.icon}</span>
                  <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{action.label}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Recent Activity</div>
            {auditLogs.slice(0, 4).map((log, i) => (
              <div key={log.id} className="mb-3 last:mb-0">
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{log.action}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{log.actor} • {log.timestamp.split(" ")[0]}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );

  const renderEvents = () => (
    <>
      <SectionHeader
        title="Event Management"
        subtitle="Create and manage hackathon events"
        action={<Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => setEventModal({ open: true })}>New Event</Button>}
      />
      <div className="space-y-3">
        {apiEvents.map((ev: any) => (
          <Card key={ev.id} className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{ev.name}</span>
                  <StatusBadge status={ev.status} />
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{ev.category} • {ev.teams ?? 0} teams • {ev.rounds ?? 0} rounds • Deadline: {ev.deadline}</div>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.success }}>{ev.prize}</span>
                <Button variant="ghost" size="sm" icon={<Eye size={13} />}>View</Button>
                <Button variant="ghost" size="sm" icon={<Edit size={13} />}>Edit</Button>
                {ev.status === "upcoming" && <Button variant="danger" size="sm" icon={<Trash2 size={13} />}>Delete</Button>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const renderCategories = () => (
    <>
      <SectionHeader
        title="Category Management"
        subtitle="Manage competition categories and tracks"
        action={<Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => setCategoryModal({ open: true })}>New Category</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => (
          <Card key={cat.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{cat.name}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={<Edit size={13} />}>Edit</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="text-center p-2 rounded-xl" style={{ background: `${cat.color}10` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: cat.color }}>{cat.tracks}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{t("event.tracks")}</div>
              </div>
              <div className="text-center p-2 rounded-xl" style={{ background: `${cat.color}10` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: cat.color }}>{cat.teams}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{t("event.teams")}</div>
              </div>
              <div className="text-center p-2 rounded-xl" style={{ background: `${cat.color}10` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: cat.color }}>{cat.criteria}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{t("nav.criteria")}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const renderRounds = () => (
    <>
      <SectionHeader
        title="Round Management"
        subtitle="Configure and monitor competition rounds"
        action={<Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => setRoundModal({ open: true, categoryId: apiCategories[0]?.categoryId })}>New Round</Button>}
      />
      <div className="space-y-3">
        {rounds.map(r => (
          <Card key={r.id} className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{r.name}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{r.event} • Deadline: {r.deadline}</div>
                <div className="mt-2">
                  <ProgressBar value={r.scored} max={r.teams} color={r.status === "completed" ? COLORS.success : COLORS.primary} label={`Scored: ${r.scored}/${r.teams}`} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" icon={<Edit size={13} />}>{t("common.edit")}</Button>
                {r.status === "open" && <Button variant="secondary" size="sm">{t("common.closeRound")}</Button>}
                {r.status === "upcoming" && <Button variant="primary" size="sm">{t("common.openRound")}</Button>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const renderCriteria = () => (
    <>
      <SectionHeader
        title={t("admin.criteriaTemplates")}
        subtitle={t("admin.criteriaTemplatesSubtitle")}
        action={<Button variant="primary" size="sm" icon={<PlusCircle size={14} />}>{t("common.newTemplate")}</Button>}
      />
      <div className="space-y-4">
        {(apiCriteriaTemplates.length > 0
          ? apiCriteriaTemplates.map(template => ({
            id: template.templateId,
            name: template.criterionName,
            fields: [
              `Weight (${template.defaultWeight})`,
              `Max Score (${template.maxScore})`,
              template.description || "No description",
            ],
            events: 0,
            status: template.isActive ? "active" : "draft",
          }))
          : criteria
        ).map(c => (
          <Card key={c.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{c.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Used in {c.events} event{c.events !== 1 ? "s" : ""}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={c.status} />
                <Button variant="ghost" size="sm" icon={<Edit size={13} />}>{t("common.edit")}</Button>
                <Button variant="ghost" size="sm" icon={<Trash2 size={13} />}>{t("common.delete")}</Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.fields.map(f => (
                <span key={f} className="px-2 py-1 rounded-xl text-xs font-medium" style={{ background: `${COLORS.primary}10`, color: COLORS.primary }}>
                  {f}
                </span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );

  const handleApproveUser = (id: number) => {
    setApprovedUsers(prev => [...prev, id]);
  };

  const handleGuestJudgeSubmit = () => {
    setGuestJudgeSuccess(true);
    setGuestJudgeForm({ email: "", fullName: "", company: "" });
    setTimeout(() => { setGuestJudgeSuccess(false); setShowGuestJudgeForm(false); }, 2500);
  };

  const handleDisqualify = handleDisqualifyConfirm;

  const handleComputeRankings = async () => {
    if (selectedEventId) {
      try {
        const data = await rankingService.computeEvent(selectedEventId);
        setApiRankings(data);
      } catch { /* ignore */ }
    }
    setRankingsComputed(true);
    setTimeout(() => setRankingsComputed(false), 3000);
  };

  const handleAutoGrantAwards = async () => {
    const limit = Number(autoGrantLimit);
    if (!awardPatternCategoryId) {
      setAutoGrantError("Select a category before granting awards.");
      return;
    }
    if (!Number.isInteger(limit) || limit < 1) {
      setAutoGrantError("Top N must be a positive whole number.");
      return;
    }

    setAutoGrantLoading(true);
    setAutoGrantError("");
    setAutoGrantMessage("");
    setAutoGrantPreview([]);

    try {
      const topCandidates = await awardService.getTopCandidates(awardPatternCategoryId, undefined, limit);
      setAutoGrantPreview(topCandidates.map(candidate => ({
        teamId: candidate.teamId,
        teamName: candidate.teamName,
        rankPosition: candidate.rankPosition,
        totalScore: candidate.totalScore,
      })));

      const granted = await awardService.autoGrant(awardPatternCategoryId, undefined, limit);
      setApiAwards(prev => {
        const existingIds = new Set(prev.map(award => award.id));
        return [...granted.filter(award => !existingIds.has(award.id)), ...prev];
      });
      setAutoGrantMessage(`Granted ${granted.length} award(s) for top ${limit} ranking team(s).`);
      if (selectedEventId) awardService.getByEvent(selectedEventId).then(setApiAwards).catch(() => {});
    } catch (error) {
      setAutoGrantError(error instanceof Error ? error.message : "Failed to grant awards for top ranking teams.");
    } finally {
      setAutoGrantLoading(false);
    }
  };

  const renderUsers = () => (
    <>
      <SectionHeader
        title={t("admin.userManagement")}
        subtitle={`${users.length} users registered`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<UserCheck size={14} />} onClick={() => setShowGuestJudgeForm(v => !v)}>
              Guest Judge
            </Button>
            <Button variant="primary" size="sm" icon={<PlusCircle size={14} />}>{t("common.addUser")}</Button>
          </div>
        }
      />
      {showGuestJudgeForm && (
        <Card className="p-5 mb-4">
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, marginBottom: 12 }}>
            Create Guest Judge Account <span style={{ fontSize: 12, color: COLORS.textSecondary }}>— POST /admin/users/guest-judge</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {[
              { label: "Full Name", key: "fullName", placeholder: "Dr. Nguyen Van A" },
              { label: "Email", key: "email", placeholder: "judge@company.com" },
              { label: "Company / Institution", key: "company", placeholder: "Google, FPT Corp, ..." },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{field.label.toUpperCase()}</label>
                <input
                  value={guestJudgeForm[field.key as keyof typeof guestJudgeForm]}
                  onChange={e => setGuestJudgeForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" icon={<CheckCircle size={13} />} onClick={handleGuestJudgeSubmit}
              disabled={!guestJudgeForm.fullName || !guestJudgeForm.email || !guestJudgeForm.company}>
              Create Guest Judge
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowGuestJudgeForm(false)}>Cancel</Button>
            {guestJudgeSuccess && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>Guest judge created!</span>}
          </div>
        </Card>
      )}
      {disqualifyTarget && (
        <Card className="p-5 mb-4" style={{ border: `1.5px solid ${COLORS.error}30` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.error, marginBottom: 12 }}>
            Disqualify Team: {disqualifyTarget.name} <span style={{ fontSize: 12, color: COLORS.textSecondary }}>— POST /admin/teams/{"{id}"}/disqualify</span>
          </div>
          <textarea
            value={disqualifyReason}
            onChange={e => setDisqualifyReason(e.target.value)}
            placeholder="State reason for disqualification (e.g. Violation of code plagiarism rules.)"
            rows={3}
            className="w-full px-3 py-2 rounded-xl outline-none resize-none mb-3"
            style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
          />
          <div className="flex gap-2">
            <Button variant="danger" size="sm" icon={<AlertTriangle size={13} />} onClick={handleDisqualify} disabled={!disqualifyReason}>
              Confirm Disqualify
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDisqualifyTarget(null)}>Cancel</Button>
          </div>
        </Card>
      )}
      <Card className="p-4 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
          <input
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            placeholder={t("users.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 rounded-xl outline-none"
            style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
          />
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {[t("users.user"), t("users.role"), t("users.team"), t("users.status"), t("users.joined"), t("users.actions")].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: i < filteredUsers.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <td className="px-4 py-3">
                    <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: `${roleColors[user.role] || COLORS.primary}15`, color: roleColors[user.role] || COLORS.primary }}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{user.team}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 12, color: COLORS.textSecondary }}>{user.joined}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <Button variant="ghost" size="sm" icon={<Edit size={12} />}>{t("common.edit")}</Button>
                      {user.status === "pending" && !approvedUsers.includes(user.id) && (
                        <Button variant="primary" size="sm" icon={<CheckCircle size={12} />} onClick={() => handleApproveUser(user.id)}>
                          {t("common.approve")}
                        </Button>
                      )}
                      {approvedUsers.includes(user.id) && (
                        <span style={{ fontSize: 12, color: COLORS.success, fontWeight: 600 }}>Approved</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );

  const renderAssignments = () => (
    <>
      <SectionHeader title={t("admin.judgeAssignments")} subtitle={t("admin.judgeAssignmentsSubtitle")} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>{t("admin.judgeAssignmentsLabel")}</div>
          {[
            { judge: "Dr. Pham Thi Lan", track: "AI Agents", teams: 10, completed: 7 },
            { judge: "Prof. Le Thi Bich", track: "AI Agents", teams: 10, completed: 8 },
            { judge: "Dr. Nguyen Huu Phuoc", track: "Web3", teams: 8, completed: 8 },
            { judge: "Assoc. Prof. Tran Van C", track: "AI Agents", teams: 10, completed: 5 },
          ].map(j => (
            <div key={j.judge} className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{j.judge}</span>
                <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{j.track}</span>
              </div>
              <ProgressBar value={j.completed} max={j.teams} color={COLORS.warning} label={`${j.completed}/${j.teams} scored`} />
            </div>
          ))}
          <Button variant="outline" size="sm" icon={<PlusCircle size={13} />} className="mt-2">{t("common.assignJudge")}</Button>
        </Card>
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>{t("admin.mentorAssignments")}</div>
          {[
            { mentor: "Dr. Nguyen Van Minh", track: "AI Agents", teams: 3 },
            { mentor: "Dr. Hoang Thi Huong", track: "AI Agents", teams: 2 },
            { mentor: "Prof. Bui Van Nam", track: "Web3", teams: 3 },
          ].map(m => (
            <div key={m.mentor} className="mb-3 flex items-center justify-between p-3 rounded-xl" style={{ background: COLORS.bg }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{m.mentor}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{m.track} • {m.teams} teams</div>
              </div>
              <Button variant="ghost" size="sm" icon={<Edit size={13} />}>{t("common.edit")}</Button>
            </div>
          ))}
          <Button variant="outline" size="sm" icon={<PlusCircle size={13} />} className="mt-2">{t("common.assignMentor")}</Button>
        </Card>
      </div>
    </>
  );

  const renderRankings = () => (
    <>
      <SectionHeader
        title={t("admin.rankingsManagement")}
        subtitle={t("admin.rankingsManagementSubtitle")}
        action={
          <div className="flex items-center gap-2">
            {rankingsComputed && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>Rankings computed!</span>}
            <Button variant="primary" size="sm" icon={<Zap size={14} />} onClick={handleComputeRankings}>
              Compute Rankings
            </Button>
          </div>
        }
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {[t("adminRankings.rank"), t("adminRankings.team"), t("adminRankings.track"), t("adminRankings.round1"), t("adminRankings.round2"), t("adminRankings.total"), t("adminRankings.status"), t("adminRankings.actions")].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankings.map((row, i) => (
                <tr key={row.rank} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-4 py-3">
                    <span style={{ fontSize: row.rank <= 3 ? 18 : 14, fontWeight: 700 }}>
                      {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : `#${row.rank}`}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{row.team}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.track}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.r1}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.r2 ?? "—"}</span></td>
                  <td className="px-4 py-3"><span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{row.total}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" icon={<Eye size={13} />}>{t("common.view")}</Button>
                      {!disqualifiedTeams.includes(row.rank) ? (
                        <Button variant="danger" size="sm" icon={<AlertTriangle size={12} />}
                          onClick={() => setDisqualifyTarget({ id: row.rank, name: row.team })}>
                          DQ
                        </Button>
                      ) : (
                        <span style={{ fontSize: 11, color: COLORS.error, fontWeight: 600 }}>DQ'd</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );

  const renderReports = () => (
    <>
      <SectionHeader
        title={t("admin.reportsAnalytics")}
        subtitle={t("admin.reportsSubtitle")}
        action={<Button variant="outline" size="sm" icon={<Download size={14} />}>{t("common.exportAll")}</Button>}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("reports.totalParticipants")} value={486} trend={15} icon={<Users size={20} />} color={COLORS.primary} />
        <StatCard title={t("reports.totalSubmissions")} value={203} trend={8} icon={<Upload size={20} />} color={COLORS.success} />
        <StatCard title={t("reports.avgScore")} value="81.2" trend={2} icon={<Star size={20} />} color={COLORS.warning} />
        <StatCard title={t("reports.completionRate")} value="94%" trend={3} icon={<CheckCircle size={20} />} color={COLORS.accent} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>{t("admin.trackDistribution")}</div>
          {[
            { track: "AI Agents", teams: 54, color: COLORS.primary },
            { track: "Web3 & Blockchain", teams: 38, color: COLORS.secondary },
            { track: "Healthcare Tech", teams: 23, color: COLORS.success },
            { track: "Open Innovation", teams: 12, color: COLORS.accent },
          ].map(tr => (
            <div key={tr.track} className="mb-3">
              <ProgressBar value={tr.teams} max={60} color={tr.color} label={`${tr.track} — ${tr.teams} teams`} />
            </div>
          ))}
        </Card>
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>{t("admin.availableReports")}</div>
          {[
            { title: "Participant Summary", desc: "All registered users and teams" },
            { title: "Score Analytics", desc: "Detailed scoring breakdown by round" },
            { title: "Judge Performance", desc: "Calibration and consistency metrics" },
            { title: "Event Timeline", desc: "Complete event activity log" },
          ].map(r => (
            <div key={r.title} className="flex items-center justify-between mb-3 p-3 rounded-xl" style={{ background: COLORS.bg }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{r.title}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{r.desc}</div>
              </div>
              <Button variant="ghost" size="sm" icon={<Download size={13} />}>{t("common.export")}</Button>
            </div>
          ))}
        </Card>
      </div>
    </>
  );

  const renderNotifications = () => (
    <>
      <SectionHeader
        title={t("admin.notificationCenter")}
        subtitle={t("admin.notificationSubtitle")}
        action={
          <Button variant="outline" size="sm" icon={<Send size={14} />} onClick={() => onNavigate("direct-notification")}>
            Direct Notification
          </Button>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("admin.broadcastSend")}</div>
          <div className="space-y-4">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{t("broadcast.audience")}</label>
              <select
                value={broadcastAudience}
                onChange={e => setBroadcastAudience(e.target.value)}
                className="w-full px-3 py-2 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              >
                <option>All Teams</option>
                <option>All Judges</option>
                <option>All Mentors</option>
                <option>All Participants</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{t("broadcast.titleLabel")}</label>
              <input
                value={broadcastTitle}
                onChange={e => setBroadcastTitle(e.target.value)}
                placeholder={t("broadcast.titlePlaceholder")}
                className="w-full px-3 py-2 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{t("broadcast.message")}</label>
              <textarea
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                rows={5}
                placeholder={t("broadcast.messagePlaceholder")}
                className="w-full px-3 py-2 rounded-xl outline-none resize-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                icon={<Send size={14} />}
                onClick={handleBroadcast}
                disabled={!broadcastTitle || !broadcastMessage}
              >
                {t("common.sendBroadcast")}
              </Button>
              {broadcastSent && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>{t("common.broadcastSent")}</span>}
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>{t("admin.broadcastHistory")}</div>
          {broadcastHistory.map(b => (
            <div key={b.id} className="mb-4 p-3 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>{b.title}</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{b.message}</div>
              <div className="flex items-center justify-between mt-2">
                <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{b.audience} - {b.sent}</span>
                <StatusBadge status={b.status} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );

  const renderDirectNotification = () => (
    <>
      <SectionHeader
        title="Direct Notification"
        subtitle="Send a targeted notification to one team or one user"
        action={
          <Button variant="outline" size="sm" icon={<Bell size={14} />} onClick={() => onNavigate("notifications")}>
            Back to Broadcast
          </Button>
        }
      />
      <div className="max-w-3xl">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>Send Direct Notification</div>
          <div className="space-y-4">
            {notificationError && (
              <div className="px-4 py-3 rounded-xl" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 13 }}>
                {notificationError}
              </div>
            )}
            {notificationStatus && (
              <div className="px-4 py-3 rounded-xl" style={{ background: `${COLORS.success}10`, color: COLORS.success, fontSize: 13 }}>
                {notificationStatus}
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>TARGET TYPE</label>
              <select
                value={notificationTargetMode}
                onChange={e => setNotificationTargetMode(e.target.value as "team" | "user")}
                className="w-full px-3 py-2 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              >
                <option value="team">Team</option>
                <option value="user">Individual User</option>
              </select>
            </div>

            {notificationTargetMode === "team" ? (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>TEAM</label>
                <select
                  value={notificationTeamId}
                  onChange={e => setNotificationTeamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                >
                  <option value="">Select team</option>
                  {apiTeamEligibility.map(team => (
                    <option key={team.teamId} value={team.teamId}>{team.teamName} ({team.activeMemberCount} members)</option>
                  ))}
                </select>
                {apiTeamEligibility.length === 0 && (
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>
                    No teams loaded for the selected event.
                  </div>
                )}
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>RECIPIENT EMAIL</label>
                <input
                  type="email"
                  value={notificationEmail}
                  onChange={e => setNotificationEmail(e.target.value)}
                  placeholder="student@fpt.edu.vn"
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
            )}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>TITLE</label>
              <input
                value={notificationTitle}
                onChange={e => setNotificationTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full px-3 py-2 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>MESSAGE</label>
              <textarea
                value={notificationMessage}
                onChange={e => setNotificationMessage(e.target.value)}
                rows={5}
                placeholder="Write a message for this recipient"
                className="w-full px-3 py-2 rounded-xl outline-none resize-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <Button
              variant="primary"
              size="md"
              icon={<Send size={14} />}
              onClick={handleSendTargetedNotification}
              disabled={notificationSending || !notificationTitle || !notificationMessage || (notificationTargetMode === "team" ? !notificationTeamId : !notificationEmail)}
            >
              {notificationSending ? "Sending..." : "Send Notification"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
  const renderAudit = () => (
    <>
      <SectionHeader title={t("admin.auditLogs")} subtitle={t("admin.auditSubtitle")} action={<Button variant="outline" size="sm" icon={<Download size={14} />}>{t("common.exportLogs")}</Button>} />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {[t("audit.action"), t("audit.actor"), t("audit.target"), t("audit.timestamp"), t("audit.ipAddress")].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log, i) => (
                <tr key={log.id} style={{ borderBottom: i < auditLogs.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <td className="px-4 py-3"><span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{log.action}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{log.actor}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{log.target}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 12, color: COLORS.textSecondary }}>{log.timestamp}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 12, color: COLORS.textSecondary, fontFamily: "monospace" }}>{log.ip}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );

  const renderProfile = () => (
    <>
      <SectionHeader title={t("admin.myProfile")} subtitle={t("admin.myProfileSubtitle")} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-center text-center gap-4">
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #F47920, #009444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 700, color: "#fff",
            boxShadow: "0 4px 16px rgba(244,121,32,0.35)"
          }}>AD</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: COLORS.textPrimary }}>Admin User</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>Platform Administrator</div>
            <StatusBadge status="active" />
          </div>
          <div className="w-full space-y-2 text-left mt-2">
            {[
              { label: "admin@fpt.edu.vn" },
              { label: "FPT University, HCM" },
              { label: "SEAL Platform — Full Access" },
            ].map((item, i) => (
              <div key={i} style={{ fontSize: 13, color: COLORS.textSecondary }}>
                {item.label}
              </div>
            ))}
          </div>
        </Card>
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("admin.personalInfo")}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: t("common.fullName"), value: "Admin User" },
                { label: t("adminForm.staffId"), value: "FPT-ADMIN-001" },
                { label: t("common.email"), value: "admin@fpt.edu.vn" },
                { label: t("common.phone"), value: "+84 900 000 001" },
                { label: t("adminForm.department"), value: "IT & Innovation" },
                { label: t("common.institution"), value: "FPT University" },
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
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{t("common.bio")}</label>
                <textarea
                  rows={3}
                  defaultValue="Platform administrator responsible for managing SEAL hackathon events and participants at FPT University."
                  className="w-full px-3 py-2 rounded-xl outline-none resize-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button variant="primary" size="md" icon={<Save size={14} />}>{t("common.saveChanges")}</Button>
            </div>
          </Card>
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>{t("admin.adminPermissions")}</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                t("admin.perm.eventManagement"),
                t("admin.perm.userManagement"),
                t("admin.perm.scoreOverride"),
                t("admin.perm.systemSettings"),
                t("admin.perm.auditLogAccess"),
                t("admin.perm.broadcastMessages"),
              ].map(perm => (
                <div key={perm} className="flex items-center gap-2 p-3 rounded-xl" style={{ background: COLORS.bg }}>
                  <CheckCircle size={14} style={{ color: COLORS.success, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{perm}</span>
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
      <SectionHeader title={t("admin.systemSettings")} subtitle={t("admin.systemSettingsSubtitle")} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("admin.generalSettings")}</div>
          <div className="space-y-4">
            {[
              { label: t("adminForm.platformName"), key: "platformName" },
              { label: t("adminForm.maxTeamSize"), key: "maxTeamSize" },
              { label: t("adminForm.minTeamSize"), key: "minTeamSize" },
              { label: t("adminForm.submissionGracePeriod"), key: "submissionGracePeriod" },
              { label: t("adminForm.contactEmail"), key: "contactEmail" },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{field.label}</label>
                <input
                  value={systemSettings[field.key as keyof typeof systemSettings] as string}
                  onChange={e => setSystemSettings(p => ({ ...p, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("admin.featureToggles")}</div>
          <div className="space-y-3">
            {[
              { labelKey: "admin.allowLateSubmissions", key: "allowLateSubmissions" },
              { labelKey: "admin.enablePublicLeaderboard", key: "enablePublicLeaderboard" },
              { labelKey: "admin.requireEmailVerification", key: "requireEmailVerification" },
            ].map(toggle => (
              <div key={toggle.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: COLORS.bg }}>
                <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{t(toggle.labelKey)}</span>
                <div
                  className="rounded-full flex items-center cursor-pointer transition-all"
                  style={{ width: 40, height: 22, background: systemSettings[toggle.key as keyof typeof systemSettings] ? COLORS.primary : COLORS.border, padding: "2px" }}
                  onClick={() => setSystemSettings(p => ({ ...p, [toggle.key]: !p[toggle.key as keyof typeof systemSettings] }))}
                >
                  <div className="rounded-full bg-white" style={{ width: 18, height: 18, transform: systemSettings[toggle.key as keyof typeof systemSettings] ? "translateX(18px)" : "translateX(0)", transition: "transform 0.2s" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Button variant="primary" size="md" icon={<Save size={14} />} onClick={() => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 2000); }}>
              {t("common.saveSettings")}
            </Button>
            {settingsSaved && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>{t("common.settingsSaved")}</span>}
          </div>
        </Card>
      </div>
    </>
  );

  const renderAwards = () => (
    <>
      <SectionHeader
        title="Award Management"
        action={
          <Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => onNavigate("award-patterns")}>
            Create Award Pattern
          </Button>
        }
        subtitle="Auto-grant awards from category rankings"
      />
      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={17} style={{ color: COLORS.primary }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Grant for Top Ranking of Category</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                Select a category, enter Top N, then grant awards using the backend award patterns.
              </div>
            </div>
          </div>

          {autoGrantError && (
            <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 13 }}>
              {autoGrantError}
            </div>
          )}
          {autoGrantMessage && (
            <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.success}10`, color: COLORS.success, fontSize: 13 }}>
              {autoGrantMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_140px] gap-4">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</label>
              <select
                value={selectedEventId ?? ""}
                onChange={e => setSelectedEventId(e.target.value || null)}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              >
                {apiEvents.length === 0 && <option value="">No events found</option>}
                {apiEvents.map((event: any) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</label>
              <select
                value={awardPatternCategoryId}
                onChange={e => setAwardPatternCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              >
                <option value="">Select category</option>
                {apiCategories.length === 0 && selectedEventId && <option value="" disabled>No categories found</option>}
                {apiCategories.map(category => (
                  <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>TOP N</label>
              <input
                type="number"
                min={1}
                max={50}
                value={autoGrantLimit}
                onChange={e => setAutoGrantLimit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Button
              variant="primary"
              size="lg"
              icon={autoGrantLoading ? <Loader size={15} className="animate-spin" /> : <Trophy size={15} />}
              onClick={handleAutoGrantAwards}
              disabled={autoGrantLoading || !awardPatternCategoryId}
            >
              {autoGrantLoading ? "Granting..." : "Grant for Top Ranking of Category"}
            </Button>
          </div>

          {autoGrantPreview.length > 0 && (
            <div className="mt-6">
              <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, marginBottom: 10 }}>Top Ranking Used</div>
              <div className="space-y-2">
                {autoGrantPreview.map(candidate => (
                  <div key={candidate.teamId} className="flex items-center justify-between p-3 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: `${COLORS.primary}12`, color: COLORS.primary, fontWeight: 700, fontSize: 12 }}>
                        #{candidate.rankPosition}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>{candidate.teamName}</div>
                        <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{candidate.teamId}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 600 }}>{candidate.totalScore.toFixed(1)} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Granted Awards</div>
          {apiAwards.length === 0 && (
            <div className="p-4 rounded-xl" style={{ background: COLORS.bg, color: COLORS.textSecondary, fontSize: 13 }}>
              No awards have been granted for this event yet.
            </div>
          )}
          {apiAwards.map(award => (
            <div key={award.id} className="flex items-center gap-3 mb-3 p-3 rounded-xl" style={{ background: COLORS.bg }}>
              <span className="inline-flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: `${COLORS.primary}12`, color: COLORS.primary }}>
                <Award size={18} />
              </span>
              <div className="flex-1">
                <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>{award.teamName}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{award.eventName} - {award.categoryName}</div>
              </div>
              <div className="text-right">
                <div style={{ fontSize: 11, color: COLORS.textPrimary, fontWeight: 700 }}>{award.awardTierName}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{award.awardTitle}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </>
  );

  const renderAwardPatterns = () => (
    <>
      <SectionHeader
        title="Create Award Pattern"
        subtitle="Configure award title, tier, description, and prize by rank for a category"
        action={
          <Button variant="outline" size="sm" icon={<Award size={14} />} onClick={() => onNavigate("awards")}>
            Back to Awards
          </Button>
        }
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</label>
            <select
              value={selectedEventId ?? ""}
              onChange={e => setSelectedEventId(e.target.value || null)}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
            >
              {apiEvents.map((event: any) => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</label>
            <select
              value={awardPatternCategoryId}
              onChange={e => setAwardPatternCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl outline-none"
              style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
            >
              <option value="">Select category</option>
              {apiCategories.map(category => (
                <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
              ))}
            </select>
          </div>
        </div>

        {awardPatternError && (
          <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 13 }}>
            {awardPatternError}
          </div>
        )}
        {awardPatternMessage && (
          <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.success}10`, color: COLORS.success, fontSize: 13 }}>
            {awardPatternMessage}
          </div>
        )}

        <div className="space-y-3">
          {awardPatterns.map((pattern, index) => (
            <div key={index} className="grid grid-cols-1 xl:grid-cols-[80px_1.2fr_1.4fr_1fr_120px_44px] gap-3 items-end p-4 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>RANK</label>
                <input type="number" min={1} max={10} value={pattern.rankPosition} onChange={e => updateAwardPattern(index, "rankPosition", Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>TIER</label>
                <select value={pattern.awardTierId} onChange={e => updateAwardPattern(index, "awardTierId", e.target.value)} className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
                  {AWARD_TIER_OPTIONS.map(tier => <option key={tier.value} value={tier.value}>{tier.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>TITLE</label>
                <input value={pattern.awardTitle} onChange={e => updateAwardPattern(index, "awardTitle", e.target.value)} placeholder="Champion" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>PRIZE</label>
                <input type="number" value={pattern.prizeValue} onChange={e => updateAwardPattern(index, "prizeValue", e.target.value)} placeholder="10000000" className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CURRENCY</label>
                <select value={pattern.prizeCurrency} onChange={e => updateAwardPattern(index, "prizeCurrency", e.target.value)} className="w-full px-3 py-2.5 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <button type="button" onClick={() => removeAwardPattern(index)} className="h-11 rounded-xl flex items-center justify-center" style={{ border: `1px solid ${COLORS.border}`, color: COLORS.error, background: COLORS.bg }} aria-label="Remove award pattern">
                <X size={16} />
              </button>
              <div className="xl:col-span-6">
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>DESCRIPTION</label>
                <textarea value={pattern.description} onChange={e => updateAwardPattern(index, "description", e.target.value)} rows={2} className="w-full px-3 py-2.5 rounded-xl outline-none resize-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-5">
          <Button variant="outline" size="sm" icon={<PlusCircle size={14} />} onClick={addAwardPattern}>Add Rank</Button>
          <Button variant="primary" size="md" icon={<Save size={14} />} onClick={handleSaveAwardPatterns} disabled={awardPatternLoading || !awardPatternCategoryId}>
            {awardPatternLoading ? "Saving..." : "Save Award Pattern"}
          </Button>
        </div>
      </Card>
    </>
  );
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return renderDashboard();
      case "events": return renderEvents();
      case "categories": return renderCategories();
      case "rounds": return renderRounds();
      case "criteria": return renderCriteria();
      case "users": return renderUsers();
      case "assignments": return renderAssignments();
      case "rankings": return renderRankings();
      case "reports": return renderReports();
      case "notifications": return renderNotifications();
      case "direct-notification": return renderDirectNotification();
      case "audit": return renderAudit();
      case "awards": return renderAwards();
      case "award-patterns": return renderAwardPatterns();
      case "settings": return renderSettings();
      case "profile": return renderProfile();
      default: return renderDashboard();
    }
  };

  return (
    <div className="p-6 space-y-6">
      {renderPage()}

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {eventModal.open && (
        <EventModal
          event={eventModal.edit}
          onClose={() => setEventModal({ open: false })}
          onSaved={saved => {
            setApiEvents(prev => eventModal.edit
              ? prev.map((e: any) => e.id === saved.eventId ? { ...e, name: saved.eventName, category: saved.description ?? e.category } : e)
              : [...prev, { id: saved.eventId, name: saved.eventName, category: saved.description ?? "—", status: "upcoming", teams: 0, rounds: 0, deadline: saved.eventEndDate ?? "—", prize: "—" }]
            );
            setEventModal({ open: false });
          }}
        />
      )}

      {categoryModal.open && selectedEventId && (
        <CategoryModal
          eventId={selectedEventId}
          category={categoryModal.edit}
          onClose={() => setCategoryModal({ open: false })}
          onSaved={saved => {
            setApiCategories(prev => categoryModal.edit
              ? prev.map(c => c.categoryId === saved.categoryId ? saved : c)
              : [...prev, saved]
            );
            setCategoryModal({ open: false });
          }}
        />
      )}

      {roundModal.open && roundModal.categoryId && (
        <RoundModal
          categoryId={roundModal.categoryId}
          round={roundModal.edit}
          onClose={() => setRoundModal({ open: false })}
          onSaved={saved => {
            setApiRounds(prev => roundModal.edit
              ? prev.map(r => r.roundId === saved.roundId ? saved : r)
              : [...prev, saved]
            );
            setRoundModal({ open: false });
          }}
        />
      )}

      {assignJudgeModal.open && assignJudgeModal.roundId && (
        <AssignJudgeModal
          roundId={assignJudgeModal.roundId}
          roundName={assignJudgeModal.roundName ?? ""}
          onClose={() => setAssignJudgeModal({ open: false })}
          onSaved={() => setAssignJudgeModal({ open: false })}
        />
      )}

    </div>
  );
}
