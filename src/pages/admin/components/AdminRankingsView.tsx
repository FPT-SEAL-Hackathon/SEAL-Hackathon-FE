import { useState, useEffect } from "react";
import { rankingService } from "@/features/rankings/api/rankingService";
import { categoryService, type CategoryResponse } from "@/features/categories/api/categoryService";
import { roundService, type RoundResponse } from "@/features/judging/api/roundService";
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
import { AdminJudgingApprovalView } from "./AdminJudgingApprovalView";

interface AdminViewProps {
  context: any;
}

export function AdminRankingsView({ context }: AdminViewProps) {
  const [localCategoryId, setLocalCategoryId] = useState<string>("");
  const [localRoundId, setLocalRoundId] = useState<string>("");
  const [localCategories, setLocalCategories] = useState<CategoryResponse[]>([]);
  const [localRounds, setLocalRounds] = useState<RoundResponse[]>([]);
  const [eventSearchText, setEventSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<"round" | "event" | "approval">("approval");
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localRankings, setLocalRankings] = useState<any[]>([]);


  // Fetch categories when event changes
  useEffect(() => {
    if (!context.selectedEventId) {
      setLocalCategories([]);
      setLocalCategoryId("");
      setEventSearchText("");
      return;
    }
    const evt = context.apiEvents.find((e: any) => (e.eventId || e.id) === context.selectedEventId);
    if (evt) setEventSearchText(evt.eventName || evt.name);

    categoryService.getByEvent(context.selectedEventId).then(data => {
      setLocalCategories(data);
      if (data.length > 0) setLocalCategoryId(data[0].categoryId);
    }).catch(() => setLocalCategories([]));
  }, [context.selectedEventId, context.apiEvents]);

  // Fetch rounds when category changes
  useEffect(() => {
    if (!localCategoryId) {
      setLocalRounds([]);
      setLocalRoundId("");
      return;
    }
    roundService.getByCategory(localCategoryId).then(data => {
      setLocalRounds(data);
      if (data.length > 0) setLocalRoundId(data[0].roundId);
    }).catch(() => setLocalRounds([]));
  }, [localCategoryId]);

  // Fetch existing rankings when filters change
  useEffect(() => {
    if (!context.selectedEventId) {
      setLocalRankings([]);
      return;
    }
    const fetchExisting = async () => {
      try {
        if (activeTab === "round") {
          if (localRoundId && localCategoryId) {
            const data = await rankingService.getRoundRankings(localRoundId, localCategoryId);
            setLocalRankings(data);
          } else {
            setLocalRankings([]);
          }
        } else if (activeTab === "event") {
          const data = await rankingService.getEventRankings(context.selectedEventId);
          setLocalRankings(data);
        }
      } catch (e) {
        console.error("Failed to fetch existing rankings", e);
        setLocalRankings([]);
      }
    };
    fetchExisting();
  }, [activeTab, context.selectedEventId, localCategoryId, localRoundId]);

  const doCompute = async () => {
    if (!context.selectedEventId) return;
    setIsLoading(true);
    try {
      if (activeTab === "round" && localRoundId && localCategoryId) {
        const data = await rankingService.computeRound(localRoundId, localCategoryId);
        setLocalRankings(data);
      } else if (activeTab === "event") {
        const data = await rankingService.computeEvent(context.selectedEventId);
        setLocalRankings(data);
      }
      context.setRankingsComputed(true);
      setTimeout(() => context.setRankingsComputed(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const doPublish = async () => {
    if (!context.selectedEventId) return;
    setIsLoading(true);
    try {
      if (activeTab === "round" && localRoundId && localCategoryId) {
        await rankingService.publishRound(localRoundId, localCategoryId);
        const roundData = await rankingService.getRoundRankings(localRoundId, localCategoryId);
        setLocalRankings(roundData);
      } else if (activeTab === "event") {
        await rankingService.publishEvent(context.selectedEventId, context.awardPatternCategoryId ?? "");
        const eventData = await rankingService.getEventRankings(context.selectedEventId);
        setLocalRankings(eventData);
      }
      context.setRankingsPublished(true);
      setTimeout(() => context.setRankingsPublished(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
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

  const renderTable = (rankingsData: any[]) => (
    <table className="w-full" style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: COLORS.bg }}>
          {[
            t("adminRankings.rank"),
            t("adminRankings.team"),
            t("adminRankings.track"),
            t("adminRankings.total"),
            ...(activeTab === "round" ? ["ADVANCEMENT"] : []),
            t("adminRankings.status")
          ].map(h => (
            <th key={h} className="text-left px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>{h.toUpperCase()}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rankingsData.length === 0 && (
          <tr>
            <td colSpan={activeTab === "round" ? 6 : 5} className="px-4 py-8 text-center text-gray-500" style={{ fontSize: 14 }}>
              No rankings data available. Click Compute to generate rankings.
            </td>
          </tr>
        )}
        {rankingsData.map((row: any, i: number) => {
          const rankNum = row.rankPosition ?? row.rank;
          const isPublishedStatus = row.isPublished ? "approved" : "draft";
          return (
            <tr key={row.rank ?? i} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              <td className="px-4 py-3">
                <span style={{ fontSize: rankNum <= 3 ? 18 : 14, fontWeight: 700 }}>
                  {rankNum <= 3 ? ["🥇", "🥈", "🥉"][rankNum - 1] : `#${rankNum}`}
                </span>
              </td>
              <td className="px-4 py-3"><span style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{row.teamName ?? row.teamId ?? row.team}</span></td>
              <td className="px-4 py-3"><span style={{ fontSize: 13, color: COLORS.textSecondary }}>{row.categoryName ?? row.categoryId ?? row.track}</span></td>
              <td className="px-4 py-3"><span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{row.finalScore?.toFixed(1) ?? row.totalScore}</span></td>
              {activeTab === "round" && (
                <td className="px-4 py-3">
                  {row.isAdvanced === true && <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.success, backgroundColor: "rgba(0,148,68,0.1)", padding: "2px 8px", borderRadius: 12 }}>Advanced</span>}
                  {row.isAdvanced === false && <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.error, backgroundColor: "rgba(229,62,46,0.1)", padding: "2px 8px", borderRadius: 12 }}>Eliminated</span>}
                  {row.isAdvanced == null && <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>—</span>}
                </td>
              )}
              <td className="px-4 py-3"><StatusBadge status={isPublishedStatus} /></td>
            </tr>
          )
        })}
      </tbody>
    </table>
  );

  return (
    <>
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("approval")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "approval" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          style={activeTab === "approval" ? { borderColor: COLORS.primary, color: COLORS.primary } : {}}
        >
          Judging Approval
        </button>
        <button
          onClick={() => setActiveTab("round")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "round" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          style={activeTab === "round" ? { borderColor: COLORS.primary, color: COLORS.primary } : {}}
        >
          Round Rankings
        </button>
        <button
          onClick={() => setActiveTab("event")}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === "event" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          style={activeTab === "event" ? { borderColor: COLORS.primary, color: COLORS.primary } : {}}
        >
          Event Leaderboard
        </button>
      </div>

      <SectionHeader
        title={activeTab === "round" ? "Round Rankings" : activeTab === "event" ? "Event Leaderboard" : "Judging Approval"}
        subtitle={activeTab === "round" ? "Compute and publish scores for a specific Round" : activeTab === "event" ? "Compute and publish the final Event Leaderboard" : "Approve judging scores before computing rankings"}
        action={
          activeTab !== "approval" && (
            <div className="flex items-center gap-2">
              {context.rankingsComputed && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>Rankings computed!</span>}
              {context.rankingsPublished && <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>Approved!</span>}
              <Button variant="secondary" size="sm" icon={isLoading ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />} onClick={doCompute} disabled={isLoading || !context.selectedEventId || (activeTab === "round" && (!localRoundId || !localCategoryId))}>
                {activeTab === "round"
                  ? (localRankings.length > 0 ? "Re-compute Round" : "Compute Round")
                  : (localRankings.length > 0 ? "Re-compute Event" : "Compute Event")}
              </Button>
              <Button variant="primary" size="sm" icon={isLoading ? <Loader size={14} className="animate-spin" /> : <Award size={14} />} onClick={doPublish} style={{ background: COLORS.success }} disabled={isLoading || !context.selectedEventId || (activeTab === "round" && (!localRoundId || !localCategoryId))}>
                {activeTab === "round" ? "Approve Round" : "Approve Event"}
              </Button>
            </div>
          )
        }
      />

      <Card className="mb-6" style={{ overflow: "visible", position: "relative", zIndex: 10 }}>
        <div className="p-4 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Event..."
                value={eventSearchText}
                onChange={e => {
                  setEventSearchText(e.target.value);
                  setShowEventDropdown(true);
                  if (e.target.value === "") context.setSelectedEventId("");
                }}
                onFocus={() => setShowEventDropdown(true)}
                onBlur={() => setTimeout(() => setShowEventDropdown(false), 200)}
                className="w-full px-3 py-2 pl-9 rounded-xl outline-none"
                style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg }}
              />
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            {showEventDropdown && (
              <div
                className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto"
                style={{ borderColor: COLORS.border }}
              >
                {context.apiEvents
                  .filter((evt: any) => (evt.eventName || evt.name).toLowerCase().includes(eventSearchText.toLowerCase()))
                  .map((evt: any) => (
                    <div
                      key={evt.eventId || evt.id}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-50"
                      style={{ fontSize: 14 }}
                      onClick={() => {
                        context.setSelectedEventId(evt.eventId || evt.id);
                        setEventSearchText(evt.eventName || evt.name);
                        setShowEventDropdown(false);
                      }}
                    >
                      {evt.eventName || evt.name}
                    </div>
                  ))}
                {context.apiEvents.filter((evt: any) => (evt.eventName || evt.name).toLowerCase().includes(eventSearchText.toLowerCase())).length === 0 && (
                  <div className="px-4 py-2 text-gray-500" style={{ fontSize: 14 }}>No events found</div>
                )}
              </div>
            )}
          </div>
          {(activeTab === "round" || activeTab === "approval") && (
            <>
              <div className="flex-1 min-w-[200px]">
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</label>
                <select
                  value={localCategoryId}
                  onChange={e => setLocalCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg }}
                  disabled={!context.selectedEventId || localCategories.length === 0}
                >
                  <option value="">{localCategories.length === 0 ? "No categories" : "Select Category..."}</option>
                  {localCategories.map(cat => (
                    <option key={cat.categoryId} value={cat.categoryId}>{cat.categoryName}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>ROUND</label>
                <select
                  value={localRoundId}
                  onChange={e => setLocalRoundId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg }}
                  disabled={!localCategoryId || localRounds.length === 0}
                >
                  <option value="">{localRounds.length === 0 ? "All Rounds / No rounds" : "Select Round..."}</option>
                  {localRounds.map(rnd => (
                    <option key={rnd.roundId} value={rnd.roundId}>Round {rnd.roundOrder}: {rnd.roundName}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </Card>



      {activeTab === "approval" ? (
        <AdminJudgingApprovalView context={context} localCategoryId={localCategoryId} localRoundId={localRoundId} />
      ) : activeTab === "event" && localRankings.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(
            localRankings.reduce((acc: any, curr: any) => {
              const catId = curr.categoryId ?? curr.track;
              if (!acc[catId]) acc[catId] = [];
              acc[catId].push(curr);
              return acc;
            }, {})
          ).map(([catId, catRankings]: [string, any]) => {
            const categoryName = catRankings[0]?.categoryName || context.apiCategories?.find((c: any) => c.categoryId === catId)?.categoryName || catId;
            return (
              <Card key={catId}>
                <div className="px-4 py-3 border-b border-gray-100" style={{ backgroundColor: COLORS.bg }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>Category: {categoryName}</h3>
                </div>
                <div className="overflow-x-auto">
                  {renderTable(catRankings)}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            {renderTable(localRankings)}
          </div>
        </Card>
      )}

    </>
  );
}
