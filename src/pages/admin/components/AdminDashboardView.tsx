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
    apiDashboardRounds,
    apiTeamEligibility,
    setApiTeamEligibility,
    apiRankings,
    setApiRankings,
    apiAwards,
    setApiAwards,
    apiCriteriaTemplates,
    setApiCriteriaTemplates,
    apiUsers,
    adminSubmissions,
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

  const selectedEvent = apiEvents.find((event: any) => event.eventId === selectedEventId || event.id === selectedEventId);
  const totalTeams = apiTeamEligibility.length;
  const totalSubmissions = adminSubmissions.length;
  const activeJudges = apiUsers.filter((user: any) => {
    const role = String(user.roleName ?? user.role ?? "").toUpperCase();
    const status = String(user.accountStatusName ?? user.accountStatus ?? "").toUpperCase();
    return role.includes("JUDGE") && status.includes("ACTIVE");
  }).length;
  const pendingApprovals = apiUsers.filter((user: any) => {
    const status = String(user.accountStatusName ?? user.accountStatus ?? "").toUpperCase();
    return status.includes("PENDING");
  }).length;
  const visibleEvents = apiEvents.filter((event: any) => {
    const status = String(event.status ?? event.eventStatusName ?? "").toUpperCase();
    return status !== "COMPLETED" && status !== "CANCELLED";
  });
  const overviewEvents = visibleEvents.length > 0 ? visibleEvents : apiEvents;
  const dashboardRounds = apiDashboardRounds ?? apiRounds;
  const recentActivity = [
    ...adminSubmissions.slice(0, 2).map((submission: any) => ({
      id: `submission-${submission.submissionId}`,
      action: "Submission received",
      actor: submission.submittedByUserId || submission.teamId || "Participant",
      date: submission.submittedAt || submission.lastUpdatedAt,
    })),
    ...apiTeamEligibility.slice(0, 2).map((team: any) => ({
      id: `team-${team.teamId}`,
      action: team.eligibleForCompetition ? "Team eligible" : "Team needs review",
      actor: team.teamName,
      date: "",
    })),
  ];

  return (
    <>
      <SectionHeader title="Admin Dashboard" subtitle={`${selectedEvent?.name ?? selectedEvent?.eventName ?? "SEAL Hackathon Platform"} - System Overview`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Teams" value={totalTeams} icon={<Users size={20} />} color={COLORS.primary} />
        <StatCard title="Submissions" value={totalSubmissions} icon={<Upload size={20} />} color={COLORS.success} />
        <StatCard title="Active Judges" value={activeJudges} icon={<Shield size={20} />} color={COLORS.warning} />
        <StatCard title="Pending Approvals" value={pendingApprovals} icon={<AlertTriangle size={20} />} color={COLORS.error} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Active Events Overview</div>
            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {overviewEvents.length === 0 && (
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>No events loaded from API.</div>
              )}
              {overviewEvents.map((ev: any) => (
                <div key={ev.id} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{ev.name}</span>
                    <StatusBadge status={ev.status} />
                  </div>
                  <ProgressBar
                    value={ev.id === selectedEventId ? totalTeams : (ev.teams ?? 0)}
                    max={Math.max(ev.maxTeamSize ?? totalTeams, totalTeams, 1)}
                    color={COLORS.primary}
                    label={`${ev.id === selectedEventId ? totalTeams : (ev.teams ?? 0)} teams registered`}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Scoring Progress - {selectedEvent?.name ?? selectedEvent?.eventName ?? "Selected Event"}</div>
            {dashboardRounds.length === 0 && (
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>No rounds loaded from API.</div>
            )}
            {dashboardRounds.map((r: any) => {
              const roundSubmissions = adminSubmissions.filter((submission: any) => submission.roundId === r.roundId);
              const scored = roundSubmissions.filter((submission: any) => {
                const status = String(submission.submissionStatusName ?? "").toUpperCase();
                return status.includes("SCORED") || status.includes("REVIEWED");
              }).length;
              const status = r.roundStatusName ?? r.status ?? "OPEN";
              return (
              <div key={r.roundId} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{r.roundName}</span>
                  <StatusBadge status={status} />
                </div>
                <ProgressBar value={scored} max={Math.max(roundSubmissions.length, 1)} color={String(status).toUpperCase().includes("COMPLETED") ? COLORS.success : COLORS.warning} label={`Scored: ${scored}/${roundSubmissions.length}`} />
              </div>
            )})}
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
            {recentActivity.length === 0 && (
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>No recent API activity loaded.</div>
            )}
            {recentActivity.map((activity: any) => (
              <div key={activity.id} className="mb-3 last:mb-0">
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{activity.action}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{activity.actor}{activity.date ? ` - ${String(activity.date).split("T")[0]}` : ""}</div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
