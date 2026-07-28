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
import { useEffect, useState } from "react";
import {
  fptStudentCodePrefixService,
  type FptStudentCodePrefix,
  type FptStudentCodePrefixRequest,
} from "@/features/users/api/fptStudentCodePrefixService";
import { parseApiError } from "@/lib/api/apiClient";

interface AdminViewProps {
  context: any;
}

export function AdminSettingsView({ context }: AdminViewProps) {
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
    settingsSaveError,
    settingsSaving,
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
    createEmptyAwardPattern,
    handleSaveSettings,
  } = context;

  const [prefixes, setPrefixes] = useState<FptStudentCodePrefix[]>([]);
  const [prefixLoading, setPrefixLoading] = useState(false);
  const [prefixSaving, setPrefixSaving] = useState(false);
  const [prefixError, setPrefixError] = useState("");
  const [prefixForm, setPrefixForm] = useState<FptStudentCodePrefixRequest>({
    prefix: "",
    englishName: "",
    vietnameseName: "",
    majorGroup: "",
    majorCode: "",
    note: "",
    active: true,
  });

  const loadPrefixes = () => {
    setPrefixLoading(true);
    setPrefixError("");
    fptStudentCodePrefixService.listForAdmin(true)
      .then(setPrefixes)
      .catch(err => setPrefixError(parseApiError(err).message))
      .finally(() => setPrefixLoading(false));
  };

  useEffect(() => {
    loadPrefixes();
  }, []);

  const editPrefix = (prefix: FptStudentCodePrefix) => {
    setPrefixForm({
      prefix: prefix.prefix,
      englishName: prefix.englishName,
      vietnameseName: prefix.vietnameseName,
      majorGroup: prefix.majorGroup,
      majorCode: prefix.majorCode ?? "",
      note: prefix.note ?? "",
      active: prefix.active,
    });
  };

  const savePrefix = async () => {
    setPrefixSaving(true);
    setPrefixError("");
    try {
      await fptStudentCodePrefixService.save(prefixForm);
      setPrefixForm({
        prefix: "",
        englishName: "",
        vietnameseName: "",
        majorGroup: "",
        majorCode: "",
        note: "",
        active: true,
      });
      loadPrefixes();
    } catch (err) {
      setPrefixError(parseApiError(err).message);
    } finally {
      setPrefixSaving(false);
    }
  };

  const togglePrefix = async (prefix: FptStudentCodePrefix) => {
    setPrefixError("");
    try {
      const updated = await fptStudentCodePrefixService.setActive(prefix.prefix, !prefix.active);
      setPrefixes(prev => prev.map(item => item.prefix === updated.prefix ? updated : item));
    } catch (err) {
      setPrefixError(parseApiError(err).message);
    }
  };

  return (
    <>
      <SectionHeader title={t("admin.systemSettings")} subtitle={t("admin.systemSettingsSubtitle")} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("admin.generalSettings")}</div>
          <div className="space-y-4">
            {[
              { label: t("adminForm.platformName"), key: "platformName" },
              { label: t("adminForm.maxTeamSize"), key: "maxTeamSize" },
              { label: t("adminForm.minTeamSize"), key: "minTeamSize" },
              { label: t("adminForm.submissionGracePeriod"), key: "submissionGracePeriod" },
              { label: t("adminForm.contactEmail"), key: "contactEmail" },
            ].map(field => (
              <div key={field.key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{field.label}</label>
                <input
                  value={systemSettings[field.key as keyof typeof systemSettings] as string}
                  onChange={e => setSystemSettings((p: typeof systemSettings) => ({ ...p, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
                />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 16 }}>{t("admin.featureToggles")}</div>
          <div className="space-y-3">
            {[
              { labelKey: "admin.allowLateSubmissions", key: "allowLateSubmissions" },
              { labelKey: "admin.enablePublicLeaderboard", key: "enablePublicLeaderboard" },
              { labelKey: "admin.requireEmailVerification", key: "requireEmailVerification" },
            ].map(toggle => (
              <div key={toggle.key} className="flex items-center justify-between p-3 rounded-xl" style={{ background: COLORS.bg }}>
                <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{t(toggle.labelKey)}</span>
                <div
                  className="rounded-full flex items-center cursor-pointer transition-all"
                  style={{ width: 40, height: 22, background: systemSettings[toggle.key as keyof typeof systemSettings] ? COLORS.primary : COLORS.border, padding: "2px" }}
                  onClick={() => setSystemSettings((p: typeof systemSettings) => ({ ...p, [toggle.key]: !p[toggle.key as keyof typeof systemSettings] }))}
                >
                  <div className="rounded-full bg-white" style={{ width: 18, height: 18, transform: systemSettings[toggle.key as keyof typeof systemSettings] ? "translateX(18px)" : "translateX(0)", transition: "transform 0.2s" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Button
              variant="primary"
              size="md"
              icon={settingsSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
              onClick={handleSaveSettings}
              disabled={settingsSaving}
            >
              {settingsSaving ? "Saving..." : t("common.saveSettings")}
            </Button>
            {settingsSaved && (
              <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>
                {t("common.settingsSaved")}
              </span>
            )}
            {settingsSaveError && (
              <span style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>
                {settingsSaveError}
              </span>
            )}
          </div>
        </Card>
      </div>
      <Card className="p-5 mt-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>FPT Student Code Prefixes</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
              Manage active MSSV prefixes used to validate FPT Student codes.
            </div>
          </div>
          <Button variant="outline" size="sm" icon={prefixLoading ? <Loader size={14} className="animate-spin" /> : <Database size={14} />} onClick={loadPrefixes}>
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
          <PrefixInput label="Prefix" value={prefixForm.prefix} onChange={value => setPrefixForm(prev => ({ ...prev, prefix: value.toUpperCase().slice(0, 2) }))} />
          <PrefixInput label="English Name" value={prefixForm.englishName} onChange={value => setPrefixForm(prev => ({ ...prev, englishName: value }))} />
          <PrefixInput label="Vietnamese Name" value={prefixForm.vietnameseName} onChange={value => setPrefixForm(prev => ({ ...prev, vietnameseName: value }))} />
          <PrefixInput label="Major Group" value={prefixForm.majorGroup} onChange={value => setPrefixForm(prev => ({ ...prev, majorGroup: value }))} />
          <PrefixInput label="Major Code" value={prefixForm.majorCode ?? ""} onChange={value => setPrefixForm(prev => ({ ...prev, majorCode: value }))} />
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>Active</label>
            <button
              type="button"
              className="w-full px-3 py-2 rounded-xl"
              style={{ fontSize: 13, fontWeight: 700, color: prefixForm.active ? COLORS.success : COLORS.textSecondary, border: `1px solid ${COLORS.border}`, background: COLORS.bg }}
              onClick={() => setPrefixForm(prev => ({ ...prev, active: !prev.active }))}
            >
              {prefixForm.active ? "Active" : "Inactive"}
            </button>
          </div>
          <div className="md:col-span-5">
            <PrefixInput label="Note" value={prefixForm.note ?? ""} onChange={value => setPrefixForm(prev => ({ ...prev, note: value }))} />
          </div>
          <div className="flex items-end">
            <Button variant="primary" size="md" icon={prefixSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />} disabled={prefixSaving} onClick={savePrefix}>
              {prefixSaving ? "Saving..." : "Save Prefix"}
            </Button>
          </div>
        </div>

        {prefixError && (
          <div className="mb-3 px-3 py-2 rounded-xl" style={{ color: COLORS.error, background: `${COLORS.error}10`, border: `1px solid ${COLORS.error}25`, fontSize: 13 }}>
            {prefixError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}` }}>
                {["Prefix", "English", "Major Group", "Major Code", "Status", "Actions"].map(header => (
                  <th key={header} className="text-left py-2 pr-3" style={{ fontSize: 12, fontWeight: 700 }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prefixes.map(prefix => (
                <tr key={prefix.prefix} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <td className="py-2 pr-3" style={{ fontWeight: 800, color: COLORS.textPrimary }}>{prefix.prefix}</td>
                  <td className="py-2 pr-3" style={{ color: COLORS.textPrimary }}>{prefix.englishName}</td>
                  <td className="py-2 pr-3" style={{ color: COLORS.textSecondary }}>{prefix.majorGroup}</td>
                  <td className="py-2 pr-3" style={{ color: COLORS.textSecondary }}>{prefix.majorCode || "-"}</td>
                  <td className="py-2 pr-3">
                    <StatusBadge status={prefix.active ? "active" : "suspended"} />
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" icon={<Edit size={13} />} onClick={() => editPrefix(prefix)}>Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => togglePrefix(prefix)}>
                        {prefix.active ? "Deactivate" : "Activate"}
                      </Button>
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

function PrefixInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl outline-none"
        style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
      />
    </div>
  );
}
