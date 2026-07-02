import {
  Users, Upload, Shield, AlertTriangle, Calendar, BookOpen,
  GitBranch, Star, UserCheck, Trophy, BarChart2, Bell,
  Settings, PlusCircle, Edit, Trash2, Save, CheckCircle,
  TrendingUp, Clock, Activity, Download, Send, Search, Filter,
  Eye, ToggleLeft, ToggleRight, ChevronDown, X, Zap, Award, Loader, Database
} from "lucide-react";
import {
  StatCard, Card, SectionHeader, COLORS, StatusBadge,
  ProgressBar, Button, DataTable, TimelineItem
} from "@/components/shared/UIComponents";

interface AdminViewProps {
  context: any;
}

export function AdminDashboardView({ context }: AdminViewProps) {
  const {
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
    handleComputeRankings,
    handlePublishRankings,
    handleAutoGrantAwards,
    handleBroadcast,
    handleSendTargetedNotification,
    handleDataExport,
    createEmptyAwardPattern
  } = context;

  return (
    <>
      <SectionHeader title="Admin Dashboard" subtitle="SEAL Hackathon Platform — System Overview" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Teams" value={127} trend={12} icon={<Users size={20} />} color={COLORS.primary} />
        <StatCard title="Submissions" value={89} trend={8} icon={<Upload size={20} />} color={COLORS.success} />
        <StatCard title="Active Judges" value={24} icon={<Shield size={20} />} color={COLORS.warning} />
        <StatCard title="Pending Approvals" value={8} icon={<AlertTriangle size={20} />} color={COLORS.error} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
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
            {rounds.filter((r: any) => r.event === "SEAL Fall 2025").map((r: any) => (
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
            {auditLogs.slice(0, 4).map((log: any, i: number) => (
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
}
