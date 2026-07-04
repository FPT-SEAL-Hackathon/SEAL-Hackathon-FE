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

export function AdminNotificationsView({ context }: AdminViewProps) {
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
          {broadcastHistory.map((b: any) => (
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
}
