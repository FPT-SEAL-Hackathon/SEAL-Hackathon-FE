import { useState, useEffect, useCallback } from "react";
import {
  Users, Upload, Star, CheckCircle, Download, RefreshCw, AlertCircle,
} from "lucide-react";
import {
  StatCard, Card, SectionHeader, COLORS,
  ProgressBar, Button,
} from "@/components/shared/UIComponents";
import { eventParticipantService } from "@/features/eventParticipants/api/eventParticipantService";
import { submissionService } from "@/features/submissions/api/submissionService";
import { rankingService } from "@/features/rankings/api/rankingService";
import { categoryService } from "@/features/categories/api/categoryService";

interface AdminViewProps {
  context: any;
}

interface ReportStats {
  totalParticipants: number;
  approvedParticipants: number;
  totalSubmissions: number;
  avgScore: number | null;
  completionRate: number | null;
}

interface CategoryDistribution {
  categoryId: string;
  categoryName: string;
  teamCount: number;
  color: string;
}

const CATEGORY_COLORS = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.accent, COLORS.warning, COLORS.error];

export function AdminReportsView({ context }: AdminViewProps) {
  const {
    t,
    selectedEventId,
    setSelectedEventId,
    apiEvents,
    apiCategories,
    apiRankings,
    apiTeamEligibility,
    adminSubmissions,
    handleDataExport,
    dataExportLoading,
    dataExportDone,
    dataExportError,
  } = context;

  const [stats, setStats] = useState<ReportStats>({
    totalParticipants: 0,
    approvedParticipants: 0,
    totalSubmissions: 0,
    avgScore: null,
    completionRate: null,
  });
  const [categoryDist, setCategoryDist] = useState<CategoryDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReportData = useCallback(async () => {
    if (!selectedEventId) {
      setStats({ totalParticipants: 0, approvedParticipants: 0, totalSubmissions: 0, avgScore: null, completionRate: null });
      setCategoryDist([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Participants
      const participantsPage = await eventParticipantService.getOrganizerParticipants({
        eventId: selectedEventId,
        size: 1000,
      }).catch(() => ({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 }));

      const allParticipants = participantsPage.content;
      const approvedParticipants = allParticipants.filter(p => p.participantStatus === "ACTIVE");

      // 2. Submissions for this event
      const submissions = await submissionService.getByEvent(selectedEventId).catch(() => []);

      // 3. Rankings for avg score
      let avgScore: number | null = null;
      const rankings = apiRankings?.length > 0
        ? apiRankings
        : await rankingService.getEventRankings(selectedEventId).catch(() => []);

      if (rankings.length > 0) {
        const scores = rankings.map((r: any) => r.finalScore ?? r.totalScore ?? 0).filter((s: number) => s > 0);
        if (scores.length > 0) {
          avgScore = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
        }
      }

      // 4. Completion rate = teams đã nộp submission / tổng teams eligible
      // Mỗi team có 1 submission → count unique teamId trong submissions
      const teamsWithSubmission = new Set(submissions.map((s: any) => s.teamId)).size;
      // Tổng teams từ apiTeamEligibility (đã load trước), hoặc fallback count unique teamId
      const totalTeams = (apiTeamEligibility?.length ?? 0) > 0
        ? apiTeamEligibility.length
        : new Set(allParticipants.map(p => (p as any).teamId).filter(Boolean)).size;
      const completionRate = totalTeams > 0
        ? Math.round((teamsWithSubmission / totalTeams) * 100)
        : null;

      setStats({
        totalParticipants: participantsPage.totalElements || allParticipants.length,
        approvedParticipants: approvedParticipants.length,
        totalSubmissions: submissions.length,
        avgScore,
        completionRate,
      });

      // 5. Category distribution — use apiCategories if available
      const cats = apiCategories?.length > 0
        ? apiCategories
        : await categoryService.getByEvent(selectedEventId).catch(() => []);

      if (cats.length > 0) {
        // Count approved participants per category
        const catParticipantCount = new Map<string, number>();
        allParticipants.forEach(p => {
          if (p.categoryId) {
            catParticipantCount.set(p.categoryId, (catParticipantCount.get(p.categoryId) ?? 0) + 1);
          }
        });

        const dist: CategoryDistribution[] = cats.map((cat: any, i: number) => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          teamCount: catParticipantCount.get(cat.categoryId) ?? 0,
          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
        }));
        setCategoryDist(dist);
      } else {
        setCategoryDist([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, apiCategories, apiRankings]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Tổng participants để tính % chính xác (mỗi category chiếm bao nhiêu % tổng)
  const totalForDist = categoryDist.reduce((sum, c) => sum + c.teamCount, 0) || 1;

  const reportItems = [
    {
      title: "Participant Summary",
      desc: "All registered users and teams",
      onClick: handleDataExport,
    },
    {
      title: "Score Analytics",
      desc: "Detailed scoring breakdown by round",
      onClick: handleDataExport,
    },
    {
      title: "Judge Performance",
      desc: "Calibration and consistency metrics",
      onClick: handleDataExport,
    },
    {
      title: "Event Timeline",
      desc: "Complete event activity log",
      onClick: handleDataExport,
    },
  ];

  const selectedEventName = apiEvents?.find((e: any) => e.eventId === selectedEventId || e.id === selectedEventId)?.eventName
    ?? apiEvents?.find((e: any) => e.eventId === selectedEventId || e.id === selectedEventId)?.name
    ?? "";

  return (
    <div className="space-y-6">
      <SectionHeader
        title={t("admin.reportsAnalytics")}
        subtitle={selectedEventName ? `Analytics for: ${selectedEventName}` : t("admin.reportsSubtitle")}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
              onClick={loadReportData}
              disabled={loading || !selectedEventId}
            >
              {loading ? "Loading..." : "Refresh"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={14} />}
              onClick={handleDataExport}
              disabled={dataExportLoading || !selectedEventId}
            >
              {dataExportLoading ? "Exporting..." : t("common.exportAll")}
            </Button>
          </div>
        }
      />

      {/* Event selector */}
      <Card className="p-4">
        <label className="block">
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>
            Event
          </span>
          <select
            value={selectedEventId ?? ""}
            onChange={e => setSelectedEventId(e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg outline-none"
            style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
          >
            <option value="">Select an event...</option>
            {(apiEvents ?? []).map((ev: any) => (
              <option key={ev.eventId ?? ev.id} value={ev.eventId ?? ev.id}>
                {ev.eventName ?? ev.name}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {!selectedEventId && (
        <Card className="p-8 text-center">
          <AlertCircle size={32} className="mx-auto mb-3" style={{ color: COLORS.border }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 6 }}>No event selected</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Select an event above to view its analytics.</div>
        </Card>
      )}

      {selectedEventId && error && (
        <Card className="p-4">
          <div className="flex items-center gap-2" style={{ color: COLORS.error, fontSize: 13, fontWeight: 600 }}>
            <AlertCircle size={15} />
            {error}
          </div>
        </Card>
      )}

      {dataExportDone && (
        <Card className="p-3">
          <div style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>✓ Data exported successfully.</div>
        </Card>
      )}
      {dataExportError && (
        <Card className="p-3">
          <div style={{ fontSize: 13, color: COLORS.error, fontWeight: 600 }}>{dataExportError}</div>
        </Card>
      )}

      {selectedEventId && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t("reports.totalParticipants")}
              value={loading ? "—" : stats.totalParticipants}
              icon={<Users size={20} />}
              color={COLORS.primary}
            />
            <StatCard
              title={t("reports.totalSubmissions")}
              value={loading ? "—" : stats.totalSubmissions}
              icon={<Upload size={20} />}
              color={COLORS.success}
            />
            <StatCard
              title={t("reports.avgScore")}
              value={loading ? "—" : stats.avgScore !== null ? stats.avgScore.toFixed(1) : "N/A"}
              icon={<Star size={20} />}
              color={COLORS.warning}
            />
            <StatCard
              title={t("reports.completionRate")}
              value={loading ? "—" : stats.completionRate !== null ? `${stats.completionRate}%` : "N/A"}
              icon={<CheckCircle size={20} />}
              color={COLORS.accent}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card className="p-5">
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>
                {t("admin.trackDistribution")}
              </div>
              {loading ? (
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Loading categories...</div>
              ) : categoryDist.length === 0 ? (
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>No category data available for this event.</div>
              ) : (
                categoryDist.map(cat => {
                  const pct = Math.round((cat.teamCount / totalForDist) * 100);
                  return (
                    <div key={cat.categoryId} className="mb-3">
                      <ProgressBar
                        value={cat.teamCount}
                        max={totalForDist}
                        color={cat.color}
                        label={`${cat.categoryName} — ${cat.teamCount} participant${cat.teamCount !== 1 ? "s" : ""} (${pct}%)`}
                      />
                    </div>
                  );
                })
              )}
            </Card>

            {/* Available Reports / Export */}
            <Card className="p-5">
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>
                {t("admin.availableReports")}
              </div>
              {reportItems.map(r => (
                <div
                  key={r.title}
                  className="flex items-center justify-between mb-3 p-3 rounded-xl"
                  style={{ background: COLORS.bg }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{r.desc}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Download size={13} />}
                    onClick={r.onClick}
                    disabled={dataExportLoading || !selectedEventId}
                  >
                    {t("common.export")}
                  </Button>
                </div>
              ))}
            </Card>
          </div>

          {/* Participant breakdown */}
          <Card className="p-5">
            <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary, marginBottom: 12 }}>
              Participant Breakdown
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Registered", value: loading ? "—" : stats.totalParticipants, color: COLORS.primary },
                { label: "Approved", value: loading ? "—" : stats.approvedParticipants, color: COLORS.success },
                { label: "Submissions", value: loading ? "—" : stats.totalSubmissions, color: COLORS.secondary },
                {
                  label: "Completion Rate",
                  value: loading ? "—" : stats.completionRate !== null ? `${stats.completionRate}%` : "N/A",
                  color: COLORS.accent,
                },
              ].map(item => (
                <div
                  key={item.label}
                  className="rounded-xl p-4 text-center"
                  style={{ background: `${item.color}10` }}
                >
                  <div style={{ fontSize: 24, fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
