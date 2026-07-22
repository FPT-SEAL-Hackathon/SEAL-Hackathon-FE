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
import { EventResponse } from "@/features/events/api/eventService.ts"

interface AdminViewProps {
  context: any;
  onViewEvent: (event: EventResponse) => void;
}

export function AdminEventsView({ context, onViewEvent }: AdminViewProps) {
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
        title="Event Management"
        subtitle="Create and manage hackathon events"
        action={<Button variant="primary" size="sm" icon={<PlusCircle size={14} />} onClick={() => setEventModal({ open: true })}>New Event</Button>}
      />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {apiEvents.map((ev: any) => {
          const visibleTeamCount = ev.visibleTeamCount ?? ev.teams ?? 0;
          const status = (ev.status || "UNKNOWN").toLowerCase();

          return (
            <Card
              key={ev.id || ev.eventId}
              className="overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md"
              style={{ display: 'flex', flexDirection: 'column', boxShadow: "none", border: `1px solid ${COLORS.border}` }}
              onClick={() => onViewEvent(ev)}
            >
              {/* Banner section */}
              <div className="relative h-32 w-full" style={{ background: `${COLORS.primary}15` }}>
                {ev.bannerImageUrl ? (
                  <img src={ev.bannerImageUrl} alt={ev.name || ev.eventName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Calendar size={32} style={{ color: COLORS.primary, opacity: 0.5 }} />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <StatusBadge status={status} />
                  <div onClick={e => e.stopPropagation()}>
                    <button 
                      className="p-1.5 rounded bg-white/90 hover:bg-white text-gray-700 shadow-sm transition-all"
                      title="Edit Event"
                      onClick={() => setEventModal({ open: true, edit: ev })}
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-3 flex-1">
                  <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary, marginBottom: 4 }} className="line-clamp-1">{ev.name || ev.eventName}</div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary }} className="line-clamp-2">{ev.description || "No description available."}</div>
                </div>
                
                <div className="flex flex-col gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} style={{ color: COLORS.textSecondary }} />
                    <span style={{ fontSize: 13, color: COLORS.textPrimary, fontWeight: 500 }}>
                      {ev.eventStartDate ? new Date(ev.eventStartDate).toLocaleDateString() : "TBA"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} style={{ color: COLORS.textSecondary }} />
                    <span style={{ fontSize: 13, color: COLORS.textPrimary, fontWeight: 500 }}>
                      {visibleTeamCount} Teams • {ev.roundCount ?? ev.rounds ?? 0} Rounds
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-between items-center" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.primary }} className="flex items-center gap-1 group-hover:gap-2 transition-all">
                    Manage Event <Eye size={14} />
                  </span>
                  
                  {status === "upcoming" && (
                    <div onClick={e => e.stopPropagation()}>
                       <Button variant="ghost" size="sm" icon={<Trash2 size={13} style={{color: COLORS.error}} />} onClick={() => {
                         // implement delete later or call existing handler
                       }}></Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

