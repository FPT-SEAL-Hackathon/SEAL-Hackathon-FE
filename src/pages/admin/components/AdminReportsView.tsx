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

export function AdminReportsView({ context }: AdminViewProps) {
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
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
}
