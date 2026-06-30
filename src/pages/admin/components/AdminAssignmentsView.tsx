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

export function AdminAssignmentsView({ context }: AdminViewProps) {
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
}
