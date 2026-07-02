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

export function AdminCategoriesView({ context }: AdminViewProps) {
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
        title="Category Management"
        subtitle="Manage competition categories and tracks"
        action={<Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => setCategoryModal({ open: true })}>New Category</Button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat: any) => (
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
}
