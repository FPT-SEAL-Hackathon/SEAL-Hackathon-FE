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

export function AdminProfileView({ context }: AdminViewProps) {
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
}
