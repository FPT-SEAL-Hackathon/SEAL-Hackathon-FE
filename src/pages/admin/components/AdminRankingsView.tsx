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

export function AdminRankingsView({ context }: AdminViewProps) {
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
        title={t("admin.rankingsManagement")}
        subtitle={t("admin.rankingsManagementSubtitle")}
        action={
          <div className="flex items-center gap-2">
            {rankingsComputed && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>Rankings computed!</span>}
            {rankingsPublished && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>Published!</span>}
            <Button variant="secondary" size="sm" icon={<Zap size={14} />} onClick={handleComputeRankings}>
              Re-Compute
            </Button>
            <Button variant="primary" size="sm" icon={<Award size={14} />} onClick={handlePublishRankings} style={{ background: COLORS.success }}>
              Publish Leaderboard
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
              {(apiRankings.length > 0 ? apiRankings : rankings).map((row: any, i: number) => {
                const rankNum = row.rankPosition ?? row.rank;
                const isPublishedStatus = row.isPublished ? "PUBLISHED" : "DRAFT";
                return (
                <tr key={row.rank ?? i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="px-4 py-3">
                    <span style={{ fontSize: rankNum <= 3 ? 18 : 14, fontWeight: 700 }}>
                      {rankNum <= 3 ? ["🥇", "🥈", "🥉"][rankNum - 1] : `#${rankNum}`}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{row.teamId ?? row.team}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.categoryId ?? row.track}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.r1 ?? "—"}</span></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.r2 ?? "—"}</span></td>
                  <td className="px-4 py-3"><span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{row.finalScore?.toFixed(1) ?? row.total}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={apiRankings.length > 0 ? isPublishedStatus : row.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" icon={<Eye size={13} />}>{t("common.view")}</Button>
                      {!disqualifiedTeams.includes(rankNum) ? (
                        <Button variant="danger" size="sm" icon={<AlertTriangle size={12} />}
                          onClick={() => setDisqualifyTarget({ id: rankNum, name: row.teamId ?? row.team })}>
                          DQ
                        </Button>
                      ) : (
                        <span style={{ fontSize: 11, color: COLORS.error, fontWeight: 600 }}>DQ'd</span>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
