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
import { isSubmissionStatus } from "@/features/submissions/api/submissionService";

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
    apiActiveJudgesCount,
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

  const selectedEvent = apiEvents.find((event: any) => event.eventId === selectedEventId || event.id === selectedEventId) || apiEvents[0];
  const selectedEventTitle = selectedEvent?.eventName ?? selectedEvent?.name ?? (selectedEventId ? `Event (${String(selectedEventId).slice(0, 8)})` : "Platform Overview");

  const teamsFromEvents = (apiEvents || []).reduce((acc: number, ev: any) => acc + Number(ev.teams ?? ev.visibleTeamCount ?? ev.teamCount ?? 0), 0);
  const totalTeams = Math.max(teamsFromEvents, (apiTeamEligibility || []).length, (context.teams || []).length);

  const totalSubmissions = Math.max((adminSubmissions || []).length, (context.submissions || []).length);

  const allUsersList = (apiUsers && apiUsers.length > 0) ? apiUsers : (users || context.users || []);

  const activeJudges = typeof apiActiveJudgesCount === "number"
    ? apiActiveJudgesCount
    : allUsersList.filter((user: any) => {
        const role = String(user.roleName ?? user.role ?? user.userRole ?? "").toUpperCase();
        const status = String(user.accountStatusName ?? user.accountStatus ?? user.status ?? "ACTIVE").toUpperCase();
        return (role.includes("JUDGE") || role.includes("EXPERT")) && (status.includes("ACTIVE") || status.includes("ENABLE"));
      }).length;

  const pendingApprovals = allUsersList.filter((user: any) => {
    const status = String(user.accountStatusName ?? user.accountStatus ?? user.status ?? "").toUpperCase();
    return status.includes("PENDING") || status.includes("WAITING");
  }).length;
  const visibleEvents = apiEvents.filter((event: any) => {
    const status = String(event.status ?? event.eventStatusName ?? "").toUpperCase();
    return status !== "COMPLETED" && status !== "CANCELLED";
  });
  const overviewEvents = visibleEvents.length > 0 ? visibleEvents : apiEvents;

  const dashboardRounds = (apiDashboardRounds && apiDashboardRounds.length > 0)
    ? apiDashboardRounds
    : (apiRounds && apiRounds.length > 0)
      ? apiRounds
      : (rounds || []);

  const recentActivityItems: Array<{ id: string; action: string; actor: string; date?: string; timestamp?: number }> = [];

  (adminSubmissions || []).forEach((s: any) => {
    const dStr = s.submittedAt || s.lastUpdatedAt || s.createdAt;
    recentActivityItems.push({
      id: `sub-${s.submissionId}`,
      action: s.submissionStatusName ? `Submission: ${s.submissionStatusName}` : "Submission received",
      actor: s.teamName || s.teamCode || (s.submittedByUserId ? `Participant (${String(s.submittedByUserId).slice(0, 8)})` : "Participant"),
      date: dStr ? new Date(dStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "",
      timestamp: dStr ? new Date(dStr).getTime() : 0,
    });
  });

  (apiTeamEligibility || []).forEach((t: any) => {
    const dStr = t.updatedAt || t.createdAt;
    recentActivityItems.push({
      id: `team-${t.teamId}`,
      action: t.eligibleForCompetition ? "Team eligible for competition" : "Team needs review",
      actor: t.teamName || "Team",
      date: dStr ? new Date(dStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
      timestamp: dStr ? new Date(dStr).getTime() : 0,
    });
  });

  (apiEvents || []).forEach((e: any) => {
    const dStr = e.createdAt || e.registrationStart || e.eventStartDate;
    recentActivityItems.push({
      id: `event-${e.eventId}`,
      action: `Event status: ${e.eventStatusName || e.eventStatus || "Active"}`,
      actor: e.eventName || e.name || "Event",
      date: dStr ? new Date(dStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
      timestamp: dStr ? new Date(dStr).getTime() : 0,
    });
  });

  (apiUsers || []).filter((u: any) => String(u.accountStatusName || u.accountStatus || "").toUpperCase().includes("PENDING")).forEach((u: any) => {
    const dStr = u.createdAt;
    recentActivityItems.push({
      id: `user-${u.userId}`,
      action: "Account pending approval",
      actor: u.fullName || u.email || "New User",
      date: dStr ? new Date(dStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
      timestamp: dStr ? new Date(dStr).getTime() : 0,
    });
  });

  const recentActivity = recentActivityItems
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 5);

  return (
    <>
      <SectionHeader title="Admin Dashboard" subtitle="Platform Overview & System Metrics" />
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
              {overviewEvents.map((ev: any) => {
                const eventTeamsCount = ev.id === selectedEventId 
                  ? (apiTeamEligibility.length || ev.teams || 0) 
                  : (ev.teams ?? 0);
                return (
                  <div key={ev.id} className="mb-4 last:mb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{ev.name}</span>
                      <StatusBadge status={ev.status} />
                    </div>
                    <ProgressBar
                      value={eventTeamsCount}
                      max={Math.max(ev.maxTeamSize ?? eventTeamsCount, eventTeamsCount, 1)}
                      color={COLORS.primary}
                      label={`${eventTeamsCount} teams registered`}
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Scoring Progress</div>
            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {dashboardRounds.length === 0 && (
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>No round schedules loaded yet.</div>
              )}
              {dashboardRounds.map((r: any, idx: number) => {
                const roundSubmissions = adminSubmissions.filter((submission: any) => submission.roundId === r.roundId);
                const scored = roundSubmissions.filter((submission: any) => isSubmissionStatus(submission, "SCORED")).length;
                const status = r.roundStatusName ?? r.status ?? "OPEN";
                const evName = r.eventName || r.event?.eventName || (apiEvents.find((e: any) => e.eventId === r.eventId || e.id === r.eventId)?.name ?? apiEvents.find((e: any) => e.eventId === r.eventId || e.id === r.eventId)?.eventName ?? selectedEventTitle);
                const catName = r.categoryName || r.category?.categoryName;

                return (
                  <div key={r.roundId || r.id || idx} className="p-3.5 rounded-xl border mb-3 last:mb-0 space-y-2" style={{ background: COLORS.bg, borderColor: COLORS.border }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>{r.roundName}</span>
                      <StatusBadge status={status} />
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }} className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold" style={{ color: COLORS.primary }}>Event:</span>
                      <span className="font-medium" style={{ color: COLORS.textPrimary }}>{evName}</span>
                      {catName && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="font-semibold" style={{ color: COLORS.primary }}>Category:</span>
                          <span className="font-medium" style={{ color: COLORS.textPrimary }}>{catName}</span>
                        </>
                      )}
                    </div>
                    <div className="pt-1">
                      <ProgressBar
                        value={scored}
                        max={Math.max(roundSubmissions.length, 1)}
                        color={String(status).toUpperCase().includes("COMPLETED") ? COLORS.success : COLORS.warning}
                        label={`Scored: ${scored}/${roundSubmissions.length}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Quick Actions</div>
            <div className="space-y-2">
              {[
                { label: "Create New Event", icon: <PlusCircle size={14} />, page: "events" },
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
            {recentActivity.length === 0 ? (
              <div style={{ fontSize: 13, color: COLORS.textSecondary }}>No recent activity logged yet.</div>
            ) : (
              recentActivity.map((activity: any) => (
                <div key={activity.id} className="mb-3 last:mb-0 border-b last:border-b-0 pb-2.5 last:pb-0" style={{ borderColor: COLORS.border }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{activity.action}</span>
                    {activity.date && (
                      <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{activity.date}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }} className="mt-0.5">
                    {activity.actor}
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
