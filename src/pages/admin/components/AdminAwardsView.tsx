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
              <select
                value={selectedEventId ?? ""}
                onChange={e => setSelectedEventId(e.target.value || null)}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              >
                {apiEvents.length === 0 && <option value="">No events found</option>}
                {apiEvents.map((event: any) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</label>
              <select
                value={awardPatternCategoryId}
                onChange={e => setAwardPatternCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              >
                <option value="">Select category</option>
                {apiCategories.length === 0 && selectedEventId && <option value="" disabled>No categories found</option>}
                {apiCategories.map((category: any) => (
                  <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                ))}
              </select>
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
              onClick={handleAutoGrantAwards}
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
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</label>
              <select
                value={manualAwardForm.categoryId}
                onChange={e => setManualAwardForm((prev: any) => ({ ...prev, categoryId: e.target.value, teamId: "" }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              >
                <option value="">Any category</option>
                {apiCategories.map((category: any) => (
                  <option key={category.categoryId} value={category.categoryId}>{category.categoryName}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>TEAM</label>
              <select
                value={manualAwardForm.teamId}
                onChange={e => setManualAwardForm((prev: any) => ({ ...prev, teamId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              >
                <option value="">Select team</option>
                {manualAwardTeams.length === 0 && selectedEventId && <option value="" disabled>No teams found</option>}
                {manualAwardTeams.map((team: any) => (
                  <option key={team.teamId} value={team.teamId}>{team.teamName}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>AWARD TIER</label>
              <select
                value={manualAwardForm.awardTierId}
                onChange={e => setManualAwardForm((prev: any) => ({ ...prev, awardTierId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
              >
                {AWARD_TIER_OPTIONS.map((tier: any) => (
                  <option key={tier.value} value={tier.value}>{tier.label}</option>
                ))}
              </select>
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
              onClick={handleManualGrantAward}
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
            <div key={award.id} className="flex items-center gap-3 mb-3 p-3 rounded-xl" style={{ background: COLORS.bg }}>
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
    </>
  );
}
