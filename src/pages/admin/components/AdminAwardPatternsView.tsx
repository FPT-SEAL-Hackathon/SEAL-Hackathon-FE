import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function AdminAwardPatternsView({ context }: AdminViewProps) {
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
        title="Create Award Pattern"
        subtitle="Configure award title, tier, description, and prize by rank for a category"
        action={
          <Button variant="outline" size="sm" icon={<Award size={14} />} onClick={() => onNavigate("awards")}>
            Back to Awards
          </Button>
        }
      />

      <Card className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</label>
            <Select value={(selectedEventId  ?? "") || "none"} onValueChange={value => setSelectedEventId((value === "none" ? "" : value) || null)} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    {apiEvents.map((event: any) => (
                <SelectItem key={event.id} value={event.id} style={{ color: COLORS.textPrimary }}>{event.name}</SelectItem>
              ))}
  </SelectContent>
</Select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</label>
            <Select value={awardPatternCategoryId || "none"} onValueChange={value => setAwardPatternCategoryId((value === "none" ? "" : value))} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="none" style={{ color: COLORS.textPrimary }}>Select category</SelectItem>
              {apiCategories.map((category: any) => (
                <SelectItem key={category.categoryId} value={category.categoryId} style={{ color: COLORS.textPrimary }}>{category.categoryName}</SelectItem>
              ))}
  </SelectContent>
</Select>
          </div>
        </div>

        {awardPatternError && (
          <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 13 }}>
            {awardPatternError}
          </div>
        )}
        {awardPatternMessage && (
          <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.success}10`, color: COLORS.success, fontSize: 13 }}>
            {awardPatternMessage}
          </div>
        )}

        <div className="space-y-3">
          {awardPatterns.map((pattern: any, index: number) => (
            <div key={index} className="grid grid-cols-1 xl:grid-cols-[80px_1.2fr_1.4fr_1fr_120px_44px] gap-3 items-end p-4 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>RANK</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={pattern.rankPosition}
                  onChange={e => updateAwardPattern(index, "rankPosition", Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>TIER</label>
                <Select value={pattern.awardTierId || "none"} onValueChange={value => updateAwardPattern(index, "awardTierId", (value === "none" ? "" : value))} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    {AWARD_TIER_OPTIONS.map((tier: any) => (
                    <SelectItem key={tier.value} value={tier.value} style={{ color: COLORS.textPrimary }}>{tier.label}</SelectItem>
                  ))}
  </SelectContent>
</Select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>TITLE</label>
                <input
                  value={pattern.awardTitle}
                  onChange={e => updateAwardPattern(index, "awardTitle", e.target.value)}
                  placeholder="Champion"
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>PRIZE</label>
                <input
                  type="number"
                  value={pattern.prizeValue}
                  onChange={e => updateAwardPattern(index, "prizeValue", e.target.value)}
                  placeholder="10000000"
                  className="w-full px-3 py-2.5 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CURRENCY</label>
                <Select value={pattern.prizeCurrency || "none"} onValueChange={value => updateAwardPattern(index, "prizeCurrency", (value === "none" ? "" : value))} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="VND" style={{ color: COLORS.textPrimary }}>VND</SelectItem>
                  <SelectItem value="USD" style={{ color: COLORS.textPrimary }}>USD</SelectItem>
  </SelectContent>
</Select>
              </div>
              <button
                type="button"
                onClick={() => removeAwardPattern(index)}
                className="h-11 rounded-xl flex items-center justify-center"
                style={{ border: `1px solid ${COLORS.border}`, color: COLORS.error, background: COLORS.bg }}
                aria-label="Remove award pattern"
              >
                <X size={16} />
              </button>
              <div className="xl:col-span-6">
                <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>DESCRIPTION</label>
                <textarea
                  value={pattern.description}
                  onChange={e => updateAwardPattern(index, "description", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-5">
          <Button variant="outline" size="sm" icon={<PlusCircle size={14} />} onClick={addAwardPattern}>
            Add Rank
          </Button>
          <Button variant="primary" size="md" icon={<Save size={14} />} onClick={handleSaveAwardPatterns} disabled={awardPatternLoading || !awardPatternCategoryId}>
            {awardPatternLoading ? "Saving..." : "Save Award Pattern"}
          </Button>
        </div>
      </Card>
    </>
  );
}
