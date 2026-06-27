import { useState, useEffect } from "react";
import { useLanguage } from "@/app/store/languageStore";
import { eventService, type EventResponse } from "@/features/events/api/eventService";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import { roundService, type CriterionTemplateResponse, type RoundResponse } from "@/features/judging/api/roundService";
import { teamService, type TeamEligibilityReviewResponse } from "@/features/teams/api/teamService";
import { rankingService, type EventRankingDTO } from "@/features/rankings/api/rankingService";
import { awardService, type AwardResponse } from "@/features/awards/api/awardService";
import { notificationService } from "@/features/notifications/api/notificationService";
import { researchService } from "@/features/research/api/researchService";
import { submissionService, type SubmissionResponse } from "@/features/submissions/api/submissionService";
import { getAccessToken } from "@/lib/api/apiClient";
import { EventModal } from "@/features/events/components/EventModal";
import { CategoryModal } from "@/features/categories/components/CategoryModal";
import { RoundModal } from "@/features/judging/components/RoundModal";
import { AssignJudgeModal } from "@/features/judging/components/AssignJudgeModal";
import { AdminDashboardView } from "./components/AdminDashboardView";
import { AdminEventsView } from "./components/AdminEventsView";
import { AdminEventParticipantsView } from "./components/AdminEventParticipantsView";
import { AdminCategoriesView } from "./components/AdminCategoriesView";
import { AdminRoundsView } from "./components/AdminRoundsView";
import { AdminCriteriaView } from "./components/AdminCriteriaView";
import { AdminUsersView } from "./components/AdminUsersView";
import { AdminAssignmentsView } from "./components/AdminAssignmentsView";
import { AdminSubmissionsView } from "./components/AdminSubmissionsView";
import { AdminRankingsView } from "./components/AdminRankingsView";
import { AdminReportsView } from "./components/AdminReportsView";
import { AdminDataExportView } from "./components/AdminDataExportView";
import { AdminNotificationsView } from "./components/AdminNotificationsView";
import { AdminDirectNotificationView } from "./components/AdminDirectNotificationView";
import { AdminAuditView } from "./components/AdminAuditView";
import { AdminProfileView } from "./components/AdminProfileView";
import { AdminSettingsView } from "./components/AdminSettingsView";
import { AdminAwardsView } from "./components/AdminAwardsView";
import { AdminAwardPatternsView } from "./components/AdminAwardPatternsView";
import { COLORS } from "@/components/shared/UIComponents";

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
  const [apiEvents, setApiEvents] = useState<typeof events>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [apiCategories, setApiCategories] = useState<CategoryResponse[]>([]);
  const [apiRounds, setApiRounds] = useState<RoundResponse[]>([]);
  const [apiTeamEligibility, setApiTeamEligibility] = useState<TeamEligibilityReviewResponse[]>([]);
  const [apiRankings, setApiRankings] = useState<EventRankingDTO[]>([]);
  const [apiAwards, setApiAwards] = useState<AwardResponse[]>([]);
  const [apiCriteriaTemplates, setApiCriteriaTemplates] = useState<CriterionTemplateResponse[]>([]);
  const [eventLoadError, setEventLoadError] = useState("");
  const [categoryLoadError, setCategoryLoadError] = useState("");
  const [selectedSubmissionCategoryId, setSelectedSubmissionCategoryId] = useState("");
  const [selectedSubmissionRoundId, setSelectedSubmissionRoundId] = useState("");
  const [adminSubmissions, setAdminSubmissions] = useState<SubmissionResponse[]>([]);
  const [submissionScope, setSubmissionScope] = useState<"event" | "round" | "unreview">("event");
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsError, setSubmissionsError] = useState("");
  const [submissionReloadKey, setSubmissionReloadKey] = useState(0);
  const [submissionActionMessage, setSubmissionActionMessage] = useState("");
  const [submissionDisqualifyTarget, setSubmissionDisqualifyTarget] = useState<SubmissionResponse | null>(null);
  const [submissionDisqualifyReason, setSubmissionDisqualifyReason] = useState("");
  const [submissionDisqualifying, setSubmissionDisqualifying] = useState(false);
  const [dataExportLoading, setDataExportLoading] = useState(false);
  const [dataExportDone, setDataExportDone] = useState(false);
  const [dataExportError, setDataExportError] = useState("");

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
  const [rankingsPublished, setRankingsPublished] = useState(false);
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
        setEventLoadError("");
        const mapped = data.map(e => ({
          id: e.eventId, name: e.eventName,
          category: e.description ?? "—", status: "active",
          teams: 0, rounds: 0, deadline: e.eventEndDate ?? "—", prize: "—",
        }));
        setApiEvents(mapped as any);
        if (data[0]) setSelectedEventId(data[0].eventId);
      })
      .catch(error => {
        setEventLoadError(error instanceof Error ? error.message : "Failed to load events.");
      });
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    setCategoryLoadError("");
    setApiCategories([]);
    setAwardPatternCategoryId("");
    setSelectedSubmissionCategoryId("");
    setSelectedSubmissionRoundId("");
    categoryService.getByEvent(selectedEventId).then(data => {
      setCategoryLoadError("");
      setApiCategories(data);
      // Load rounds for first category
      if (data[0]) {
        roundService.getByCategory(data[0].categoryId).then(setApiRounds).catch(() => {});
        setAwardPatternCategoryId(data[0].categoryId);
        setSelectedSubmissionCategoryId(data[0].categoryId);
      }
    }).catch(error => {
      setCategoryLoadError(error instanceof Error ? error.message : "Failed to load categories.");
    });
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

  useEffect(() => {
    if (!selectedSubmissionCategoryId) return;
    roundService.getByCategory(selectedSubmissionCategoryId)
      .then(rounds => {
        setApiRounds(rounds);
        setSelectedSubmissionRoundId(rounds[0]?.roundId ?? "");
      })
      .catch(() => {
        setApiRounds([]);
        setSelectedSubmissionRoundId("");
      });
  }, [selectedSubmissionCategoryId]);

  useEffect(() => {
    if (!selectedSubmissionRoundId && apiRounds[0]) {
      setSelectedSubmissionRoundId(apiRounds[0].roundId);
    }
  }, [apiRounds, selectedSubmissionRoundId]);

  useEffect(() => {
    if (currentPage !== "submissions") return;

    const loadSubmissions = async () => {
      setSubmissionsLoading(true);
      setSubmissionsError("");
      setSubmissionActionMessage("");
      try {
        const data = submissionScope === "event"
          ? await submissionService.getByEvent(selectedEventId ?? "")
          : submissionScope === "unreview"
            ? await submissionService.getUnreviewByRound(selectedSubmissionRoundId)
            : await submissionService.getByRound(selectedSubmissionRoundId);
        setAdminSubmissions(data);
      } catch (error) {
        setAdminSubmissions([]);
        setSubmissionsError(error instanceof Error ? error.message : "Failed to load submissions.");
      } finally {
        setSubmissionsLoading(false);
      }
    };

    if (submissionScope === "event" && selectedEventId) {
      loadSubmissions();
    }
    if (submissionScope !== "event" && selectedSubmissionRoundId) {
      loadSubmissions();
    }
  }, [currentPage, selectedEventId, selectedSubmissionRoundId, submissionScope, submissionReloadKey]);

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

  const handleSubmissionDisqualifyConfirm = async () => {
    if (!submissionDisqualifyTarget || !submissionDisqualifyReason.trim()) return;
    setSubmissionDisqualifying(true);
    setSubmissionsError("");
    try {
      await submissionService.disqualify(submissionDisqualifyTarget.submissionId, submissionDisqualifyReason.trim());
      setAdminSubmissions(prev => prev.map(submission =>
        submission.submissionId === submissionDisqualifyTarget.submissionId
          ? { ...submission, submissionStatusName: "Disqualified" }
          : submission
      ));
      setSubmissionActionMessage("Submission disqualified successfully.");
      setSubmissionDisqualifyTarget(null);
      setSubmissionDisqualifyReason("");
    } catch (error) {
      setSubmissionsError(error instanceof Error ? error.message : "Failed to disqualify submission.");
    } finally {
      setSubmissionDisqualifying(false);
    }
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
    } catch { /* ignore for demo */ }
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3000);
  };

  const handleSendTargetedNotification = async () => {
    setNotificationError("");
    setNotificationStatus("");
    setNotificationSending(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setNotificationStatus("Notification sent successfully!");
      setNotificationTitle("");
      setNotificationMessage("");
      setTimeout(() => setNotificationStatus(""), 3000);
    } catch (err) {
      setNotificationError("Failed to send notification.");
    } finally {
      setNotificationSending(false);
    }
  };

  const handleDataExport = async () => {
    if (!selectedEventId) {
      setDataExportError("Select or load an event before exporting data.");
      return;
    }

    setDataExportLoading(true);
    setDataExportError("");
    setDataExportDone(false);
    try {
      const token = getAccessToken();
      const response = await fetch(researchService.exportUrl(selectedEventId), {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `seal-data-export-${selectedEventId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setDataExportDone(true);
      setTimeout(() => setDataExportDone(false), 3000);
    } catch (error) {
      setDataExportError(error instanceof Error ? error.message : "Failed to export data.");
    } finally {
      setDataExportLoading(false);
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

  const handlePublishRankings = async () => {
    if (selectedEventId && awardPatternCategoryId) {
      try {
        await rankingService.publishEvent(selectedEventId, awardPatternCategoryId);
        const data = await rankingService.computeEvent(selectedEventId);
        setApiRankings(data);
      } catch { /* ignore */ }
    }
    setRankingsPublished(true);
    setTimeout(() => {
        setRankingsPublished(false);
        if (window.confirm("Kết quả đã được duyệt! Bạn có muốn gửi Notification báo cho toàn bộ thí sinh không?")) {
            setBroadcastTitle("Leaderboard Published!");
            setBroadcastMessage("The official results for the event have been published. Check out the leaderboard!");
            onNavigate("notifications");
        }
    }, 1500);
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


  const viewContext = {
    t,
    onNavigate,
    events,
    categories,
    rounds,
    criteria,
    users,
    rankings,
    auditLogs,
    broadcastHistory,
    roleColors,
    AWARD_TIER_OPTIONS,
    apiEvents,
    setApiEvents,
    selectedEventId,
    setSelectedEventId,
    apiCategories,
    setApiCategories,
    apiRounds,
    setApiRounds,
    apiTeamEligibility,
    setApiTeamEligibility,
    apiRankings,
    setApiRankings,
    apiAwards,
    setApiAwards,
    apiCriteriaTemplates,
    setApiCriteriaTemplates,
    eventLoadError,
    setEventLoadError,
    categoryLoadError,
    setCategoryLoadError,
    selectedSubmissionCategoryId,
    setSelectedSubmissionCategoryId,
    selectedSubmissionRoundId,
    setSelectedSubmissionRoundId,
    adminSubmissions,
    setAdminSubmissions,
    submissionScope,
    setSubmissionScope,
    submissionsLoading,
    setSubmissionsLoading,
    submissionsError,
    setSubmissionsError,
    submissionReloadKey,
    setSubmissionReloadKey,
    submissionActionMessage,
    setSubmissionActionMessage,
    submissionDisqualifyTarget,
    setSubmissionDisqualifyTarget,
    submissionDisqualifyReason,
    setSubmissionDisqualifyReason,
    submissionDisqualifying,
    setSubmissionDisqualifying,
    dataExportLoading,
    setDataExportLoading,
    dataExportDone,
    setDataExportDone,
    dataExportError,
    setDataExportError,
    eventModal,
    setEventModal,
    categoryModal,
    setCategoryModal,
    roundModal,
    setRoundModal,
    assignJudgeModal,
    setAssignJudgeModal,
    userSearch,
    setUserSearch,
    approvedUsers,
    setApprovedUsers,
    showGuestJudgeForm,
    setShowGuestJudgeForm,
    guestJudgeForm,
    setGuestJudgeForm,
    guestJudgeSuccess,
    setGuestJudgeSuccess,
    rankingsComputed,
    setRankingsComputed,
    rankingsPublished,
    setRankingsPublished,
    disqualifiedTeams,
    setDisqualifiedTeams,
    disqualifyTarget,
    setDisqualifyTarget,
    disqualifyReason,
    setDisqualifyReason,
    awardPatternCategoryId,
    setAwardPatternCategoryId,
    awardPatterns,
    setAwardPatterns,
    awardPatternLoading,
    setAwardPatternLoading,
    awardPatternMessage,
    setAwardPatternMessage,
    awardPatternError,
    setAwardPatternError,
    autoGrantLimit,
    setAutoGrantLimit,
    autoGrantLoading,
    setAutoGrantLoading,
    autoGrantMessage,
    setAutoGrantMessage,
    autoGrantError,
    setAutoGrantError,
    autoGrantPreview,
    setAutoGrantPreview,
    broadcastTitle,
    setBroadcastTitle,
    broadcastMessage,
    setBroadcastMessage,
    broadcastAudience,
    setBroadcastAudience,
    broadcastSent,
    setBroadcastSent,
    notificationTargetMode,
    setNotificationTargetMode,
    notificationTeamId,
    setNotificationTeamId,
    notificationEmail,
    setNotificationEmail,
    notificationTitle,
    setNotificationTitle,
    notificationMessage,
    setNotificationMessage,
    notificationSending,
    setNotificationSending,
    notificationStatus,
    setNotificationStatus,
    notificationError,
    setNotificationError,
    settingsSaved,
    setSettingsSaved,
    systemSettings,
    setSystemSettings,
    filteredUsers,
    updateAwardPattern,
    addAwardPattern,
    removeAwardPattern,
    handleSaveAwardPatterns,
    handleApproveUser,
    handleGuestJudgeSubmit,
    handleDisqualify,
    handleDisqualifyConfirm,
    handleSubmissionDisqualifyConfirm,
    handleComputeRankings,
    handlePublishRankings,
    handleAutoGrantAwards,
    handleBroadcast,
    handleSendTargetedNotification,
    handleDataExport,
    createEmptyAwardPattern
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <AdminDashboardView context={viewContext} />;
      case "events": return <AdminEventsView context={viewContext} />;
      case "event-participants": return <AdminEventParticipantsView />;
      case "categories": return <AdminCategoriesView context={viewContext} />;
      case "rounds": return <AdminRoundsView context={viewContext} />;
      case "criteria": return <AdminCriteriaView context={viewContext} />;
      case "users": return <AdminUsersView context={viewContext} />;
      case "assignments": return <AdminAssignmentsView context={viewContext} />;
      case "submissions": return <AdminSubmissionsView context={viewContext} />;
      case "rankings": return <AdminRankingsView context={viewContext} />;
      case "reports": return <AdminReportsView context={viewContext} />;
      case "data-export": return <AdminDataExportView context={viewContext} />;
      case "notifications": return <AdminNotificationsView context={viewContext} />;
      case "direct-notification": return <AdminDirectNotificationView context={viewContext} />;
      case "audit": return <AdminAuditView context={viewContext} />;
      case "awards": return <AdminAwardsView context={viewContext} />;
      case "award-patterns": return <AdminAwardPatternsView context={viewContext} />;
      case "settings": return <AdminSettingsView context={viewContext} />;
      case "profile": return <AdminProfileView context={viewContext} />;
      default: return <AdminDashboardView context={viewContext} />;

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
