import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
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

export function AdminAwardsView({ context }: AdminViewProps) {
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
    manualAwardForm,
    setManualAwardForm,
    manualAwardLoading,
    manualAwardMessage,
    manualAwardError,
    setManualAwardError,
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
    handleManualGrantAward,
    handleBroadcast,
    handleSendTargetedNotification,
    handleDataExport,
    createEmptyAwardPattern
  } = context;

  const manualAwardTeams = apiTeamEligibility.filter((team: any) => (
    !manualAwardForm.categoryId || team.categoryId === manualAwardForm.categoryId
  ));

  const [selectedAward, setSelectedAward] = useState<any>(null);
  const [showAutoGrantConfirm, setShowAutoGrantConfirm] = useState(false);
  const [showManualGrantConfirm, setShowManualGrantConfirm] = useState(false);

  const onOpenAutoGrantConfirm = () => {
    if (setAutoGrantError) setAutoGrantError("");
    const limit = Number(autoGrantLimit);
    if (!awardPatternCategoryId) {
      if (setAutoGrantError) setAutoGrantError("Select a category before granting awards.");
      return;
    }
    if (!Number.isInteger(limit) || limit < 1) {
      if (setAutoGrantError) setAutoGrantError("Top N must be a positive whole number.");
      return;
    }
    setShowAutoGrantConfirm(true);
  };

  const onOpenManualGrantConfirm = () => {
    if (setManualAwardError) setManualAwardError("");
    if (!selectedEventId) {
      if (setManualAwardError) setManualAwardError("Select an event before granting a manual award.");
      return;
    }
    if (!manualAwardForm.teamId) {
      if (setManualAwardError) setManualAwardError("Select a team before granting a manual award.");
      return;
    }
    if (!manualAwardForm.awardTierId || !manualAwardForm.awardTitle.trim()) {
      if (setManualAwardError) setManualAwardError("Choose an award tier and enter an award title.");
      return;
    }

    const prizeValue = manualAwardForm.prizeValue.trim()
      ? Number(manualAwardForm.prizeValue)
      : undefined;
    if (prizeValue !== undefined && (!Number.isFinite(prizeValue) || prizeValue < 0)) {
      if (setManualAwardError) setManualAwardError("Prize value must be zero or a positive number.");
      return;
    }
    setShowManualGrantConfirm(true);
  };

  return (
    <>
      <SectionHeader
        title="Award Management"
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle size={14} />}
            onClick={() => onNavigate("award-patterns")}
          >
            Create Award Pattern
          </Button>
        }
        subtitle="Auto-grant awards from category rankings"
      />
      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
        <div className="space-y-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={17} style={{ color: COLORS.primary }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Grant for Top Ranking of Category</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                Select a category, enter Top N, then grant awards using the backend award patterns.
              </div>
            </div>
          </div>

          {autoGrantError && (
            <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 13 }}>
              {autoGrantError}
            </div>
          )}
          {autoGrantMessage && (
            <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.success}10`, color: COLORS.success, fontSize: 13 }}>
              {autoGrantMessage}
            </div>
          )}
          {eventLoadError && (
            <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 13 }}>
              Events could not be loaded from database: {eventLoadError}
            </div>
          )}
          {categoryLoadError && (
            <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 13 }}>
              Categories could not be loaded for this event: {categoryLoadError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_140px] gap-4">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</label>
              <Select value={(selectedEventId  ?? "") || "none"} onValueChange={value => setSelectedEventId((value === "none" ? "" : value) || null)} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    {apiEvents.length === 0 && <SelectItem value="none" style={{ color: COLORS.textPrimary }}>No events found</SelectItem>}
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
                {apiCategories.length === 0 && selectedEventId && <SelectItem value="none" style={{ color: COLORS.textPrimary }}>No categories found</SelectItem>}
                {apiCategories.map((category: any) => (
                  <SelectItem key={category.categoryId} value={category.categoryId} style={{ color: COLORS.textPrimary }}>{category.categoryName}</SelectItem>
                ))}
  </SelectContent>
</Select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>TOP N</label>
              <input
                type="number"
                min={1}
                max={50}
                value={autoGrantLimit}
                onChange={e => setAutoGrantLimit(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Button
              variant="primary"
              size="lg"
              icon={autoGrantLoading ? <Loader size={15} className="animate-spin" /> : <Trophy size={15} />}
              onClick={onOpenAutoGrantConfirm}
              disabled={autoGrantLoading || !awardPatternCategoryId}
            >
              {autoGrantLoading ? "Granting..." : "Grant for Top Ranking of Category"}
            </Button>
          </div>

          {autoGrantPreview.length > 0 && (
            <div className="mt-6">
              <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, marginBottom: 10 }}>Top Ranking Used</div>
              <div className="space-y-2">
                {autoGrantPreview.map((candidate: any) => (
                  <div key={candidate.teamId} className="flex items-center justify-between p-3 rounded-xl" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: `${COLORS.primary}12`, color: COLORS.primary, fontWeight: 700, fontSize: 12 }}>
                        #{candidate.rankPosition}
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>{candidate.teamName}</div>
                        <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{candidate.teamId}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 600 }}>{candidate.totalScore.toFixed(1)} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={17} style={{ color: COLORS.warning }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Manual Special Award</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                Grant a non-ranking award such as Best Innovation, Best Presentation, or Sponsor Award.
              </div>
            </div>
          </div>

          {manualAwardError && (
            <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 13 }}>
              {manualAwardError}
            </div>
          )}
          {manualAwardMessage && (
            <div className="px-4 py-3 rounded-xl mb-4" style={{ background: `${COLORS.success}10`, color: COLORS.success, fontSize: 13 }}>
              {manualAwardMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</label>
              <Select value={(selectedEventId  ?? "") || "none"} onValueChange={value => setSelectedEventId((value === "none" ? "" : value) || null)} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="none" style={{ color: COLORS.textPrimary }}>Select an Event</SelectItem>
                {apiEvents.length === 0 && <SelectItem value="none" style={{ color: COLORS.textPrimary }}>No events found</SelectItem>}
                {apiEvents.map((event: any) => (
                  <SelectItem key={event.id} value={event.id} style={{ color: COLORS.textPrimary }}>{event.name}</SelectItem>
                ))}
  </SelectContent>
</Select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</label>
              <Select value={manualAwardForm.categoryId || "none"} onValueChange={value => setManualAwardForm((prev: any) => ({ ...prev, categoryId: (value === "none" ? "" : value), teamId: "" }))} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="none" style={{ color: COLORS.textPrimary }}>Any category</SelectItem>
                {apiCategories.map((category: any) => (
                  <SelectItem key={category.categoryId} value={category.categoryId} style={{ color: COLORS.textPrimary }}>{category.categoryName}</SelectItem>
                ))}
  </SelectContent>
</Select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>TEAM</label>
              <Select value={manualAwardForm.teamId || "none"} onValueChange={value => setManualAwardForm((prev: any) => ({ ...prev, teamId: (value === "none" ? "" : value) }))} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="none" style={{ color: COLORS.textPrimary }}>Select team</SelectItem>
                {manualAwardTeams.length === 0 && selectedEventId && <SelectItem value="none" style={{ color: COLORS.textPrimary }}>No teams found</SelectItem>}
                {manualAwardTeams.map((team: any) => (
                  <SelectItem key={team.teamId} value={team.teamId} style={{ color: COLORS.textPrimary }}>{team.teamName}</SelectItem>
                ))}
  </SelectContent>
</Select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>AWARD TIER</label>
              <Select value={manualAwardForm.awardTierId || "none"} onValueChange={value => setManualAwardForm((prev: any) => ({ ...prev, awardTierId: (value === "none" ? "" : value) }))} >
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
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>AWARD TITLE</label>
              <input
                value={manualAwardForm.awardTitle}
                onChange={e => setManualAwardForm((prev: any) => ({ ...prev, awardTitle: e.target.value }))}
                placeholder="Best Innovation"
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>PRIZE VALUE</label>
              <input
                type="number"
                min={0}
                value={manualAwardForm.prizeValue}
                onChange={e => setManualAwardForm((prev: any) => ({ ...prev, prizeValue: e.target.value }))}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CURRENCY</label>
              <input
                value={manualAwardForm.prizeCurrency}
                onChange={e => setManualAwardForm((prev: any) => ({ ...prev, prizeCurrency: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
            <div className="lg:col-span-2">
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>DESCRIPTION</label>
              <textarea
                value={manualAwardForm.description}
                onChange={e => setManualAwardForm((prev: any) => ({ ...prev, description: e.target.value }))}
                placeholder="Why this team receives the award"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl outline-none resize-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Button
              variant="primary"
              size="lg"
              icon={manualAwardLoading ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
              onClick={onOpenManualGrantConfirm}
              disabled={manualAwardLoading || !selectedEventId || !manualAwardForm.teamId}
              style={{ background: COLORS.warning }}
            >
              {manualAwardLoading ? "Granting..." : "Grant Manual Award"}
            </Button>
          </div>
        </Card>
        </div>

        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>Granted Awards</div>
          {apiAwards.length === 0 && (
            <div className="p-4 rounded-xl" style={{ background: COLORS.bg, color: COLORS.textSecondary, fontSize: 13 }}>
              No awards have been granted for this event yet.
            </div>
          )}
          {apiAwards.map((award: any) => (
            <div
              key={award.id}
              className="flex items-center gap-3 mb-3 p-3 rounded-xl cursor-pointer"
              style={{ background: COLORS.bg, transition: "border 0.15s", border: "1px solid transparent" }}
              onClick={() => setSelectedAward(award)}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${COLORS.primary}40`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = "1px solid transparent"; }}
            >
              <span className="inline-flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, background: `${COLORS.primary}12`, color: COLORS.primary }}>
                <Award size={18} />
              </span>
              <div className="flex-1">
                <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>{award.teamName}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{award.eventName} - {award.categoryName}</div>
              </div>
              <div className="text-right">
                <div style={{ fontSize: 11, color: COLORS.textPrimary, fontWeight: 700 }}>{award.awardTierName}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{award.awardTitle}</div>
              </div>

            </div>
          ))}
        </Card>
      </div>

      {/* Award Detail Modal */}
      {selectedAward && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedAward(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 relative"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(32px) saturate(180%)",
              border: "1px solid var(--glass-border)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.25), 0 4px 16px rgba(244,121,32,0.12)",
              animation: "awardDetailIn 0.22s ease",
            }}
            onClick={e => e.stopPropagation()}
          >
            <style>{`@keyframes awardDetailIn { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center rounded-xl" style={{ width: 46, height: 46, background: `${COLORS.primary}14`, color: COLORS.primary }}>
                  <Trophy size={22} />
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, color: "var(--text-primary)", lineHeight: 1.2 }}>
                    {selectedAward.awardTitle || selectedAward.awardTierName}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{selectedAward.awardTierName}</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedAward(null)}
                className="rounded-xl p-1.5 transition-opacity hover:opacity-70"
                style={{ background: COLORS.bg, color: COLORS.textSecondary, border: `1px solid ${COLORS.border}` }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: "Team", value: selectedAward.teamName },
                { label: "Event", value: selectedAward.eventName },
                { label: "Category", value: selectedAward.categoryName },
                { label: "Rank", value: selectedAward.rankPosition ? `#${selectedAward.rankPosition}` : "—" },
                { label: "Prize", value: selectedAward.prizeValue ? `${selectedAward.prizeValue} ${selectedAward.prizeCurrency ?? ""}`.trim() : "—" },
                {
                  label: "Granted At",
                  value: selectedAward.awardedAt
                    ? new Date(selectedAward.awardedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                    : "—",
                },
              ] as { label: string; value: string }[]).map(item => (
                <div key={item.label} className="rounded-xl p-3" style={{ background: COLORS.bg }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", marginBottom: 3 }}>
                    {item.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{item.value || "—"}</div>
                </div>
              ))}
            </div>

            {selectedAward.description && (
              <div className="mt-3 rounded-xl p-3" style={{ background: COLORS.bg }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: "0.08em", marginBottom: 3 }}>
                  DESCRIPTION
                </div>
                <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.6 }}>{selectedAward.description}</div>
              </div>
            )}

            <button
              onClick={() => setSelectedAward(null)}
              className="mt-5 w-full rounded-xl py-2.5 font-semibold text-sm transition-opacity hover:opacity-80"
              style={{ background: `linear-gradient(135deg, ${COLORS.primary}, #FF9040)`, color: "white" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Modal Confirm Auto Grant */}
      {showAutoGrantConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-amber-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Confirm Auto Grant Award</h3>
                  <p className="text-xs text-gray-500">Auto-grant awards from category rankings</p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoGrantConfirm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-xl text-amber-900 text-xs leading-relaxed flex gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-950 mb-1">Current Award Configuration</p>
                  <p>The system will automatically grant awards to the top ranking teams based on the official leaderboard and active Award Patterns.</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-2.5 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</span>
                  <span className="font-medium text-gray-900">{apiEvents.find((e: any) => e.id === selectedEventId)?.name || "Not selected"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</span>
                  <span className="font-medium text-amber-700">{apiCategories.find((c: any) => c.categoryId === awardPatternCategoryId)?.categoryName || "Not selected"}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ranking Limit (Top N)</span>
                  <span className="font-bold text-gray-900 bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs">Top {autoGrantLimit}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowAutoGrantConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<Trophy size={15} />}
                onClick={() => {
                  setShowAutoGrantConfirm(false);
                  handleAutoGrantAwards();
                }}
                disabled={autoGrantLoading}
              >
                Confirm & Grant Auto
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Manual Grant */}
      {showManualGrantConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-orange-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Confirm Custom Award (Manual Grant)</h3>
                  <p className="text-xs text-gray-500">Grant a non-ranking award to a team</p>
                </div>
              </div>
              <button
                onClick={() => setShowManualGrantConfirm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-orange-50/60 border border-orange-200/60 rounded-xl text-orange-900 text-xs leading-relaxed flex gap-3">
                <AlertTriangle size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-950 mb-1">Current Award Configuration</p>
                  <p>Please carefully verify the selected award details and the winning team before granting the award.</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-2.5 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</span>
                  <span className="font-medium text-gray-900">{apiEvents.find((e: any) => e.id === selectedEventId)?.name || "Not selected"}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</span>
                  <span className="font-medium text-gray-900">
                    {apiCategories.find((c: any) => c.categoryId === manualAwardForm.categoryId)?.categoryName || "All Categories"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Awardee Team</span>
                  <span className="font-bold text-orange-600">
                    {manualAwardTeams.find((t: any) => t.teamId === manualAwardForm.teamId)?.teamName || manualAwardForm.teamId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Award Tier</span>
                  <span className="font-semibold text-gray-800">
                    {AWARD_TIER_OPTIONS.find((t: any) => t.value === manualAwardForm.awardTierId)?.label || manualAwardForm.awardTierId}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Award Title</span>
                  <span className="font-bold text-gray-900">{manualAwardForm.awardTitle}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-gray-200/50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prize Value</span>
                  <span className="font-bold text-green-600">
                    {manualAwardForm.prizeValue ? `${Number(manualAwardForm.prizeValue).toLocaleString()} ${manualAwardForm.prizeCurrency}` : "0 VND"}
                  </span>
                </div>
                {manualAwardForm.description && (
                  <div className="pt-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description / Reason</span>
                    <span className="text-xs text-gray-700 italic block bg-white p-2 rounded border border-gray-200/60">
                      "{manualAwardForm.description}"
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowManualGrantConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<Send size={15} />}
                onClick={() => {
                  setShowManualGrantConfirm(false);
                  handleManualGrantAward();
                }}
                disabled={manualAwardLoading}
                style={{ background: COLORS.warning }}
              >
                Confirm & Grant Manual
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
