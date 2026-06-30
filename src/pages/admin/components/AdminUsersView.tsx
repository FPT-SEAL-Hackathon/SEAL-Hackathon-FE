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

export function AdminUsersView({ context }: AdminViewProps) {
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
        title={t("admin.userManagement")}
        subtitle={`${users.length} users registered`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<UserCheck size={14} />} onClick={() => setShowGuestJudgeForm(v => !v)}>
              Guest Judge
            </Button>
            <Button variant="primary" size="sm" icon={<PlusCircle size={14} />}>{t("common.addUser")}</Button>
          </div>
        }
      />
      {showGuestJudgeForm && (
        <Card className="p-5 mb-4">
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, marginBottom: 12 }}>
            Create Guest Judge Account <span style={{ fontSize: 12, color: COLORS.textSecondary }}>— POST /admin/users/guest-judge</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {[
              { label: "Full Name", key: "fullName", placeholder: "Dr. Nguyen Van A" },
              { label: "Email", key: "email", placeholder: "judge@company.com" },
              { label: "Company / Institution", key: "company", placeholder: "Google, FPT Corp, ..." },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{field.label.toUpperCase()}</label>
                <input
                  value={guestJudgeForm[field.key as keyof typeof guestJudgeForm]}
                  onChange={e => setGuestJudgeForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" icon={<CheckCircle size={13} />} onClick={handleGuestJudgeSubmit}
              disabled={!guestJudgeForm.fullName || !guestJudgeForm.email || !guestJudgeForm.company}>
              Create Guest Judge
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowGuestJudgeForm(false)}>Cancel</Button>
            {guestJudgeSuccess && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>Guest judge created!</span>}
          </div>
        </Card>
      )}
      {disqualifyTarget && (
        <Card className="p-5 mb-4" style={{ border: `1.5px solid ${COLORS.error}30` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.error, marginBottom: 12 }}>
            Disqualify Team: {disqualifyTarget.name} <span style={{ fontSize: 12, color: COLORS.textSecondary }}>— POST /admin/teams/{"{id}"}/disqualify</span>
          </div>
          <textarea
            value={disqualifyReason}
            onChange={e => setDisqualifyReason(e.target.value)}
            placeholder="State reason for disqualification (e.g. Violation of code plagiarism rules.)"
            rows={3}
            className="w-full px-3 py-2 rounded-xl outline-none resize-none mb-3"
            style={{ fontSize: 13, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
          />
          <div className="flex gap-2">
            <Button variant="danger" size="sm" icon={<AlertTriangle size={13} />} onClick={handleDisqualify} disabled={!disqualifyReason}>
              Confirm Disqualify
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDisqualifyTarget(null)}>Cancel</Button>
          </div>
        </Card>
      )}
      <Card className="p-4 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
          <input
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            placeholder={t("users.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-2 rounded-xl outline-none"
            style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
          />
        </div>
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {[t("users.user"), t("users.role"), t("users.team"), t("users.status"), t("users.joined"), t("users.actions")].map(h => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, i) => (
                <tr key={user.id} style={{ borderBottom: i < filteredUsers.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                  <td className="px-4 py-3">
                    <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: `${roleColors[user.role] || COLORS.primary}15`, color: roleColors[user.role] || COLORS.primary }}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{user.team}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                  <td className="px-4 py-3"><span style={{ fontSize: 12, color: COLORS.textSecondary }}>{user.joined}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <Button variant="ghost" size="sm" icon={<Edit size={12} />}>{t("common.edit")}</Button>
                      {user.status === "pending" && !approvedUsers.includes(user.id) && (
                        <Button variant="primary" size="sm" icon={<CheckCircle size={12} />} onClick={() => handleApproveUser(user.id)}>
                          {t("common.approve")}
                        </Button>
                      )}
                      {approvedUsers.includes(user.id) && (
                        <span style={{ fontSize: 12, color: COLORS.success, fontWeight: 600 }}>Approved</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
