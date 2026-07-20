import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import {
  AlertTriangle, BookOpen, CheckCircle, Eye, FileText, Filter,
  Github, History, Loader, Shield, Star, Upload, X
} from "lucide-react";
import {
  Card, SectionHeader, COLORS, StatusBadge, Button, StatCard
} from "@/components/shared/UIComponents";
import { submissionService, type SubmissionHistoryResponse } from "@/features/submissions/api/submissionService";

interface AdminViewProps {
  context: any;
}

export function AdminSubmissionsView({ context }: AdminViewProps) {
  const {
    apiEvents,
    selectedEventId,
    setSelectedEventId,
    apiCategories,
    apiRounds = [],
    apiDashboardRounds = [],
    selectedSubmissionCategoryId,
    setSelectedSubmissionCategoryId,
    selectedSubmissionRoundId,
    setSelectedSubmissionRoundId,
    adminSubmissions,
    submissionScope,
    setSubmissionScope,
    submissionsLoading,
    submissionsError,
    setSubmissionReloadKey,
    submissionActionMessage,
    submissionDisqualifyTarget,
    setSubmissionDisqualifyTarget,
    submissionDisqualifyReason,
    setSubmissionDisqualifyReason,
    submissionDisqualifying,
    handleSubmissionDisqualifyConfirm,
  } = context;
  const [historyTarget, setHistoryTarget] = useState<any | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistoryResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const submitted = adminSubmissions.filter((submission: any) =>
    (submission.submissionStatusName ?? "").toLowerCase().includes("submitted")
  ).length;
  const disqualified = adminSubmissions.filter((submission: any) =>
    (submission.submissionStatusName ?? "").toLowerCase().includes("disqualified")
  ).length;
  const scored = adminSubmissions.filter((submission: any) =>
    (submission.submissionStatusName ?? "").toLowerCase().includes("scored")
  ).length;
  const eventRounds = [...apiDashboardRounds, ...apiRounds].filter(
    (round, index, rounds) => rounds.findIndex(item => item.roundId === round.roundId) === index
  );
  const selectedRound = eventRounds.find((round: any) => round.roundId === selectedSubmissionRoundId);
  const getSubmissionRound = (submission: any) =>
    eventRounds.find((round: any) => round.roundId === submission.roundId);
  const getRoundName = (submission: any) =>
    submission.roundName
    ?? submission.round?.name
    ?? submission.round?.roundName
    ?? getSubmissionRound(submission)?.roundName
    ?? getSubmissionRound(submission)?.name
    ?? submission.roundId
    ?? "Unknown round";
  const getSubmissionName = (submission: any) =>
    submission.submissionName
    ?? submission.name
    ?? submission.title
    ?? submission.notes
    ?? "Untitled submission";
  const isCalibrationSubmission = (submission: any) => {
    const round = getSubmissionRound(submission);
    return Boolean(
      submission.isCalibrationRound
      ?? submission.isCalibration
      ?? submission.isSampleSubmission
      ?? submission.sampleSubmission
      ?? submission.round?.isCalibrationRound
      ?? round?.isCalibrationRound
      ?? (selectedRound?.roundId === submission.roundId ? selectedRound?.isCalibrationRound : false)
    );
  };
  const getTeamName = (submission: any) =>
    submission.teamName
    ?? submission.team?.teamName
    ?? submission.team?.name
    ?? submission.teamId
    ?? "Unknown team";
  const submissionColumns = [
    { label: "Team Name", width: "14%", align: "left" },
    { label: "Round Name", width: "12%", align: "left" },
    { label: "Submission Name", width: "15%", align: "left" },
    { label: "Status", width: "9%", align: "left" },
    { label: "Submitted", width: "15%", align: "left" },
    { label: "Artifacts", width: "21%", align: "center" },
    { label: "Action", width: "14%", align: "center" },
  ] as const;

  const loadSubmissionHistory = async (submission: any) => {
    if (!submission?.submissionId) return;
    setHistoryTarget(submission);
    setSubmissionHistory([]);
    setHistoryError("");
    setHistoryLoading(true);
    try {
      setSubmissionHistory(await submissionService.getHistoryBySubmissionId(submission.submissionId));
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Failed to load submission history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <>
      <SectionHeader
        title="Submission Management"
        subtitle="Review team submissions by event or round, and disqualify invalid work"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Loaded Submissions" value={adminSubmissions.length} icon={<Upload size={20} />} color={COLORS.primary} />
        <StatCard title="Submitted" value={submitted} icon={<CheckCircle size={20} />} color={COLORS.success} />
        <StatCard title="Scored" value={scored} icon={<Star size={20} />} color={COLORS.warning} />
        <StatCard title="Disqualified" value={disqualified} icon={<Shield size={20} />} color={COLORS.error} />
      </div>

      <Card className="p-5 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 items-end">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>EVENT</label>
            <Select value={(selectedEventId ?? "") || "none"} onValueChange={value => setSelectedEventId((value === "none" ? "" : value) || null)} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="none" style={{ color: COLORS.textPrimary }}>{apiEvents.length === 0 ? "No events found" : "Select an event"}</SelectItem>
              {apiEvents.map((event: any) => (
                <SelectItem key={event.id} value={event.id} style={{ color: COLORS.textPrimary }}>{event.name}</SelectItem>
              ))}
  </SelectContent>
</Select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>CATEGORY</label>
            <Select value={selectedSubmissionCategoryId || "none"} onValueChange={value => setSelectedSubmissionCategoryId((value === "none" ? "" : value))} disabled={!selectedEventId || apiCategories.length === 0}>
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    {apiCategories.length === 0 && <SelectItem value="none" style={{ color: COLORS.textPrimary }}>No categories found</SelectItem>}
              {apiCategories.map((category: any) => (
                <SelectItem key={category.categoryId} value={category.categoryId} style={{ color: COLORS.textPrimary }}>{category.categoryName}</SelectItem>
              ))}
  </SelectContent>
</Select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>ROUND</label>
            <Select value={selectedSubmissionRoundId || "none"} onValueChange={value => {
                setSelectedSubmissionRoundId((value === "none" ? "" : value));
                if ((value === "none" ? "" : value)) setSubmissionScope("round");
              }} disabled={!selectedSubmissionCategoryId || apiRounds.length === 0}>
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    {apiRounds.length === 0 && <SelectItem value="none" style={{ color: COLORS.textPrimary }}>No rounds loaded</SelectItem>}
              {apiRounds.map((round: any) => (
                <SelectItem key={round.roundId} value={round.roundId} style={{ color: COLORS.textPrimary }}>{round.roundName}</SelectItem>
              ))}
  </SelectContent>
</Select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>VIEW</label>
            <Select value={submissionScope || "none"} onValueChange={value => setSubmissionScope((value === "none" ? "" : value) as "round" | "unreview")} >
  <SelectTrigger className="w-full px-3 py-2 rounded-xl outline-none" style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
    <SelectItem value="round" style={{ color: COLORS.textPrimary }}>All submissions in round</SelectItem>
              <SelectItem value="unreview" style={{ color: COLORS.textPrimary }}>Unreviewed submissions in round</SelectItem>
  </SelectContent>
</Select>
          </div>
          <Button
            variant="outline"
            size="md"
            icon={submissionsLoading ? <Loader size={14} className="animate-spin" /> : <Filter size={14} />}
            onClick={() => setSubmissionReloadKey((key: number) => key + 1)}
            disabled={submissionsLoading}
          >
            {submissionsLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
        {selectedRound && (
          <div className="mt-3" style={{ fontSize: 12, color: COLORS.textSecondary }}>
            Deadline: {selectedRound.submissionDeadline ? new Date(selectedRound.submissionDeadline).toLocaleString("en-US") : "Not set"}
          </div>
        )}
      </Card>

      {submissionsError && (
        <div className="px-4 py-3 rounded-xl" style={{ background: `${COLORS.error}10`, color: COLORS.error, fontSize: 13 }}>
          {submissionsError}
        </div>
      )}
      {submissionActionMessage && (
        <div className="px-4 py-3 rounded-xl" style={{ background: `${COLORS.success}10`, color: COLORS.success, fontSize: 13 }}>
          {submissionActionMessage}
        </div>
      )}

      <Card className="mt-6">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse", tableLayout: "fixed", minWidth: 1180 }}>
            <colgroup>
              {submissionColumns.map(column => (
                <col key={column.label} style={{ width: column.width }} />
              ))}
            </colgroup>
            <thead>
              <tr style={{ background: COLORS.bg }}>
                {submissionColumns.map(column => (
                  <th key={column.label} className="px-4 py-3" style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.border}`, textAlign: column.align }}>
                    {column.label.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminSubmissions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center" style={{ color: COLORS.textSecondary, fontSize: 13 }}>
                    {submissionsLoading ? "Loading submissions..." : "No submissions found for the selected scope."}
                  </td>
                </tr>
              )}
              {adminSubmissions.map((submission: any) => {
                const status = (submission.submissionStatusName || "draft").toLowerCase().replace(/\s+/g, "_");
                const isCalibration = isCalibrationSubmission(submission);
                return (
                  <tr key={submission.submissionId} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                    <td className="px-4 py-3" style={{ verticalAlign: "middle" }}>
                      {isCalibration ? (
                        <span style={{ fontSize: 12, color: COLORS.textSecondary }}>None</span>
                      ) : (
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{getTeamName(submission)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, verticalAlign: "middle" }}>{getRoundName(submission)}</td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: COLORS.textSecondary, verticalAlign: "middle" }}>{getSubmissionName(submission)}</td>
                    <td className="px-4 py-3" style={{ verticalAlign: "middle" }}><StatusBadge status={status} /></td>
                    <td className="px-4 py-3" style={{ fontSize: 12, color: COLORS.textSecondary, verticalAlign: "middle" }}>
                      {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString("en-US") : "Not submitted"}
                    </td>
                    <td className="px-4 py-3" style={{ verticalAlign: "middle", textAlign: "center" }}>
                      <div className="flex flex-wrap justify-center gap-2">
                        {[
                          { label: "Repo", url: submission.repositoryUrl, icon: <Github size={12} /> },
                          { label: "Demo", url: submission.demoUrl, icon: <Eye size={12} /> },
                          { label: "Report", url: submission.reportUrl, icon: <BookOpen size={12} /> },
                          { label: "Slides", url: submission.slideUrl, icon: <FileText size={12} /> },
                        ].map(item => item.url ? (
                          <a
                            key={item.label}
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg"
                            style={{ background: `${COLORS.primary}10`, color: COLORS.primary, fontSize: 11, fontWeight: 600 }}
                          >
                            {item.icon}{item.label}
                          </a>
                        ) : null)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ verticalAlign: "middle" }}>
                      <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<History size={13} />}
                        onClick={() => loadSubmissionHistory(submission)}
                      >
                        History
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<AlertTriangle size={13} />}
                        onClick={() => setSubmissionDisqualifyTarget(submission)}
                        disabled={status === "disqualified"}
                      >
                        Disqualify
                      </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {historyTarget && (
        <Card className="p-5 mt-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Submission History</div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>
                {getSubmissionName(historyTarget)} - {getTeamName(historyTarget)}
              </div>
            </div>
            <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={() => setHistoryTarget(null)}>
              Close
            </Button>
          </div>
          {historyLoading ? (
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Loading history...</div>
          ) : historyError ? (
            <div style={{ fontSize: 13, color: COLORS.error }}>{historyError}</div>
          ) : submissionHistory.length === 0 ? (
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>No saved versions found.</div>
          ) : (
            <div className="space-y-3">
              {submissionHistory.map(history => (
                <div key={history.submissionHistoryId} className="rounded-lg p-4" style={{ border: `1px solid ${COLORS.border}`, background: COLORS.bg }}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary }}>
                        {history.notes || "Untitled submission"}
                      </div>
                    </div>
                    <StatusBadge status={(history.submissionStatusName || "submitted").toLowerCase()} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    {[
                      { label: "Repository", value: history.repositoryUrl },
                      { label: "Demo", value: history.demoUrl },
                      { label: "Report", value: history.reportUrl },
                      { label: "Slides", value: history.slideUrl },
                    ].map(item => (
                      <div key={item.label} style={{ fontSize: 12, color: COLORS.textSecondary, wordBreak: "break-word" }}>
                        <strong style={{ color: COLORS.textPrimary }}>{item.label}:</strong> {item.value || "-"}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {submissionDisqualifyTarget && (
        <Card className="p-5 mt-6" style={{ border: `1px solid ${COLORS.error}55` }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Disqualify submission</div>
            </div>
            <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={() => setSubmissionDisqualifyTarget(null)}>
              Cancel
            </Button>
          </div>
          <textarea
            value={submissionDisqualifyReason}
            onChange={e => setSubmissionDisqualifyReason(e.target.value)}
            rows={3}
            placeholder="Reason required"
            className="w-full px-3 py-2.5 rounded-xl outline-none resize-none mt-4"
            style={{ fontSize: 14, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.textPrimary }}
          />
          <div className="mt-4">
            <Button
              variant="danger"
              size="md"
              icon={submissionDisqualifying ? <Loader size={14} className="animate-spin" /> : <Shield size={14} />}
              onClick={handleSubmissionDisqualifyConfirm}
              disabled={submissionDisqualifying || !submissionDisqualifyReason.trim()}
            >
              {submissionDisqualifying ? "Disqualifying..." : "Confirm Disqualification"}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
